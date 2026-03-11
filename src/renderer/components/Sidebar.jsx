import { useState, useEffect } from 'react';
import { FolderPlus, Home, Settings2 } from 'lucide-react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ProjectItem } from './ProjectItem';

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
    <aside className="dark relative flex flex-col h-full bg-[#0e1041] border-r border-[#374151] text-white transition-colors" style={{ width: sidebarWidth }}>
      <div className="border-b border-white/10 px-4 pb-4 pt-5">
        <div className="mb-6 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-[color:var(--primary-color)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className="font-bold text-sm leading-tight text-white">Code Workspace Orchestrator</h2>
          </div>
        </div>

        <button
          className={`flex w-full items-center gap-3 rounded-[8px] px-3 py-2 text-left transition-all ${
            activeScreen === 'home'
              ? 'bg-[color:var(--primary-color)] text-white font-medium'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
          onClick={handleGoHome}
        >
          <Home className="h-5 w-5" />
          <span className="font-medium text-[0.95rem]">Home</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {projects.length === 0 ? (
          <div className="rounded-[8px] border border-dashed border-white/10 mx-2 bg-black/20 px-4 py-8 text-center text-slate-400">
            <p className="font-semibold text-slate-200">Nenhum repositório</p>
            <p className="mt-2 text-[0.85rem] leading-6">
              Adicione um diretório Git para ativar chats, workspaces e sessões de terminal.
            </p>
          </div>
        ) : (
          <ul className="space-y-1">
            {projects.map((project) => (
              <ProjectItem key={project.id} project={project} />
            ))}
          </ul>
        )}
      </div>

      <div className="border-t border-white/10 p-2">
        <div className="grid gap-1">
          <button
            onClick={handleAddProject}
            disabled={isLoading}
            className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-left text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50"
          >
            <FolderPlus className={`h-5 w-5 ${isLoading ? 'animate-pulse' : ''}`} />
            <span className="font-medium text-[0.95rem]">Adicionar repositório</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="flex items-center gap-3 rounded-[8px] px-3 py-2 text-left text-slate-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <Settings2 className="h-5 w-5" />
            <span className="font-medium text-[0.95rem]">Configurações</span>
          </button>
        </div>
      </div>

      <div
        className="absolute right-0 top-0 h-full w-3 translate-x-1/2 cursor-col-resize z-10"
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
