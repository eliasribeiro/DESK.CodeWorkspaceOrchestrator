/**
 * Componente da barra lateral direita (Secundária)
 * Espaço reservado para logs, resultados de LLM e ferramentas auxiliares.
 */
export function SecondarySidebar() {
  return (
    <aside className="h-full flex flex-col bg-surface-light dark:bg-surface-dark border-l border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Auxiliar
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="h-full border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center p-6 opacity-40">
          <svg className="w-10 h-10 text-slate-400 dark:text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-xs text-slate-500 dark:text-slate-500 font-medium">
            Área Reservada
          </p>
          <p className="text-[10px] text-slate-400 dark:text-slate-600 mt-2">
            Futuramente aqui serão exibidos logs, resultados da LLM e ferramentas de suporte.
          </p>
        </div>
      </div>
    </aside>
  );
}
