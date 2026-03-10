/**
 * Componente da barra lateral esquerda (Primária)
 * Gerencia a seleção de projetos e exibição da estrutura de arquivos.
 */
export function PrimarySidebar({ projectPath, onSelectProject }) {
  return (
    <aside className="h-full flex flex-col bg-surface-light dark:bg-surface-dark border-r border-slate-200 dark:border-slate-800 overflow-hidden">
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
          Explorer
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Seção de Seleção de Projeto */}
        <div className="space-y-3">
          <button
            onClick={onSelectProject}
            className="w-full py-2 px-3 flex items-center justify-center gap-2 
                       bg-slate-900 hover:bg-black active:bg-black 
                       text-white text-sm font-medium rounded-md transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Selecionar Projeto
          </button>

          {projectPath ? (
            <div className="p-3 bg-slate-100 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-800">
              <p className="text-[10px] text-slate-500 dark:text-slate-500 uppercase font-bold mb-1">
                Pasta selecionada:
              </p>
              <p className="text-xs text-slate-700 dark:text-slate-300 break-all font-mono">
                {projectPath}
              </p>
            </div>
          ) : (
            <div className="p-4 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg flex flex-col items-center justify-center text-center">
              <svg className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
              <p className="text-xs text-slate-500 dark:text-slate-500">
                Nenhum projeto selecionado.
              </p>
            </div>
          )}
        </div>

        {/* Placeholder para estrutura de arquivos futuramente */}
        {projectPath && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
             <p className="text-[10px] text-slate-500 dark:text-slate-400 italic">
               Estrutura de arquivos será exibida aqui...
             </p>
          </div>
        )}
      </div>
    </aside>
  );
}
