
import React, { useState } from 'react';
import { ColumnDefinition, ExtractionMode } from '../types';

interface ExtractorFormProps {
  onExtract: (content: string, isPDF: boolean, prompt: string, columns: ColumnDefinition[], sourceUrl?: string) => void;
  isLoading: boolean;
  initialColumns: ColumnDefinition[];
}

const ExtractorForm: React.FC<ExtractorFormProps> = ({ onExtract, isLoading, initialColumns }) => {
  const [mode, setMode] = useState<ExtractionMode>('text');
  const [textContent, setTextContent] = useState('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [userInstructions, setUserInstructions] = useState("Extraire la marque de la moto, le modèle, l'année, ainsi que les réglages techniques de suspension (clics, compression, rebond, tarage, SAG) pour chaque configuration mentionnée.");
  
  const [columns, setColumns] = useState<ColumnDefinition[]>(initialColumns);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        setFileBase64(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const addColumn = () => {
    const header = window.prompt('Nom de la nouvelle colonne :');
    if (header) {
      const id = header.toLowerCase().replace(/\s+/g, '_');
      setColumns([...columns, { id, header }]);
    }
  };

  const removeColumn = (id: string) => {
    setColumns(columns.filter(c => c.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'pdf' && fileBase64) {
      onExtract(fileBase64, true, userInstructions, columns);
    } else if (textContent) {
      onExtract(textContent, false, userInstructions, columns, textContent);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-bold text-slate-800">Source d'extraction</h2>
        <div className="flex gap-2 p-1 bg-slate-100 rounded-lg self-start">
          <button 
            type="button"
            onClick={() => setMode('text')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Texte / HTML
          </button>
          <button 
            type="button"
            onClick={() => setMode('pdf')}
            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${mode === 'pdf' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Fichier PDF
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {mode === 'pdf' ? (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Sélectionner un PDF (Fiche technique, manuel...)</label>
            <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-8 transition-colors hover:border-indigo-300 bg-slate-50/50 text-center">
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex flex-col items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-slate-600 font-medium text-sm">
                  {fileBase64 ? 'Document chargé !' : 'Cliquez ou déposez votre PDF'}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-slate-700">Contenu (Texte, HTML ou URL de site)</label>
            <textarea 
              className="w-full h-40 p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none text-sm"
              placeholder="Collez le texte d'un article, d'un test, le code source d'une page ou une URL..."
              value={textContent}
              onChange={(e) => setTextContent(e.target.value)}
            />
            <p className="text-xs text-slate-400">Le contenu collé sera stocké comme source pour pouvoir relancer l'extraction plus tard.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Configuration de la base</label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1">
            {columns.map(col => (
              <div key={col.id} className="flex items-center gap-2 px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-[10px] font-bold border border-indigo-100 group">
                {col.header}
                <button 
                  type="button"
                  onClick={() => removeColumn(col.id)}
                  className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
            <button 
              type="button" 
              onClick={addColumn}
              className="px-3 py-1 border border-dashed border-slate-300 text-slate-500 rounded-full text-[10px] font-bold hover:border-indigo-500 hover:text-indigo-500 transition-all"
            >
              + Colonne
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-slate-700">Instructions IA</label>
          <input 
            type="text"
            className="w-full p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all text-sm"
            value={userInstructions}
            onChange={(e) => setUserInstructions(e.target.value)}
          />
        </div>

        <button 
          type="submit"
          disabled={isLoading || (mode === 'text' && !textContent) || (mode === 'pdf' && !fileBase64)}
          className={`w-full py-4 rounded-xl font-bold text-white transition-all shadow-lg flex items-center justify-center gap-2 ${isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Analyse technique...
            </>
          ) : (
            'Extraire les données'
          )}
        </button>
      </form>
    </div>
  );
};

export default ExtractorForm;
