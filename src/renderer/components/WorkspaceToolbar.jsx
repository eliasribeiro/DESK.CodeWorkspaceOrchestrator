import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

const editorOptions = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'qwen-code', label: 'Qwen Code' },
  { value: 'opcode', label: 'OpenCode' },
];

const layoutOptions = [
  { value: 'tabs', label: 'Abas' },
  { value: 'grid', label: 'Grade' },
];

function SearchableSelect({
  value,
  onChange,
  options,
  disabled = false,
  placeholder = 'Selecionar',
  searchPlaceholder = 'Digite para filtrar',
  emptyLabel = 'Nenhuma opção',
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const selectedOption = useMemo(() => {
    return options.find((option) => option.value === value) || null;
  }, [options, value]);

  const filteredOptions = useMemo(() => {
    const normalizedTerm = searchTerm.trim().toLowerCase();
    if (!normalizedTerm) {
      return options;
    }

    return options.filter((option) => option.label.toLowerCase().includes(normalizedTerm));
  }, [options, searchTerm]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const handleSelect = (nextValue) => {
    onChange?.(nextValue);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`.trim()} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          if (disabled) {
            return;
          }
          setIsOpen((current) => !current);
        }}
        disabled={disabled}
        className="group h-10 w-full rounded-xl border border-slate-200/80 bg-white/70 px-4 text-left text-sm font-medium text-slate-800 shadow-sm backdrop-blur-md outline-none transition-all duration-200 hover:bg-white/90 hover:border-slate-300 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
      >
        <span className="block truncate pr-6">{selectedOption?.label || placeholder}</span>
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform duration-300 group-hover:text-indigo-400 ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-slate-200/80 bg-white/95 shadow-xl backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 duration-200 flex flex-col focus:outline-none ring-1 ring-black/5 dark:ring-white/5 animate-in fade-in slide-in-from-top-2">
          <div className="border-b border-slate-200/50 p-2 dark:border-white/10 bg-slate-50/50 dark:bg-white/5">
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    setIsOpen(false);
                    setSearchTerm('');
                  }
                  if (event.key === 'Enter' && filteredOptions[0]) {
                    event.preventDefault();
                    handleSelect(filteredOptions[0].value);
                  }
                }}
                placeholder={searchPlaceholder}
                className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-slate-800 dark:text-slate-100"
              />
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-center text-slate-500 dark:text-slate-400">{emptyLabel}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`relative w-full px-4 py-2.5 text-left text-sm transition-colors duration-150 ${
                    option.value === value
                      ? 'bg-indigo-50/80 font-semibold text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-300'
                      : 'text-slate-700 hover:bg-slate-100/80 dark:text-slate-300 dark:hover:bg-white/10'
                  }`}
                >
                  {option.label}
                  {option.value === value && (
                    <svg className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-indigo-500 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function WorkspaceToolbar({
  editor,
  onEditorChange,
  selectedProvider,
  onProviderChange,
  selectedModel,
  onModelChange,
  yoloMode,
  onToggleYolo,
  layoutMode,
  onLayoutChange,
  onLaunch,
  isRunning,
  sessionCount = 0,
}) {
  const { aiProviders } = useWorkspace();

  const providerOptions = useMemo(() => {
    return aiProviders
      .filter((provider) => provider.enabled !== false)
      .filter((provider) => provider.name || provider.baseUrl)
      .map((provider) => ({
        value: provider.id,
        label: provider.name || provider.baseUrl,
        models: provider.models
          ? provider.models.split(',').map((model) => model.trim()).filter(Boolean)
          : [],
      }));
  }, [aiProviders]);

  const currentProvider = providerOptions.find((providerOption) => providerOption.value === selectedProvider);
  const isCodexSelected = editor === 'codex';
  const isClaudeSelected = editor === 'claude-code';
  const isQwenSelected = editor === 'qwen-code';
  const isOpenCodeSelected = editor === 'opcode';
  const showYolo = isCodexSelected || isClaudeSelected || isQwenSelected;
  const requiresProvider = !isCodexSelected && !isQwenSelected;
  const isLaunchDisabled =
    isRunning || sessionCount >= 8 || (requiresProvider ? !selectedProvider || !selectedModel : false);

  const currentActionLabel = isCodexSelected
    ? 'Run Codex'
    : isClaudeSelected
      ? 'Run Claude'
      : isQwenSelected
        ? 'Run Qwen'
        : isOpenCodeSelected
          ? 'Run OpenCode'
          : 'Run';

  return (
    <div className="relative z-30 border-b border-slate-200/60 bg-white/60 px-6 py-4 backdrop-blur-xl shadow-sm dark:border-white/5 dark:bg-[#111827]/80 transition-all">
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative min-w-0 group">
            <select
              value={editor}
              onChange={(event) => onEditorChange?.(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200/80 bg-white/70 px-4 pr-10 text-sm font-medium text-slate-800 shadow-sm backdrop-blur-md outline-none transition-all duration-200 hover:bg-white focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/20 dark:border-white/10 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10"
            >
              {editorOptions.map((editorOption) => (
                <option key={editorOption.value} value={editorOption.value} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                  {editorOption.label}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 group-hover:text-indigo-400 transition-colors">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {requiresProvider && (
            <SearchableSelect
              value={selectedProvider}
              onChange={onProviderChange}
              options={providerOptions.map((providerOption) => ({
                value: providerOption.value,
                label: providerOption.label,
              }))}
              disabled={providerOptions.length === 0}
              placeholder="Nenhum provedor"
              searchPlaceholder="Filtrar provedores..."
              emptyLabel="Nenhum provedor encontrado"
              className="min-w-0"
            />
          )}

          {requiresProvider && (
            <SearchableSelect
              value={selectedModel}
              onChange={onModelChange}
              options={(currentProvider?.models || []).map((model) => ({
                value: model,
                label: model,
              }))}
              disabled={!currentProvider || currentProvider.models.length === 0}
              placeholder="Nenhum modelo"
              searchPlaceholder="Filtrar modelos..."
              emptyLabel="Nenhum modelo encontrado"
              className="min-w-0"
            />
          )}

          {!requiresProvider && <div className="hidden md:block" />}

          {!requiresProvider && <div className="hidden md:block" />}

          <button
            onClick={onLaunch}
            disabled={isLaunchDisabled}
            className={`group relative inline-flex h-10 w-full overflow-hidden items-center justify-center gap-2 rounded-xl px-5 text-sm font-bold shadow-md transition-all duration-300 transform ${
              isLaunchDisabled
                ? 'cursor-not-allowed bg-slate-200 text-slate-400 shadow-none dark:bg-white/5 dark:text-slate-500'
                : isCodexSelected
                  ? 'bg-gradient-to-r from-emerald-500 to-green-500 text-white hover:shadow-emerald-500/30 hover:shadow-lg hover:-translate-y-0.5'
                  : isClaudeSelected
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white hover:shadow-orange-500/30 hover:shadow-lg hover:-translate-y-0.5'
                    : isQwenSelected
                      ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white hover:shadow-blue-500/30 hover:shadow-lg hover:-translate-y-0.5'
                      : 'bg-gradient-to-r from-slate-900 to-slate-700 text-white hover:shadow-slate-800/30 hover:shadow-lg hover:-translate-y-0.5 dark:from-slate-100 dark:to-white dark:text-slate-900 dark:hover:shadow-white/20'
            }`}
          >
            {/* Glossy overlay effect for button */}
            {!isLaunchDisabled && (
              <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
            )}

            {isRunning ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Abrindo...
              </>
            ) : (
              <>
                <svg className="h-4 w-4 transition-transform group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {currentActionLabel}
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-slate-200/50 pt-3 md:grid-cols-2 dark:border-white/5">
          <div className="flex min-w-0 items-center justify-between md:justify-start gap-4">
            <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 ml-1">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
              View
            </span>
            <div className="inline-flex shrink-0 rounded-lg p-1 bg-slate-100/80 dark:bg-white/5 shadow-inner backdrop-blur-sm gap-1">
              {layoutOptions.map((option) => {
                const isActive = layoutMode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onLayoutChange?.(option.value)}
                    className={`inline-flex h-8 items-center gap-2 rounded-md px-3 text-xs font-semibold transition-all duration-200 ${
                      isActive
                        ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white dark:shadow-black/50 ring-1 ring-slate-200/50 dark:ring-white/10'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-white/50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-white/5'
                    }`}
                    title={option.label}
                    aria-pressed={isActive}
                  >
                    {option.value === 'tabs' ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h6l2 2h8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                      </svg>
                    )}
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>

          {showYolo && (
            <button
              type="button"
              onClick={onToggleYolo}
              role="switch"
              aria-checked={yoloMode}
              className={`ml-auto inline-flex h-9 w-full max-w-fit items-center justify-self-end gap-3 rounded-lg border px-3 py-1.5 text-left transition-all duration-300 shadow-sm hover:shadow active:scale-95 ${
                yoloMode
                  ? 'border-transparent bg-gradient-to-r from-orange-500/10 to-amber-500/10 text-orange-900 ring-1 ring-orange-500/30 dark:from-orange-500/20 dark:to-orange-600/20 dark:text-orange-100 dark:ring-orange-500/50'
                  : 'border-slate-200/80 bg-slate-50 text-slate-700 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              <span className="flex flex-col leading-none pt-0.5">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">YOLO Mode</span>
                <span className={`mt-0.5 text-[10px] font-medium transition-opacity ${yoloMode ? 'opacity-90' : 'opacity-60'}`}>{yoloMode ? 'Active' : 'Disabled'}</span>
              </span>
              <span
                className={`relative h-6 w-11 rounded-full transition-colors duration-300 shadow-inner ${
                  yoloMode ? 'bg-gradient-to-r from-orange-500 to-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-all duration-300 ${
                    yoloMode ? 'left-[22px] shadow-orange-500/50' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          )}

          {!showYolo && <div />}
        </div>
      </div>
    </div>
  );
}
