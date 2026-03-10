import { useState, useEffect } from 'react';

/**
 * Componente TitleBar
 * Barra de título customizada para janela frameless do Electron
 */
export function TitleBar({ 
  showPrimary = false, 
  onTogglePrimary = () => {}, 
  showSecondary = false, 
  onToggleSecondary = () => {} 
}) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
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

  // Ícones estilo VSCode
  const PrimarySidebarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 3.5V13L2 14H14L15 13V3.5L14 2.5H2L1 3.5ZM2 3.5H5V13H2V3.5ZM14 13H6V3.5H14V13Z" />
    </svg>
  );

  const SecondarySidebarIcon = () => (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
      <path d="M1 3.5V13L2 14H14L15 13V3.5L14 2.5H2L1 3.5ZM10 3.5H14V13H10V3.5ZM2 13V3.5H9V13H2Z" />
    </svg>
  );

  return (
    <header 
      className="drag-region flex items-center justify-between h-11 px-4 
                 bg-background-light dark:bg-background-dark
                 border-b border-border-light dark:border-white/5
                 select-none z-50"
    >
      {/* Lado esquerdo: Espaço vazio ou botões extras */}
      <div className="flex items-center gap-2 flex-1 no-drag">
      </div>
      {/* Centro: Título do projeto */}
      <div className="flex-1 flex justify-center items-center pointer-events-none">
        <h1 className="text-xs font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-widest">
          Code Workspace Orchestrator
        </h1>
      </div>

      {/* Lado direito: Controles */}
      <div className="flex items-center justify-end gap-1 flex-1 no-drag">
        
        {/* Toggle Sidebar Primária - MOVIDO PARA CÁ */}
        <button
          onClick={onTogglePrimary}
          className={`p-1.5 rounded-md transition-colors duration-150 mx-0.5 ${
            showPrimary 
              ? 'text-slate-900 bg-slate-200 dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title="Toggle Primary Sidebar (Ctrl+B)"
        >
          <PrimarySidebarIcon />
        </button>

        {/* Toggle Sidebar Secundária */}
        <button
          onClick={onToggleSecondary}
          className={`p-1.5 rounded-md transition-colors duration-150 mx-0.5 ${
            showSecondary 
              ? 'text-slate-900 bg-slate-200 dark:bg-white/10 dark:text-white' 
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5'
          }`}
          title="Toggle Secondary Sidebar"
        >
          <SecondarySidebarIcon />
        </button>

        <div className="w-[1px] h-4 bg-border-light dark:bg-white/10 mx-1" />

        {/* Botão Minimizar */}
        <button
          onClick={handleMinimize}
          className="w-10 h-8 flex items-center justify-center rounded-md
                     hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group"
        >
          <svg className="w-[10px] h-[10px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
            <line x1="0" y1="5" x2="10" y2="5" />
          </svg>
        </button>

        {/* Botão Maximizar/Restaurar */}
        <button
          onClick={handleMaximize}
          className="w-10 h-8 flex items-center justify-center rounded-md
                     hover:bg-slate-200 dark:hover:bg-white/5 transition-colors group"
        >
          {isMaximized ? (
            <svg className="w-[10px] h-[10px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
              <path d="M2.5 2.5v-2h7v7h-2" />
              <rect x="0.5" y="2.5" width="7" height="7" />
            </svg>
          ) : (
            <svg className="w-[10px] h-[10px] text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white" fill="none" viewBox="0 0 10 10" stroke="currentColor" strokeWidth="1">
              <rect x="0.5" y="0.5" width="9" height="9" />
            </svg>
          )}
        </button>

        {/* Botão Fechar */}
        <button
          onClick={handleClose}
          className="w-10 h-8 flex items-center justify-center rounded-md
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
