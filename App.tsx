
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useMutation, useQuery, usePaginatedQuery, useConvex } from "convex/react";
import { UserButton } from '@clerk/clerk-react';
import { api } from "./convex/_generated/api";
import type { Id } from "./convex/_generated/dataModel";
import ExtractorForm from './components/ExtractorForm';
import DataGrid from './components/DataGrid';
import Sidebar, { Page } from './components/Sidebar';
import Catalogue from './components/Catalogue';
import { extractContent, reExtractForRecord, fetchUrlContent, extractFromUrl, isUrl } from './services/geminiService';
import { ExtractionRecord, ColumnDefinition, AppState, SyncSettings, SyncStatus } from './types';

const App: React.FC = () => {
  const saveRecordsMutation = useMutation(api.records.saveRecords);
  const updateRecordMutation = useMutation(api.records.updateRecord);
  const deleteRecordMutation = useMutation(api.records.deleteRecord);
  const patchRecordMutation = useMutation(api.records.patchRecord);
  const convexClient = useConvex();
  const { results: catalogueRecords, status: paginationStatus, loadMore } = usePaginatedQuery(
    api.records.getPaginatedRecords,
    {},
    { initialNumItems: 20 }
  );
  const totalDbCount = useQuery(api.records.getRecordCount) ?? 0;

  const [currentPage, setCurrentPage] = useState<Page>('extraction');
  const [reExtractingId, setReExtractingId] = useState<string | null>(null);
  const [viewingSourceId, setViewingSourceId] = useState<string | null>(null);

  const [state, setState] = useState<AppState>(() => {
    const savedSync = localStorage.getItem('suspension_sync_settings');
    return {
      records: [],
      columns: [
        { id: 'marque_moto', header: 'Marque Moto' },
        { id: 'modele_moto', header: 'Modèle' },
        { id: 'annee_moto', header: 'Année' },
        { id: 'marque_fourche', header: 'Marque Fourche' },
        { id: 'modele_fourche', header: 'Modèle Fourche' },
        { id: 'comp_fourche', header: 'Comp. Fourche' },
        { id: 'rebond_fourche', header: 'Rebond Fourche' },
        { id: 'ressort_fourche', header: 'Ressort Fourche' },
        { id: 'marque_amortisseur', header: 'Marque Amorto' },
        { id: 'modele_amortisseur', header: 'Modèle Amorto' },
        { id: 'comp_hv_amorto', header: 'Comp. HV Amorto' },
        { id: 'comp_bv_amorto', header: 'Comp. BV Amorto' },
        { id: 'detente_amorto', header: 'Détente Amorto' },
        { id: 'ressort_amorto', header: 'Ressort Amorto' },
        { id: 'sag', header: 'SAG' }
      ],
      isLoading: false,
      error: null,
      syncSettings: savedSync ? JSON.parse(savedSync) : { 
        enabled: false, 
        webhookUrl: '', 
        convexEnabled: true, 
        convexUrl: 'https://adjoining-kookabura-150.convex.cloud' 
      },
      syncStatus: 'idle',
      convexSyncStatus: 'idle'
    };
  });

  useEffect(() => {
    localStorage.setItem('suspension_sync_settings', JSON.stringify(state.syncSettings));
  }, [state.syncSettings]);

  // Merge session records with Convex DB records for unified display
  const displayRecords: ExtractionRecord[] = useMemo(() => {
    const dbBikeIds = new Set(catalogueRecords.map((r: any) => r.bikeId));

    // Session records not yet in DB
    const newSessionRecords = state.records.filter(sr => {
      const brand = String(sr.marque_moto || "").trim().toLowerCase();
      const model = String(sr.modele_moto || "").trim().toLowerCase();
      const year = String(sr.annee_moto || "").trim();
      const bikeId = `${brand}-${model}-${year}`.replace(/\s+/g, "_");
      return !dbBikeIds.has(bikeId);
    });

    // Map Convex records to ExtractionRecord format
    const dbRecords: ExtractionRecord[] = catalogueRecords.map((r: any) => {
      const record: ExtractionRecord = {
        id: r._id as string,
        _convexId: r._id as string,
      };
      state.columns.forEach(col => {
        record[col.id] = r[col.id] || '';
      });
      // Carry over sourceType for smart source display
      if (r.sourceType) {
        record.sourceType = r.sourceType;
      }
      return record;
    });

    return [...newSessionRecords, ...dbRecords];
  }, [state.records, catalogueRecords, state.columns]);

  const syncToGoogleSheets = async (data: ExtractionRecord[]) => {
    if (!state.syncSettings.enabled || !state.syncSettings.webhookUrl || data.length === 0) return;

    setState(prev => ({ ...prev, syncStatus: 'syncing' }));
    try {
      await fetch(state.syncSettings.webhookUrl, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'sync',
          timestamp: new Date().toISOString(),
          data: data
        })
      });
      setState(prev => ({ ...prev, syncStatus: 'success' }));
      setTimeout(() => setState(prev => ({ ...prev, syncStatus: 'idle' })), 3000);
    } catch (err) {
      console.error('Sheet Sync failed:', err);
      setState(prev => ({ ...prev, syncStatus: 'error' }));
    }
  };

  const syncConvex = async () => {
    if (!state.syncSettings.convexEnabled || state.records.length === 0) return;
    
    setState(prev => ({ ...prev, convexSyncStatus: 'syncing', error: null }));
    
    try {
      const result = await saveRecordsMutation({ records: state.records });
      setState(prev => ({ ...prev, convexSyncStatus: 'success', error: null }));
      console.log(`Convex sync: ${result.inserted} inserted, ${result.updated} updated (duplicates skipped)`);
      setTimeout(() => setState(prev => ({ ...prev, convexSyncStatus: 'idle' })), 3000);
    } catch (err: any) {
      console.error('Convex Sync failed:', err);
      const errorMsg = err.message?.includes("Could not find public function") 
        ? "Erreur : La fonction 'records:saveRecords' n'est pas encore déployée. Lancez 'npx convex dev' dans votre terminal."
        : "La synchronisation Convex a échoué. Vérifiez votre connexion.";
      
      setState(prev => ({ 
        ...prev, 
        convexSyncStatus: 'error',
        error: errorMsg 
      }));
    }
  };

  const handleExtraction = async (content: string, isPDF: boolean, prompt: string, columns: ColumnDefinition[], sourceContent?: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      let extractionContent = content;
      let storedSource = sourceContent || '';
      let newRecords: ExtractionRecord[];

      // If the user pasted a URL, use smart multi-strategy extraction
      if (!isPDF && isUrl(content.trim())) {
        const url = content.trim();
        console.log('URL detected:', url);

        // Strategy 1: Use Gemini with Google Search grounding (best for JS-rendered pages)
        try {
          console.log('Strategy 1: Gemini Google Search extraction...');
          newRecords = await extractFromUrl(url, prompt, columns);
          console.log(`Google Search extraction found ${newRecords.length} records`);

          // Try to also fetch page HTML for stored source (enables re-extraction later)
          try {
            storedSource = await fetchUrlContent(url);
          } catch {
            storedSource = url; // If proxy fails, store URL as fallback source
          }
        } catch (searchErr: any) {
          console.warn('Strategy 1 failed:', searchErr.message);

          // Strategy 2: Fetch HTML via CORS proxy → send raw HTML to Gemini
          console.log('Strategy 2: CORS proxy + HTML extraction...');
          const fetched = await fetchUrlContent(url);
          extractionContent = fetched;
          storedSource = fetched;
          console.log(`Proxy fetched ${fetched.length} chars of HTML`);
          newRecords = await extractContent(extractionContent, false, prompt, columns);
        }
      } else {
        // Normal text/PDF extraction
        newRecords = await extractContent(extractionContent, isPDF, prompt, columns);
      }

      // For PDF uploads, store as base64 data URI (preserves binary integrity)
      if (isPDF && !storedSource) {
        storedSource = `data:application/pdf;base64,${content}`;
      }

      // Attach source content for re-extraction later
      const recordsWithSource = newRecords.map(r => ({
        ...r,
        source: storedSource,
      }));

      setState(prev => ({
        ...prev,
        columns,
        records: [...prev.records, ...recordsWithSource],
        isLoading: false,
      }));
      syncToGoogleSheets(recordsWithSource);
    } catch (err: any) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err.message || "Une erreur est survenue lors de l'extraction."
      }));
    }
  };

  const handleUpdateRecord = useCallback((id: string, field: string, value: string) => {
    const isConvexRecord = catalogueRecords.some((r: any) => r._id === id);
    if (isConvexRecord) {
      updateRecordMutation({ id: id as Id<"dirtbikes">, field, value });
    } else {
      setState(prev => {
        const updatedRecords = prev.records.map(r => r.id === id ? { ...r, [field]: value } : r);
        return { ...prev, records: updatedRecords };
      });
    }
  }, [catalogueRecords, updateRecordMutation]);

  const handleDeleteRecord = useCallback((id: string) => {
    const isConvexRecord = catalogueRecords.some((r: any) => r._id === id);
    if (isConvexRecord) {
      deleteRecordMutation({ id: id as Id<"dirtbikes"> });
    } else {
      setState(prev => ({
        ...prev,
        records: prev.records.filter(r => r.id !== id)
      }));
    }
  }, [catalogueRecords, deleteRecordMutation]);

  const handleAddRow = useCallback(() => {
    const newRecord: ExtractionRecord = { id: `manual-${Date.now()}` };
    state.columns.forEach(col => {
      newRecord[col.id] = '';
    });
    setState(prev => ({
      ...prev,
      records: [newRecord, ...prev.records]
    }));
  }, [state.columns]);

  const handleUpdateSyncSettings = (newSettings: SyncSettings) => {
    setState(prev => ({ ...prev, syncSettings: newSettings }));
  };

  const handleReExtract = async (recordId: string) => {
    const record = displayRecords.find(r => r.id === recordId);
    if (!record) return;

    setReExtractingId(recordId);
    setState(prev => ({ ...prev, error: null }));

    try {
      // Fetch source on demand: from session record or from Convex DB
      let source = record.source || '';
      const isConvex = catalogueRecords.some((r: any) => r._id === recordId);
      if (isConvex && !source) {
        const result = await convexClient.query(api.records.getRecordSource, { id: recordId as Id<"dirtbikes"> });
        source = result?.source || '';
      }
      if (!source) return;

      const filledFields = await reExtractForRecord(
        source,
        state.columns,
        record as unknown as Record<string, string>
      );

      if (Object.keys(filledFields).length === 0) {
        setReExtractingId(null);
        return;
      }

      // If it's a Convex record, update in DB
      const isConvexRecord = catalogueRecords.some((r: any) => r._id === recordId);
      if (isConvexRecord) {
        await patchRecordMutation({
          id: recordId as Id<"dirtbikes">,
          fields: filledFields,
        });
      } else {
        // Update session record
        setState(prev => ({
          ...prev,
          records: prev.records.map(r =>
            r.id === recordId ? { ...r, ...filledFields } : r
          ),
        }));
      }

      setReExtractingId(null);
    } catch (err: any) {
      setReExtractingId(null);
      setState(prev => ({
        ...prev,
        error: `Re-extraction échouée: ${err.message}`,
      }));
    }
  };

  const handleViewSource = async (recordId: string) => {
    const record = displayRecords.find(r => r.id === recordId);
    if (!record) return;

    const sourceType = String(record.sourceType || '');

    setViewingSourceId(recordId);
    try {
      // Fetch source from Convex (includes sourceUrl for HTML)
      const result = await convexClient.query(api.records.getRecordSource, {
        id: recordId as Id<"dirtbikes">
      });
      if (!result?.source) {
        setViewingSourceId(null);
        return;
      }

      const source = result.source;
      const type = result.sourceType || sourceType;
      const sourceUrl = (result as any).sourceUrl || '';

      // PDF handling: base64-encoded PDFs can be viewed, legacy raw-string PDFs cannot
      if (type === 'pdf') {
        if (source.startsWith('data:application/pdf;base64,')) {
          const base64 = source.slice('data:application/pdf;base64,'.length);
          const byteChars = atob(base64);
          const byteArray = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) {
            byteArray[i] = byteChars.charCodeAt(i);
          }
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const blobUrl = URL.createObjectURL(blob);
          window.open(blobUrl, '_blank');
        }
        // Legacy raw-string PDFs are not viewable (corrupted by UTF-8 encoding)
        setViewingSourceId(null);
        return;
      }

      if (type === 'url') {
        // Direct URL — open in new tab
        window.open(source.trim(), '_blank');
      } else if (type === 'html') {
        // For HTML sources, open the original website URL if available
        if (sourceUrl) {
          window.open(sourceUrl, '_blank');
        } else {
          // Fallback: try to find a URL in the HTML content
          const urlMatch = source.match(/href="(https?:\/\/[^"]+)"/i);
          if (urlMatch) {
            window.open(urlMatch[1], '_blank');
          }
        }
      } else {
        // Unknown type — try URL detection
        const trimmed = source.trim();
        if (/^https?:\/\//i.test(trimmed)) {
          window.open(trimmed, '_blank');
        }
      }
    } catch (err) {
      console.error('Failed to view source:', err);
    }
    setViewingSourceId(null);
  };

  return (
    <div className="app-layout">
      <Sidebar 
        currentPage={currentPage}
        onNavigate={setCurrentPage}
        recordCount={displayRecords.length}
        catalogueCount={totalDbCount}
      />

      <div className="app-main">
        {/* Top bar */}
        <header className="app-topbar">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-slate-800">
              {currentPage === 'extraction' ? 'Extraction de données' : 'Catalogue Dirtbikes'}
            </h1>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${state.syncSettings.enabled || state.syncSettings.convexEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
              {state.records.length} en session • {totalDbCount} en base
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>

        {/* Content */}
        <div className="app-content">
          {currentPage === 'extraction' ? (
            <div className="extraction-layout">
              <div className="extraction-sidebar">
                <ExtractorForm 
                  onExtract={handleExtraction} 
                  isLoading={state.isLoading}
                  initialColumns={state.columns}
                />
                
                {state.error && (
                  <div className={`p-4 rounded-xl border flex gap-3 items-start ${state.error.includes("Lancez 'npx convex dev'") ? 'bg-orange-50 border-orange-200' : 'bg-red-50 border-red-200'}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 mt-0.5 shrink-0 ${state.error.includes("Lancez 'npx convex dev'") ? 'text-orange-500' : 'text-red-500'}`} viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${state.error.includes("Lancez 'npx convex dev'") ? 'text-orange-800' : 'text-red-800'}`}>Message système</p>
                      <p className={`text-xs mt-1 ${state.error.includes("Lancez 'npx convex dev'") ? 'text-orange-700' : 'text-red-700'}`}>{state.error}</p>
                    </div>
                  </div>
                )}

                <div className="sync-card">
                  <div className="relative z-10">
                    <h3 className="font-bold mb-2 text-white text-sm">Synchronisation</h3>
                    <p className="text-xs text-slate-400 mb-3">Exportez vers Convex pour un archivage permanent.</p>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className={`w-2 h-2 rounded-full ${state.syncSettings.convexEnabled ? 'bg-orange-500' : 'bg-slate-600'}`}></div>
                        Convex : {state.syncSettings.convexEnabled ? 'Prêt' : 'Désactivé'}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-300">
                        <div className={`w-2 h-2 rounded-full ${state.syncSettings.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                        Sheets : {state.syncSettings.enabled ? 'Connecté' : 'Désactivé'}
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                </div>
              </div>

              <div className="extraction-main">
                <DataGrid 
                  columns={state.columns}
                  records={displayRecords}
                  onUpdateRecord={handleUpdateRecord}
                  onDeleteRecord={handleDeleteRecord}
                  onAddRow={handleAddRow}
                  syncSettings={state.syncSettings}
                  onUpdateSyncSettings={handleUpdateSyncSettings}
                  syncStatus={state.syncStatus}
                  convexSyncStatus={state.convexSyncStatus}
                  onSyncConvex={syncConvex}
                  onReExtract={handleReExtract}
                  reExtractingId={reExtractingId}
                  onLoadMore={() => loadMore(20)}
                  canLoadMore={paginationStatus === 'CanLoadMore'}
                  isLoadingMore={paginationStatus === 'LoadingMore'}
                  onViewSource={handleViewSource}
                  viewingSourceId={viewingSourceId}
                />
              </div>
            </div>
          ) : (
            <Catalogue />
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
