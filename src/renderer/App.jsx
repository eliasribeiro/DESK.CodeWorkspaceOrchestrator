import { useCallback, useEffect, useRef, useState } from 'react';
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
  const [isFocusMode, setIsFocusMode] = useState(false);
  const previousSidebarStateRef = useRef({
    showPrimary: true,
    showSecondary: false,
  });

  const toggleFocusMode = useCallback(() => {
    setIsFocusMode((current) => {
      const next = !current;

      if (next) {
        previousSidebarStateRef.current = {
          showPrimary: showPrimarySidebar,
          showSecondary: showSecondarySidebar,
        };
        setShowPrimarySidebar(false);
        setShowSecondarySidebar(false);
      } else {
        setShowPrimarySidebar(previousSidebarStateRef.current.showPrimary);
        setShowSecondarySidebar(previousSidebarStateRef.current.showSecondary);
      }

      return next;
    });
  }, [showPrimarySidebar, showSecondarySidebar, setShowPrimarySidebar, setShowSecondarySidebar]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'F11') {
        return;
      }

      event.preventDefault();
      toggleFocusMode();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [toggleFocusMode]);

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
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[color:var(--bg-body)] transition-colors duration-400">
      <TitleBar
        showPrimary={showPrimarySidebar}
        onTogglePrimary={() => setShowPrimarySidebar(!showPrimarySidebar)}
        showSecondary={showSecondarySidebar}
        onToggleSecondary={() => setShowSecondarySidebar(!showSecondarySidebar)}
        isFocusMode={isFocusMode}
        onToggleFocusMode={toggleFocusMode}
      />

      <div className="relative flex flex-1 overflow-hidden">
        {showPrimarySidebar && !isFocusMode && <Sidebar />}

        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--bg-body)] transition-colors duration-400">
          <AnimatePresence mode="wait">
            <motion.div
              key={isSettingsOpen ? 'settings' : selectedWorkspace ? 'workspace' : activeScreen}
              initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
              transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
              className="flex h-full flex-1 flex-col overflow-hidden"
            >
              {isSettingsOpen ? (
                <SettingsScreen />
              ) : selectedWorkspace ? (
                <WorkspaceChatArea isFocusMode={isFocusMode} />
              ) : activeScreen === 'home' ? (
                <HomeScreen />
              ) : (
                <ChatArea />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {showSecondarySidebar && !isSettingsOpen && !isFocusMode && (
          <div className="relative border-l border-[color:var(--border-color)] bg-[color:var(--bg-surface)] transition-colors duration-400" style={{ width: secondarySidebarWidth }}>
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
              className="absolute left-0 top-0 h-full w-4 cursor-col-resize -translate-x-1/2 hover:bg-[color:var(--border-color)]/30 transition-colors"
              title="Resize secondary panel"
            />
          </div>
        )}
      </div>

      {!isFocusMode && (
        <footer className="h-8 border-t border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4 flex items-center justify-between text-[10px] uppercase font-mono tracking-widest text-[color:var(--text-tertiary)] transition-colors duration-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 border border-[color:var(--border-color)] px-2 py-0.5 rounded-full">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--success-color)] shadow-[0_0_8px_currentColor]"></span>
              System Online
            </span>
            {selectedWorkspace && (
              <span className="rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-body)] px-2 py-0.5">
                Sessions: {activeSessionsCount}/12
              </span>
            )}
          </div>
          <span>CWO v1.0.0</span>
        </footer>
      )}

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
