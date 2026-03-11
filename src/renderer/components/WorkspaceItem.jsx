import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { isValidWorkspaceName } from '@utils/nameGenerator';

/**
 * Componente WorkspaceItem
 * Item de workspace (git worktree) dentro de um projeto
 * 
 * @param {Object} props
 * @param {Object} props.workspace - Workspace a ser renderizado
 * @param {string} props.projectId - ID do projeto pai
 * @param {string} props.projectPath - Caminho do projeto
 * @returns {JSX.Element} Item de workspace
 */
export function WorkspaceItem({ workspace, projectId, projectPath, onDeleted, onRenamed }) {
  const { removeWorkspace, renameWorkspace, selectWorkspace, selectedWorkspace, showConfirm, showAlert } = useWorkspace();
  const [showActions, setShowActions] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workspace.name);

  /**
   * Handler para remover workspace
   */
  const handleRemove = async (e) => {
    e.stopPropagation();
    
    if (isRemoving) return;

    let shouldRemove = false;

    try {
      const syncResult = await window.electronAPI.git.getWorktreeSyncStatus({
        worktreePath: workspace.path
      });

      const hasPendingWork = syncResult.success
        ? Boolean(syncResult.hasPendingWork)
        : true;

      if (hasPendingWork) {
        shouldRemove = await showConfirm({
          title: 'Descartar trabalho não enviado?',
          message: `O workspace "${workspace.name}" possui alterações sem commit ou commits ainda não enviados. Deseja descartar todo o trabalho realizado?`,
          confirmText: 'Descartar workspace',
          cancelText: 'Cancelar',
          variant: 'danger',
        });
      } else {
        shouldRemove = await showConfirm({
          title: 'Remover workspace?',
          message: `Tem certeza que deseja remover o workspace "${workspace.name}"?`,
          confirmText: 'Remover workspace',
          cancelText: 'Cancelar',
          variant: 'danger',
        });
      }
    } catch (_error) {
      shouldRemove = await showConfirm({
        title: 'Confirmar remoção',
        message: `Não foi possível validar o estado de commit/push do workspace "${workspace.name}". Deseja prosseguir com a remoção?`,
        confirmText: 'Remover workspace',
        cancelText: 'Cancelar',
        variant: 'danger',
      });
    }

    if (!shouldRemove) {
      return;
    }

    setIsRemoving(true);
    
    try {
      const isWorkspaceSelected = selectedWorkspace?.projectId === projectId
        && selectedWorkspace?.workspace?.path === workspace.path;

      if (isWorkspaceSelected) {
        selectWorkspace(null, null);
        await new Promise((resolve) => setTimeout(resolve, 250));
      }

      const closeSessionsResult = await window.electronAPI.terminal.closeWorkspaceSessions({
        workspacePath: workspace.path,
      });

      if (!closeSessionsResult?.success) {
        throw new Error(closeSessionsResult?.error || 'Nao foi possivel encerrar os terminais do workspace');
      }

      await new Promise((resolve) => setTimeout(resolve, 700));

      const result = await window.electronAPI.git.removeWorktree({
        projectPath,
        worktreePath: workspace.path
      });
      
      if (result.success) {
        // Se este era o workspace selecionado, limpar seleção
        if (workspace.isSelected) {
          selectWorkspace(null, null);
        }
        
        removeWorkspace(projectId, workspace.name, workspace.path);
        if (onDeleted) onDeleted();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao remover workspace:', error);
      await showAlert({
        title: 'Erro ao remover workspace',
        message: error.message || 'Erro desconhecido',
        confirmText: 'Fechar',
        variant: 'danger',
      });
    } finally {
      setIsRemoving(false);
    }
  };

  /**
   * Handler para selecionar workspace e abrir chat
   */
  const handleSelect = () => {
    selectWorkspace(projectId, workspace);
  };

  const handleStartRename = (e) => {
    e.stopPropagation();
    if (isRemoving || isRenaming) return;
    setEditName(workspace.name);
    setIsEditing(true);
  };

  const handleRename = async () => {
    const nextName = editName.trim();
    if (!nextName || nextName === workspace.name) {
      setEditName(workspace.name);
      setIsEditing(false);
      return;
    }

    if (!isValidWorkspaceName(nextName)) {
      await showAlert({
        title: 'Nome de workspace inválido',
        message: 'Use apenas letras, números, hífen e underscore.',
        confirmText: 'Entendi',
        variant: 'danger',
      });
      return;
    }

    setIsRenaming(true);
    try {
      const result = await window.electronAPI.git.renameWorktree({
        projectPath,
        worktreePath: workspace.path,
        newName: nextName,
      });

      if (!result.success || !result.workspace) {
        throw new Error(result.error || 'Erro ao renomear workspace');
      }

      renameWorkspace(projectId, workspace.path, result.workspace);
      if (onRenamed) onRenamed();
      setIsEditing(false);
    } catch (error) {
      console.error('Erro ao renomear workspace:', error);
      await showAlert({
        title: 'Erro ao renomear workspace',
        message: error.message || 'Erro desconhecido',
        confirmText: 'Fechar',
        variant: 'danger',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <li
      className={`group w-full min-h-9 flex items-center gap-2 px-3 text-[0.85rem] rounded-[8px]
                  cursor-pointer transition-colors duration-150
                  hover:bg-[#eff6ff] dark:hover:bg-white/5
                  ${workspace.isSelected
                    ? 'bg-[#eff6ff] dark:bg-white/10' 
                    : ''}`}
      onClick={handleSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      title={workspace.path}
    >
      {/* Ícone do Workspace (Branch) */}
      <svg 
        className={`w-4 h-4 flex-shrink-0 ${workspace.isSelected ? 'text-[color:var(--primary-color)]' : 'text-[color:var(--text-tertiary)]'}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <line x1="6" y1="3" x2="6" y2="15"></line>
        <circle cx="18" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <path d="M18 9a9 9 0 0 1-9 9"></path>
      </svg>

      {isEditing ? (
        <input
          type="text"
          value={editName}
          onChange={(e) => setEditName(e.target.value)}
          onClick={(e) => e.stopPropagation()}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleRename();
            } else if (e.key === 'Escape') {
              setEditName(workspace.name);
              setIsEditing(false);
            }
          }}
          autoFocus
          className="flex-1 px-1 py-0.5 text-[0.85rem] rounded-[4px]
                     bg-[color:var(--bg-body)]
                     border border-[color:var(--border-color)]
                     focus:outline-none focus:ring-1 focus:ring-[color:var(--primary-color)]
                     text-[color:var(--text-primary)]"
        />
      ) : (
        <span className={`flex-1 text-[0.85rem] truncate ${workspace.isSelected ? 'font-bold text-[color:var(--primary-color)]' : 'text-[color:var(--text-primary)]'}`}>
          {workspace.name}
        </span>
      )}

      {/* Indicador de workspace atual */}
      {workspace.isCurrent && (
        <span className="text-[0.75rem] text-[color:var(--text-secondary)] font-semibold mr-1 bg-[color:var(--bg-surface)] px-1.5 py-0.5 rounded-[4px]">
          Git
        </span>
      )}

      {/* Ações do Workspace */}
      <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        <button
          onClick={handleStartRename}
          disabled={isRenaming || isRemoving}
          className="p-1 rounded-[6px] hover:bg-[#eff6ff] hover:text-[color:var(--primary-color)] dark:hover:bg-white/10 text-[color:var(--text-tertiary)]
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Renomear"
          aria-label="Renomear workspace"
        >
          <svg className="w-3.5 h-3.5"
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        {/* Remover */}
        <button
          onClick={handleRemove}
          disabled={isRemoving || isRenaming}
          className="p-1 rounded-[6px] hover:bg-[color:var(--danger-color)] hover:text-[color:var(--bg-body)] text-[color:var(--text-tertiary)]
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Remover"
          aria-label="Remover workspace"
        >
          <svg className="w-3.5 h-3.5" 
               fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" 
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </li>
  );
}
