
import React from 'react';

export type Page = 'extraction' | 'catalogue';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
  recordCount: number;
  catalogueCount: number;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, onNavigate, recordCount, catalogueCount }) => {
  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="sidebar-logo-text">
          <span className="sidebar-logo-title">Dataexpro</span>
          <span className="sidebar-logo-subtitle">Data Extraction</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="sidebar-section-label">MENU</div>

        <button 
          onClick={() => onNavigate('extraction')}
          className={`sidebar-nav-item ${currentPage === 'extraction' ? 'active' : ''}`}
        >
          <div className="sidebar-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <span className="sidebar-nav-label">Extraction</span>
          {recordCount > 0 && (
            <span className="sidebar-badge bg-indigo-100 text-indigo-600">{recordCount}</span>
          )}
        </button>

        <button 
          onClick={() => onNavigate('catalogue')}
          className={`sidebar-nav-item ${currentPage === 'catalogue' ? 'active' : ''}`}
        >
          <div className="sidebar-nav-icon">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <span className="sidebar-nav-label">Catalogue</span>
          {catalogueCount > 0 && (
            <span className="sidebar-badge bg-emerald-100 text-emerald-600">{catalogueCount}</span>
          )}
        </button>
      </nav>

      {/* Bottom info */}
      <div className="sidebar-footer">
        <div className="sidebar-footer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[11px] font-semibold text-slate-600">Convex Connecté</span>
          </div>
          <p className="text-[10px] text-slate-400 leading-relaxed">
            Base de données en temps réel synchronisée.
          </p>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
