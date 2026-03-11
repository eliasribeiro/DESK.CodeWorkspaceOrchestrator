import { PromptInput } from './PromptInput';

/**
 * Área principal de trabalho (Workspace Central)
 */
export function MainWorkspace() {
  return (
    <div className="h-full flex flex-col bg-[color:var(--bg-body)] overflow-hidden">
      {/* Área superior (conteúdo principal) */}
      <div className="flex-1 overflow-auto scrollbar-thin p-6">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 border-2 border-dashed border-[color:var(--border-color)] rounded-[16px] flex flex-col items-center justify-center text-center opacity-60">
             <div className="w-16 h-16 rounded-full bg-[color:var(--bg-surface)] flex items-center justify-center mb-4">
               <svg className="w-8 h-8 text-[color:var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
               </svg>
             </div>
             <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">
               Workspace Orchestrator
             </h3>
             <p className="max-w-md text-[0.95rem] text-[color:var(--text-secondary)] mt-2">
               Esta é sua área de trabalho central. Selecione um projeto na barra lateral e use o prompt abaixo para orquestrar seu código.
             </p>
          </div>
        </div>
      </div>

      {/* Área inferior (Entrada de Prompts) */}
      <PromptInput />
    </div>
  );
}
