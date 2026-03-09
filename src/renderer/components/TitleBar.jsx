import { useState, useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';

/**
 * Componente TitleBar
 * Barra de título customizada para janela frameless do Electron
 */
export function TitleBar({ 
  showPrimary, 
  onTogglePrimary, 
  showSecondary, 
  onToggleSecondary 
}) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if electronAPI is available before calling
    if (window.electronAPI && window.electronAPI.window && window.electronAPI.window.isMaximized) {
      window.electronAPI.window.isMaximized()
        .then(setIsMaximized)
        .catch(err => console.error('Failed to check maximized state:', err));
    }
  }, []);

  const handleMinimize = () => {
    if (window.electronAPI?.window?.minimize) {
      window.electronAPI.window.minimize();
    }
  };

  const handleMaximize = () => {
    if (window.electronAPI?.window?.maximize) {
      window.electronAPI.window.maximize();
      setIsMaximized(!isMaximized);
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.window?.close) {
      window.electronAPI.window.close();
    }
  };

  return (
    <header 
      className="drag-region flex items-center justify-between h-10 px-3 
                 bg-surface-light dark:bg-surface-dark
                 border-b border-slate-200 dark:border-slate-800
                 select-none z-50"
    >
      {/* Lado esquerdo: Toggles de Sidebar e Logo */}
      <div className="flex items-center gap-2 flex-1 no-drag">
        <button
          onClick={onTogglePrimary}
          className={`p-1.5 rounded-md transition-colors duration-150 ${
            showPrimary 
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Primary Sidebar"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-500 to-purple-600 
                        flex items-center justify-center shadow-sm">
          <span className="text-white text-[10px] font-bold">CW</span>
        </div>
      </div>

      {/* Centro: Título do projeto */}
      <div className="flex-1 flex justify-center items-center pointer-events-none">
        <h1 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          Code Workspace Orchestrator
        </h1>
      </div>

      {/* Lado direito: ThemeToggle + Sidebar Toggle + Controles da Janela */}
      <div className="flex items-center justify-end gap-1 flex-1 no-drag">
        <ThemeToggle />
        
        <button
          onClick={onToggleSecondary}
          className={`p-1.5 rounded-md transition-colors duration-150 mx-1 ${
            showSecondary 
              ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/20' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
          title="Toggle Secondary Sidebar"
        >
          <svg className="w-4 h-4 rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
          </svg>
        </button>

        {/* Botão Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center rounded
                     hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
          </svg>
        </button>

        {/* Botão Maximizar */}
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center rounded
                     hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors group"
        >
          <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="4" y="4" width="16" height="16" rx="1" />
          </svg>
        </button>

        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center rounded
                     hover:bg-red-500 hover:text-white transition-colors group"
        >
          <svg className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </header>
  );
}
