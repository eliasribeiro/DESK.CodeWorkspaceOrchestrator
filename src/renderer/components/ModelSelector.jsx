import { useState, useRef, useEffect } from 'react';

/**
 * Componente ModelSelector
 * Dropdown com filtro para seleção de modelos de IA
 * 
 * @param {Object} props
 * @param {Array} props.models - Lista de modelos disponíveis
 * @param {string} props.selectedModel - Modelo selecionado atualmente
 * @param {Function} props.onSelect - Callback quando um modelo é selecionado
 * @returns {JSX.Element} Seletor de modelos
 */
export function ModelSelector({ models = [], selectedModel, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  /**
   * Filtra modelos baseado no termo de busca
   */
  const filteredModels = models.filter(model =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    model.provider?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  /**
   * Modelo selecionado atual
   */
  const currentModel = models.find(m => m.id === selectedModel) || models[0];

  /**
   * Handler para selecionar modelo
   */
  const handleSelect = (model) => {
    onSelect(model.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  /**
   * Handler para toggle do dropdown
   */
  const handleToggle = () => {
    setIsOpen(!isOpen);
    if (!isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  /**
   * Fecha dropdown ao clicar fora
   */
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Handler para teclado
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Botão do Dropdown */}
      <button
        onClick={handleToggle}
        className="flex items-center gap-2 px-3 py-2 rounded-lg
                   bg-slate-100 dark:bg-slate-800
                   hover:bg-slate-200 dark:hover:bg-slate-700
                   border border-slate-300 dark:border-slate-600
                   transition-colors duration-150"
        aria-label="Selecionar modelo"
        aria-expanded={isOpen}
      >
        {/* Ícone de IA */}
        <svg className="w-4 h-4 text-black dark:text-slate-400" 
             fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" 
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>

        {/* Nome do modelo */}
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {currentModel?.name || 'Selecionar modelo'}
        </span>

        {/* Ícone de dropdown */}
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div 
          className="absolute left-0 mt-2 w-72 rounded-xl
                     bg-white dark:bg-slate-800
                     border border-slate-200 dark:border-slate-700
                     shadow-xl shadow-slate-200/50 dark:shadow-slate-900/50
                     z-50 overflow-hidden"
          onKeyDown={handleKeyDown}
        >
          {/* Campo de busca/filtro */}
          <div className="p-3 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filtrar modelos..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg
                           bg-slate-100 dark:bg-slate-700
                           border border-slate-200 dark:border-slate-600
                           focus:outline-none focus:ring-2 focus:ring-slate-800
                           text-slate-900 dark:text-slate-100
                           placeholder-slate-400"
                autoFocus
              />
            </div>
          </div>

          {/* Lista de modelos */}
          <div className="max-h-64 overflow-y-auto scrollbar-thin py-2">
            {filteredModels.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-8 h-8 mx-auto mb-2 text-slate-400" 
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Nenhum modelo encontrado
                </p>
              </div>
            ) : (
              <ul>
                {filteredModels.map(model => (
                  <li key={model.id}>
                    <button
                      onClick={() => handleSelect(model)}
                      className={`w-full flex items-center gap-3 px-4 py-2.5
                                  hover:bg-slate-100 dark:hover:bg-slate-700
                                  transition-colors
                                  ${model.id === selectedModel 
                                    ? 'bg-slate-100 dark:bg-slate-800/20' 
                                    : ''}`}
                    >
                      {/* Ícone do provedor */}
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                                      ${getProviderColor(model.provider)}`}>
                        {getProviderIcon(model.provider)}
                      </div>

                      {/* Informações do modelo */}
                      <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900 dark:text-white">
                            {model.name}
                          </span>
                          {model.id === selectedModel && (
                            <svg className="w-4 h-4 text-black dark:text-slate-400" 
                                 fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" 
                                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                                    clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {model.provider} {model.version && `• ${model.version}`}
                        </p>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700
                          bg-slate-50 dark:bg-slate-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {filteredModels.length} modelo{filteredModels.length !== 1 ? 's' : ''} disponível{filteredModels.length !== 1 ? 'is' : ''}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Obtém cor do provedor
 */
function getProviderColor(provider) {
  const colors = {
    'OpenAI': 'bg-slate-100 dark:bg-slate-800/20 text-slate-700 dark:text-slate-400',
    'Anthropic': 'bg-slate-200 dark:bg-slate-700/30 text-slate-800 dark:text-slate-300',
    'Google': 'bg-slate-300 dark:bg-slate-600/30 text-slate-900 dark:text-slate-200',
    'Meta': 'bg-slate-100 dark:bg-slate-800/40 text-black dark:text-slate-100',
    'Microsoft': 'bg-slate-200 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400',
    'Local': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400',
  };
  return colors[provider] || colors['Local'];
}

/**
 * Obtém ícone do provedor
 */
function getProviderIcon(provider) {
  const icons = {
    'OpenAI': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813z"/>
      </svg>
    ),
    'Anthropic': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
      </svg>
    ),
    'Google': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z"/>
      </svg>
    ),
    'Meta': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
      </svg>
    ),
    'Microsoft': (
      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
        <path d="M0 0h11.377v11.377H0zm12.623 0H24v11.377H12.623zM0 12.623h11.377V24H0zm12.623 0H24V24H12.623z"/>
      </svg>
    ),
    'Local': (
      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" 
              d="M5 12h14M12 5l7 7-7 7" />
      </svg>
    ),
  };
  return icons[provider] || icons['Local'];
}
