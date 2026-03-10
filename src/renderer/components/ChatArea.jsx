import { useWorkspace } from '@context/WorkspaceContext';
import { ModelSelector } from '@components/ModelSelector';

/**
 * Componente ChatArea
 * Área principal de exibição do chat selecionado
 * 
 * @returns {JSX.Element} Área de conteúdo do chat
 */
export function ChatArea() {
  const { getSelectedChat, models, selectedModel, setSelectedModel } = useWorkspace();

  const selected = getSelectedChat();

  // Nenhum chat selecionado
  if (!selected) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 
                          flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Nenhum chat selecionado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Selecione um chat na barra lateral ou crie um novo
          </p>
        </div>
      </div>
    );
  }

  const { chat, project } = selected;

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
      {/* Header do Chat */}
      <header className="h-14 flex items-center justify-between px-6
                         border-b border-slate-200 dark:border-slate-700
                         bg-surface-light dark:bg-surface-dark">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            {chat.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {project.name}
          </p>
        </div>

        {/* Seletor de modelo e informações */}
        <div className="flex items-center gap-4">
          {/* Model Selector Dropdown */}
          <ModelSelector
            models={models}
            selectedModel={selectedModel}
            onSelect={setSelectedModel}
          />
          
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Criado em {new Date(chat.createdAt).toLocaleDateString('pt-BR')}
          </div>
        </div>
      </header>

      {/* Área de mensagens */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
        <div className="w-full space-y-4">
          {/* Mensagem de boas-vindas */}
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700
                             flex items-center justify-center flex-shrink-0">
               <span className="text-slate-600 dark:text-slate-300 text-sm font-bold">AI</span>
            </div>            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-slate-900 dark:text-white">
                  Assistente
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {new Date(chat.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-slate-700 dark:text-slate-300 text-sm leading-relaxed">
                <p>Olá! Este é o início do seu chat <strong>"{chat.name}"</strong> no projeto <strong>"{project.name}"</strong>.</p>
                <p className="mt-2">Como posso ajudar você hoje?</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Área de input */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-700 
                      bg-surface-light dark:bg-surface-dark">
        <div className="w-full">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Digite sua mensagem..."
              className="flex-1 px-4 py-2.5 rounded-lg
                         bg-white dark:bg-slate-800
                         border border-slate-300 dark:border-slate-600
                         focus:outline-none focus:ring-2 focus:ring-slate-700
                         text-slate-900 dark:text-slate-100
                         placeholder-slate-400"
            />
            <button
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-black 
                         text-white font-medium transition-colors duration-150"
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
