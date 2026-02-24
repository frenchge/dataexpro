
import React, { useState } from 'react';
import { ColumnDefinition, ExtractionRecord, SyncSettings, SyncStatus } from '../types';
import SyncSettingsPanel from './SyncSettings';

interface DataGridProps {
  columns: ColumnDefinition[];
  records: ExtractionRecord[];
  onUpdateRecord: (id: string, field: string, value: string) => void;
  onDeleteRecord: (id: string) => void;
  onAddRow: () => void;
  syncSettings: SyncSettings;
  onUpdateSyncSettings: (settings: SyncSettings) => void;
  syncStatus: SyncStatus;
  convexSyncStatus: SyncStatus;
  onSyncConvex: () => void;
  onReExtract?: (id: string) => void;
  reExtractingId?: string | null;
  onLoadMore?: () => void;
  canLoadMore?: boolean;
  isLoadingMore?: boolean;
  onViewSource?: (id: string) => void;
  viewingSourceId?: string | null;
}

const DataGrid: React.FC<DataGridProps> = ({ 
  columns, 
  records, 
  onUpdateRecord, 
  onDeleteRecord,
  onAddRow,
  syncSettings,
  onUpdateSyncSettings,
  syncStatus,
  convexSyncStatus,
  onSyncConvex,
  onReExtract,
  reExtractingId,
  onLoadMore,
  canLoadMore,
  isLoadingMore,
  onViewSource,
  viewingSourceId
}) => {
  const [editingCell, setEditingCell] = useState<{ id: string, field: string } | null>(null);

  const handleExportCSV = () => {
    const headers = columns.map(c => c.header).join(',');
    const rows = records.map(r => 
      columns.map(c => `"${String(r[c.id] || '').replace(/"/g, '""')}"`).join(',')
    ).join('\n');
    
    const csvContent = "data:text/csv;charset=utf-8," + headers + "\n" + rows;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `extracted_data_${new Date().getTime()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
      <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-slate-50/50">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-slate-800">Base de données structurée</h2>
            <div className="flex gap-1.5">
              {syncSettings.enabled && (
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  syncStatus === 'syncing' ? 'bg-amber-100 text-amber-700' : 
                  syncStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  Sheet
                </div>
              )}
              {syncSettings.convexEnabled && (
                <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  convexSyncStatus === 'syncing' ? 'bg-orange-100 text-orange-700' : 
                  convexSyncStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-orange-200 text-orange-800'
                }`}>
                  Convex
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <SyncSettingsPanel 
            settings={syncSettings} 
            onSave={onUpdateSyncSettings} 
            status={syncStatus}
          />
          
          {syncSettings.convexEnabled && (
            <button 
              onClick={onSyncConvex}
              disabled={convexSyncStatus === 'syncing' || records.length === 0}
              className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-sm ${
                convexSyncStatus === 'syncing' 
                  ? 'bg-orange-100 text-orange-400 cursor-not-allowed' 
                  : 'bg-orange-500 text-white hover:bg-orange-600 active:scale-95'
              }`}
            >
              {convexSyncStatus === 'syncing' ? (
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
              )}
              Sync Convex
            </button>
          )}

          <button 
            onClick={onAddRow}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors text-sm font-medium flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Ajouter
          </button>
          
          <button 
            onClick={handleExportCSV}
            className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1400px]">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map(col => (
                <th key={col.id} className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 last:border-r-0">
                  {col.header}
                </th>
              ))}
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider border-r border-slate-200 w-20">
                Source
              </th>
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-24 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-12 text-center text-slate-400 italic">
                  Aucune donnée disponible. Commencez par extraire du contenu.
                </td>
              </tr>
            ) : (
              records.map(record => (
                <tr key={record.id} className="hover:bg-slate-50/50 transition-colors group">
                  {columns.map(col => (
                    <td 
                      key={col.id} 
                      className="px-6 py-3 text-sm text-slate-600 border-r border-slate-100 last:border-r-0 relative"
                      onDoubleClick={() => setEditingCell({ id: record.id, field: col.id })}
                    >
                      {editingCell?.id === record.id && editingCell?.field === col.id ? (
                        <input
                          autoFocus
                          className="absolute inset-0 w-full h-full px-6 py-3 bg-indigo-50 border-2 border-indigo-400 outline-none z-10"
                          value={record[col.id] as string}
                          onChange={(e) => onUpdateRecord(record.id, col.id, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => { if (e.key === 'Enter') setEditingCell(null); }}
                        />
                      ) : (
                        <div className="truncate max-w-[150px]">{record[col.id]}</div>
                      )}
                    </td>
                  ))}
                  <td className="px-6 py-3 text-sm border-r border-slate-100">
                    {record.sourceType ? (
                      record.sourceType === 'pdf' ? (
                        <button
                          onClick={() => onViewSource?.(record.id)}
                          disabled={viewingSourceId === record.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                            viewingSourceId === record.id
                              ? 'bg-slate-100 text-slate-400 cursor-wait'
                              : 'bg-red-50 text-red-600 hover:bg-red-100 cursor-pointer'
                          }`}
                          title="Voir le PDF source"
                        >
                          {viewingSourceId === record.id ? (
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                            </svg>
                          )}
                          PDF
                        </button>
                      ) : (
                        <button
                          onClick={() => onViewSource?.(record.id)}
                          disabled={viewingSourceId === record.id}
                          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                            viewingSourceId === record.id
                              ? 'bg-slate-100 text-slate-400 cursor-wait'
                              : record.sourceType === 'url'
                              ? 'bg-blue-50 text-blue-600 hover:bg-blue-100'
                              : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                          }`}
                          title={
                            record.sourceType === 'url' ? 'Ouvrir le lien source' :
                            'Ouvrir la page source'
                          }
                        >
                          {viewingSourceId === record.id ? (
                            <svg className="animate-spin h-3.5 w-3.5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : record.sourceType === 'url' ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                            </svg>
                          )}
                          {record.sourceType === 'url' ? 'URL' : 'HTML'}
                        </button>
                      )
                    ) : (
                      <span className="text-slate-300 text-xs">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {onReExtract && record.sourceType && (
                        <button
                          onClick={() => onReExtract(record.id)}
                          disabled={reExtractingId === record.id}
                          className={`p-1 rounded transition-colors ${
                            reExtractingId === record.id
                              ? 'text-amber-400 cursor-not-allowed'
                              : 'text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50'
                          }`}
                          title="Relancer l'extraction depuis la source"
                        >
                          {reExtractingId === record.id ? (
                            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                          )}
                        </button>
                      )}
                      <button 
                        onClick={() => onDeleteRecord(record.id)}
                        className="text-slate-400 hover:text-red-500 transition-colors p-1"
                        title="Supprimer la ligne"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Voir plus button */}
      {canLoadMore && (
        <div className="p-4 border-t border-slate-100 flex justify-center">
          <button
            onClick={onLoadMore}
            disabled={isLoadingMore}
            className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoadingMore ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Chargement...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
                Voir plus
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default DataGrid;
