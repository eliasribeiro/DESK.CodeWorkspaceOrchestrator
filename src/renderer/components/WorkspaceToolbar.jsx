import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { providerSupportsEditor } from '@lib/providerApi';
import { getEnabledCliOptions } from '@lib/cliCatalog';

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
  onLaunch,
  isRunning,
  sessionCount = 0,
  maxSessionCount = 12,
}) {
  const { aiProviders, enabledCliEditors } = useWorkspace();
  const [isLaunchMenuOpen, setIsLaunchMenuOpen] = useState(false);
  const [selectedLaunchCount, setSelectedLaunchCount] = useState(1);
  const [cliInstallations, setCliInstallations] = useState(null);
  const launchMenuRef = useRef(null);
  const launchCountOptions = useMemo(() => Array.from({ length: maxSessionCount }, (_, index) => ({
    value: index + 1,
    label: `${index + 1}x`,
  })), [maxSessionCount]);

  const providerOptions = useMemo(() => {
    const baseProviders = aiProviders
      .filter((provider) => provider.enabled !== false)
      .filter((provider) => providerSupportsEditor(provider, editor))
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

    if (editor === 'codex') {
      return [
        { value: 'codex-native', label: 'Padrão (Codex CLI)', models: [] },
        ...baseProviders,
      ];
    }

    return baseProviders;
  }, [aiProviders, editor]);
  const availableEditorOptions = useMemo(
    () => getEnabledCliOptions(enabledCliEditors),
    [enabledCliEditors],
  );
  const hasSelectedEditor = Boolean(editor);

  const currentProvider = providerOptions.find((providerOption) => providerOption.value === selectedProvider) || null;
  const currentEditorOption = availableEditorOptions.find((editorOption) => editorOption.value === editor) || null;
  const isCodexSelected = editor === 'codex';
  const isClaudeSelected = editor === 'claude-code';
  const isGeminiSelected = editor === 'gemini-cli';
  const isQwenSelected = editor === 'qwen-code';
  const isOpenCodeSelected = editor === 'opcode';
  const requiresProvider = hasSelectedEditor && !isQwenSelected && !isGeminiSelected;
  const isCodexNativeSelected = isCodexSelected && selectedProvider === 'codex-native';
  const providerAllowsEmptyModel = (
    isClaudeSelected && ['claude-native', 'claude-proxy'].includes(selectedProvider)
  ) || isCodexNativeSelected;
  const availableLaunchSlots = Math.max(0, maxSessionCount - sessionCount);
  const currentCliStatus = Array.isArray(cliInstallations)
    ? cliInstallations.find((item) => item.id === editor) || null
    : null;
  const selectedEditorInstalled = !hasSelectedEditor
    ? false
    : cliInstallations === null
      ? true
      : Boolean(currentCliStatus?.installed);
  const currentActionLabel = !hasSelectedEditor
    ? 'Nenhum CLI habilitado'
    : isCodexSelected
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
  const currentEditorLabel = currentEditorOption?.label || currentActionLabel.replace(/^Run\s+/, '').trim() || 'CLI';
  let launchDisabledReason = '';

  if (!hasSelectedEditor) {
    launchDisabledReason = 'Nenhum CLI está habilitado nas preferências.';
  } else if (!selectedEditorInstalled) {
    launchDisabledReason = `${currentEditorLabel} não está instalado ou não foi encontrado no PATH.`;
  } else if (isRunning) {
    launchDisabledReason = 'Já existe uma abertura em andamento.';
  } else if (availableLaunchSlots <= 0) {
    launchDisabledReason = `Limite de ${maxSessionCount} terminais por workspace atingido.`;
  } else if (requiresProvider && !selectedProvider) {
    launchDisabledReason = 'Selecione um provedor.';
  } else if (requiresProvider && !providerAllowsEmptyModel && !selectedModel) {
    launchDisabledReason = 'Selecione um modelo.';
  }

  const isLaunchDisabled = Boolean(launchDisabledReason);
  const launchButtonTitle = isLaunchDisabled
    ? launchDisabledReason
    : `Abrir ${selectedLaunchCount} instancia${selectedLaunchCount > 1 ? 's' : ''}`;

  useEffect(() => {
    let isMounted = true;

    const loadCliInstallations = async () => {
      try {
        const result = await window.electronAPI?.cli?.listSupported?.();
        if (!isMounted) {
          return;
        }

        setCliInstallations(result?.success && Array.isArray(result.items) ? result.items : []);
      } catch (_error) {
        if (isMounted) {
          setCliInstallations([]);
        }
      }
    };

    loadCliInstallations();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (launchMenuRef.current && !launchMenuRef.current.contains(event.target)) {
        setIsLaunchMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (availableLaunchSlots <= 0) {
      setIsLaunchMenuOpen(false);
      return;
    }

    if (selectedLaunchCount > availableLaunchSlots) {
      setSelectedLaunchCount(availableLaunchSlots);
    }
  }, [availableLaunchSlots, selectedLaunchCount]);

  const handleLaunch = () => {
    if (isLaunchDisabled) {
      return;
    }

    onLaunch?.(Math.min(selectedLaunchCount, availableLaunchSlots));
  };

  return (
    <div className="relative z-30 border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-6 py-3 backdrop-blur transition-colors">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative min-w-0">
            <select
              value={editor}
              onChange={(event) => onEditorChange?.(event.target.value)}
              disabled={availableEditorOptions.length === 0}
              className="h-10 w-full appearance-none rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] px-3 pr-10 text-[0.95rem] font-medium text-[color:var(--text-secondary)] shadow-sm outline-none transition hover:border-[color:var(--text-primary)] focus:border-[color:var(--text-primary)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {availableEditorOptions.length === 0 && (
                <option value="">Nenhum CLI habilitado</option>
              )}
              {availableEditorOptions.map((editorOption) => (
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

          <div ref={launchMenuRef} className="relative flex w-full min-w-0" title={launchButtonTitle}>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={isLaunchDisabled}
              title={launchButtonTitle}
              className={`inline-flex h-10 min-w-0 flex-1 items-center justify-center gap-2 rounded-l-[8px] border px-4 text-[0.95rem] font-semibold transition ${
                isLaunchDisabled
                  ? 'cursor-not-allowed border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-tertiary)]'
                  : 'border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-body)] hover:opacity-90'
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
                  <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="truncate">{currentActionLabel}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (isLaunchDisabled) {
                  return;
                }

                setIsLaunchMenuOpen((current) => !current);
              }}
              disabled={isLaunchDisabled}
              aria-haspopup="menu"
              aria-expanded={isLaunchMenuOpen}
              title={launchButtonTitle}
              className={`inline-flex h-10 shrink-0 items-center gap-2 rounded-r-[8px] border border-l-0 px-3 text-[0.95rem] font-semibold transition ${
                isLaunchDisabled
                  ? 'cursor-not-allowed border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-tertiary)]'
                  : 'border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-body)] hover:opacity-90'
              }`}
            >
              <span>{selectedLaunchCount}x</span>
              <svg className={`h-4 w-4 transition-transform ${isLaunchMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isLaunchMenuOpen && !isLaunchDisabled && (
              <div className="absolute right-0 top-full z-40 mt-1 min-w-[96px] overflow-hidden rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] shadow-lg">
                <div className="py-1">
                  {launchCountOptions.map((option) => {
                    const isUnavailable = option.value > availableLaunchSlots;
                    const isSelected = option.value === selectedLaunchCount;

                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          if (isUnavailable) {
                            return;
                          }

                          setSelectedLaunchCount(option.value);
                          setIsLaunchMenuOpen(false);
                        }}
                        disabled={isUnavailable}
                        className={`flex w-full items-center justify-between px-3 py-2 text-left text-[0.95rem] transition-colors ${
                          isUnavailable
                            ? 'cursor-not-allowed text-[color:var(--text-tertiary)] opacity-50'
                            : isSelected
                              ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] font-medium'
                              : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/30 hover:text-[color:var(--text-primary)]'
                        }`}
                      >
                        <span>{option.label}</span>
                        {isSelected && !isUnavailable && (
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
