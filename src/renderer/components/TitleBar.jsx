import { useEffect, useState } from 'react';
import { PanelLeft, PanelRight, Minus, Square, Copy, X, Moon, Sun, Focus, FocusIcon } from 'lucide-react';
import { useWorkspace } from '@context/WorkspaceContext';
import { cn } from '@lib/utils';

export function TitleBar({
  showPrimary = false,
  onTogglePrimary = () => {},
  showSecondary = false,
  onToggleSecondary = () => {},
  isFocusMode = false,
  onToggleFocusMode = () => {},
}) {
  const [isMaximized, setIsMaximized] = useState(false);
  const { theme, setTheme } = useWorkspace();

  useEffect(() => {
    window.electronAPI?.window?.isMaximized?.()
      .then(setIsMaximized)
      .catch(() => {});
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="drag-region relative z-50 flex h-[38px] w-full items-center justify-between border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4 transition-colors duration-400">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="no-drag flex min-w-0 items-center justify-center">
          <p className="truncate text-xs font-display font-medium tracking-wide text-[color:var(--text-secondary)]">
            CWO
          </p>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5">
        <div className="no-drag mr-3">
          <div className="flex items-center gap-1">
            <button
              onClick={toggleTheme}
              className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition-all hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun className="h-[14px] w-[14px]" /> : <Moon className="h-[14px] w-[14px]" />}
            </button>
            <button
              onClick={onToggleFocusMode}
              className={cn(
                'inline-flex h-[26px] items-center justify-center gap-1 rounded-lg px-2 text-[11px] font-medium transition-all duration-300',
                isFocusMode
                  ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] shadow-sm'
                  : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]'
              )}
              title={isFocusMode ? 'Sair do modo foco (F11)' : 'Entrar no modo foco (F11)'}
            >
              {isFocusMode ? <FocusIcon className="h-[13px] w-[13px]" /> : <Focus className="h-[13px] w-[13px]" />}
              <span>{isFocusMode ? 'Foco' : 'Tela cheia'}</span>
            </button>
          </div>
        </div>

        <div className="no-drag flex items-center gap-1">
          <button
            className={cn(
              'inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg transition-all duration-300',
              isFocusMode
                ? 'cursor-not-allowed opacity-40 text-[color:var(--text-tertiary)]'
                : showPrimary
                ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)]' 
                : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]'
            )}
            onClick={onTogglePrimary}
            title="Alternar painel esquerdo"
            disabled={isFocusMode}
          >
            <PanelLeft className="h-[14px] w-[14px]" />
          </button>
          <button
            className={cn(
              'inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg transition-all duration-300',
              isFocusMode
                ? 'cursor-not-allowed opacity-40 text-[color:var(--text-tertiary)]'
                : showSecondary
                ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)]' 
                : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]'
            )}
            onClick={onToggleSecondary}
            title="Alternar painel direito"
            disabled={isFocusMode}
          >
            <PanelRight className="h-[14px] w-[14px]" />
          </button>
        </div>
        
        <div className="ml-2 h-4 w-px bg-[color:var(--border-color)] no-drag transition-colors"></div>

        <div className="no-drag ml-2 flex items-center gap-1">
          <button 
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]" 
            onClick={() => window.electronAPI?.window?.minimize?.()}
          >
            <Minus className="h-[14px] w-[14px]" />
          </button>
          <button 
            className="inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--border-color)]/50 hover:text-[color:var(--text-primary)]" 
            onClick={() => { window.electronAPI?.window?.maximize?.(); setIsMaximized((value) => !value); }}
          >
            {isMaximized ? <Copy className="h-3 w-3" /> : <Square className="h-3 w-3" />}
          </button>
          <button 
            className="group inline-flex h-[26px] w-[26px] items-center justify-center rounded-lg text-[color:var(--text-secondary)] transition-all hover:bg-red-500 hover:text-white dark:hover:bg-red-600" 
            onClick={() => window.electronAPI?.window?.close?.()}
          >
            <X className="h-[14px] w-[14px] group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </header>
  );
}
