import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

const editorOptions = [
  { value: 'claude-code', label: 'Claude Code' },
  { value: 'codex', label: 'Codex' },
  { value: 'gemini-cli', label: 'Gemini CLI' },
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
        className="flex h-10 w-full items-center justify-between rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] px-3 text-[0.95rem] font-medium text-[color:var(--text-secondary)] shadow-sm outline-none transition-colors hover:border-[color:var(--text-primary)] focus:border-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        <span className="block truncate pr-3">{selectedOption?.label || placeholder}</span>
        <svg
          className={`pointer-events-none h-4 w-4 text-[color:var(--text-tertiary)] transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && !disabled && (
        <div className="absolute z-40 mt-1 w-full overflow-hidden rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-lg">
          <div className="border-b border-[color:var(--border-color)] p-2">
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
              className="h-9 w-full rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] px-3 text-[0.95rem] text-[color:var(--text-primary)] outline-none transition focus:border-[color:var(--text-primary)]"
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-2 text-[0.95rem] text-[color:var(--text-tertiary)]">{emptyLabel}</div>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleSelect(option.value);
                  }}
                  onClick={() => handleSelect(option.value)}
                  className={`w-full px-3 py-2 text-left text-[0.95rem] transition-colors ${
                    option.value === value
                      ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] font-medium'
                      : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/30 hover:text-[color:var(--text-primary)]'
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
    const baseProviders = aiProviders
      .filter((provider) => provider.enabled !== false)
      .filter((provider) => provider.name || provider.baseUrl)
      .map((provider) => ({
        value: provider.id,
        label: provider.name || provider.baseUrl,
        models: provider.models
          ? provider.models.split(',').map((model) => model.trim()).filter(Boolean)
          : [],
      }));

    if (editor === 'claude-code') {
      return [
        { value: 'claude-native', label: 'Padrão (Claude)', models: [] },
        { value: 'claude-proxy', label: 'Antigravity (Proxy)', models: [] },
        ...baseProviders,
      ];
    }
    return baseProviders;
  }, [aiProviders, editor]);

  const currentProvider = providerOptions.find((providerOption) => providerOption.value === selectedProvider);
  const isCodexSelected = editor === 'codex';
  const isClaudeSelected = editor === 'claude-code';
  const isGeminiSelected = editor === 'gemini-cli';
  const isQwenSelected = editor === 'qwen-code';
  const isOpenCodeSelected = editor === 'opcode';
  const showYolo = isCodexSelected || isClaudeSelected || isQwenSelected || isGeminiSelected;
  const requiresProvider = !isCodexSelected && !isQwenSelected && !isGeminiSelected && !isOpenCodeSelected;
  const isLaunchDisabled =
    isRunning || sessionCount >= 8 || (requiresProvider ? !selectedProvider || (!selectedModel && !['claude-native', 'claude-proxy'].includes(selectedProvider)) : false);

  const currentActionLabel = isCodexSelected
    ? 'Run Codex'
    : isClaudeSelected
      ? 'Run Claude'
      : isGeminiSelected
        ? 'Run Gemini'
        : isQwenSelected
          ? 'Run Qwen'
          : isOpenCodeSelected
            ? 'Run OpenCode'
            : 'Run';

  return (
    <div className="relative z-30 border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-6 py-3 backdrop-blur transition-colors">
      <div className="flex flex-col gap-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative min-w-0">
            <select
              value={editor}
              onChange={(event) => onEditorChange?.(event.target.value)}
              className="h-10 w-full appearance-none rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] px-3 pr-10 text-[0.95rem] font-medium text-[color:var(--text-secondary)] shadow-sm outline-none transition hover:border-[color:var(--text-primary)] focus:border-[color:var(--text-primary)]"
            >
              {editorOptions.map((editorOption) => (
                <option key={editorOption.value} value={editorOption.value}>
                  {editorOption.label}
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--text-tertiary)]"
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
            className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-[8px] px-4 text-[0.95rem] font-semibold transition ${
              isLaunchDisabled
                ? 'cursor-not-allowed border border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-tertiary)]'
                : 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] hover:opacity-90'
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

        <div className="grid grid-cols-1 gap-4 border-t border-[color:var(--border-color)] pt-4 mt-1 md:grid-cols-2">
          <div className="flex min-w-0 items-center gap-3">
            <span className="text-[11px] font-bold uppercase tracking-[0.1em] text-[color:var(--text-secondary)]">
              Layout
            </span>
            <div className="inline-flex shrink-0 rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-1 shadow-sm">
              {layoutOptions.map((option) => {
                const isActive = layoutMode === option.value;
                return (
                  <button
                    key={option.value}
                    onClick={() => onLayoutChange?.(option.value)}
                    className={`inline-flex h-[28px] items-center gap-2 rounded-[6px] px-3 text-[0.85rem] font-medium transition ${
                      isActive
                        ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] shadow-sm'
                        : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/30 hover:text-[color:var(--text-primary)]'
                    }`}
                    title={option.label}
                    aria-pressed={isActive}
                  >
                    {option.value === 'tabs' ? (
                      <svg className="h-[14px] w-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h6l2 2h8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                      </svg>
                    ) : (
                      <svg className="h-[14px] w-[14px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              className={`ml-auto inline-flex h-10 w-full max-w-[200px] items-center justify-between gap-3 rounded-[8px] border px-3 py-2 transition shadow-sm ${
                yoloMode
                  ? 'border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-body)]'
                  : 'border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-secondary)] hover:border-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]'
              }`}
            >
              <span className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-bold uppercase tracking-[0.1em]">YOLO Mode</span>
                <span className="mt-1 text-[10px] font-medium opacity-80">{yoloMode ? 'Ativo' : 'Inativo'}</span>
              </span>
              <span
                className={`relative inline-block h-6 w-11 shrink-0 rounded-full transition-colors ${
                  yoloMode ? 'bg-[color:var(--bg-body)]' : 'bg-[color:var(--border-color)]'
                }`}
              >
                <span
                  className={`absolute top-[2px] left-[2px] h-5 w-5 rounded-full shadow-sm transition-transform ${
                    yoloMode ? 'translate-x-[22px] bg-[color:var(--text-primary)]' : 'translate-x-0 bg-[color:var(--text-tertiary)]'
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
