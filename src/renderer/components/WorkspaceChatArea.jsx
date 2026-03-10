import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceToolbar } from '@components/WorkspaceToolbar';
import { Terminal } from '@components/Terminal';
import { WorkspaceFilePreviewModal } from '@components/WorkspaceFilePreviewModal';

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
    <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-[#0a0f18]">
      <header className="h-16 px-6 flex items-center justify-between border-b border-slate-200/60 bg-white/70 dark:bg-[#111827]/80 backdrop-blur-xl z-40 shadow-sm transition-all">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100 tracking-tight">
              {projectLabel}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className="hidden md:flex max-w-[280px] items-center gap-2 rounded-full border border-slate-200/80 bg-slate-100/50 px-3.5 py-1.5 text-xs font-medium text-slate-600 shadow-inner group transition-all hover:bg-slate-200/50 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
            title={workspace.path}
          >
            <svg className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 transition-colors dark:group-hover:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="truncate">{workspacePathLabel}</span>
          </div>
          <button
            onClick={() => window.electronAPI.shell.openPath(workspace.path)}
            className="p-2.5 rounded-full hover:bg-white dark:hover:bg-white/10 transition-all hover:shadow-sm text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white transform hover:scale-105 active:scale-95"
            title="Abrir pasta no explorador"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
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

      <div className="flex-1 min-h-0 relative">
        {/* Subtle background gradient pattern for the workspace area */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxjaXJjbGUgY3g9IjMiIGN5PSIzIiByPSIzIiBmaWxsPSIjOWNhM2FmIiBmaWxsLW9wYWNpdHk9IjAuMDUiLz48L2c+PC9zdmc+')] pointer-events-none" />

        {showTerminal ? (
          <div className="h-full min-h-0 flex flex-col relative z-10">
            <div className="flex-1 min-h-0 p-3">
              {isGridMode ? (
                <div className={`grid h-full min-h-0 gap-3 ${getGridColumnsClass(sessions.length)} ${getGridRowsClass(sessions.length)}`}>
                  {sessions.map((session) => (
                    <div key={session.sessionId} className="rounded-xl overflow-hidden shadow-sm border border-slate-200/80 bg-white/60 dark:border-white/10 dark:bg-[#111827]/80 backdrop-blur-md transition-all duration-300 hover:shadow-md hover:border-indigo-400/30 dark:hover:border-indigo-500/30 flex flex-col">
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
                <div className="h-full min-h-0 overflow-hidden rounded-xl border border-slate-200/80 bg-white/60 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-[#111827]/80 flex flex-col transition-all duration-300 hover:shadow-md">
                  <div className="shrink-0 border-b border-slate-200/80 bg-slate-50/50 pt-2 px-2 dark:border-white/10 dark:bg-white/5 backdrop-blur-xl">
                    <div className="flex items-end gap-1.5 overflow-x-auto pb-0 hide-scrollbar">
                      {sessions.map((session) => {
                        const isActive = session.sessionId === activeSession.sessionId;
                        return (
                          <button
                            key={session.sessionId}
                            onClick={() => handleFocusSession(session.sessionId)}
                            className={`group relative min-w-0 max-w-xs flex items-center gap-2.5 rounded-t-lg border-t border-x px-4 py-2.5 text-left text-sm font-medium transition-all duration-200 ${
                              isActive
                                ? 'border-slate-200/80 bg-white text-indigo-600 dark:border-white/10 dark:bg-[#111827] dark:text-indigo-400 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] z-10'
                                : 'border-transparent bg-transparent text-slate-500 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/5 hover:text-slate-700 dark:hover:text-slate-200'
                            }`}
                          >
                            <span className={`inline-flex h-2 w-2 rounded-full ring-2 ring-white/50 dark:ring-black/50 align-middle transition-colors shadow-sm ${
                              session.status === 'exited' ? 'bg-amber-400' : 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]'
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
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === ' ') {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  handleCloseTerminal(session.sessionId);
                                }
                              }}
                              className={`ml-1 inline-flex h-5 w-5 items-center justify-center rounded-md transition-all ${
                                isActive
                                  ? 'text-slate-400 hover:bg-slate-100 hover:text-red-500 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:text-red-400'
                                  : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-200 hover:text-red-500 dark:text-slate-500 dark:hover:bg-white/10 dark:hover:text-red-400'
                              }`}
                              aria-label={`Fechar ${getSessionTitle(session)}`}
                            >
                              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                            </span>
                            {isActive && (
                              <div className="absolute -bottom-[1px] left-0 right-0 h-[3px] bg-white dark:bg-[#111827]" />
                            )}
                            {isActive && (
                              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500 rounded-t-lg opacity-80" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 relative bg-white/70 dark:bg-transparent">
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
            {/* Background elements for empty state */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center opacity-40 dark:opacity-20">
              <div className="w-[500px] h-[500px] bg-indigo-400/20 rounded-full blur-[100px] absolute -top-20 -left-20 mix-blend-multiply dark:mix-blend-screen" />
              <div className="w-[400px] h-[400px] bg-purple-400/20 rounded-full blur-[80px] absolute bottom-10 right-10 mix-blend-multiply dark:mix-blend-screen" />
            </div>
            
            <div className="max-w-md text-center rounded-3xl border border-white/60 bg-white/60 px-10 py-12 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-[#111827]/60 relative z-10 duration-500 hover:shadow-indigo-500/10 hover:border-white/80 transition-all dark:hover:border-white/20">
              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
                <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 tracking-tight">
                Sessões inline do workspace
              </h3>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                Escolha o editor, defina o layout em abas ou grade e clique em <span className="font-semibold text-indigo-600 dark:text-indigo-400 px-1.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10">Executar</span>. 
                Cada novo launch abre um terminal embutido nesta área, sem criar janelas externas.
              </p>
              {terminalError && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-600 dark:text-red-400 animate-pulse">
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
