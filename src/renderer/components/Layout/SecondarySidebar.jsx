import { useCallback, useEffect, useRef, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente da barra lateral direita (Secundária)
 * Área limpa conforme solicitado.
 */
export function SecondarySidebar() {
  const { selectedWorkspace, projects, openFilePreview } = useWorkspace();
  const gitActionOptions = [
    { value: 'commitPush', label: 'Comitar e fazer Push' },
    { value: 'commit', label: 'Comitar alterações' },
    { value: 'push', label: 'Fazer push' },
  ];
  const [changedFiles, setChangedFiles] = useState([]);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);
  const [changesError, setChangesError] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState('');
  const [selectedGitAction, setSelectedGitAction] = useState('commitPush');
  const [isGitActionMenuOpen, setIsGitActionMenuOpen] = useState(false);
  const [gitFeedback, setGitFeedback] = useState({ type: '', text: '' });
  const [pullRequestUrl, setPullRequestUrl] = useState('');
  const [isOpeningPullRequest, setIsOpeningPullRequest] = useState(false);
  const [previewLoadingPath, setPreviewLoadingPath] = useState('');
  const gitActionMenuRef = useRef(null);
  const projectPath = projects.find((project) => project.id === selectedWorkspace?.projectId)?.path || '';
  const isProjectRootWorkspace =
    Boolean(selectedWorkspace?.workspace?.isProjectRoot)
    || Boolean(projectPath && selectedWorkspace?.workspace?.path === projectPath);

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
        setChangesError(result?.error || 'Não foi possível carregar alterações do workspace');
        return;
      }

      setChangedFiles(Array.isArray(result.files) ? result.files : []);
    } catch (error) {
      setChangedFiles([]);
      setChangesError(error.message || 'Erro ao carregar alterações do workspace');
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
    setSelectedGitAction('commitPush');
    setIsGitActionMenuOpen(false);
  }, [selectedWorkspace?.workspace?.path, loadWorktreeChanges]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!gitActionMenuRef.current?.contains(event.target)) {
        setIsGitActionMenuOpen(false);
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
      setGitFeedback({ type: 'error', text: 'Workspace não selecionado' });
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
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível realizar commit' });
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
      setGitFeedback({ type: 'error', text: 'Workspace não selecionado' });
      return;
    }

    setActionInProgress('push');
    setGitFeedback({ type: '', text: '' });
    setPullRequestUrl('');

    try {
      const result = await window.electronAPI.git.push({ worktreePath: workspacePath });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível realizar push' });
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
      setGitFeedback({ type: 'error', text: 'Workspace não selecionado' });
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
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível realizar commit e push' });
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
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível abrir tela de pull request' });
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
      setGitFeedback({ type: 'error', text: 'Workspace não selecionado' });
      return;
    }

    if (!projectPath) {
      setGitFeedback({ type: 'error', text: 'Projeto principal não encontrado para este workspace' });
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
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível executar merge com a main' });
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
        setGitFeedback({ type: 'error', text: result?.error || 'Não foi possível abrir a visualização do arquivo' });
        return;
      }

      openFilePreview(result.file);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao abrir a visualização do arquivo' });
    } finally {
      setPreviewLoadingPath('');
    }
  };

  const runSelectedGitAction = async () => {
    if (selectedGitAction === 'commit') {
      await handleCommit();
      return;
    }

    if (selectedGitAction === 'push') {
      await handlePush();
      return;
    }

    await handleCommitAndPush();
  };

  const selectedGitActionLabel = gitActionOptions.find((option) => option.value === selectedGitAction)?.label
    || 'Comitar e fazer Push';

  return (
    <aside className="h-full flex flex-col bg-[color:var(--bg-body)] border-l border-[color:var(--border-color)] overflow-hidden">
      <div className="h-full p-2">
        {selectedWorkspace?.workspace?.path ? (
          <div className="w-full h-full rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)]">
              <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wide text-[color:var(--text-tertiary)]">
                    {isProjectRootWorkspace ? 'Repositorio Principal' : 'Repositorio do Worktree'}
                  </p>
                <p className="text-xs font-semibold text-[color:var(--text-primary)] truncate">{selectedWorkspace.workspace.name}</p>
              </div>
              <button
                type="button"
                onClick={() => loadWorktreeChanges(selectedWorkspace.workspace.path)}
                className="p-1 rounded-[8px] hover:bg-[#eff6ff] hover:text-[color:var(--primary-color)] dark:hover:bg-white/10 text-[color:var(--text-secondary)] transition-colors"
                title="Atualizar alterações"
              >
                <svg className={`w-3.5 h-3.5 ${isLoadingChanges ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m14.356-2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.357-2m14.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="flex-1 px-2 py-2 flex flex-col gap-2 min-h-0">
              {!isProjectRootWorkspace && (
                <button
                  type="button"
                  onClick={handleMergeToMain}
                  disabled={Boolean(actionInProgress)}
                  className="w-full h-9 px-3 rounded-[8px] text-[0.85rem] font-semibold text-[color:var(--text-primary)] border border-[color:var(--success-color)] bg-[color:var(--success-color)]/10 hover:bg-[color:var(--success-color)]/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {actionInProgress === 'merge' ? 'Fazendo merge...' : 'Merge'}
                </button>
              )}

              <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
                {changesError && (
                  <p className="px-1 py-1 text-xs text-[color:var(--danger-color)]">{changesError}</p>
                )}

                {!changesError && isLoadingChanges && (
                  <p className="px-1 py-1 text-xs text-[color:var(--text-tertiary)]">Carregando alterações...</p>
                )}

                {!changesError && !isLoadingChanges && changedFiles.length === 0 && (
                  <p className="px-1 py-1 text-xs text-[color:var(--text-tertiary)]">Nenhum arquivo alterado</p>
                )}

                {!changesError && !isLoadingChanges && changedFiles.length > 0 && (
                  <ul className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
                    {changedFiles.map((file) => (
                      <li
                        key={file.path}
                        title={file.path}
                      >
                        <button
                          type="button"
                          onClick={() => handleOpenFilePreview(file.path)}
                          className="w-full min-h-8 flex flex-col items-start justify-center gap-0.5 px-2 py-1 rounded-[6px] hover:bg-[#eff6ff] dark:hover:bg-white/5 transition-colors group"
                        >
                          <span className="text-left py-0.5 text-xs text-[color:var(--text-primary)] truncate max-w-full block group-hover:text-[color:var(--primary-color)]">
                            {previewLoadingPath === file.path ? 'Abrindo...' : file.path}
                          </span>
                          <span className="flex items-center gap-2 shrink-0 text-[10px] font-semibold opacity-80">
                            <span className="text-[color:var(--danger-color)]">-{file.removed || 0}</span>
                            <span className="text-[color:var(--success-color)]">+{file.added || 0}</span>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="pt-2 space-y-2 mt-auto shrink-0 border-t border-[color:var(--border-color)]">
                <input
                  type="text"
                  value={commitMessage}
                  onChange={(event) => setCommitMessage(event.target.value)}
                  className="w-full h-8 px-2 rounded-[8px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] text-[0.85rem] text-[color:var(--text-primary)] outline-none focus:ring-1 focus:ring-[color:var(--primary-color)] focus:border-[color:var(--primary-color)] transition-colors placeholder:text-[color:var(--text-tertiary)]"
                  placeholder="Mensagem do commit"
                />
                <div className="relative w-full" ref={gitActionMenuRef}>
                  <div className="flex items-stretch overflow-hidden rounded-[11px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] shadow-[0_8px_22px_rgba(15,23,42,0.08)]">
                    <button
                      type="button"
                      onClick={runSelectedGitAction}
                      disabled={
                        Boolean(actionInProgress)
                        || ((selectedGitAction === 'commit' || selectedGitAction === 'commitPush') && !commitMessage.trim())
                      }
                      className="flex-1 h-9 px-3 text-[0.85rem] font-semibold text-[color:var(--text-primary)] hover:bg-[color:var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                    >
                      {actionInProgress === 'commit' && 'Realizando commit...'}
                      {actionInProgress === 'push' && 'Realizando push...'}
                      {actionInProgress === 'commitPush' && 'Realizando commit e push...'}
                      {!actionInProgress && selectedGitActionLabel}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsGitActionMenuOpen((current) => !current)}
                      disabled={Boolean(actionInProgress)}
                      className="w-10 h-9 border-l border-[color:var(--border-color)] text-[color:var(--text-secondary)] hover:bg-[color:var(--bg-surface)] hover:text-[color:var(--text-primary)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
                      aria-label="Abrir menu de ações do Git"
                      aria-expanded={isGitActionMenuOpen}
                    >
                      <svg
                        className={`h-4 w-4 transition-transform ${isGitActionMenuOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {isGitActionMenuOpen && !actionInProgress && (
                    <div className="absolute inset-x-0 bottom-full z-20 mb-2 overflow-hidden rounded-[16px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] py-1.5 shadow-[0_18px_50px_rgba(15,23,42,0.18)] backdrop-blur-xl">
                      {gitActionOptions.map((option, index) => {
                        const isSelected = selectedGitAction === option.value;
                        const requiresCommitMessage = option.value === 'commit' || option.value === 'commitPush';
                        const isDisabled = requiresCommitMessage && !commitMessage.trim();

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              setSelectedGitAction(option.value);
                              setIsGitActionMenuOpen(false);
                            }}
                            className={`flex w-full items-center gap-3 px-3 py-2.5 text-left text-[0.82rem] transition-colors ${
                              isDisabled
                                ? 'cursor-not-allowed text-[color:var(--text-tertiary)] opacity-60'
                                : 'text-[color:var(--text-primary)] hover:bg-[color:var(--bg-body)]'
                            }`}
                            disabled={isDisabled}
                          >
                            <span className="flex h-4 w-4 items-center justify-center text-[color:var(--text-primary)]">
                              {isSelected && (
                                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                              )}
                            </span>
                            <span className="min-w-0 flex-1 whitespace-normal break-words leading-5">{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
                {gitFeedback.text && (
                  <p className={`px-1 text-xs ${gitFeedback.type === 'error' ? 'text-[color:var(--danger-color)]' : 'text-[color:var(--success-color)]'}`}>
                    {gitFeedback.text}
                  </p>
                )}
                {pullRequestUrl && (
                  <button
                    type="button"
                    onClick={handleOpenPullRequest}
                    disabled={isOpeningPullRequest}
                    className="w-full h-8 px-2 rounded-[8px] text-[0.85rem] font-medium text-[color:var(--text-secondary)] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] hover:bg-[color:var(--bg-surface)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isOpeningPullRequest ? 'Abrindo pull request...' : 'Abrir pull request'}
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="w-full h-full rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] flex items-center justify-center px-4">
            <p className="text-[0.85rem] text-[color:var(--text-tertiary)] text-center">
              Selecione um workspace para ver alterações do repositório
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
