import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente da barra lateral direita (Secundária)
 * Área limpa conforme solicitado.
 */
export function SecondarySidebar() {
  const { selectedWorkspace, projects, openFilePreview } = useWorkspace();
  const [changedFiles, setChangedFiles] = useState([]);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);
  const [changesError, setChangesError] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState('');
  const [isActionsMenuOpen, setIsActionsMenuOpen] = useState(false);
  const [gitFeedback, setGitFeedback] = useState({ type: '', text: '' });
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [isOpeningPullRequest, setIsOpeningPullRequest] = useState(false);
  const [previewLoadingPath, setPreviewLoadingPath] = useState('');
  const actionsMenuRef = useRef(null);
  const projectPath = projects.find((project) => project.id === selectedWorkspace?.projectId)?.path || '';

  const loadWorktreeChanges = useCallback(async (workspacePath) => {
    if (!workspacePath) {
      setChangedFiles([]);
      setChangesError('');
      setIsLoadingChanges(false);
      return;
    }

    setIsLoadingChanges(true);
    setChangesError('');

    try {
      const result = await window.electronAPI.git.getWorktreeChanges({ worktreePath: workspacePath });
      if (!result?.success) {
        setChangedFiles([]);
        setChangesError(result?.error || 'Nao foi possivel carregar alteracoes do workspace');
        return;
      }

      setChangedFiles(Array.isArray(result.files) ? result.files : []);
    } catch (error) {
      setChangedFiles([]);
      setChangesError(error.message || 'Erro ao carregar alteracoes do workspace');
    } finally {
      setIsLoadingChanges(false);
    }
  }, []);

  useEffect(() => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    loadWorktreeChanges(workspacePath);
    setCommitMessage('');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');
    setPreviewLoadingPath('');
  }, [selectedWorkspace?.workspace?.path, loadWorktreeChanges]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!actionsMenuRef.current) {
        return;
      }

      if (!actionsMenuRef.current.contains(event.target)) {
        setIsActionsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleCommit = async () => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    const normalizedMessage = commitMessage.trim();

    if (!workspacePath) {
      setGitFeedback({ type: 'error', text: 'Workspace nao selecionado' });
      return;
    }

    if (!normalizedMessage) {
      setGitFeedback({ type: 'error', text: 'Digite uma mensagem de commit' });
      return;
    }

    setActionInProgress('commit');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');

    try {
      const result = await window.electronAPI.git.commit({ worktreePath: workspacePath, message: normalizedMessage });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel realizar commit' });
        return;
      }

      setCommitMessage('');
      setGitFeedback({ type: 'success', text: 'Commit realizado com sucesso' });
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao realizar commit' });
    } finally {
      setActionInProgress('');
    }
  };

  const handlePush = async () => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    if (!workspacePath) {
      setGitFeedback({ type: 'error', text: 'Workspace nao selecionado' });
      return;
    }

    setActionInProgress('push');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');

    try {
      const result = await window.electronAPI.git.push({ worktreePath: workspacePath });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel realizar push' });
        setPullRequestUrl('');
        return;
      }

      setGitFeedback({
        type: 'success',
        text: result?.upstreamWasConfigured
          ? 'Push realizado com sucesso e branch vinculada ao remoto'
          : 'Push realizado com sucesso',
      });
      setPullRequestUrl(result?.pullRequestUrl || '');
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao realizar push' });
      setPullRequestUrl('');
    } finally {
      setActionInProgress('');
    }
  };

  const handleCommitAndPush = async () => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    const normalizedMessage = commitMessage.trim();

    if (!workspacePath) {
      setGitFeedback({ type: 'error', text: 'Workspace nao selecionado' });
      return;
    }

    if (!normalizedMessage) {
      setGitFeedback({ type: 'error', text: 'Digite uma mensagem de commit' });
      return;
    }

    setActionInProgress('commitPush');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');

    try {
      const result = await window.electronAPI.git.commitAndPush({
        worktreePath: workspacePath,
        message: normalizedMessage,
      });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel realizar commit e push' });
        setPullRequestUrl('');
        return;
      }

      setCommitMessage('');
      setGitFeedback({
        type: 'success',
        text: result?.upstreamWasConfigured
          ? 'Commit e push realizados com sucesso, com upstream configurado'
          : 'Commit e push realizados com sucesso',
      });
      setPullRequestUrl(result?.pullRequestUrl || '');
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao realizar commit e push' });
      setPullRequestUrl('');
    } finally {
      setActionInProgress('');
    }
  };

  const handleOpenPullRequest = async () => {
    if (!pullRequestUrl) {
      return;
    }

    setIsOpeningPullRequest(true);
    try {
      const result = await window.electronAPI.shell.openExternal(pullRequestUrl);
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel abrir tela de pull request' });
      }
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao abrir tela de pull request' });
    } finally {
      setIsOpeningPullRequest(false);
    }
  };

  const handleMergeToMain = async () => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    const normalizedMessage = commitMessage.trim();

    if (!workspacePath) {
      setGitFeedback({ type: 'error', text: 'Workspace nao selecionado' });
      return;
    }

    if (!projectPath) {
      setGitFeedback({ type: 'error', text: 'Projeto principal nao encontrado para este workspace' });
      return;
    }

    setActionInProgress('merge');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');

    try {
      const result = await window.electronAPI.git.mergeToMain({
        projectPath,
        worktreePath: workspacePath,
        message: normalizedMessage,
      });

      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel executar merge com a main' });
        return;
      }

      setCommitMessage('');
      setGitFeedback({ type: 'success', text: result?.message || 'Merge com a main realizado com sucesso' });
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao executar merge com a main' });
    } finally {
      setActionInProgress('');
    }
  };

  const handleOpenFilePreview = async (filePath) => {
    const workspacePath = selectedWorkspace?.workspace?.path;
    if (!workspacePath || !filePath) {
      return;
    }

    setPreviewLoadingPath(filePath);
    try {
      const result = await window.electronAPI.git.getWorktreeFilePreview({
        worktreePath: workspacePath,
        filePath,
      });

      if (!result?.success || !result?.file) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel abrir a visualizacao do arquivo' });
        return;
      }

      openFilePreview(result.file);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao abrir a visualizacao do arquivo' });
    } finally {
      setPreviewLoadingPath('');
    }
  };

  return (
    <aside className="h-full flex flex-col bg-background-light dark:bg-background-dark border-l border-border-light dark:border-white/5 overflow-hidden">
      <div className="h-full p-2">
        {selectedWorkspace?.workspace?.path ? (
          <div className="w-full h-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03]">
            <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 dark:border-white/10">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-wide text-slate-500 dark:text-slate-400">Repositorio do Worktree</p>
                <p className="text-xs font-medium text-slate-700 dark:text-slate-200 truncate">{selectedWorkspace.workspace.name}</p>
              </div>
              <button
                type="button"
                onClick={() => loadWorktreeChanges(selectedWorkspace.workspace.path)}
                className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10 text-slate-500 dark:text-slate-400"
                title="Atualizar alterações"
              >
                <svg className={`w-3.5 h-3.5 ${isLoadingChanges ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m14.356-2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.357-2m14.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="h-[calc(100%-41px)] px-2 py-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleMergeToMain}
                disabled={Boolean(actionInProgress)}
                className="w-full h-9 px-3 rounded-md text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionInProgress === 'merge' ? 'Fazendo merge...' : 'Merge'}
              </button>

              <div className="min-h-0 flex-1">
                {changesError && (
                  <p className="px-1 py-1 text-xs text-red-500">{changesError}</p>
                )}

                {!changesError && isLoadingChanges && (
                  <p className="px-1 py-1 text-xs text-slate-500 dark:text-slate-400">Carregando alteracoes...</p>
                )}

                {!changesError && !isLoadingChanges && changedFiles.length === 0 && (
                  <p className="px-1 py-1 text-xs text-slate-500 dark:text-slate-400">Nenhum arquivo alterado</p>
                )}

                {!changesError && !isLoadingChanges && changedFiles.length > 0 && (
                  <ul className="h-full overflow-y-auto scrollbar-thin space-y-1">
                    {changedFiles.map((file) => (
                      <li
                        key={file.path}
                        title={file.path}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenFilePreview(file.path)}
                          className="w-full min-h-8 flex items-center justify-between gap-2 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/5"
                        >
                          <span className="text-left text-xs text-slate-700 dark:text-slate-300 truncate">
                            {previewLoadingPath === file.path ? 'Abrindo...' : file.path}
                          </span>
                          <span className="flex items-center gap-2 shrink-0 text-[11px] font-semibold">
                            <span className="text-red-500">-{file.removed || 0}</span>
                            <span className="text-emerald-500">+{file.added || 0}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="border-t border-slate-200 dark:border-white/10 pt-2 space-y-2">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  className="w-full h-8 px-2 rounded-md border border-slate-300 dark:border-white/15 bg-white dark:bg-white/5 text-xs text-slate-700 dark:text-slate-200 outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="Mensagem do commit"
                />
                <div className="relative" ref={actionsMenuRef}>
                  <button
                    type="button"
                    onClick={() => setIsActionsMenuOpen((prev) => !prev)}
                    disabled={Boolean(actionInProgress)}
                    className="w-full h-8 px-2 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-between"
                  >
                    <span>
                      {actionInProgress === 'commit' && 'Realizando commit...'}
                      {actionInProgress === 'push' && 'Realizando push...'}
                      {actionInProgress === 'commitPush' && 'Realizando commit e push...'}
                      {!actionInProgress && 'Ações Git'}
                    </span>
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isActionsMenuOpen && !actionInProgress && (
                    <div className="absolute left-0 right-0 bottom-full mb-1 rounded-md border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-lg overflow-hidden z-20">
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          handleCommit();
                        }}
                        disabled={!commitMessage.trim()}
                        className="w-full h-8 px-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Comitar alterações
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          handlePush();
                        }}
                        className="w-full h-8 px-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10"
                      >
                        Fazer push
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsActionsMenuOpen(false);
                          handleCommitAndPush();
                        }}
                        disabled={!commitMessage.trim()}
                        className="w-full h-8 px-2 text-left text-xs text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Comitar e fazer push
                      </button>
                    </div>
                  )}
                </div>
                {gitFeedback.text && (
                  <p className={`px-1 text-xs ${gitFeedback.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {gitFeedback.text}
                  </p>
                )}
                {pullRequestUrl && (
                  <button
                    type="button"
                    onClick={handleOpenPullRequest}
                    disabled={isOpeningPullRequest}
                    className="w-full h-8 px-2 rounded-md text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isOpeningPullRequest ? 'Abrindo pull request...' : 'Abrir pull request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-md border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.03] flex items-center justify-center px-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
              Selecione um workspace para ver alteracoes do repositorio
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
