import { useState } from 'react';

/**
 * Componente de entrada de prompts
 * Textarea grande para o usuário interagir com a LLM.
 */
export function PromptInput() {
  const [prompt, setPrompt] = useState('');

  const handleChange = (e) => {
    setPrompt(e.target.value);
  };

  return (
    <div className="p-4 bg-[color:var(--bg-surface)] border-t border-[color:var(--border-color)]">
      <div className="max-w-4xl mx-auto relative group">
        <textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Digite seu prompt aqui para a LLM..."
          className="w-full min-h-[120px] max-h-[300px] p-4 pr-12
                     bg-[color:var(--bg-body)] 
                     border border-[color:var(--border-color)] 
                     rounded-[12px] shadow-sm focus:ring-2 focus:ring-[color:var(--primary-color)]/20 
                     focus:border-[color:var(--primary-color)] outline-none transition-all
                     text-[color:var(--text-primary)] placeholder:text-[color:var(--text-tertiary)]
                     resize-y scrollbar-thin"
        />
        
        <button 
          disabled={!prompt.trim()}
          className="absolute right-3 bottom-3 p-2 rounded-[8px]
                     bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] disabled:bg-[color:var(--border-color)] 
                     disabled:text-[color:var(--text-tertiary)] text-white transition-colors
                     shadow-sm flex items-center justify-center"
          title="Enviar Prompt"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-[10px] text-center text-[color:var(--text-secondary)]">
        Pressione <kbd className="px-1 py-0.5 rounded bg-[color:var(--bg-body)] border border-[color:var(--border-color)] font-mono">Shift + Enter</kbd> para quebrar linha.
      </p>
    </div>
  );
}
