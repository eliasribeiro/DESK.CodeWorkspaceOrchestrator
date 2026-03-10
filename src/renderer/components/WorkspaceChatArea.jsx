import { useEffect, useMemo, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceToolbar } from '@components/WorkspaceToolbar';
import { Terminal } from '@components/Terminal';

const MAX_TERMINAL_SESSIONS = 6;

function getDefaultWorkspaceView() {
  return {
    layoutMode: 'tabs',
    sessions: [],
    activeSessionId: '',
    terminalError: '',
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

  const removeSession = (sessionId) => {
    updateWorkspaceView((currentView) => {
      const nextSessions = currentView.sessions.filter((item) => item.sessionId !== sessionId);
      const nextActiveSessionId = currentView.activeSessionId === sessionId
        ? nextSessions[nextSessions.length - 1]?.sessionId || ''
        : currentView.activeSessionId;

      return {
        ...currentView,
        sessions: nextSessions,
        activeSessionId: nextActiveSessionId,
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
        terminalError: 'Limite de 6 terminais por workspace atingido. Encerre um terminal para abrir outro.',
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
      <header className="h-12 px-6 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-surface-light dark:bg-surface-dark">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
              {workspace.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {project?.name || 'Projeto'} | {workspace.branch || 'workspace'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-xs text-slate-500 dark:text-slate-400 text-right">
            <p className="truncate max-w-xs" title={workspace.path}>
              {workspace.path}
            </p>
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
            {!isGridMode && (
              <div className="px-4 pt-4">
                <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-slate-200 bg-white/85 p-2 shadow-[0_10px_30px_rgba(15,23,42,0.07)] dark:border-slate-800 dark:bg-slate-950/80">
                  {sessions.map((session) => {
                    const isActive = session.sessionId === activeSession?.sessionId;
                    return (
                      <button
                        key={session.sessionId}
                        onClick={() => handleFocusSession(session.sessionId)}
                        className={`group min-w-0 flex items-center gap-3 rounded-xl border px-3 py-2 text-left transition-all ${
                          isActive
                            ? 'border-slate-900 bg-slate-900 text-white shadow-lg dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                            : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <span className={`inline-flex h-2.5 w-2.5 rounded-full ${
                          session.status === 'exited' ? 'bg-amber-400' : 'bg-emerald-400'
                        }`} />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold">
                            {getSessionTitle(session)}
                          </span>
                          <span className={`block truncate text-[11px] ${
                            isActive ? 'text-white/70 dark:text-slate-600' : 'text-slate-400'
                          }`}>
                            {getSessionStatusLabel(session)}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className={`flex-1 min-h-0 p-4 ${isGridMode ? '' : 'pt-3'}`}>
              {isGridMode ? (
                <div className={`grid h-full min-h-0 gap-4 ${getGridColumnsClass(sessions.length)} ${getGridRowsClass(sessions.length)}`}>
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
                      onClose={() => handleCloseTerminal(session.sessionId)}
                      onSessionExit={() => {}}
                      onFocus={() => handleFocusSession(session.sessionId)}
                    />
                  ))}
                </div>
              ) : activeSession ? (
                <Terminal
                  key={activeSession.sessionId}
                  session={activeSession}
                  workspaceName={workspace.name}
                  workspacePath={workspacePath}
                  title={getSessionTitle(activeSession)}
                  statusLabel={getSessionStatusLabel(activeSession)}
                  errorMessage=""
                  onClose={() => handleCloseTerminal(activeSession.sessionId)}
                  onSessionExit={() => {}}
                />
              ) : null}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center px-6">
            <div className="max-w-lg text-center rounded-[28px] border border-slate-200 bg-white/80 px-8 py-10 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/70">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[22px] bg-[radial-gradient(circle_at_top,#22c55e,transparent_58%),linear-gradient(135deg,#111827,#1f2937)] shadow-[0_16px_50px_rgba(34,197,94,0.25)]">
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
