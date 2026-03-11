import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

export function SettingsModal() {
  const { isSettingsOpen, setIsSettingsOpen, aiProviders, addProvider, updateProvider, removeProvider, fetchProviderModels } = useWorkspace();
  const [activeTab, setActiveTab] = useState('geral');

  if (!isSettingsOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-[color:var(--bg-surface)] w-full max-w-4xl h-[80vh] rounded-[16px] shadow-2xl flex flex-col overflow-hidden border border-[color:var(--border-color)]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[color:var(--border-color)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[color:var(--text-primary)] flex items-center gap-2">
            <svg className="w-5 h-5 text-[color:var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Configurações
          </h2>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-full text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-body)] hover:text-[color:var(--primary-color)] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex px-6 border-b border-[color:var(--border-color)]">
          <button 
            onClick={() => setActiveTab('geral')}
            className={`px-4 py-3 text-[0.95rem] font-medium border-b-[2px] transition-colors ${activeTab === 'geral' ? 'border-[color:var(--primary-color)] text-[color:var(--primary-color)]' : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
          >
            Geral
          </button>
          <button 
            onClick={() => setActiveTab('provedores')}
            className={`px-4 py-3 text-[0.95rem] font-medium border-b-[2px] transition-colors ${activeTab === 'provedores' ? 'border-[color:var(--primary-color)] text-[color:var(--primary-color)]' : 'border-transparent text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'}`}
          >
            Provedores AI
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
              <section className="space-y-4">
                <h3 className="text-sm font-bold text-[color:var(--text-tertiary)] uppercase tracking-widest">Interface</h3>
                <div className="p-4 bg-[color:var(--bg-body)] rounded-[12px] border border-[color:var(--border-color)]">
                   <p className="text-[0.95rem] text-[color:var(--text-secondary)] italic">Configurações gerais da interface em breve...</p>
                </div>
              </section>
            </div>
          )}

          {activeTab === 'provedores' && (
            <div className="space-y-6 animate-in slide-in-from-right-2 duration-200">
              <div className="flex items-center justify-between">
                <p className="text-[0.95rem] text-[color:var(--text-secondary)]">Gerencie seus provedores de inteligência artificial.</p>
                <button 
                  onClick={addProvider}
                  className="flex items-center gap-2 px-3 py-1.5 bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] text-white rounded-[8px] text-[0.9rem] font-medium transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Novo Provedor
                </button>
              </div>

              <div className="space-y-4">
                {aiProviders.map((provider) => (
                  <div key={provider.id} className="p-5 bg-[color:var(--bg-body)] rounded-[12px] border border-[color:var(--border-color)] space-y-4 relative group shadow-sm">
                    <button 
                      onClick={() => removeProvider(provider.id)}
                      className="absolute top-4 right-4 p-2 text-[color:var(--text-tertiary)] hover:text-[color:var(--danger-color)] hover:bg-red-50 dark:hover:bg-red-900/10 rounded-[8px] transition-all opacity-0 group-hover:opacity-100"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[0.85rem] font-bold text-[color:var(--text-tertiary)] uppercase ml-1">Nome do Provedor</label>
                        <input 
                          type="text" 
                          value={provider.name}
                          onChange={(e) => updateProvider(provider.id, { name: e.target.value })}
                          placeholder="Ex: Local LLM, Anthropic..."
                          className="w-full px-3 py-2 bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] rounded-[8px] focus:outline-none focus:border-[color:var(--primary-color)] transition-all text-sm text-[color:var(--text-primary)] relative z-20"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[0.85rem] font-bold text-[color:var(--text-tertiary)] uppercase ml-1">Base URL</label>
                        <input 
                          type="text" 
                          value={provider.baseUrl}
                          onChange={(e) => updateProvider(provider.id, { baseUrl: e.target.value })}
                          placeholder="Ex: http://localhost:11434/v1"
                          className="w-full px-3 py-2 bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] rounded-[8px] focus:outline-none focus:border-[color:var(--primary-color)] transition-all text-sm text-[color:var(--text-primary)] relative z-20"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[0.85rem] font-bold text-[color:var(--text-tertiary)] uppercase ml-1">API Token</label>
                      <input 
                        type="password" 
                        value={provider.apiKey}
                        onChange={(e) => updateProvider(provider.id, { apiKey: e.target.value })}
                        placeholder="sk-..."
                        className="w-full px-3 py-2 bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] rounded-[8px] focus:outline-none focus:border-[color:var(--primary-color)] transition-all text-sm text-[color:var(--text-primary)] relative z-20"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[0.85rem] font-bold text-[color:var(--text-tertiary)] uppercase ml-1 flex items-center justify-between">
                        Modelos (separados por vírgula)
                        <button
                          onClick={() => fetchProviderModels(provider.id)}
                          className="text-[10px] bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] text-[color:var(--text-secondary)] px-2 py-0.5 rounded-[4px] hover:text-[color:var(--primary-color)] hover:border-[color:var(--primary-color)] transition-colors flex items-center gap-1 relative z-20"
                        >                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Obter Modelos
                        </button>
                      </label>
                      <textarea 
                        value={provider.models}
                        onChange={(e) => updateProvider(provider.id, { models: e.target.value })}
                        placeholder="gpt-4o, gpt-4-turbo..."
                        className="w-full px-3 py-2 bg-[color:var(--bg-surface)] border border-[color:var(--border-color)] rounded-[8px] focus:outline-none focus:border-[color:var(--primary-color)] transition-all text-sm text-[color:var(--text-primary)] h-20 resize-none scrollbar-thin relative z-20"
                      />
                    </div>
                  </div>
                ))}

                {aiProviders.length === 0 && (
                  <div className="p-12 border-2 border-dashed border-[color:var(--border-color)] rounded-[12px] flex flex-col items-center justify-center text-center">
                    <p className="text-[color:var(--text-secondary)] text-[0.95rem]">Nenhum provedor configurado.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 border-t border-[color:var(--border-color)] flex justify-end">
           <button 
             onClick={() => setIsSettingsOpen(false)}
             className="px-6 py-2 bg-[color:var(--primary-color)] hover:bg-[color:var(--primary-hover)] text-white rounded-[8px] text-[0.95rem] font-medium transition-colors shadow-sm"
           >
             Concluído
           </button>
        </div>
      </div>
    </div>
  );
}
