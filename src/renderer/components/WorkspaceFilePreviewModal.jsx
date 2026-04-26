import { useEffect } from 'react';

function getRowClassName(type) {
  if (type === 'added') {
    return 'bg-[color:var(--success-color)]/10 text-[color:var(--text-primary)]';
  }

  if (type === 'removed') {
    return 'bg-[color:var(--danger-color)]/10 text-[color:var(--text-primary)]';
  }

  return 'bg-transparent text-[color:var(--text-primary)]';
}

function getLineNumberClassName(type) {
  if (type === 'added') {
    return 'text-[color:var(--success-color)] opacity-80';
  }

  if (type === 'removed') {
    return 'text-[color:var(--danger-color)] opacity-80';
  }

  return 'text-[color:var(--text-tertiary)]';
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
    <div className="absolute inset-0 z-50 flex items-stretch justify-center bg-black/60 px-6 py-6 backdrop-blur-sm">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative flex h-full w-full max-w-6xl flex-col overflow-hidden rounded-[24px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] shadow-xl">
        <div className="border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-tertiary)]">
                File Review
              </p>
              <h3 className="mt-1 truncate text-[1.1rem] font-bold text-[color:var(--text-primary)]">
                {file.path}
              </h3>
              <p className="mt-1 truncate text-[0.85rem] text-[color:var(--text-secondary)]">
                {file.absolutePath}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="rounded-[8px] border border-[color:var(--success-color)]/20 bg-[color:var(--success-color)]/10 px-3 py-1 text-[0.85rem] font-semibold text-[color:var(--success-color)]">
                +{file.summary?.added || 0}
              </div>
              <div className="rounded-[8px] border border-[color:var(--danger-color)]/20 bg-[color:var(--danger-color)]/10 px-3 py-1 text-[0.85rem] font-semibold text-[color:var(--danger-color)]">
                -{file.summary?.removed || 0}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="ml-2 inline-flex h-10 w-10 items-center justify-center rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-secondary)] transition-colors hover:bg-[color:var(--bg-surface)] hover:text-[color:var(--text-primary)]"
                aria-label="Fechar visualização do arquivo"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-[84px_84px_minmax(0,1fr)] border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-[color:var(--text-tertiary)] shadow-sm z-10">
          <span>Old</span>
          <span>New</span>
          <span>Code</span>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[color:var(--bg-body)]">
          <div className="min-w-full font-mono text-[13px] leading-6 py-2">
            {file.lines?.map((line, index) => (
              <div
                key={`${line.type}-${line.oldLineNumber ?? 'n'}-${line.newLineNumber ?? 'n'}-${index}`}
                className={`grid grid-cols-[84px_84px_minmax(0,1fr)] border-b border-[color:var(--border-color)]/30 px-4 ${getRowClassName(line.type)}`}
              >
                <span className={`select-none border-r border-[color:var(--border-color)] pr-4 text-right tabular-nums ${getLineNumberClassName(line.type)}`}>
                  {line.oldLineNumber ?? ''}
                </span>
                <span className={`select-none border-r border-[color:var(--border-color)] px-4 text-right tabular-nums ${getLineNumberClassName(line.type)}`}>
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
