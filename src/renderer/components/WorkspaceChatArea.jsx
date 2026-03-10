import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceToolbar } from '@components/WorkspaceToolbar';
import { Terminal } from '@components/Terminal';

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
  } = useWorkspace();
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedEditor, setSelectedEditor] = useState('claude-code');
  const [selectedProviderId, setSelectedProviderId] = useState('');
  const [selectedModelLocal, setSelectedModelLocal] = useState('');
  const [yoloMode, setYoloMode] = useState(false);
  const [workspaceViews, setWorkspaceViews] = useState({});

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
    setActiveSessionsCount(sessions.length);
  }, [sessions.length, setActiveSessionsCount]);

  useEffect(() => {
    if (!selectedProviderId && aiProviders.length > 0) {
      setSelectedProviderId(aiProviders[0].id);
    }
  }, [enabledProviders, selectedProviderId]);

  useEffect(() => {
    if (selectedEditor === 'codex' || selectedEditor === 'qwen-code') {
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
    if (selectedEditor === 'codex' || selectedEditor === 'qwen-code') {
      setSelectedModelLocal('');
      setSelectedModel('');
      return;
    }

    if (!selectedProvider || selectedProviderModels.length === 0) {
      setSelectedModelLocal('');
      setSelectedModel('');
      return;
    }

    const nextModel = selectedProviderModels.includes(selectedModelLocal)
      ? selectedModelLocal
      : selectedProviderModels[0];

    setSelectedModelLocal(nextModel);
    setSelectedModel(nextModel);
  }, [selectedEditor, selectedModelLocal, selectedProvider, selectedProviderModels, setSelectedModel]);

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
      <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
        <div className="text-center px-4">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg className="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-200 mb-1">
            Nenhum workspace selecionado
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
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

    setIsStartingSession(true);

    try {
      const result = await window.electronAPI.terminal.launchSession({
        workspacePath,
        editor: selectedEditor,
        provider: selectedEditor === 'codex' || selectedEditor === 'qwen-code'
          ? null
          : {
            id: selectedProvider?.id || '',
            name: selectedProvider?.name || '',
            baseUrl: selectedProvider?.baseUrl || '',
            apiKey: selectedProvider?.apiKey || '',
          },
        model: selectedEditor === 'codex' || selectedEditor === 'qwen-code' ? '' : selectedModelLocal,
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
    <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
      <header className="h-12 px-6 flex items-center justify-between border-b border-slate-200 dark:border-white/5 bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center">
          <div>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {projectLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div
            className="hidden md:flex max-w-[220px] items-center gap-1 rounded-lg border border-border-light bg-background-light px-2 py-1 text-xs text-slate-500 dark:border-white/10 dark:bg-background-dark dark:text-slate-400"
            title={workspace.path}
          >
            <span className="truncate">{workspacePathLabel}</span>
          </div>
          <button
            onClick={() => window.electronAPI.shell.openPath(workspace.path)}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            title="Abrir pasta no explorador"
          >
            <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
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

      <div className="flex-1 min-h-0 bg-background-light dark:bg-background-dark">
        {showTerminal ? (
          <div className="h-full min-h-0 flex flex-col">
            <div className="flex-1 min-h-0">
              {isGridMode ? (
                <div className={`grid h-full min-h-0 gap-0 ${getGridColumnsClass(sessions.length)} ${getGridRowsClass(sessions.length)}`}>
                  {sessions.map((session) => (
                    <Terminal
                      key={session.sessionId}
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
                  ))}
                </div>
              ) : activeSession ? (
                <div className="h-full min-h-0 overflow-hidden border border-border-light bg-surface-light shadow-sm dark:border-white/5 dark:bg-surface-dark dark:shadow-md flex flex-col">
                  <div className="shrink-0 border-b border-border-light bg-slate-50 px-2 pt-2 dark:border-white/5 dark:bg-black/20">
                    <div className="flex items-end gap-1 overflow-x-auto">
                      {sessions.map((session) => {
                        const isActive = session.sessionId === activeSession.sessionId;
                        return (
                          <button
                            key={session.sessionId}
                            onClick={() => handleFocusSession(session.sessionId)}
                            className={`group min-w-0 max-w-xs flex items-center gap-2 border border-b-0 px-3 py-2 text-left text-sm transition-colors ${
                              isActive
                                ? 'border-border-light bg-surface-light text-slate-900 dark:border-white/10 dark:bg-surface-dark dark:text-slate-100'
                                : 'border-transparent bg-transparent text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-white/5'
                            }`}
                          >
                            <span className={`inline-flex h-2 w-2 rounded-full ${
                              session.status === 'exited' ? 'bg-amber-400' : 'bg-emerald-400'
                            }`} />
                            <span className="truncate font-medium">
                              {getSessionTitle(session)}
                            </span>
                            <span
                              role="button"
                              tabIndex={0}
                              onClick={(event) => {
                                event.stopPropagation();
                                handleCloseTerminal(session.sessionId);
                              }}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleCloseTerminal(session.sessionId);
                                }
                              }}
                              className={`inline-flex h-5 w-5 items-center justify-center rounded transition-colors ${
                                isActive
                                  ? 'text-slate-500 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-white'
                                  : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-slate-200'
                              }`}
                              aria-label={`Fechar ${getSessionTitle(session)}`}
                            >
                              ×
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0">
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
          <div className="h-full flex items-center justify-center px-6">
            <div className="max-w-lg text-center rounded-2xl border border-border-light bg-surface-light px-8 py-10 shadow-lg dark:border-white/5 dark:bg-surface-dark">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-xl bg-primary-light/10 dark:bg-white/5">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Sessões inline do workspace
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Escolha o editor, defina o layout em abas ou grade e clique em <span className="font-medium text-slate-700 dark:text-slate-200">Executar</span>. Cada novo launch abre um terminal embutido nesta área, sem criar janelas externas.
              </p>
              {terminalError && (
                <p className="mt-5 text-sm text-red-500 dark:text-red-400">
                  {terminalError}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
