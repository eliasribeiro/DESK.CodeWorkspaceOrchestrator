import { useEffect } from 'react';

export function AppDialog({
  isOpen,
  type = 'alert',
  variant = 'info',
  title = '',
  message = '',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onCancel();
      }
      if (event.key === 'Enter') {
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen) {
    return null;
  }

  const isDanger = variant === 'danger';
  const dangerConfirmClasses = 'bg-red-600 hover:bg-red-700 text-white';
  const defaultConfirmClasses = 'bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 backdrop-blur-sm px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/80 dark:border-white/10 bg-surface-light dark:bg-surface-dark shadow-2xl overflow-hidden">
        <div className="px-5 pt-5 pb-4">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl ${isDanger ? 'bg-red-100 text-red-600 dark:bg-red-900/35 dark:text-red-300' : 'bg-slate-200 text-slate-700 dark:bg-white/10 dark:text-slate-300'}`}>
              {isDanger ? (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86l-8.11 14A1 1 0 003.05 19h17.9a1 1 0 00.87-1.5l-8.11-14a1 1 0 00-1.74 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{message}</p>
            </div>
          </div>
        </div>
        <div className="px-5 pb-5 flex items-center justify-end gap-2">
          {type === 'confirm' && (
            <button
              onClick={onCancel}
              className="px-4 py-2 rounded-lg border border-slate-300 dark:border-white/15 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors text-sm font-medium"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg transition-colors text-sm font-semibold ${isDanger ? dangerConfirmClasses : defaultConfirmClasses}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
