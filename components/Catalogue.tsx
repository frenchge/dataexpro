
import React, { useState } from 'react';
import { usePaginatedQuery, useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import type { Id } from "../convex/_generated/dataModel";

const FIELDS = [
  { id: 'marque_moto', header: 'Marque Moto', group: 'bike' },
  { id: 'modele_moto', header: 'Modèle', group: 'bike' },
  { id: 'annee_moto', header: 'Année', group: 'bike' },
  { id: 'marque_fourche', header: 'Marque Fourche', group: 'fork' },
  { id: 'modele_fourche', header: 'Modèle Fourche', group: 'fork' },
  { id: 'comp_fourche', header: 'Comp. Fourche', group: 'fork' },
  { id: 'rebond_fourche', header: 'Rebond Fourche', group: 'fork' },
  { id: 'ressort_fourche', header: 'Ressort Fourche', group: 'fork' },
  { id: 'marque_amortisseur', header: 'Marque Amorto', group: 'shock' },
  { id: 'modele_amortisseur', header: 'Modèle Amorto', group: 'shock' },
  { id: 'comp_hv_amorto', header: 'Comp. HV Amorto', group: 'shock' },
  { id: 'comp_bv_amorto', header: 'Comp. BV Amorto', group: 'shock' },
  { id: 'detente_amorto', header: 'Détente Amorto', group: 'shock' },
  { id: 'ressort_amorto', header: 'Ressort Amorto', group: 'shock' },
  { id: 'sag', header: 'SAG', group: 'shock' },
] as const;

const Catalogue: React.FC = () => {
  const { results: records, status, loadMore } = usePaginatedQuery(
    api.records.getPaginatedRecords,
    {},
    { initialNumItems: 20 }
  );
  const totalCount = useQuery(api.records.getRecordCount) ?? 0;
  const updateRecord = useMutation(api.records.updateRecord);
  const deleteRecord = useMutation(api.records.deleteRecord);

  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingField, setEditingField] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredRecords = records.filter((r: any) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.marque_moto?.toLowerCase().includes(q) ||
      r.modele_moto?.toLowerCase().includes(q) ||
      r.annee_moto?.toLowerCase().includes(q)
    );
  });

  const startEdit = (id: string, field: string, currentValue: string) => {
    setEditingField({ id, field });
    setEditValue(currentValue);
  };

  const saveEdit = async () => {
    if (!editingField) return;
    try {
      await updateRecord({
        id: editingField.id as Id<"dirtbikes">,
        field: editingField.field,
        value: editValue,
      });
    } catch (err) {
      console.error('Update failed:', err);
    }
    setEditingField(null);
    setEditValue('');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteRecord({ id: id as Id<"dirtbikes"> });
      setDeleteConfirm(null);
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const groupLabels: Record<string, string> = {
    bike: '🏍️ Moto',
    fork: '🔧 Fourche',
    shock: '⚙️ Amortisseur',
  };

  return (
    <div className="catalogue-container">
      {/* Header */}
      <div className="catalogue-header">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Catalogue</h1>
          <p className="text-sm text-slate-500 mt-1">
            {totalCount} dirtbike{totalCount !== 1 ? 's' : ''} dans la base Convex
          </p>
        </div>
        {/* Search */}
        <div className="catalogue-search">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher marque, modèle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="catalogue-search-input"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Cards Grid */}
      {filteredRecords.length === 0 ? (
        <div className="catalogue-empty">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <p className="text-slate-500 font-medium">
            {searchQuery ? 'Aucun résultat trouvé' : 'Aucun dirtbike dans la base'}
          </p>
          <p className="text-slate-400 text-sm mt-1">
            {searchQuery ? 'Essayez avec un autre terme' : 'Commencez par extraire des données dans l\'onglet Extraction'}
          </p>
        </div>
      ) : (
        <div className="catalogue-grid">
          {filteredRecords.map((record: any) => {
            const isExpanded = expandedId === record._id;
            return (
              <div 
                key={record._id} 
                className={`catalogue-card ${isExpanded ? 'expanded' : ''}`}
              >
                {/* Card Header */}
                <div 
                  className="catalogue-card-header"
                  onClick={() => setExpandedId(isExpanded ? null : record._id)}
                >
                  <div className="flex items-center gap-3">
                    <div className="catalogue-card-avatar">
                      <span className="text-lg">🏍️</span>
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-sm">
                        {record.marque_moto || 'Sans marque'} {record.modele_moto || ''}
                      </h3>
                      <p className="text-xs text-slate-500">
                        {record.annee_moto || 'N/A'} • {record.marque_fourche || '?'} / {record.marque_amortisseur || '?'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {deleteConfirm === record._id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(record._id); }}
                          className="px-2 py-1 bg-red-500 text-white text-[10px] font-bold rounded hover:bg-red-600 transition-colors"
                        >
                          Confirmer
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteConfirm(null); }}
                          className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] font-bold rounded hover:bg-slate-300 transition-colors"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeleteConfirm(record._id); }}
                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="catalogue-card-body">
                    {(['bike', 'fork', 'shock'] as const).map(group => (
                      <div key={group} className="catalogue-field-group">
                        <div className="catalogue-field-group-label">
                          {groupLabels[group]}
                        </div>
                        <div className="catalogue-field-grid">
                          {FIELDS.filter(f => f.group === group).map(field => {
                            const isEditing = editingField?.id === record._id && editingField?.field === field.id;
                            const value = record[field.id] || '';
                            return (
                              <div key={field.id} className="catalogue-field">
                                <label className="catalogue-field-label">{field.header}</label>
                                {isEditing ? (
                                  <div className="flex gap-1">
                                    <input
                                      autoFocus
                                      className="catalogue-field-input"
                                      value={editValue}
                                      onChange={(e) => setEditValue(e.target.value)}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') saveEdit();
                                        if (e.key === 'Escape') setEditingField(null);
                                      }}
                                    />
                                    <button onClick={saveEdit} className="px-2 py-1 bg-indigo-500 text-white text-[10px] rounded font-bold hover:bg-indigo-600">
                                      ✓
                                    </button>
                                    <button onClick={() => setEditingField(null)} className="px-2 py-1 bg-slate-200 text-slate-600 text-[10px] rounded font-bold hover:bg-slate-300">
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div 
                                    className="catalogue-field-value"
                                    onClick={() => startEdit(record._id, field.id, value)}
                                    title="Cliquer pour modifier"
                                  >
                                    {value || <span className="text-slate-300 italic">—</span>}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-slate-300 opacity-0 group-hover:opacity-100 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    <div className="catalogue-card-meta">
                      <span className="text-[10px] text-slate-400">
                        Extrait le {record.extractedAt ? new Date(record.extractedAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                      </span>
                      {record.source && (
                        <a href={record.source} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                          Source
                        </a>
                      )}
                      <span className="text-[10px] text-slate-400 font-mono">{record.bikeId}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Voir plus button */}
      {status === 'CanLoadMore' && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => loadMore(20)}
            className="px-6 py-2.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors text-sm font-semibold flex items-center gap-2 shadow-sm"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
            Voir plus
          </button>
        </div>
      )}
      {status === 'LoadingMore' && (
        <div className="flex justify-center mt-6">
          <div className="px-6 py-2.5 text-indigo-400 text-sm font-semibold flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            Chargement...
          </div>
        </div>
      )}
    </div>
  );
};

export default Catalogue;
