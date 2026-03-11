import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { TitleBar } from '@components/TitleBar';
import { Sidebar } from '@components/Sidebar';
import { HomeScreen } from '@components/HomeScreen';
import { ChatArea } from '@components/ChatArea';
import { WorkspaceChatArea } from '@components/WorkspaceChatArea';
import { SettingsScreen } from '@components/SettingsScreen';
import { SecondarySidebar } from '@components/Layout/SecondarySidebar';
import { AppDialog } from '@components/AppDialog';
import { WorkspaceProvider, useWorkspace } from '@context/WorkspaceContext';
import '@styles/index.css';

function WorkspaceContent() {
  const {
    activeScreen,
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    secondarySidebarWidth,
    setSecondarySidebarWidth,
    isSettingsOpen,
    selectedWorkspace,
    activeSessionsCount,
    dialogState,
    closeDialog,
  } = useWorkspace();
  const [isResizingSecondary, setIsResizingSecondary] = useState(false);

  useEffect(() => {
    if (!isResizingSecondary) {
      return undefined;
    }

    const handleMouseMove = (event) => {
      const nextWidth = Math.max(280, Math.min(760, window.innerWidth - event.clientX));
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

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--bg-body)]">
      <TitleBar
        showPrimary={showPrimarySidebar}
        onTogglePrimary={() => setShowPrimarySidebar(!showPrimarySidebar)}
        showSecondary={showSecondarySidebar}
        onToggleSecondary={() => setShowSecondarySidebar(!showSecondarySidebar)}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {showPrimarySidebar && <Sidebar />}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--bg-body)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSettingsOpen ? 'settings' : selectedWorkspace ? 'workspace' : activeScreen}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.28, ease: 'easeOut' }}
              className="flex h-full flex-1 flex-col overflow-hidden"
            >
              {isSettingsOpen ? (
                <SettingsScreen />
              ) : selectedWorkspace ? (
                <WorkspaceChatArea />
              ) : activeScreen === 'home' ? (
                <HomeScreen />
              ) : (
                <ChatArea />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {showSecondarySidebar && !isSettingsOpen && (
          <div className="relative border-l border-[color:var(--border-color)] bg-[color:var(--bg-surface)]" style={{ width: secondarySidebarWidth }}>
            <div className="h-full overflow-hidden">
              <SecondarySidebar />
            </div>
            <div
              onMouseDown={(event) => {
                event.preventDefault();
                setIsResizingSecondary(true);
                document.body.style.cursor = 'col-resize';
                document.body.style.userSelect = 'none';
              }}
              className="absolute left-0 top-0 h-full w-4 cursor-col-resize -translate-x-1/2"
              title="Redimensionar painel auxiliar"
            />
          </div>
        )}
      </div>

      <footer className="h-10 border-t border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4 flex items-center justify-between text-[11px] font-semibold tracking-wider text-[color:var(--text-secondary)]">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[color:var(--success-color)] animate-pulse"></span>
            System ready
          </span>
          {selectedWorkspace && (
            <span className="rounded-full bg-slate-100 dark:bg-slate-800 px-3 py-1">
              Sessões {activeSessionsCount}/8
            </span>
          )}
        </div>
        <span>v1.0.0</span>
      </footer>

      <AppDialog
        isOpen={dialogState.isOpen}
        type={dialogState.type}
        variant={dialogState.variant}
        title={dialogState.title}
        message={dialogState.message}
        confirmText={dialogState.confirmText}
        cancelText={dialogState.cancelText}
        onConfirm={() => closeDialog(true)}
        onCancel={() => closeDialog(false)}
      />
    </div>
  );
}

function App() {
  return (
    <WorkspaceProvider>
      <WorkspaceContent />
    </WorkspaceProvider>
  );
}

export default App;
