import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ProviderModal } from './ProviderModal';

export function SettingsSidebar() {
  const { isSettingsOpen, setIsSettingsOpen, aiProviders, addProvider, updateProvider, removeProvider, fetchProviderModels } = useWorkspace();
  const [activeTab, setActiveTab] = useState('geral');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);

  if (!isSettingsOpen) return null;

  return (
    <>
      {/* Overlay para fechar ao clicar fora */}
      <div 
        className="fixed inset-0 z-[90] bg-black/20 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={() => setIsSettingsOpen(false)}
      />

      {/* Sidebar de Configurações */}
      <aside className="fixed top-0 right-0 h-full w-[480px] z-[91] bg-surface-light dark:bg-surface-dark shadow-2xl border-l border-border-light dark:border-white/5 animate-in slide-in-from-right duration-300 flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light dark:border-white/5 flex items-center justify-between bg-surface-light dark:bg-surface-dark">
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </h2>
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-white/5">
          <button
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'geral' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Geral
          </button>
          <button
            onClick={() => setActiveTab('provedores')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'provedores' ? 'border-slate-900 text-slate-900' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            Provedores AI
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Interface</h3>
                <div className="p-4 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-white/5">
                   <p className="text-sm text-slate-600 dark:text-slate-400 italic">Configurações gerais da interface em breve...</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'provedores' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500 dark:text-slate-400">Gerencie seus provedores de inteligência artificial.</p>
                <button
                  onClick={() => setIsProviderModalOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Novo Provedor
                </button>
              </div>

              {/* Lista de Cards de Provedores */}
              <div className="space-y-3">
                {aiProviders.map((provider) => (
                  <div 
                    key={provider.id} 
                    className="p-4 bg-background-light dark:bg-background-dark rounded-xl border border-border-light dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20 transition-all group"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-slate-700/20">
                          {provider.name ? provider.name.charAt(0).toUpperCase() : 'P'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 dark:text-slate-100">
                            {provider.name || 'Sem nome'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                            {provider.baseUrl || 'Sem URL configurada'}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => removeProvider(provider.id)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Remover provedor"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </button>
                    </div>

                    {/* Modelos */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {provider.models ? (
                        provider.models.split(',').slice(0, 5).map((model, idx) => (
                          <span 
                            key={idx}
                            className="px-2 py-0.5 bg-slate-100 dark:bg-white/5 text-black dark:text-slate-300 rounded text-[10px] font-medium"
                          >
                            {model.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-slate-400 italic">Nenhum modelo</span>
                      )}
                      {provider.models && provider.models.split(',').length > 5 && (
                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-[10px] font-medium">
                          +{provider.models.split(',').length - 5}
                        </span>
                      )}
                    </div>

                    {/* Ações */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => fetchProviderModels(provider.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/20 hover:bg-slate-200 dark:hover:bg-slate-800/40 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Atualizar Modelos
                      </button>
                      <button
                        onClick={() => setIsProviderModalOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg transition-colors"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Editar
                      </button>
                    </div>

                    {/* Campos ocultos para edição via modal */}
                    <input type="hidden" value={provider.name} onChange={(e) => updateProvider(provider.id, { name: e.target.value })} />
                    <input type="hidden" value={provider.baseUrl} onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })} />
                    <input type="hidden" value={provider.apiKey} onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })} />
                    <input type="hidden" value={provider.models} onChange={(e) => updateProvider(provider.id, { models: e.target.value })} />
                  </div>
                ))}

                {aiProviders.length === 0 && (
                  <div className="p-12 border-2 border-dashed border-border-light dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">Nenhum provedor configurado</p>
                    <button
                      onClick={() => setIsProviderModalOpen(true)}
                      className="text-sm text-slate-900 dark:text-slate-600 hover:underline font-medium"
                    >
                      Adicionar seu primeiro provedor
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border-light dark:border-white/5 flex justify-end bg-surface-light dark:bg-surface-dark">
           <button
             onClick={() => setIsSettingsOpen(false)}
             className="px-6 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl text-sm font-medium transition-colors shadow-lg"
           >
             Concluído
           </button>
        </div>
      </aside>

      {/* Modal de Cadastro/Edição de Provedor */}
      <ProviderModal 
        isOpen={isProviderModalOpen}
        onClose={() => setIsProviderModalOpen(false)}
      />
    </>
  );
}
