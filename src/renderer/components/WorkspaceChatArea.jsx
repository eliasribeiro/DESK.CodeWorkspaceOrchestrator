import { useEffect, useMemo, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceToolbar } from '@components/WorkspaceToolbar';
import { Terminal } from '@components/Terminal';
import { WorkspaceFilePreviewModal } from '@components/WorkspaceFilePreviewModal';
import { providerSupportsEditor } from '@lib/providerApi';
import { getEnabledCliOptions } from '@lib/cliCatalog';

const MAX_TERMINAL_SESSIONS = 12;
const TERMINAL_MIN_ZOOM_LEVEL = -4;
const TERMINAL_MAX_ZOOM_LEVEL = 8;

function getDefaultWorkspaceView() {
  return {
    layoutMode: 'tabs',
    sessions: [],
    activeSessionId: '',
    terminalError: '',
    terminalZoomBySession: {},
  };
}

function serializeProviderForLaunch(provider) {
  if (!provider) {
    return null;
  }

  return {
    id: provider.id,
    name: provider.name,
    apiType: provider.apiType || 'openai',
    baseUrl: provider.baseUrl,
    apiKey: provider.apiKey,
  };
}

function getSessionTitle(session) {
  const editorLabelMap = {
    codex: 'Codex',
    'claude-code': 'Claude',
    'claude-code-proxy': 'Claude',
    'claude-code-native': 'Claude',
    'gemini-cli': 'Gemini',
    'qwen-code': 'Qwen',
    openclaude: 'OpenClaude',
    opcode: 'OpenCode',
  };

  const editorLabel = editorLabelMap[session.editor] || 'Terminal';
  return session.model ? `${editorLabel} - ${session.model}` : editorLabel;
}

function getSessionStatusLabel(session) {
  if (!session) return 'idle';
  if (session.status === 'exited') return 'encerrada';
  if (session.status === 'starting') return 'iniciando';
  return 'ativa';
}

function getFirstProviderModel(provider) {
  if (!provider?.models) {
    return '';
  }

  return provider.models
    .split(',')
    .map((model) => model.trim())
    .find(Boolean) || '';
}

function getGridColumnsClass(sessionCount) {
  if (sessionCount <= 1) return 'grid-cols-1';
  if (sessionCount === 2) return 'grid-cols-2';
  if (sessionCount === 4) return 'grid-cols-2';
  if (sessionCount > 6) return 'grid-cols-4';
  return 'grid-cols-3';
}

function getGridRowsClass(sessionCount) {
  if (sessionCount <= 3) return 'grid-rows-1';
  return 'grid-rows-2';
}

const layoutOptions = [
  { value: 'tabs', label: 'Abas' },
  { value: 'grid', label: 'Grade' },
];

