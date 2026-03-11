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
    theme,
  } = useWorkspace();
  const [isResizing, setIsResizing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isConductor = theme === 'conductor';

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

  /* ─── Estilos condicionais por tema ─── */

  // Wrapper <aside>
  const asideClass = isConductor
    ? 'relative flex flex-col h-full text-[#ededed] transition-colors'
    : 'dark relative flex flex-col h-full bg-[#0e1041] border-r border-[#374151] text-white transition-colors';

  const asideStyle = isConductor
    ? {
        width: sidebarWidth,
        background: '#161616',
        borderRight: '1px solid rgba(255,255,255,0.08)',
      }
    : { width: sidebarWidth };

  // Divisores internos
  const dividerClass = isConductor
    ? 'border-b border-white/[0.08]'
    : 'border-b border-white/10';

  const dividerFooterClass = isConductor
    ? 'border-t border-white/[0.08] p-2'
    : 'border-t border-white/10 p-2';

  // Logo / título
  const logoIconColor = isConductor ? '#4f46e5' : 'var(--primary-color)';
  const logoTextClass = isConductor
    ? 'font-semibold text-sm leading-tight text-[#ededed] tracking-tight'
    : 'font-bold text-sm leading-tight text-white';

  // Botão Home ativo
  const homeActiveClass = isConductor
    ? 'bg-[#4f46e5]/20 text-[#a5b4fc] border border-[#4f46e5]/40 font-medium'
    : 'bg-[color:var(--primary-color)] text-white font-medium';

  const homeInactiveClass = isConductor
    ? 'text-[#a1a1aa] hover:bg-white/[0.06] hover:text-[#ededed]'
    : 'text-slate-400 hover:bg-white/5 hover:text-white';

  // Texto do estado vazio
  const emptyBorderClass = isConductor
    ? 'rounded-[6px] border border-dashed border-white/[0.08] mx-2 bg-black/30 px-4 py-8 text-center'
    : 'rounded-[8px] border border-dashed border-white/10 mx-2 bg-black/20 px-4 py-8 text-center text-slate-400';

  const emptyTitleClass = isConductor
    ? 'font-medium text-[#ededed] text-[0.9rem]'
    : 'font-semibold text-slate-200';

  const emptyDescClass = isConductor
    ? 'mt-2 text-[0.8rem] leading-6 text-[#71717a]'
    : 'mt-2 text-[0.85rem] leading-6';

  // Botões do rodapé
  const footerBtnClass = isConductor
    ? 'flex items-center gap-3 rounded-[6px] px-3 py-2 text-left text-[#71717a] transition-all hover:bg-white/[0.06] hover:text-[#ededed] disabled:opacity-40'
    : 'flex items-center gap-3 rounded-[8px] px-3 py-2 text-left text-slate-400 transition-all hover:bg-white/5 hover:text-white disabled:opacity-50';

  return (
    <aside className={asideClass} style={asideStyle}>
      {/* Cabeçalho */}
      <div className={`${dividerClass} px-4 pb-4 pt-5`}>
        <div className="mb-6 px-2 flex items-center justify-between">
          <div className="flex items-center gap-2" style={{ color: logoIconColor }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            <h2 className={logoTextClass}>Code Workspace Orchestrator</h2>
          </div>
        </div>

        <button
          className={`flex w-full items-center gap-3 rounded-[${isConductor ? '6px' : '8px'}] px-3 py-2 text-left transition-all ${
            activeScreen === 'home' ? homeActiveClass : homeInactiveClass
          }`}
          onClick={handleGoHome}
        >
          <Home className="h-[18px] w-[18px]" />
          <span className={`font-medium text-[0.95rem]${isConductor ? ' tracking-tight' : ''}`}>Home</span>
        </button>
      </div>

      {/* Lista de projetos */}
      <div className="flex-1 overflow-y-auto px-2 py-4 scrollbar-thin">
        {projects.length === 0 ? (
          <div className={emptyBorderClass}>
            <p className={emptyTitleClass}>Nenhum repositório</p>
            <p className={emptyDescClass}>
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

      {/* Rodapé */}
      <div className={dividerFooterClass}>
        <div className="grid gap-1">
          <button
            onClick={handleAddProject}
            disabled={isLoading}
            className={footerBtnClass}
          >
            <FolderPlus className={`h-[18px] w-[18px] ${isLoading ? 'animate-pulse' : ''}`} />
            <span className="font-medium text-[0.95rem]">Adicionar repositório</span>
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className={footerBtnClass}
          >
            <Settings2 className="h-[18px] w-[18px]" />
            <span className="font-medium text-[0.95rem]">Configurações</span>
          </button>
        </div>
      </div>

      {/* Handle de resize */}
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
