
import React, { useState } from 'react';
import { SyncSettings } from '../types';

interface SyncSettingsProps {
  settings: SyncSettings;
  onSave: (settings: SyncSettings) => void;
  status: 'idle' | 'syncing' | 'success' | 'error';
}

const SyncSettingsPanel: React.FC<SyncSettingsProps> = ({ settings, onSave, status }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [url, setUrl] = useState(settings.webhookUrl);
  const [enabled, setEnabled] = useState(settings.enabled);
  const [convexUrl, setConvexUrl] = useState(settings.convexUrl || '');
  const [convexEnabled, setConvexEnabled] = useState(settings.convexEnabled || false);

  const handleSave = () => {
    onSave({ 
      enabled, 
      webhookUrl: url,
      convexUrl: convexUrl,
      convexEnabled: convexEnabled
    });
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border ${
          settings.enabled || settings.convexEnabled
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 shadow-sm' 
            : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${status === 'syncing' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
        </svg>
        Sync Cloud
        {status === 'error' && <span className="w-2 h-2 bg-red-500 rounded-full"></span>}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-slate-200 p-5 z-50 animate-in fade-in zoom-in duration-200">
          <h3 className="text-sm font-bold text-slate-800 mb-3">Configuration Cloud</h3>
          
          <div className="space-y-4">
            {/* Google Sheets */}
            <div className="border-b border-slate-100 pb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Google Sheets</label>
                <button
                  onClick={() => setEnabled(!enabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${enabled ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${enabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Google Script Web App URL"
                className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>

            {/* Convex */}
            <div className="pb-3">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-600 uppercase tracking-wider">Convex DB</label>
                <button
                  onClick={() => setConvexEnabled(!convexEnabled)}
                  className={`w-10 h-5 rounded-full transition-colors relative ${convexEnabled ? 'bg-orange-500' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${convexEnabled ? 'translate-x-5' : ''}`} />
                </button>
              </div>
              <input
                type="text"
                value={convexUrl}
                onChange={(e) => setConvexUrl(e.target.value)}
                placeholder="https://your-app.convex.cloud"
                className="w-full p-2 text-xs border border-slate-200 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none"
              />
              <p className="text-[9px] text-slate-400 mt-1 italic">Nécessite le déploiement des mutations Convex.</p>
            </div>

            <button
              onClick={handleSave}
              className="w-full py-2 bg-slate-900 text-white rounded-lg text-sm font-bold hover:bg-slate-800 transition-all"
            >
              Enregistrer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncSettingsPanel;
