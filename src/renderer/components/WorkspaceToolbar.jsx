import { useMemo } from 'react';
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

  const currentActionLabel = isCodexSelected
    ? 'Executar Codex'
    : isClaudeSelected
      ? 'Executar Claude'
      : isQwenSelected
        ? 'Executar Qwen'
      : isOpenCodeSelected
        ? 'Executar OpenCode'
        : 'Abrir Terminal';

  return (
    <div className="border-b border-slate-200 bg-[linear-gradient(180deg,rgba(255,255,255,0.9),rgba(248,250,252,0.82))] px-6 py-3 backdrop-blur dark:border-slate-800 dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.94),rgba(2,6,23,0.82))]">
      <div className="flex flex-wrap items-end gap-3">
        <div className="flex min-w-[180px] flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Editor
          </label>
          <div className="relative">
            <select
              value={editor}
              onChange={(event) => onEditorChange?.(event.target.value)}
              className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white/90 px-3 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            >
              {editorOptions.map((editorOption) => (
                <option key={editorOption.value} value={editorOption.value}>
                  {editorOption.label}
                </option>
              ))}
            </select>
            <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            Layout
          </label>
          <div className="inline-flex rounded-2xl border border-slate-200 bg-white/85 p-1 shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/90">
            {layoutOptions.map((option) => {
              const isActive = layoutMode === option.value;
              return (
                <button
                  key={option.value}
                  onClick={() => onLayoutChange?.(option.value)}
                  className={`inline-flex h-10 items-center gap-2 rounded-xl px-3 text-sm font-semibold transition ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                      : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100'
                  }`}
                  title={option.label}
                >
                  {option.value === 'tabs' ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 7h6l2 2h8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                    </svg>
                  ) : (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              YOLO
            </label>
            <button
              onClick={onToggleYolo}
              className={`h-10 rounded-xl px-4 text-sm font-bold transition ${
                yoloMode
                  ? 'bg-[linear-gradient(135deg,#dc2626,#f97316)] text-white shadow-[0_10px_30px_rgba(249,115,22,0.28)]'
                  : 'border border-slate-200 bg-white/85 text-slate-500 shadow-[0_10px_30px_rgba(15,23,42,0.06)] hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              YOLO
            </button>
          </div>
        )}

        {requiresProvider && (
          <div className="flex min-w-[200px] flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Provedor
            </label>
            <div className="relative">
              <select
                value={selectedProvider}
                onChange={(event) => onProviderChange?.(event.target.value)}
                disabled={providerOptions.length === 0}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white/90 px-3 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {providerOptions.length === 0 ? (
                  <option value="">Nenhum provedor</option>
                ) : (
                  providerOptions.map((providerOption) => (
                    <option key={providerOption.value} value={providerOption.value}>
                      {providerOption.label}
                    </option>
                  ))
                )}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        {requiresProvider && (
          <div className="flex min-w-[220px] flex-col gap-1">
            <label className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              Modelo
            </label>
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(event) => onModelChange?.(event.target.value)}
                disabled={!currentProvider || currentProvider.models.length === 0}
                className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-white/90 px-3 text-sm font-medium text-slate-900 shadow-[0_10px_30px_rgba(15,23,42,0.06)] outline-none transition disabled:cursor-not-allowed disabled:opacity-50 focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
              >
                {!currentProvider || currentProvider.models.length === 0 ? (
                  <option value="">Nenhum modelo</option>
                ) : (
                  currentProvider.models.map((model) => (
                    <option key={model} value={model}>
                      {model}
                    </option>
                  ))
                )}
              </select>
              <svg className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        )}

        <div className="ml-auto flex items-end gap-3">
          <div className="hidden rounded-2xl border border-slate-200 bg-white/80 px-3 py-2 text-right shadow-[0_10px_30px_rgba(15,23,42,0.06)] dark:border-slate-700 dark:bg-slate-900/90 md:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Sessões
            </p>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
              {sessionCount}/6
            </p>
          </div>

          <button
            onClick={onLaunch}
            disabled={isRunning || sessionCount >= 6 || (requiresProvider ? !selectedProvider || !selectedModel : false)}
            className={`inline-flex h-10 items-center gap-2 rounded-xl px-4 text-sm font-semibold shadow-[0_14px_40px_rgba(15,23,42,0.18)] transition ${
              isRunning || sessionCount >= 6
                ? 'cursor-not-allowed bg-slate-300 text-slate-500 dark:bg-slate-800 dark:text-slate-500'
                : isCodexSelected
                  ? 'bg-[linear-gradient(135deg,#059669,#22c55e)] text-white'
                  : isClaudeSelected
                    ? 'bg-[linear-gradient(135deg,#ea580c,#f59e0b)] text-white'
                    : isQwenSelected
                      ? 'bg-[linear-gradient(135deg,#2563eb,#06b6d4)] text-white'
                    : 'bg-[linear-gradient(135deg,#0f172a,#334155)] text-white dark:bg-[linear-gradient(135deg,#e2e8f0,#ffffff)] dark:text-slate-950'
            }`}
          >
            {isRunning ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
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
      </div>
    </div>
  );
}
