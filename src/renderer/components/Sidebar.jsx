import { useState, useEffect } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ProjectItem } from './ProjectItem';

/**
 * Componente Sidebar
 * Barra lateral esquerda para gerenciamento de projetos e chats
 * 
 * @returns {JSX.Element} Sidebar com lista de projetos
 */
export function Sidebar() {
  const {
    projects,
    addProjectFromPath,
    sidebarWidth,
    setSidebarWidth,
    activeScreen,
    setActiveScreen,
    setIsCloneModalOpen,
    setIsSettingsOpen,
    setSelectedWorkspace
  } = useWorkspace();

  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  /**
   * Inicia redimensionamento da sidebar
   */
  const startResize = (e) => {
    e.preventDefault();
    setIsResizing(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  /**
   * Finaliza redimensionamento
   */
  const stopResize = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  /**
   * Processa movimento do mouse durante redimensionamento
   */
  const resize = (e) => {
    if (!isResizing) return;

    const newWidth = Math.max(200, Math.min(500, e.clientX));
    setSidebarWidth(newWidth);
  };

  // Adiciona/remove listeners de resize
  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResize);
      return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResize);
      };
    }
  }, [isResizing]);

  /**
   * Handler para adicionar novo projeto via seleção de pasta
   */
  const handleAddProject = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const folderPath = await window.electronAPI.dialog.openDirectory();

      if (folderPath) {
        addProjectFromPath(folderPath);
      }
    } catch (error) {
      console.error('Erro ao selecionar pasta:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handler para abrir tela Home
   */
  const handleGoHome = () => {
    setSelectedWorkspace(null);
    setActiveScreen('home');
  };

  return (
    <aside
      className="flex flex-col bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-white/5 relative"
      style={{ width: sidebarWidth }}
    >
      {/* Link Home e Ações Rápidas */}
      <div className="flex items-center justify-between px-3 py-2 mt-2">
        <div
          className={`flex-1 flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors cursor-pointer
                      ${activeScreen === 'home'
              ? 'bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white'
              : 'hover:bg-slate-100 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'}`}
          onClick={handleGoHome}
        >
          <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          <span className="text-sm font-medium ml-1">Home</span>
        </div>
      </div>

      {/* Lista de Projetos */}
      <div className="flex-1 overflow-y-auto scrollbar-thin py-2 px-2 mt-2">
        {projects.length === 0 ? (
          <div className="px-4 py-8 text-center opacity-50">
            <p className="text-xs text-slate-500 mb-2">Nenhum repositório</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-200/60 dark:divide-white/5">
            {projects.map(project => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>

      {/* Footer da Sidebar - Ações Globais */}
      <div className="p-3 flex items-center justify-between mt-auto">
        <button
          onClick={handleAddProject}
          disabled={isLoading}
          className="flex items-center gap-2 text-[13px] text-slate-500 hover:text-slate-300 transition-colors"
        >
          {isLoading ? (
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0H5zm2 5l3-2z" /></svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          )}
          Add repository
        </button>

        <div className="flex items-center gap-1">
          <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
          </button>
          <button className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          </button>
          <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 rounded-md hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Alça de redimensionamento */}
      <div
        className="absolute top-0 right-0 w-[3px] h-full cursor-col-resize hover:bg-slate-600/50 transition-colors z-10"
        onMouseDown={startResize}
      />
    </aside>
  );
}
