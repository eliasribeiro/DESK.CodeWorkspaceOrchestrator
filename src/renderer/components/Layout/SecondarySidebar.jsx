import { useCallback, useEffect, useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente da barra lateral direita (Secundária)
 * Área limpa conforme solicitado.
 */
export function SecondarySidebar() {
  const { selectedWorkspace } = useWorkspace();
  const [changedFiles, setChangedFiles] = useState([]);
  const [isLoadingChanges, setIsLoadingChanges] = useState(false);
  const [changesError, setChangesError] = useState('');
  const [commitMessage, setCommitMessage] = useState('');
  const [actionInProgress, setActionInProgress] = useState('');
  const [gitFeedback, setGitFeedback] = useState({ type: '', text: '' });

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
  }, [selectedWorkspace?.workspace?.path, loadWorktreeChanges]);

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

    try {
      const result = await window.electronAPI.git.push({ worktreePath: workspacePath });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel realizar push' });
        return;
      }

      setGitFeedback({ type: 'success', text: 'Push realizado com sucesso' });
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao realizar push' });
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

    try {
      const result = await window.electronAPI.git.commitAndPush({
        worktreePath: workspacePath,
        message: normalizedMessage,
      });
      if (!result?.success) {
        setGitFeedback({ type: 'error', text: result?.error || 'Nao foi possivel realizar commit e push' });
        return;
      }

      setCommitMessage('');
      setGitFeedback({ type: 'success', text: 'Commit e push realizados com sucesso' });
      await loadWorktreeChanges(workspacePath);
    } catch (error) {
      setGitFeedback({ type: 'error', text: error.message || 'Erro ao realizar commit e push' });
    } finally {
      setActionInProgress('');
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
                title="Atualizar alteracoes"
              >
                <svg className={`w-3.5 h-3.5 ${isLoadingChanges ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m14.356-2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-14.357-2m14.357 2H15" />
                </svg>
              </button>
            </div>

            <div className="h-[calc(100%-41px)] px-2 py-2 flex flex-col gap-2">
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
                        className="w-full min-h-8 flex items-center justify-between gap-2 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-white/5"
                        title={file.path}
                      >
                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate">{file.path}</span>
                        <span className="flex items-center gap-2 shrink-0 text-[11px] font-semibold">
                          <span className="text-red-500">-{file.removed || 0}</span>
                          <span className="text-emerald-500">+{file.added || 0}</span>
                        </span>
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
                <button
                  type="button"
                  onClick={handleCommit}
                  disabled={Boolean(actionInProgress) || !commitMessage.trim()}
                  className="w-full h-8 px-2 rounded-md text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionInProgress === 'commit' ? 'Realizando commit...' : 'Comitar alteracoes'}
                </button>
                <button
                  type="button"
                  onClick={handlePush}
                  disabled={Boolean(actionInProgress)}
                  className="w-full h-8 px-2 rounded-md text-xs font-medium text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionInProgress === 'push' ? 'Realizando push...' : 'Fazer push'}
                </button>
                <button
                  type="button"
                  onClick={handleCommitAndPush}
                  disabled={Boolean(actionInProgress) || !commitMessage.trim()}
                  className="w-full h-8 px-2 rounded-md text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionInProgress === 'commitPush' ? 'Realizando commit e push...' : 'Comitar e fazer push'}
                </button>
                {gitFeedback.text && (
                  <p className={`px-1 text-xs ${gitFeedback.type === 'error' ? 'text-red-500' : 'text-emerald-500'}`}>
                    {gitFeedback.text}
                  </p>
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
