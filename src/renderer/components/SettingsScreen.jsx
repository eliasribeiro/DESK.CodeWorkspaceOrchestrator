import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ProviderModal } from './ProviderModal';

export function SettingsScreen() {
  const { 
    aiProviders, 
    updateProvider, 
    removeProvider, 
    setIsSettingsOpen,
    theme,
    setTheme
  } = useWorkspace();
  const [activeTab, setActiveTab] = useState('geral');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState(null);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [expandedModels, setExpandedModels] = useState({});

  const handleFetchModels = async (provider) => {
    if (!provider.baseUrl || !provider.apiKey) return;

    setIsFetchingModels(true);
    try {
      const response = await fetch(`${provider.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${provider.apiKey}` }
      });
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map(m => m.id).join(',');
        updateProvider(provider.id, { models: modelNames });
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleEditProvider = (provider) => {
    setEditingProvider(provider);
    setIsProviderModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingProvider(null);
    setIsProviderModalOpen(false);
  };

  const toggleModelsExpand = (providerId) => {
    setExpandedModels(prev => ({
      ...prev,
      [providerId]: !prev[providerId]
    }));
  };

  const shouldShowExpandButton = (models) => {
    if (!models) return false;
    const modelList = models.split(',').filter(m => m.trim());
    return modelList.length > 6;
  };

  const getDisplayedModels = (models, providerId) => {
    if (!models) return [];
    const modelList = models.split(',').filter(m => m.trim());
    const isExpanded = expandedModels[providerId];
    
    if (isExpanded || modelList.length <= 6) {
      return modelList;
    }
    return modelList.slice(0, 6);
  };

  return (
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-border-light dark:border-white/5 bg-background-light dark:bg-background-dark/95">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSettingsOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-5 h-5 text-slate-600 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 flex items-center gap-2 border-b border-border-light dark:border-white/5 bg-surface-light dark:bg-surface-dark/95">
        <button
          onClick={() => setActiveTab('geral')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'geral'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Geral
        </button>
        <button
          onClick={() => setActiveTab('provedores')}
          className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'provedores'
              ? 'border-slate-900 text-slate-900 dark:border-white dark:text-white'
              : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Provedores de IA
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-8 scrollbar-thin">
        <div className="max-w-4xl mx-auto">
          {/* ABA: GERAL */}
          {activeTab === 'geral' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <section className="space-y-4">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-700/20">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Configurações Gerais</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Personalize a aparência e comportamento da aplicação
                    </p>
                  </div>
                </div>

                <div className="p-8 bg-surface-light dark:bg-surface-dark rounded-2xl border border-border-light dark:border-white/5 shadow-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div>
                      <h3 className="text-base font-semibold text-slate-900 dark:text-white mb-1">
                        Tema da Interface
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        Escolha entre os temas disponíveis para personalizar sua experiência.
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <div className="relative w-full max-w-[240px]">
                        <select
                          value={theme}
                          onChange={(e) => setTheme(e.target.value)}
                          className="w-full h-11 px-4 pr-10 bg-background-light dark:bg-background-dark 
                                     text-slate-900 dark:text-white text-sm font-medium
                                     border border-border-light dark:border-white/10 rounded-xl
                                     appearance-none cursor-pointer focus:outline-none focus:border-primary-light transition-all shadow-sm"
                        >
                          <option value="dark">Tons mais escuros</option>
                          <option value="light">White</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 dark:text-slate-500">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          )}

          {/* ABA: PROVEDORES */}
          {activeTab === 'provedores' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <section className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Provedores de IA</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                      Configure seus provedores de inteligência artificial para usar nos chats
                    </p>
                  </div>
                  <button
                    onClick={() => setIsProviderModalOpen(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    Adicionar Provedor
                  </button>
                </div>

                {/* Lista de Cards de Provedores */}
                <div className="grid gap-4">
                  {aiProviders.map((provider) => {
                    const displayedModels = getDisplayedModels(provider.models, provider.id);
                    const showExpandButton = shouldShowExpandButton(provider.models);
                    const isExpanded = expandedModels[provider.id];

                    return (
                      <div
                        key={provider.id}
                        className="p-5 bg-surface-light dark:bg-surface-dark rounded-xl border border-border-light dark:border-white/5 hover:border-slate-400 dark:hover:border-white/20 transition-all shadow-sm"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-slate-700/20">
                              {provider.name ? provider.name.charAt(0).toUpperCase() : 'P'}
                            </div>
                            <div>
                              <h4 className="font-bold text-slate-900 dark:text-white">
                                {provider.name || 'Sem nome'}
                              </h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400">
                                {provider.baseUrl || 'Sem URL configurada'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                              <span className={`text-xs font-semibold ${provider.enabled !== false ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400 dark:text-slate-500'}`}>
                                {provider.enabled !== false ? 'Ativo' : 'Inativo'}
                              </span>
                              <button
                                type="button"
                                role="switch"
                                aria-checked={provider.enabled !== false}
                                onClick={() => updateProvider(provider.id, { enabled: provider.enabled === false })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                  provider.enabled !== false ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'
                                }`}
                                title={provider.enabled !== false ? 'Desabilitar provedor' : 'Habilitar provedor'}
                              >
                                <span
                                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                                    provider.enabled !== false ? 'translate-x-5' : 'translate-x-1'
                                  }`}
                                />
                              </button>
                            </label>
                            <div className="flex items-center gap-1 opacity-100">
                            <button
                              onClick={() => handleEditProvider(provider)}
                              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-all"
                              title="Editar provedor"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <button
                              onClick={() => removeProvider(provider.id)}
                              className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                              title="Remover provedor"
                            >
                              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            </div>
                          </div>
                        </div>

                        {/* Modelos */}
                        <div className="flex flex-wrap gap-2 mb-3">
                          {displayedModels.length > 0 ? (
                            displayedModels.map((model, idx) => (
                              <span
                                key={idx}
                                className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-black dark:text-slate-300 rounded-full text-xs font-medium"
                              >
                                {model.trim()}
                              </span>
                            ))
                          ) : (
                            <span className="text-sm text-slate-400 italic">Nenhum modelo configurado</span>
                          )}
                        </div>

                        {/* Botão Expandir/Recolher */}
                        {showExpandButton && (
                          <button
                            onClick={() => toggleModelsExpand(provider.id)}
                            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-600 transition-colors mb-4"
                          >
                            {isExpanded ? (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M5 15l7-7 7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Mostrar menos
                              </>
                            ) : (
                              <>
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M19 9l-7 7-7-7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                                Mostrar mais {provider.models.split(',').filter(m => m.trim()).length - 6} modelos
                              </>
                            )}
                          </button>
                        )}

                        {/* Ações */}
                        <div className="flex items-center gap-2 pt-4 border-t border-border-light dark:border-white/5">
                          <button
                            onClick={() => handleFetchModels(provider)}
                            disabled={isFetchingModels}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 dark:text-slate-600 bg-slate-100 dark:bg-slate-800/20 hover:bg-slate-200 dark:hover:bg-slate-800/40 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isFetchingModels ? (
                              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                            ) : (
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            )}
                            Atualizar Modelos
                          </button>
                        </div>
                      </div>
                    );
                  })}

                  {aiProviders.length === 0 && (
                    <div className="p-16 border-2 border-dashed border-border-light dark:border-white/10 rounded-2xl flex flex-col items-center justify-center text-center bg-surface-light dark:bg-surface-dark">
                      <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-6">
                        <svg className="w-10 h-10 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                        Nenhum provedor configurado
                      </h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm mb-6 max-w-md">
                        Adicione um provedor de IA para começar a usar os recursos de inteligência artificial no seu workspace.
                      </p>
                      <button
                        onClick={() => setIsProviderModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-slate-900 hover:bg-black text-white dark:bg-white dark:text-black dark:hover:bg-slate-200 rounded-xl text-sm font-medium transition-colors shadow-lg shadow-slate-900/20"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4v16m8-8H4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        Adicionar Primeiro Provedor
                      </button>
                    </div>
                  )}
                </div>
              </section>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Cadastro/Edição de Provedor */}
      <ProviderModal
        isOpen={isProviderModalOpen}
        onClose={handleCloseModal}
        editingProvider={editingProvider}
      />
    </div>
  );
}