export function WorkspaceChatArea({ isFocusMode = false }) {
  const {
    selectedWorkspace,
    projects,
    aiProviders,
    enabledCliEditors,
    setSelectedModel,
    setActiveSessionsCount,
    workspaceViews,
    setWorkspaceViews,
    filePreview,
    closeFilePreview,
  } = useWorkspace();
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState('claude-code');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelLocal, setSelectedModelLocal] = useState('');
  const [yoloMode, setYoloMode] = useState(false);
  const [terminalTabContextMenu, setTerminalTabContextMenu] = useState(null);
  const terminalTabContextMenuRef = useRef(null);
  const workspace = selectedWorkspace?.workspace;
  const projectId = selectedWorkspace?.projectId;
  const project = projects.find((item) => item.id === projectId);
  const workspacePath = workspace?.path || '';
  const enabledProviders = useMemo(() => (
    aiProviders.filter((provider) => provider.enabled !== false)
  ), [aiProviders]);
  const availableEditorOptions = useMemo(
    () => getEnabledCliOptions(enabledCliEditors),
    [enabledCliEditors],
  );
  const availableEditorIds = useMemo(
    () => availableEditorOptions.map((option) => option.value),
    [availableEditorOptions],
  );

  const selectedProvider = useMemo(() => {
    return enabledProviders.find((provider) => provider.id === selectedProviderId) || null;
  }, [enabledProviders, selectedProviderId]);
  const isSelectedProviderCompatible = useMemo(() => (
    !selectedEditor
      ? false
      : selectedEditor === 'qwen-code' || selectedEditor === 'gemini-cli' || selectedEditor === 'openclaude'
      ? true
      : providerSupportsEditor(selectedProvider, selectedEditor)
  ), [selectedEditor, selectedProvider]);

  const selectedProviderModels = useMemo(() => {
    if (!selectedProvider?.models) {
      return [];
    }

    return selectedProvider.models.split(',').map((model) => model.trim()).filter(Boolean);
  }, [selectedProvider]);

  const currentWorkspaceView = workspaceViews[workspacePath] || getDefaultWorkspaceView();
  const sessions = currentWorkspaceView.sessions || [];
  const activeSession = sessions.find((session) => session.sessionId === currentWorkspaceView.activeSessionId) || sessions[0] || null;
  const showTerminal = sessions.length > 0;
  const terminalError = currentWorkspaceView.terminalError || '';
  const isGridMode = currentWorkspaceView.layoutMode === 'grid';
  const showYoloToggle = selectedEditor === 'codex' || selectedEditor === 'claude-code';
  const projectLabel = project?.name || 'Projeto';
  const workspacePathLabel = useMemo(() => {
    if (!workspacePath) {
      return '';
    }
    const normalizedPath = workspacePath.replace(/\\/g, '/');
    const pathSegments = normalizedPath.split('/').filter(Boolean);
    return pathSegments[pathSegments.length - 1] || workspacePath;
  }, [workspacePath]);

  useEffect(() => {
    closeFilePreview();
  }, [workspacePath, closeFilePreview]);

  useEffect(() => {
    if (!terminalTabContextMenu) {
      return undefined;
    }

    const handlePointerDownOutside = (event) => {
      if (terminalTabContextMenuRef.current?.contains(event.target)) {
        return;
      }

      setTerminalTabContextMenu(null);
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setTerminalTabContextMenu(null);
      }
    };

    const closeContextMenu = () => {
      setTerminalTabContextMenu(null);
    };

    document.addEventListener('mousedown', handlePointerDownOutside);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('resize', closeContextMenu);
    window.addEventListener('scroll', closeContextMenu, true);

    return () => {
      document.removeEventListener('mousedown', handlePointerDownOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('resize', closeContextMenu);
      window.removeEventListener('scroll', closeContextMenu, true);
    };
  }, [terminalTabContextMenu]);

  useEffect(() => {
    setActiveSessionsCount(sessions.length);
  }, [sessions.length, setActiveSessionsCount]);

  useEffect(() => {
    if (availableEditorIds.length === 0) {
      if (selectedEditor !== '') {
        setSelectedEditor('');
      }
      if (selectedProviderId !== '') {
        setSelectedProviderId('');
      }
      return;
    }

    if (!availableEditorIds.includes(selectedEditor)) {
      setSelectedEditor(availableEditorIds[0]);
    }
  }, [availableEditorIds, selectedEditor, selectedProviderId]);

  useEffect(() => {
    if (!selectedEditor) {
      return;
    }

    if (!selectedProviderId) {
      if (selectedEditor === 'claude-code') {
        setSelectedProviderId('claude-native');
      } else if (selectedEditor === 'codex') {
        setSelectedProviderId('codex-native');
      } else if (selectedEditor === 'openclaude') {
        setSelectedProviderId('');
      } else {
        const compatibleProvider = enabledProviders.find((provider) => providerSupportsEditor(provider, selectedEditor));
        if (compatibleProvider) {
          setSelectedProviderId(compatibleProvider.id);
        }
      }
    }
  }, [enabledProviders, selectedProviderId, selectedEditor]);

  useEffect(() => {
    if (!selectedEditor) {
      if (selectedProviderId !== '') {
        setSelectedProviderId('');
      }
      return;
    }

    if (selectedEditor === 'qwen-code' || selectedEditor === 'gemini-cli' || selectedEditor === 'openclaude') {
      return;
    }

    if (selectedEditor === 'claude-code') {
      const validClaudeProviders = [
        'claude-native',
        'claude-proxy',
        ...enabledProviders
          .filter((provider) => providerSupportsEditor(provider, selectedEditor))
          .map((provider) => provider.id),
      ];
      if (!validClaudeProviders.includes(selectedProviderId)) {
        setSelectedProviderId('claude-native');
      }
      return;
    }

    if (selectedEditor === 'codex') {
      const validCodexProviders = [
        'codex-native',
        ...enabledProviders
          .filter((provider) => providerSupportsEditor(provider, selectedEditor))
          .map((provider) => provider.id),
      ];
      if (!validCodexProviders.includes(selectedProviderId)) {
        setSelectedProviderId('codex-native');
      }
      return;
    }

    const compatibleProviders = enabledProviders.filter((provider) => providerSupportsEditor(provider, selectedEditor));

    if (compatibleProviders.length === 0) {
      setSelectedProviderId('');
      return;
    }

    if (!compatibleProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(compatibleProviders[0].id);
    }
  }, [enabledProviders, selectedEditor, selectedProviderId]);

  useEffect(() => {
    if (!selectedEditor) {
      if (selectedModelLocal !== '') {
        setSelectedModelLocal('');
        setSelectedModel('');
      }
      return;
    }

    if (selectedEditor === 'qwen-code' || selectedEditor === 'gemini-cli' || selectedEditor === 'openclaude') {
      if (selectedModelLocal !== '') {
        setSelectedModelLocal('');
        setSelectedModel('');
      }
      return;
    }

    if (
      (selectedEditor === 'claude-code' && ['claude-native', 'claude-proxy'].includes(selectedProviderId))
      || (selectedEditor === 'codex' && selectedProviderId === 'codex-native')
    ) {
      if (selectedModelLocal !== '') {
        setSelectedModelLocal('');
        setSelectedModel('');
      }
      return;
    }

    if (!selectedProvider || !isSelectedProviderCompatible || selectedProviderModels.length === 0) {
      if (selectedModelLocal !== '') {
        setSelectedModelLocal('');
        setSelectedModel('');
      }
      return;
    }

    if (!selectedProviderModels.includes(selectedModelLocal)) {
      const nextModel = selectedProviderModels[0];
      setSelectedModelLocal(nextModel);
      setSelectedModel(nextModel);
    }
  }, [isSelectedProviderCompatible, selectedEditor, selectedProvider, selectedProviderModels]);

  useEffect(() => {
    if (selectedEditor === 'codex' || selectedEditor === 'claude-code') {
      setYoloMode(true);
    } else {
      setYoloMode(false);
    }
  }, [selectedEditor]);

  useEffect(() => {
    let isMounted = true;

    const loadSessions = async () => {
      if (!workspacePath) {
        return;
      }

      try {
        const result = await window.electronAPI.terminal.listSessions({ workspacePath });

        if (!isMounted) {
          return;
        }

        if (!result.success) {
          setWorkspaceViews((current) => ({
            ...current,
            [workspacePath]: {
              ...(current[workspacePath] || getDefaultWorkspaceView()),
              terminalError: result.error || '',
            },
          }));
          return;
        }

        setWorkspaceViews((current) => {
          const existingView = current[workspacePath] || getDefaultWorkspaceView();
          const zoomBySession = existingView.terminalZoomBySession || {};
          const nextZoomBySession = result.sessions.reduce((accumulator, session) => {
            accumulator[session.sessionId] = zoomBySession[session.sessionId] ?? 0;
            return accumulator;
          }, {});
          const nextActiveSessionId = result.sessions.some((session) => session.sessionId === existingView.activeSessionId)
            ? existingView.activeSessionId
            : result.sessions[0]?.sessionId || '';

          return {
            ...current,
            [workspacePath]: {
              ...existingView,
              sessions: result.sessions,
              activeSessionId: nextActiveSessionId,
              terminalError: '',
              terminalZoomBySession: nextZoomBySession,
            },
          };
        });
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setWorkspaceViews((current) => ({
          ...current,
          [workspacePath]: {
            ...(current[workspacePath] || getDefaultWorkspaceView()),
            terminalError: error.message || 'Erro ao carregar sessões do terminal',
          },
        }));
      }
    };

    loadSessions();

    return () => {
      isMounted = false;
    };
  }, [workspacePath]);

  useEffect(() => {
    const unsubscribeExit = window.electronAPI.terminal.onExit((payload) => {
      setWorkspaceViews((current) => {
        const workspaceEntry = Object.entries(current).find(([, view]) => (
          view.sessions.some((session) => session.sessionId === payload.sessionId)
        ));

        if (!workspaceEntry) {
          return current;
        }

        const [matchedWorkspacePath, matchedView] = workspaceEntry;

        return {
          ...current,
          [matchedWorkspacePath]: {
            ...matchedView,
            sessions: matchedView.sessions.map((session) => (
              session.sessionId === payload.sessionId
                ? {
                  ...session,
                  status: 'exited',
                  exitCode: payload.exitCode,
                  signal: payload.signal,
                }
                : session
            )),
          },
        };
      });
    });

    const unsubscribeError = window.electronAPI.terminal.onError((payload) => {
      if (!payload.workspacePath) {
        return;
      }

      setWorkspaceViews((current) => ({
        ...current,
        [payload.workspacePath]: {
          ...(current[payload.workspacePath] || getDefaultWorkspaceView()),
          terminalError: payload.message || 'Erro no terminal',
        },
      }));
    });

    return () => {
      unsubscribeExit();
      unsubscribeError();
    };
  }, []);

  const updateWorkspaceView = (updater) => {
    if (!workspacePath) {
      return;
    }

    setWorkspaceViews((current) => {
      const baseView = current[workspacePath] || getDefaultWorkspaceView();
      const nextView = updater(baseView);
      if (nextView === baseView) {
        return current;
      }

      return {
        ...current,
        [workspacePath]: nextView,
      };
    });
  };

  const getSessionZoomLevel = (sessionId) => {
    if (!sessionId) {
      return 0;
    }
    return currentWorkspaceView.terminalZoomBySession?.[sessionId] ?? 0;
  };

  const handleAdjustTerminalZoom = (sessionId, delta) => {
    if (!sessionId || !delta) {
      return;
    }

    updateWorkspaceView((currentView) => {
      const currentZoom = currentView.terminalZoomBySession?.[sessionId] ?? 0;
      const nextZoom = Math.max(
        TERMINAL_MIN_ZOOM_LEVEL,
        Math.min(TERMINAL_MAX_ZOOM_LEVEL, currentZoom + delta),
      );

      if (nextZoom === currentZoom) {
        return currentView;
      }

      return {
        ...currentView,
        terminalZoomBySession: {
          ...(currentView.terminalZoomBySession || {}),
          [sessionId]: nextZoom,
        },
      };
    });
  };

  const removeSession = (sessionId) => {
    updateWorkspaceView((currentView) => {
      const nextSessions = currentView.sessions.filter((item) => item.sessionId !== sessionId);
      const nextActiveSessionId = currentView.activeSessionId === sessionId
        ? nextSessions[nextSessions.length - 1]?.sessionId || ''
        : currentView.activeSessionId;
      const nextZoomBySession = { ...(currentView.terminalZoomBySession || {}) };
      delete nextZoomBySession[sessionId];

      return {
        ...currentView,
        sessions: nextSessions,
        activeSessionId: nextActiveSessionId,
        terminalZoomBySession: nextZoomBySession,
      };
    });
  };

  const clearSessions = () => {
    updateWorkspaceView((currentView) => ({
      ...currentView,
      sessions: [],
      activeSessionId: '',
      terminalZoomBySession: {},
      terminalError: '',
    }));
  };

  if (!selectedWorkspace || !workspace) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[color:var(--bg-body)]">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[color:var(--bg-surface)] flex items-center justify-center border border-[color:var(--border-color)]">
            <svg className="w-8 h-8 text-[color:var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-[color:var(--text-primary)] mb-1">
            Nenhum workspace selecionado
          </h3>
          <p className="text-[0.95rem] text-[color:var(--text-secondary)]">
            Selecione um workspace na barra lateral
          </p>
        </div>
      </div>
    );
  }

  const handleLaunchEditor = async (requestedLaunchCount = 1) => {
    if (isStartingSession) {
      return;
    }

    const availableLaunchSlots = MAX_TERMINAL_SESSIONS - sessions.length;

    if (availableLaunchSlots <= 0) {
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: `Limite de ${MAX_TERMINAL_SESSIONS} terminais por workspace atingido. Encerre um terminal para abrir outro.`,
      }));
      return;
    }

    if (
      selectedEditor !== 'qwen-code'
      && selectedEditor !== 'gemini-cli'
      && selectedEditor !== 'openclaude'
      && !(selectedEditor === 'codex' && selectedProviderId === 'codex-native')
      && !isSelectedProviderCompatible
    ) {
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: 'O provedor selecionado não é compatível com o editor atual.',
      }));
      return;
    }

    setIsStartingSession(true);

    let finalEditor = selectedEditor;
    let finalProvider = null;
    let finalModel = selectedModelLocal;

    if (selectedEditor === 'claude-code') {
      if (selectedProviderId === 'claude-native') {
        finalEditor = 'claude-code-native';
        finalModel = '';
      } else if (selectedProviderId === 'claude-proxy') {
        finalEditor = 'claude-code-proxy';
        finalModel = '';
      } else {
        finalProvider = serializeProviderForLaunch(selectedProvider);
      }
    } else if (selectedEditor === 'codex') {
      if (selectedProviderId === 'codex-native') {
        finalModel = '';
      } else {
        finalProvider = serializeProviderForLaunch(selectedProvider);
      }
    } else if (['qwen-code', 'gemini-cli', 'openclaude'].includes(selectedEditor)) {
      finalModel = '';
    } else {
      finalProvider = serializeProviderForLaunch(selectedProvider);
    }

    if (finalProvider && !finalModel) {
      finalModel = getFirstProviderModel(finalProvider);
    }

    const launchCount = Math.max(1, Math.min(requestedLaunchCount || 1, availableLaunchSlots));

    try {
      const launchOptions = {
        workspacePath,
        editor: finalEditor,
        provider: finalProvider,
        model: finalModel,
        yoloMode,
        cols: isGridMode ? 56 : 120,
        rows: isGridMode ? 18 : 32,
      };
      let latestSessions = sessions;
      let latestSession = null;
      let launchError = '';
      let successCount = 0;

      for (let index = 0; index < launchCount; index += 1) {
        const result = await window.electronAPI.terminal.launchSession(launchOptions);

        if (!result.success || !result.session) {
          launchError = result.error || 'Erro ao iniciar o editor';
          break;
        }

        successCount += 1;
        latestSession = result.session;
        latestSessions = result.sessions?.length ? result.sessions : [...latestSessions, result.session];
      }

      if (successCount === 0 || !latestSession) {
        updateWorkspaceView((currentView) => ({
          ...currentView,
          terminalError: launchError || 'Erro ao iniciar o editor',
        }));
        return;
      }

      const terminalError =
        launchError && successCount < launchCount
          ? `${successCount} de ${launchCount} terminais foram abertos. ${launchError}`
          : '';

      updateWorkspaceView((currentView) => ({
        ...currentView,
        sessions: latestSessions,
        activeSessionId: latestSession.sessionId,
        terminalError,
      }));
    } catch (error) {
      console.error('Erro ao executar editor:', error);
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: error.message || 'Erro ao executar o editor',
      }));
    } finally {
      setIsStartingSession(false);
    }
  };

  const handleCloseTerminal = async (sessionId) => {
    if (!sessionId) {
      return;
    }

    try {
      await window.electronAPI.terminal.close({ sessionId });
    } catch (error) {
      console.error('Erro ao encerrar terminal:', error);
    } finally {
      removeSession(sessionId);
    }
  };

  const handleCloseAllTerminals = async () => {
    if (!workspacePath || sessions.length === 0) {
      setTerminalTabContextMenu(null);
      return;
    }

    setTerminalTabContextMenu(null);

    try {
      const result = await window.electronAPI.terminal.closeWorkspaceSessions({ workspacePath });

      if (!result?.success) {
        throw new Error(result?.error || 'Não foi possível fechar os terminais');
      }

      clearSessions();
    } catch (error) {
      console.error('Erro ao encerrar todos os terminais:', error);
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: error.message || 'Não foi possível fechar os terminais',
      }));
    }
  };

  const handleFocusSession = (sessionId) => {
    updateWorkspaceView((currentView) => {
      if (currentView.activeSessionId === sessionId && !currentView.terminalError) {
        return currentView;
      }

      return {
        ...currentView,
        activeSessionId: sessionId,
        terminalError: '',
      };
    });
  };

  const handleOpenTerminalTabContextMenu = (event, sessionId) => {
    event.preventDefault();
    event.stopPropagation();

    if (sessionId) {
      handleFocusSession(sessionId);
    }

    const menuWidth = 220;
    const menuHeight = 52;
    const nextX = Math.min(event.clientX, Math.max(12, window.innerWidth - menuWidth - 12));
    const nextY = Math.min(event.clientY, Math.max(12, window.innerHeight - menuHeight - 12));

    setTerminalTabContextMenu({
      x: Math.max(12, nextX),
      y: Math.max(12, nextY),
    });
  };

  return (
    <div className="flex-1 flex flex-col bg-[color:var(--bg-body)]">
      {!isFocusMode && (
        <>
          <header className="h-[60px] px-6 flex items-center justify-between border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] backdrop-blur-xl z-40 transition-all">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-md flex items-center justify-center bg-[color:var(--text-primary)] text-[color:var(--bg-body)]">
                <svg className="w-5 h-5 text-[color:var(--bg-body)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
              </div>
              <div>
                <p className="font-display font-medium text-[1.1rem] text-[color:var(--text-primary)] tracking-tight">
                  {projectLabel}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2">
                {showYoloToggle && (
                  <button
                    type="button"
                    onClick={() => setYoloMode((current) => !current)}
                    role="switch"
                    aria-checked={yoloMode}
                    className={`inline-flex h-8 items-center gap-2 rounded-[8px] border px-3 text-[0.8rem] font-semibold transition-colors ${
                      yoloMode
                        ? 'border-[color:var(--text-primary)] bg-[color:var(--text-primary)] text-[color:var(--bg-body)]'
                        : 'border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[color:var(--text-secondary)] hover:border-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]'
                    }`}
                    title="Alternar YOLO"
                  >
                    <span>YOLO</span>
                    <span
                      className={`relative inline-block h-4.5 w-8 shrink-0 rounded-full transition-colors ${
                        yoloMode ? 'bg-[color:var(--bg-body)]/80' : 'bg-[color:var(--border-color)]'
                      }`}
                    >
                      <span
                        className={`absolute top-[2px] left-[2px] h-3.5 w-3.5 rounded-full shadow-sm transition-transform ${
                          yoloMode
                            ? 'translate-x-[14px] bg-[color:var(--text-primary)]'
                            : 'translate-x-0 bg-[color:var(--text-tertiary)]'
                        }`}
                      />
                    </span>
                  </button>
                )}
                <div className="inline-flex shrink-0 rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-1 shadow-sm">
                  {layoutOptions.map((option) => {
                    const isActive = currentWorkspaceView.layoutMode === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          updateWorkspaceView((currentView) => ({
                            ...currentView,
                            layoutMode: option.value,
                          }));
                        }}
                        className={`inline-flex h-[24px] items-center gap-1.5 rounded-[6px] px-2.5 text-[0.78rem] font-medium transition ${
                          isActive
                            ? 'bg-[color:var(--text-primary)] text-[color:var(--bg-body)] shadow-sm'
                            : 'text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/30 hover:text-[color:var(--text-primary)]'
                        }`}
                        title={option.label}
                        aria-pressed={isActive}
                      >
                        {option.value === 'tabs' ? (
                          <svg className="h-[13px] w-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 7h6l2 2h8v8a2 2 0 01-2 2H6a2 2 0 01-2-2V7z" />
                          </svg>
                        ) : (
                          <svg className="h-[13px] w-[13px]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z" />
                          </svg>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div
                className="hidden md:flex max-w-[280px] items-center gap-2 rounded-[6px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-3 py-1.5 text-[0.85rem] font-medium text-[color:var(--text-secondary)] transition-all"
                title={workspace.path}
              >
                <svg className="w-4 h-4 text-[color:var(--text-tertiary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
                <span className="truncate">{workspacePathLabel}</span>
              </div>
              <button
                onClick={() => window.electronAPI.shell.openPath(workspace.path)}
                className="p-2 rounded-md hover:bg-[color:var(--border-color)] text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] transition-colors"
                title="Abrir pasta no explorador"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5l-1.405-1.405A2 2 0 0010 6z" />
                </svg>
              </button>
            </div>
          </header>

          <WorkspaceToolbar
            editor={selectedEditor}
            onEditorChange={setSelectedEditor}
            selectedProvider={selectedProviderId}
            onProviderChange={setSelectedProviderId}
            selectedModel={selectedModelLocal}
            onModelChange={(model) => {
              setSelectedModelLocal(model);
              setSelectedModel(model);
            }}
            onLaunch={handleLaunchEditor}
            isRunning={isStartingSession}
            sessionCount={sessions.length}
            maxSessionCount={MAX_TERMINAL_SESSIONS}
          />

          {selectedEditor === 'claude-code' && selectedProviderId === 'claude-proxy' && (
            <div className="flex shrink-0 items-center justify-between px-6 py-2.5 bg-[color:var(--bg-surface)] border-b border-[color:var(--border-color)]">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[color:var(--success-color)] shadow-[0_0_6px_rgba(16,185,129,0.3)]"></span>
                <span className="text-[0.85rem] font-medium text-[color:var(--text-secondary)]">Antigravity Proxy selecionado para conectar o Claude.</span>
              </div>
              <button
                onClick={() => window.electronAPI.shell.openExternal('http://localhost:8080')}
                className="text-[0.85rem] font-medium text-[color:var(--text-primary)] hover:underline flex items-center gap-1.5 transition-colors"
              >
                Abrir proxy no navegador (Localhost:8080)
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 5l9-9m0 0h-5m5 0v5" /></svg>
              </button>
            </div>
          )}
        </>
      )}

      <div className="flex-1 min-h-0 relative">
        {showTerminal ? (
          <div className="h-full min-h-0 flex flex-col relative z-10">
            <div className="flex-1 min-h-0">
              {isGridMode ? (
                <div className={`grid h-full min-h-0 gap-0 ${getGridColumnsClass(sessions.length)} ${getGridRowsClass(sessions.length)}`}>
                  {sessions.map((session) => {
                    const isActive = session.sessionId === activeSession?.sessionId;
                    return (
                      <div
                        key={session.sessionId}
                        className={`overflow-hidden border bg-[color:var(--bg-surface)] transition-all duration-200 flex flex-col ${
                          isActive
                            ? 'border-[color:var(--text-primary)] shadow-[inset_0_0_0_1px_var(--text-primary)]'
                            : 'border-[color:var(--border-color)]'
                        }`}
                      >
                        <Terminal
                          session={session}
                          workspaceName={workspace.name}
                          workspacePath={workspacePath}
                          title={getSessionTitle(session)}
                          statusLabel={getSessionStatusLabel(session)}
                          errorMessage=""
                          compact
                          showClear={false}
                          zoomLevel={getSessionZoomLevel(session.sessionId)}
                          onZoomIn={() => handleAdjustTerminalZoom(session.sessionId, 1)}
                          onZoomOut={() => handleAdjustTerminalZoom(session.sessionId, -1)}
                          onClose={() => handleCloseTerminal(session.sessionId)}
                          onSessionExit={() => {}}
                          onFocus={() => handleFocusSession(session.sessionId)}
                          onHeaderContextMenu={(event) => handleOpenTerminalTabContextMenu(event, session.sessionId)}
                          isActive={isActive}
                        />
                      </div>
                    );
                  })}
                </div>
              ) : activeSession ? (
                <div className="h-full min-h-0 overflow-hidden border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] flex flex-col transition-all duration-300">
                  <div className="shrink-0 border-b border-[color:var(--border-color)] bg-[color:var(--bg-body)] pt-2 px-2">
                    <div className="flex items-end gap-1.5 overflow-x-auto pb-0 hide-scrollbar">
                      {sessions.map((session) => {
                        const isActive = session.sessionId === activeSession.sessionId;
                        return (
                          <button
                            key={session.sessionId}
                            onClick={() => handleFocusSession(session.sessionId)}
                            onContextMenu={(event) => handleOpenTerminalTabContextMenu(event, session.sessionId)}
                            className={`group relative min-w-0 max-w-xs flex items-center gap-2.5 rounded-t-[8px] border-t border-x px-4 py-2 text-left text-[0.95rem] font-medium transition-all duration-200 ${
                              isActive
                                ? 'border-[color:var(--border-color)] bg-[color:var(--bg-surface)] text-[color:var(--text-primary)] font-semibold z-10'
                                : 'border-transparent bg-transparent text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)]/30 hover:text-[color:var(--text-primary)]'
                            }`}
                          >
                            <span className={`inline-flex h-2 w-2 rounded-full align-middle transition-colors shadow-sm ${
                              session.status === 'exited' ? 'bg-[color:var(--warning-color)]' : 'bg-[color:var(--success-color)] shadow-[0_0_6px_rgba(16,185,129,0.3)]'
                            }`} />
                            <span className="truncate">
                              {getSessionTitle(session)}
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCloseTerminal(session.sessionId);
                              }}
                              className={`ml-1 inline-flex h-[18px] w-[18px] items-center justify-center rounded-[4px] transition-all ${
                                isActive
                                  ? 'text-[color:var(--text-tertiary)] hover:bg-[color:var(--danger-color)]/10 hover:text-[color:var(--danger-color)]'
                                  : 'text-[color:var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[color:var(--danger-color)]/10 hover:text-[color:var(--danger-color)]'
                              }`}
                              aria-label={`Fechar ${getSessionTitle(session)}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </span>
                            {isActive && (
                              <div className="absolute -bottom-[1px] left-0 right-0 h-[2px] bg-[color:var(--bg-surface)]" />
                            )}
                            {isActive && (
                              <div className="absolute top-0 left-0 right-0 h-[2px] bg-[color:var(--text-primary)] rounded-t-[8px]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative">
                    {sessions.map((session) => {
                      const isActive = session.sessionId === activeSession.sessionId;
                      return (
                        <div
                          key={session.sessionId}
                          className={isActive ? 'h-full min-h-0' : 'hidden'}
                        >
                          <Terminal
                            session={session}
                            workspaceName={workspace.name}
                            workspacePath={workspacePath}
                            title={getSessionTitle(session)}
                            statusLabel={getSessionStatusLabel(session)}
                            errorMessage=""
                            embedded
                            zoomLevel={getSessionZoomLevel(session.sessionId)}
                            onZoomIn={() => handleAdjustTerminalZoom(session.sessionId, 1)}
                            onZoomOut={() => handleAdjustTerminalZoom(session.sessionId, -1)}
                            onClose={() => handleCloseTerminal(session.sessionId)}
                            onSessionExit={() => {}}
                            onFocus={() => handleFocusSession(session.sessionId)}
                            isActive={isActive}
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
) : (
          <div className="h-full flex items-center justify-center px-6 relative overflow-hidden">
            <div className="max-w-md text-center rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-10 py-12 shadow-sm relative z-10 transition-all">
              <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-[12px] bg-[color:var(--text-primary)] text-[color:var(--bg-body)]">
                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-display font-medium text-[color:var(--text-primary)] tracking-tight">
                Workspace Sessions
              </h3>
              <p className="mt-4 text-[0.95rem] leading-relaxed text-[color:var(--text-secondary)]">
                Pick your editor, layout mode, and hit <span className="font-semibold px-2 py-0.5 rounded-[4px] bg-[color:var(--border-color)] text-[color:var(--text-primary)]">Execute</span>. 
                Each launch creates an integrated terminal session.
              </p>
              {terminalError && (
                <div className="mt-6 p-4 rounded-[8px] bg-red-50 text-[0.9rem] text-red-600 dark:bg-red-900/10 dark:text-red-400">
                  {terminalError}
                </div>
              )}
            </div>
          </div>
        )}

        {filePreview?.isOpen && filePreview?.file && (
          <WorkspaceFilePreviewModal
            file={filePreview.file}
            onClose={closeFilePreview}
          />
        )}

        {terminalTabContextMenu && showTerminal && !isGridMode && (
          <div
            ref={terminalTabContextMenuRef}
            className="fixed z-[80] min-w-[220px] overflow-hidden rounded-[10px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] p-1 shadow-2xl"
            style={{
              left: `${terminalTabContextMenu.x}px`,
              top: `${terminalTabContextMenu.y}px`,
            }}
            role="menu"
            aria-label="Menu de contexto das abas do terminal"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="flex w-full items-center rounded-[8px] px-3 py-2 text-left text-[0.92rem] text-[color:var(--danger-color)] transition-colors hover:bg-[color:var(--danger-color)]/10"
              onClick={handleCloseAllTerminals}
              role="menuitem"
            >
              Fechar todas as abas
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
