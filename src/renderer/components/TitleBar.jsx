import { useEffect, useState } from 'react';
import { PanelLeft, PanelRight, Minus, Square, Copy, X } from 'lucide-react';
import { cn } from '@lib/utils';

function ShellButton({ active = false, className, children, ...props }) {
  return (
    <button
      className={cn(
        'no-drag inline-flex h-10 items-center justify-center rounded-2xl border border-white/8 bg-white/6 px-3 text-slate-300 transition-all hover:bg-white/12 hover:text-white',
        active && 'border-[color:var(--ring)] bg-[color:var(--accent-soft)] text-white',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TitleBar({
  showPrimary = false,
  onTogglePrimary = () => {},
  showSecondary = false,
  onToggleSecondary = () => {},
}) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    window.electronAPI?.window?.isMaximized?.()
      .then(setIsMaximized)
      .catch(() => {});
  }, []);

  return (
    <header className="drag-region relative z-50 flex h-9 w-full items-center justify-between border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4">
      <div className="flex flex-1 items-center gap-2">
        <div className="no-drag ml-3 hidden items-center justify-center md:flex">
          <p className="font-semibold text-[color:var(--text-primary)]">
            Code Workspace Orchestrator
          </p>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-1">
        <div className="no-drag flex items-center gap-1">
          <button
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--primary-color)]',
              showPrimary && 'bg-[#eff6ff] text-[color:var(--primary-color)] dark:bg-white/10 dark:text-white',
            )}
            onClick={onTogglePrimary}
            title="Alternar painel principal"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
          <button
            className={cn(
              'inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-body)] hover:text-[color:var(--primary-color)]',
              showSecondary && 'bg-[#eff6ff] text-[color:var(--primary-color)] dark:bg-white/10 dark:text-white',
            )}
            onClick={onToggleSecondary}
            title="Alternar painel auxiliar"
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
        
        <div className="ml-2 w-px h-4 bg-[color:var(--border-color)] no-drag hidden md:block"></div>

        <div className="no-drag hidden items-center gap-1 md:flex ml-2">
          <button className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-body)] hover:text-[color:var(--primary-color)]" onClick={() => window.electronAPI?.window?.minimize?.()}>
            <Minus className="h-4 w-4" />
          </button>
          <button className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-body)] hover:text-[color:var(--primary-color)]" onClick={() => { window.electronAPI?.window?.maximize?.(); setIsMaximized((value) => !value); }}>
            {isMaximized ? <Copy className="h-3.5 w-3.5" /> : <Square className="h-3.5 w-3.5" />}
          </button>
          <button className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] text-[color:var(--text-secondary)] hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10" onClick={() => window.electronAPI?.window?.close?.()}>
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
