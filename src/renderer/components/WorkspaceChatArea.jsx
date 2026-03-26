import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceToolbar } from '@components/WorkspaceToolbar';
import { Terminal } from '@components/Terminal';
import { WorkspaceFilePreviewModal } from '@components/WorkspaceFilePreviewModal';
import { providerSupportsEditor } from '@lib/providerApi';

const MAX_TERMINAL_SESSIONS = 8;
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

function getSessionTitle(session) {
  const editorLabelMap = {
    codex: 'Codex',
    'claude-code': 'Claude',
    'claude-code-proxy': 'Claude',
    'claude-code-native': 'Claude',
    'gemini-cli': 'Gemini',
    'qwen-code': 'Qwen',
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

export function WorkspaceChatArea() {
  const {
    selectedWorkspace,
    projects,
    aiProviders,
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
  const workspace = selectedWorkspace?.workspace;
  const projectId = selectedWorkspace?.projectId;
  const project = projects.find((item) => item.id === projectId);
  const workspacePath = workspace?.path || '';
  const enabledProviders = useMemo(() => (
    aiProviders.filter((provider) => provider.enabled !== false)
  ), [aiProviders]);

  const selectedProvider = useMemo(() => {
    return enabledProviders.find((provider) => provider.id === selectedProviderId) || null;
  }, [enabledProviders, selectedProviderId]);
  const isSelectedProviderCompatible = useMemo(() => (
    selectedEditor === 'codex' || selectedEditor === 'qwen-code' || selectedEditor === 'claude-code' || selectedEditor === 'gemini-cli'
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
    setActiveSessionsCount(sessions.length);
  }, [sessions.length, setActiveSessionsCount]);

  useEffect(() => {
    if (!selectedProviderId) {
      if (selectedEditor === 'claude-code') {
        setSelectedProviderId('claude-native');
      } else if (enabledProviders.length > 0) {
        setSelectedProviderId(enabledProviders[0].id);
      }
    }
  }, [enabledProviders, selectedProviderId, selectedEditor]);

  useEffect(() => {
    if (selectedEditor === 'codex' || selectedEditor === 'qwen-code' || selectedEditor === 'gemini-cli' || selectedEditor === 'opcode') {
      return;
    }

    if (selectedEditor === 'claude-code') {
      const validClaudeProviders = ['claude-native', 'claude-proxy', ...enabledProviders.map(p => p.id)];
      if (!validClaudeProviders.includes(selectedProviderId)) {
        setSelectedProviderId('claude-native');
      }
      return;
    }

    if (enabledProviders.length === 0) {
      setSelectedProviderId('');
      return;
    }

    if (!enabledProviders.some((provider) => provider.id === selectedProviderId)) {
      setSelectedProviderId(enabledProviders[0].id);
    }
  }, [enabledProviders, selectedEditor, selectedProviderId]);

  useEffect(() => {
    if (selectedEditor === 'codex' || selectedEditor === 'qwen-code' || selectedEditor === 'gemini-cli' || selectedEditor === 'opcode') {
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
            terminalError: error.message || 'Erro ao carregar sessoes do terminal',
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
      return {
        ...current,
        [workspacePath]: updater(baseView),
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

  const handleLaunchEditor = async () => {
    if (isStartingSession) {
      return;
    }

    if (sessions.length >= MAX_TERMINAL_SESSIONS) {
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: `Limite de ${MAX_TERMINAL_SESSIONS} terminais por workspace atingido. Encerre um terminal para abrir outro.`,
      }));
      return;
    }

    if (selectedEditor !== 'codex' && selectedEditor !== 'qwen-code' && selectedEditor !== 'claude-code' && selectedEditor !== 'gemini-cli' && !isSelectedProviderCompatible) {
      updateWorkspaceView((currentView) => ({
        ...currentView,
        terminalError: 'O provedor selecionado nao e compativel com o editor atual.',
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
        finalProvider = selectedProvider ? {
          id: selectedProvider.id,
          name: selectedProvider.name,
          apiType: selectedProvider.apiType || 'openai',
          baseUrl: selectedProvider.baseUrl,
          apiKey: selectedProvider.apiKey,
        } : null;
      }
    } else if (['codex', 'qwen-code', 'gemini-cli'].includes(selectedEditor)) {
      finalModel = '';
    } else {
      finalProvider = selectedProvider ? {
        id: selectedProvider.id,
        name: selectedProvider.name,
        apiType: selectedProvider.apiType || 'openai',
        baseUrl: selectedProvider.baseUrl,
        apiKey: selectedProvider.apiKey,
      } : null;
    }

    try {
      const result = await window.electronAPI.terminal.launchSession({
        workspacePath,
        editor: finalEditor,
        provider: finalProvider,
        model: finalModel,
        yoloMode,
        cols: isGridMode ? 56 : 120,
        rows: isGridMode ? 18 : 32,
      });

      if (!result.success || !result.session) {
        updateWorkspaceView((currentView) => ({
          ...currentView,
          terminalError: result.error || 'Erro ao iniciar o editor',
        }));
        return;
      }

      updateWorkspaceView((currentView) => ({
        ...currentView,
        sessions: result.sessions?.length ? result.sessions : [...currentView.sessions, result.session],
        activeSessionId: result.session.sessionId,
        terminalError: '',
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

  const handleFocusSession = (sessionId) => {
    updateWorkspaceView((currentView) => ({
      ...currentView,
      activeSessionId: sessionId,
      terminalError: '',
    }));
  };

  return (
    <div className="flex-1 flex flex-col bg-[color:var(--bg-body)]">
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
        yoloMode={yoloMode}
        onToggleYolo={() => setYoloMode((current) => !current)}
        layoutMode={currentWorkspaceView.layoutMode}
        onLayoutChange={(layoutMode) => {
          updateWorkspaceView((currentView) => ({
            ...currentView,
            layoutMode,
          }));
        }}
        onLaunch={handleLaunchEditor}
        isRunning={isStartingSession}
        sessionCount={sessions.length}
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

      <div className="flex-1 min-h-0 relative">
        {showTerminal ? (
          <div className="h-full min-h-0 flex flex-col relative z-10">
            <div className="flex-1 min-h-0">
              {isGridMode ? (
                <div className={`grid h-full min-h-0 gap-0 ${getGridColumnsClass(sessions.length)} ${getGridRowsClass(sessions.length)}`}>
                  {sessions.map((session) => (
                    <div key={session.sessionId} className="overflow-hidden border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] transition-all duration-300 flex flex-col">
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
                      />
                    </div>
                  ))}
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
                    <Terminal
                      key={activeSession.sessionId}
                      session={activeSession}
                      workspaceName={workspace.name}
                      workspacePath={workspacePath}
                      title={getSessionTitle(activeSession)}
                      statusLabel={getSessionStatusLabel(activeSession)}
                      errorMessage=""
                      embedded
                      zoomLevel={getSessionZoomLevel(activeSession.sessionId)}
                      onZoomIn={() => handleAdjustTerminalZoom(activeSession.sessionId, 1)}
                      onZoomOut={() => handleAdjustTerminalZoom(activeSession.sessionId, -1)}
                      onClose={() => handleCloseTerminal(activeSession.sessionId)}
                      onSessionExit={() => {}}
                      onFocus={() => handleFocusSession(activeSession.sessionId)}
                    />
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
      </div>
    </div>
  );
}
