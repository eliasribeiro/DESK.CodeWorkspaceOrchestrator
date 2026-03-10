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
    <div className="p-4 bg-background-light dark:bg-background-dark border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-4xl mx-auto relative group">
        <textarea
          value={prompt}
          onChange={handleChange}
          placeholder="Digite seu prompt aqui para a LLM..."
          className="w-full min-h-[120px] max-h-[300px] p-4 pr-12
                     bg-white dark:bg-slate-900 
                     border border-slate-200 dark:border-slate-800 
                     rounded-xl shadow-sm focus:ring-2 focus:ring-slate-700/20 
                     focus:border-slate-700 outline-none transition-all
                     text-slate-800 dark:text-slate-100 placeholder:text-slate-400
                     resize-y scrollbar-thin"
        />
        
        <button 
          disabled={!prompt.trim()}
          className="absolute right-3 bottom-3 p-2 rounded-lg
                     bg-slate-900 hover:bg-black disabled:bg-slate-300 
                     dark:disabled:bg-slate-800 text-white transition-colors
                     shadow-sm flex items-center justify-center"
          title="Enviar Prompt"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </button>
      </div>
      <p className="mt-2 text-[10px] text-center text-slate-400 dark:text-slate-500">
        Pressione <kbd className="px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-mono">Shift + Enter</kbd> para quebrar linha.
      </p>
    </div>
  );
}
