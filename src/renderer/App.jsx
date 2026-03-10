import { useState, useEffect } from 'react';
import { TitleBar } from '@components/TitleBar';
import { Sidebar } from '@components/Sidebar';
import { HomeScreen } from '@components/HomeScreen';
import { ChatArea } from '@components/ChatArea';
import { WorkspaceChatArea } from '@components/WorkspaceChatArea';
import { SettingsScreen } from '@components/SettingsScreen';
import { CloneModal } from '@components/CloneModal';
import { SecondarySidebar } from '@components/Layout/SecondarySidebar';
import { WorkspaceProvider, useWorkspace } from '@context/WorkspaceContext';
import '@styles/index.css';

/**
 * Conteúdo principal da aplicação
 */
function WorkspaceContent() {
  const {
    activeScreen,
    setIsCloneModalOpen,
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    secondarySidebarWidth,
    setSecondarySidebarWidth,
    isSettingsOpen,
    setIsSettingsOpen,
    selectedWorkspace,
    activeSessionsCount
  } = useWorkspace();
  const [showCloneModal, setShowCloneModal] = useState(false);
  const [isResizingSecondary, setIsResizingSecondary] = useState(false);

  useEffect(() => {
    const handleOpenCloneModal = () => {
      setShowCloneModal(true);
    };

    window.addEventListener('open-clone-modal', handleOpenCloneModal);
    return () => window.removeEventListener('open-clone-modal', handleOpenCloneModal);
  }, []);

  useEffect(() => {
    if (!isResizingSecondary) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      const nextWidth = Math.max(240, Math.min(720, window.innerWidth - event.clientX));
      setSecondarySidebarWidth(nextWidth);
    };

    const handleMouseUp = () => {
      setIsResizingSecondary(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizingSecondary, setSecondarySidebarWidth]);

  const handleStartSecondaryResize = (event) => {
    event.preventDefault();
    setIsResizingSecondary(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleCloseCloneModal = () => {
    setShowCloneModal(false);
    setIsCloneModalOpen(false);
  };

  // Se configurações estiverem abertas, mostra a tela de configurações
  if (isSettingsOpen) {
    return (
      <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark">
        <TitleBar
          showPrimary={showPrimarySidebar}
          onTogglePrimary={() => setShowPrimarySidebar(!showPrimarySidebar)}
          showSecondary={showSecondarySidebar}
          onToggleSecondary={() => setShowSecondarySidebar(!showSecondarySidebar)}
        />
        <SettingsScreen />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full w-full bg-background-light dark:bg-background-dark">
      {/* Barra de título customizada */}
      <TitleBar
        showPrimary={showPrimarySidebar}
        onTogglePrimary={() => setShowPrimarySidebar(!showPrimarySidebar)}
        showSecondary={showSecondarySidebar}
        onToggleSecondary={() => setShowSecondarySidebar(!showSecondarySidebar)}
      />

      {/* Área de trabalho principal */}
      <div className="flex-1 flex overflow-hidden relative bg-background-light dark:bg-background-dark">
        {/* Sidebar esquerda - Home e Projetos */}
        {showPrimarySidebar && <Sidebar />}

        {/* Área de conteúdo */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative border-r border-transparent dark:border-white/5">
          {selectedWorkspace ? <WorkspaceChatArea /> : activeScreen === 'home' ? <HomeScreen /> : <ChatArea />}
        </main>

        {/* Sidebar direita - Auxiliar (Review & Terminal) */}
        {showSecondarySidebar && (
          <div
            style={{ width: secondarySidebarWidth }}
            className="relative flex-shrink-0 border-l border-slate-200 dark:border-white/10"
          >
            <div
              onMouseDown={handleStartSecondaryResize}
              className="absolute left-0 top-0 z-10 h-full w-[4px] -translate-x-1/2 cursor-col-resize rounded-full hover:bg-slate-500/40"
              title="Redimensionar painel auxiliar"
            />
            <SecondarySidebar />
          </div>
        )}
      </div>

      {/* Barra de status inferior */}
      <footer className="h-7 px-4 flex items-center justify-between 
                         bg-surface-light dark:bg-surface-dark
                         border-t border-slate-200 dark:border-white/5
                         text-[11px] font-medium text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span>Pronto</span>
          {activeScreen === 'workspace' && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-200 dark:bg-white/5 text-slate-700 dark:text-slate-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Sessões: {activeSessionsCount}/8
            </span>
          )}
        </div>
        <span className="flex items-center gap-2">
          <span>v1.0.0</span>
        </span>
      </footer>

      {/* Modais */}
      <CloneModal
        isOpen={showCloneModal}
        onClose={handleCloseCloneModal}
      />
    </div>
  );
}

/**
 * Componente principal da aplicação
 */
function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceContent />
    </WorkspaceProvider>
  );
}

export default App;
