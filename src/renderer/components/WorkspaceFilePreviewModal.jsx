import { useEffect } from 'react';

function getRowClassName(type) {
  if (type === 'added') {
    return 'bg-emerald-500/10 text-emerald-950 dark:bg-emerald-500/12 dark:text-emerald-50';
  }

  if (type === 'removed') {
    return 'bg-rose-500/10 text-rose-950 dark:bg-rose-500/12 dark:text-rose-50';
  }

  return 'bg-transparent text-slate-700 dark:text-slate-200';
}

function getLineNumberClassName(type) {
  if (type === 'added') {
    return 'text-emerald-700 dark:text-emerald-300';
  }

  if (type === 'removed') {
    return 'text-rose-700 dark:text-rose-300';
  }

  return 'text-slate-400 dark:text-slate-500';
}

export function WorkspaceFilePreviewModal({ file, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  if (!file) {
    return null;
  }

  return (
    <div className="absolute inset-0 z-50 flex items-stretch justify-center bg-slate-950/55 px-6 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/40 bg-white/92 shadow-[0_28px_120px_rgba(15,23,42,0.35)] dark:border-white/10 dark:bg-[#09111d]/95">
        <div className="border-b border-slate-200/80 bg-gradient-to-r from-slate-100 via-white to-emerald-50 px-5 py-4 dark:border-white/10 dark:from-[#0f172a] dark:via-[#0b1220] dark:to-[#0c1a14]">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                File Review
              </p>
              <h3 className="mt-1 truncate text-lg font-semibold text-slate-900 dark:text-white">
                {file.path}
              </h3>
              <p className="mt-1 truncate text-xs text-slate-500 dark:text-slate-400">
                {file.absolutePath}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
                +{file.summary?.added || 0}
              </div>
              <div className="rounded-full border border-rose-500/20 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-700 dark:text-rose-300">
                -{file.summary?.removed || 0}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:border-white/20 dark:hover:text-white"
                aria-label="Fechar visualizacao do arquivo"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[84px_84px_minmax(0,1fr)] border-b border-slate-200/80 bg-slate-100/80 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
          <span>Old</span>
          <span>New</span>
          <span>Code</span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[linear-gradient(180deg,rgba(255,255,255,0.45),rgba(248,250,252,0.92))] dark:bg-[linear-gradient(180deg,rgba(9,17,29,0.96),rgba(6,12,22,1))]">
          <div className="min-w-full font-mono text-[12.5px] leading-6">
            {file.lines?.map((line, index) => (
              <div
                key={`${line.type}-${line.oldLineNumber ?? 'n'}-${line.newLineNumber ?? 'n'}-${index}`}
                className={`grid grid-cols-[84px_84px_minmax(0,1fr)] border-b border-slate-200/60 px-4 dark:border-white/5 ${getRowClassName(line.type)}`}
              >
                <span className={`select-none border-r border-slate-200/60 pr-4 text-right tabular-nums dark:border-white/5 ${getLineNumberClassName(line.type)}`}>
                  {line.oldLineNumber ?? ''}
                </span>
                <span className={`select-none border-r border-slate-200/60 px-4 text-right tabular-nums dark:border-white/5 ${getLineNumberClassName(line.type)}`}>
                  {line.newLineNumber ?? ''}
                </span>
                <span className="whitespace-pre px-4">
                  {line.content || ' '}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
