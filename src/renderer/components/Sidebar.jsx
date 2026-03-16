import { useState, useEffect } from 'react';
import { FolderPlus, Home, Settings2 } from 'lucide-react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ProjectItem } from './ProjectItem';
import { cn } from '@lib/utils';

export function Sidebar() {
  const {
    projects,
    addProjectFromPath,
    sidebarWidth,
    setSidebarWidth,
    activeScreen,
    setActiveScreen,
    setIsSettingsOpen,
    setSelectedWorkspace,
  } = useWorkspace();
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const stopResize = () => {
    setIsResizing(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  };

  const resize = (event) => {
    if (!isResizing) return;
    const newWidth = Math.max(260, Math.min(520, event.clientX));
    setSidebarWidth(newWidth);
  };

  useEffect(() => {
    if (!isResizing) {
      return undefined;
    }

    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResize);

    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResize);
    };
  }, [isResizing]);

  const handleAddProject = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const folderPath = await window.electronAPI.dialog.openDirectory();
      if (folderPath) {
        addProjectFromPath(folderPath);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    setSelectedWorkspace(null);
    setActiveScreen('home');
  };

  return (
    <aside 
      className="relative flex flex-col h-full bg-[color:var(--bg-sidebar)] border-r border-[color:var(--border-color)] transition-colors duration-400"
      style={{ width: sidebarWidth }}
    >
      {/* Cabeçalho */}
      <div className="border-b border-[color:var(--border-color)] px-4 pb-4 pt-5 transition-colors duration-400">
        <div className="mb-6 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[color:var(--text-primary)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[color:var(--text-primary)]">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="font-display font-semibold text-sm leading-tight tracking-tight">CWO</h2>
          </div>
        </div>

        <button
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-all duration-300 group',
            activeScreen === 'home' 
              ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] font-medium shadow-sm' 
              : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]'
          )}
          onClick={handleGoHome}
        >
          <Home className="h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110" />
          <span className="font-medium text-[0.95rem] tracking-tight">Home</span>
        </button>
      </div>

      {/* Lista de projetos */}
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {projects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[color:var(--border-color)] mx-2 bg-[color:var(--bg-surface)] px-4 py-8 text-center transition-colors duration-400">
            <p className="font-medium text-[color:var(--text-primary)] text-[0.9rem] font-display">Nenhum repositório</p>
            <p className="mt-2 text-[0.8rem] leading-5 text-[color:var(--text-secondary)]">
              Adicione um diretório Git para ativar chats, workspaces e sessões de terminal.
            </p>
          </div>
        ) : (
          <ul className="space-y-0.5">
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>

      {/* Rodapé */}
      <div className="border-t border-[color:var(--border-color)] p-3 transition-colors duration-400">
        <div className="grid gap-1">
          <button
            onClick={handleAddProject}
            disabled={isLoading}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[color:var(--text-secondary)] transition-all duration-300 hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)] disabled:opacity-40"
          >
            <FolderPlus className={cn("h-[18px] w-[18px] transition-transform duration-300 group-hover:scale-110", isLoading && "animate-pulse")} />
            <span className="font-medium text-sm tracking-tight text-[0.95rem]">Adicionar repositório</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-[color:var(--text-secondary)] transition-all duration-300 hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]"
          >
            <Settings2 className="h-[18px] w-[18px] transition-transform duration-300 group-hover:rotate-45" />
            <span className="font-medium text-sm tracking-tight text-[0.95rem]">Configurações</span>
          </button>
        </div>
      </div>

      {/* Handle de resize */}
      <div
        className="absolute right-0 top-0 h-full w-2 translate-x-1/2 cursor-col-resize z-10 transition-colors hover:bg-[color:var(--border-color)]/50"
        onMouseDown={(event) => {
          event.preventDefault();
          setIsResizing(true);
          document.body.style.cursor = 'col-resize';
          document.body.style.userSelect = 'none';
        }}
      />
    </aside>
  );
}
