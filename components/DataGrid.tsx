
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
  onSyncConvex
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
              <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase tracking-wider w-16 text-center">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {records.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="px-6 py-12 text-center text-slate-400 italic">
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
                  <td className="px-6 py-3 text-center">
                    <button 
                      onClick={() => onDeleteRecord(record.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                      title="Supprimer la ligne"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataGrid;
