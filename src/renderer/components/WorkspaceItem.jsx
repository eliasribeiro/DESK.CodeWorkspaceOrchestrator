import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { isValidWorkspaceName } from '@utils/nameGenerator';
import { GitBranch, Pencil, Trash2 } from 'lucide-react';
import { cn } from '@lib/utils';

export function WorkspaceItem({ workspace, projectId, projectPath, onDeleted, onRenamed }) {
  const { removeWorkspace, renameWorkspace, selectWorkspace, selectedWorkspace, showConfirm, showAlert } = useWorkspace();
  const [showActions, setShowActions] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(workspace.name);

  const formatBlockingProcesses = (processes = []) => {
    return processes
      .slice(0, 3)
      .map((processInfo) => {
        const pid = processInfo?.pid ?? '-';
        const name = processInfo?.name || 'processo';
        const commandLine = processInfo?.commandLine || processInfo?.executablePath || '';
        const shortCommand = commandLine.length > 140
          ? `${commandLine.slice(0, 140)}...`
          : commandLine;
        return `• PID ${pid} - ${name}${shortCommand ? `\n  ${shortCommand}` : ''}`;
      })
      .join('\n\n');
  };

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
          title: 'Discard uncommitted work?',
          message: `The workspace "${workspace.name}" has uncommitted changes. Are you sure you want to discard them?`,
          confirmText: 'Discard',
          cancelText: 'Cancel',
          variant: 'danger',
        });
      } else {
        shouldRemove = await showConfirm({
          title: 'Remove workspace?',
          message: `Are you sure you want to remove the workspace "${workspace.name}"?`,
          confirmText: 'Remove',
          cancelText: 'Cancel',
          variant: 'danger',
        });
      }
    } catch (_error) {
      shouldRemove = await showConfirm({
        title: 'Confirm removal',
        message: `Could not validate the commit status of "${workspace.name}". Proceed with removal?`,
        confirmText: 'Remove',
        cancelText: 'Cancel',
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
        throw new Error(closeSessionsResult?.error || 'Could not close terminals');
      }

      await new Promise((resolve) => setTimeout(resolve, 700));

      let result = await window.electronAPI.git.removeWorktree({
        projectPath,
        worktreePath: workspace.path
      });

      if (!result.success && result.canKillBlockingProcesses && Array.isArray(result.blockingProcesses) && result.blockingProcesses.length > 0) {
        const processDescription = formatBlockingProcesses(result.blockingProcesses);
        const shouldKillProcess = await showConfirm({
          title: 'Blocking processes found',
          message: `We found processes blocking the removal of "${workspace.name}".\n\n${processDescription}\n\nDo you want to force kill these processes?`,
          confirmText: 'Kill and remove',
          cancelText: 'Cancel',
          variant: 'danger',
        });

        if (shouldKillProcess) {
          const killResult = await window.electronAPI.git.killProcesses({
            processIds: result.blockingProcesses.map((processInfo) => processInfo.pid),
          });

          if (!killResult?.success) {
            throw new Error(`Could not kill processes.`);
          }

          await new Promise((resolve) => setTimeout(resolve, 500));
          result = await window.electronAPI.git.removeWorktree({
            projectPath,
            worktreePath: workspace.path
          });
        }
      }
      
      if (result.success) {
        if (workspace.isSelected) {
          selectWorkspace(null, null);
        }
        removeWorkspace(projectId, workspace.name, workspace.path);
        if (onDeleted) onDeleted();
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      await showAlert({
        title: 'Error removing workspace',
        message: error.message || 'Unknown error',
        confirmText: 'Dismiss',
        variant: 'danger',
      });
    } finally {
      setIsRemoving(false);
    }
  };

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
        title: 'Invalid workspace name',
        message: 'Use only letters, numbers, hyphens, and underscores.',
        confirmText: 'Got it',
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
        throw new Error(result.error || 'Failed to rename workspace');
      }

      renameWorkspace(projectId, workspace.path, result.workspace);
      if (onRenamed) onRenamed();
      setIsEditing(false);
    } catch (error) {
      await showAlert({
        title: 'Failed to rename workspace',
        message: error.message || 'Unknown error',
        confirmText: 'Dismiss',
        variant: 'danger',
      });
    } finally {
      setIsRenaming(false);
    }
  };

  return (
    <div
      className={cn(
        "group w-full min-h-8 flex items-center justify-between gap-2 px-2.5 text-xs rounded-md cursor-pointer transition-all duration-300",
        workspace.isSelected
          ? "bg-[color:var(--text-primary)] text-[color:var(--bg-body)] shadow-sm"
          : "hover:bg-[color:var(--border-color)]/30 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
      )}
      onClick={handleSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      title={workspace.path}
    >
      <div className="flex items-center gap-2 overflow-hidden flex-1">
        <GitBranch 
          className={cn(
            "h-3 w-3 shrink-0", 
            workspace.isSelected ? "text-[color:var(--bg-body)]" : "text-[color:var(--text-tertiary)] group-hover:text-[color:var(--text-primary)]"
          )} 
        />

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
            className="flex-1 px-1.5 py-0.5 mt-0 text-xs font-mono rounded bg-[color:var(--bg-body)] border border-[color:var(--border-color)] focus:outline-none focus:border-[color:var(--text-primary)] text-[color:var(--text-primary)] transition-all"
          />
        ) : (
          <span className={cn(
            "flex-1 font-mono tracking-tight truncate", 
            workspace.isSelected && "font-semibold"
          )}>
            {workspace.name}
          </span>
        )}

        {workspace.isCurrent && (
          <span className={cn(
            "text-[9px] font-bold px-1.5 py-0.5 rounded-[3px] uppercase tracking-wider",
            workspace.isSelected 
              ? "bg-[color:var(--bg-body)]/20 text-[color:var(--bg-body)]" 
              : "bg-[color:var(--border-color)]/50 text-[color:var(--text-primary)]"
          )}>
            Git
          </span>
        )}
      </div>

      <div className={cn(
        "flex items-center gap-0.5 transition-opacity duration-300",
        showActions && !isEditing ? "opacity-100" : "opacity-0"
      )}>
        <button
          onClick={handleStartRename}
          disabled={isRenaming || isRemoving}
          className={cn(
            "p-1 rounded transition-colors disabled:opacity-50",
            workspace.isSelected 
              ? "hover:bg-[color:var(--bg-body)]/20 text-[color:var(--bg-body)]/70 hover:text-[color:var(--bg-body)]" 
              : "hover:bg-[color:var(--border-color)] text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]"
          )}
          title="Rename"
        >
          <Pencil className="h-3 w-3" />
        </button>
        <button
          onClick={handleRemove}
          disabled={isRemoving || isRenaming}
          className={cn(
            "p-1 rounded transition-colors disabled:opacity-50",
            workspace.isSelected 
              ? "hover:bg-red-500/20 text-[color:var(--bg-body)]/70 hover:text-red-300" 
              : "hover:bg-red-500/10 text-[color:var(--text-tertiary)] hover:text-red-500"
          )}
          title="Remove"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}
