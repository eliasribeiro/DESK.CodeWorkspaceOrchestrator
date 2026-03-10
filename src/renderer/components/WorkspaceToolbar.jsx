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
  emptyLabel = 'Nenhuma opcao',
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
        className="h-9 w-full rounded-xl border border-border-light bg-background-light px-3 text-left text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-primary-light disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/10 dark:bg-background-dark dark:text-slate-100"
      >
        <span className="block truncate pr-5">{selectedOption?.label || placeholder}</span>
        <svg
          className={`pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-40 mt-2 w-full overflow-hidden rounded-xl border border-border-light bg-surface-light shadow-xl dark:border-white/10 dark:bg-surface-dark">
          <div className="border-b border-border-light p-2 dark:border-white/5">
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
              className="h-9 w-full rounded-xl border border-border-light bg-background-light px-3 text-sm text-slate-900 outline-none transition focus:border-primary-light dark:border-white/10 dark:bg-background-dark dark:text-slate-100"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">{emptyLabel}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-sm transition ${
                    option.value === value
                      ? 'bg-slate-100 font-medium text-slate-900 dark:bg-white/10 dark:text-slate-100'
                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5'
                  }`}
                >
                  {option.label}
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
    <div className="relative z-30 border-b border-border-light bg-surface-light/95 px-6 py-3 backdrop-blur dark:border-white/5 dark:bg-surface-dark/95">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
          <div className="relative min-w-0">
            <select
              value={editor}
              onChange={(event) => onEditorChange?.(event.target.value)}
              className="h-9 w-full appearance-none rounded-xl border border-border-light bg-surface-light px-3 pr-10 text-sm font-medium text-slate-900 shadow-sm outline-none transition focus:border-primary-light dark:border-white/10 dark:bg-surface-dark dark:text-slate-100"
            >
              {editorOptions.map((editorOption) => (
                <option key={editorOption.value} value={editorOption.value}>
                  {editorOption.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
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
            className={`inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-sm transition ${
              isLaunchDisabled
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                : isCodexSelected
                  ? 'bg-[linear-gradient(135deg,#059669,#22c55e)] text-white hover:opacity-95'
                  : isClaudeSelected
                    ? 'bg-[linear-gradient(135deg,#ea580c,#f59e0b)] text-white hover:opacity-95'
                    : isQwenSelected
                      ? 'bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-white hover:opacity-95'
                      : 'bg-[linear-gradient(135deg,#0f172a,#334155)] text-white hover:opacity-95 dark:bg-[linear-gradient(135deg,#e2e8f0,#ffffff)] dark:text-slate-950'
            }`}
          >
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
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {currentActionLabel}
              </>
            )}
          </button>
        </div>

        <div className="grid grid-cols-1 gap-3 border-t border-border-light pt-3 md:grid-cols-2 dark:border-white/5">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              Layout
            </span>
            <div className="inline-flex shrink-0 rounded-xl border border-border-light bg-background-light p-1 shadow-sm dark:border-white/10 dark:bg-background-dark">
              {layoutOptions.map((option) => {
                const isActive = layoutMode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onLayoutChange?.(option.value)}
                    className={`inline-flex h-7 items-center gap-2 rounded-lg px-3 text-[11px] font-semibold transition ${
                      isActive
                        ? 'bg-surface-dark text-white shadow-sm dark:bg-surface-light dark:text-slate-900'
                        : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                    }`}
                    title={option.label}
                    aria-pressed={isActive}
                  >
                    {option.value === 'tabs' ? (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h6l2 2h8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
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
              className={`ml-auto inline-flex h-9 w-full max-w-fit items-center justify-self-end gap-3 rounded-xl border px-3 py-2 text-left transition shadow-sm ${
                yoloMode
                  ? 'border-orange-200 bg-orange-50 text-orange-900 dark:border-orange-400/20 dark:bg-orange-500/10 dark:text-orange-100'
                  : 'border-border-light bg-background-light text-slate-700 hover:text-slate-900 dark:border-white/10 dark:bg-background-dark dark:text-slate-200'
              }`}
            >
              <span className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em]">YOLO</span>
                <span className="mt-1 text-[11px] font-medium opacity-75">{yoloMode ? 'enabled' : 'disabled'}</span>
              </span>
              <span
                className={`relative h-6 w-11 rounded-full transition ${
                  yoloMode ? 'bg-orange-500' : 'bg-slate-300 dark:bg-slate-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition ${
                    yoloMode ? 'left-[22px]' : 'left-0.5'
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
