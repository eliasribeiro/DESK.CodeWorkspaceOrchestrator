import { useState, useEffect } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

export function ProviderModal({ isOpen, onClose, editingProvider = null }) {
  const { addProvider, updateProvider, fetchProviderModels } = useWorkspace();
  const [formData, setFormData] = useState({
    name: '',
    baseUrl: '',
    apiKey: '',
    models: ''
  });
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Quando o modal abrir, carrega os dados do provedor sendo editado ou limpa o formulário
  useEffect(() => {
    if (isOpen) {
      setShowApiKey(false);
      if (editingProvider) {
        setFormData({
          name: editingProvider.name || '',
          baseUrl: editingProvider.baseUrl || '',
          apiKey: editingProvider.apiKey || '',
          models: editingProvider.models || ''
        });
      } else {
        setFormData({
          name: '',
          baseUrl: '',
          apiKey: '',
          models: ''
        });
      }
    }
  }, [isOpen, editingProvider]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFetchModels = async () => {
    if (!formData.baseUrl || !formData.apiKey) return;

    setIsFetchingModels(true);
    try {
      const response = await fetch(`${formData.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${formData.apiKey}` }
      });
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map(m => m.id).join(',');
        handleChange('models', modelNames);

        // Se estiver editando, atualiza diretamente
        if (editingProvider) {
          updateProvider(editingProvider.id, { models: modelNames });
        }
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (editingProvider) {
      // Atualizar provedor existente
      updateProvider(editingProvider.id, formData);
    } else {
      // Criar novo provedor
      const newProvider = {
        id: `prov-${Date.now()}`,
        ...formData
      };
      addProvider(newProvider);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-surface-light dark:bg-surface-dark w-full max-w-lg rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-border-light dark:border-white/5 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-border-light dark:border-white/5 flex items-center justify-between bg-background-light dark:bg-background-dark">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-slate-900" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {editingProvider ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              )}
            </svg>
            {editingProvider ? 'Editar Provedor' : 'Novo Provedor'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-white/10 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              Nome do Provedor
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Ex: Local LLM, Anthropic, OpenAI..."
              className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-white/10 rounded-lg focus:outline-none focus:border-primary-light transition-all text-sm shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              Base URL
            </label>
            <input
              type="url"
              value={formData.baseUrl}
              onChange={(e) => handleChange('baseUrl', e.target.value)}
              placeholder="Ex: http://localhost:11434/v1"
              className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-white/10 rounded-lg focus:outline-none focus:border-primary-light transition-all text-sm shadow-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1">
              API Token
            </label>
            <div className="flex items-center gap-2">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => handleChange('apiKey', e.target.value)}
                placeholder="sk-..."
                className="w-full px-3 py-2.5 bg-background-light dark:bg-background-dark border border-border-light dark:border-white/10 rounded-lg focus:outline-none focus:border-primary-light transition-all text-sm shadow-sm"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(prev => !prev)}
                className="px-3 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/40 border border-border-light dark:border-white/10 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800/70 transition-colors whitespace-nowrap"
              >
                {showApiKey ? 'Ocultar' : 'Visualizar'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase ml-1 flex items-center justify-between">
              <span>Modelos</span>
              <button
                type="button"
                onClick={handleFetchModels}
                disabled={isFetchingModels || !formData.baseUrl || !formData.apiKey}
                className="text-[10px] bg-slate-200 dark:bg-slate-800/30 text-slate-900 dark:text-slate-600 px-2 py-0.5 rounded-full hover:bg-slate-400 dark:hover:bg-slate-800/50 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >                {isFetchingModels ? (
                  <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                )}
                Buscar Modelos
              </button>
            </label>
            <textarea
              value={formData.models}
              onChange={(e) => handleChange('models', e.target.value)}
              placeholder="gpt-4o, gpt-4-turbo, llama-3..."
              className="w-full px-3 py-2 bg-background-light dark:bg-background-dark border border-border-light dark:border-white/10 rounded-lg focus:outline-none focus:border-primary-light transition-all text-sm h-24 resize-none scrollbar-thin shadow-sm"
            />
            <p className="text-xs text-slate-400 dark:text-slate-500 ml-1">
              Separe os modelos por vírgula ou use "Buscar Modelos" para carregar automaticamente.
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border-light dark:border-white/5 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 rounded-lg transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-sm font-medium transition-colors shadow-lg shadow-slate-900/20"
            >
              {editingProvider ? 'Salvar Alterações' : 'Cadastrar Provedor'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
