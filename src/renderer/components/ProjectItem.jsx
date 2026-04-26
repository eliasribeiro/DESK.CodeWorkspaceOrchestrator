import { useState, useEffect } from 'react';
import { ChevronRight, Folder, GitBranch, Terminal, Trash2 } from 'lucide-react';
import { useWorkspace } from '@context/WorkspaceContext';
import { WorkspaceItem } from './WorkspaceItem';
import { generateRandomName } from '@utils/nameGenerator';
import { cn } from '@lib/utils';

export function ProjectItem({ project }) {
  const {
    toggleProjectExpanded,
    removeProject,
    addWorkspace,
    selectWorkspace,
    selectedWorkspace,
    showConfirm,
    showAlert
  } = useWorkspace();
  
  const [showActions, setShowActions] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);

  useEffect(() => {
    if (project.isExpanded && project.path) {
      loadWorkspaces();
    }
  }, [project.isExpanded, project.path]);

  const loadWorkspaces = async () => {
    try {
      const result = await window.electronAPI.git.listWorktrees({
        projectPath: project.path
      });
      
      if (result.success && result.worktrees) {
        const formattedWorkspaces = result.worktrees
          .filter(wt => {
            const pathParts = wt.path.split(/[/\\]/);
            const folderName = pathParts.pop();
            return pathParts[pathParts.length - 1] === '.cwo' && folderName !== '.cwo';
          })
          .map(wt => {
            const pathParts = wt.path.split(/[/\\]/);
            return {
              ...wt,
              name: pathParts.pop(),
              isCurrent: wt.isCurrent
            };
          });
        
        setWorkspaces(formattedWorkspaces);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    }
  };

  const handleHeaderClick = () => {
    toggleProjectExpanded(project.id);
  };

  const handleRemove = async (e) => {
    e.stopPropagation();
    const shouldRemove = await showConfirm({
      title: 'Remove repository?',
      message: `Are you sure you want to remove "${project.name}" from the list?`,
      confirmText: 'Remove',
      cancelText: 'Cancel',
      variant: 'danger',
    });
    if (shouldRemove) {
      removeProject(project.id);
    }
  };

  const handleCreateWorkspace = async (e) => {
    e.stopPropagation();
    if (isCreatingWorkspace) return;
    setIsCreatingWorkspace(true);
    
    try {
      const workspaceName = generateRandomName({
        useSeparator: true,
        separator: '-',
        includeNumber: false
      });

      const result = await window.electronAPI.git.createWorktree({
        projectPath: project.path,
        worktreeName: workspaceName
      });

      if (result.success) {
        addWorkspace(project.id, {
          name: workspaceName,
          path: result.path,
          branch: result.branch,
          isCurrent: false
        });
        await loadWorkspaces();
      } else {
        await showAlert({
          title: 'Workspace creation failed',
          message: result.error || 'Unknown error',
          confirmText: 'Dismiss',
          variant: 'danger',
        });
      }
    } catch (error) {
      await showAlert({
        title: 'Workspace creation failed',
        message: error.message || 'Unknown error',
        confirmText: 'Dismiss',
        variant: 'danger',
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  const handleOpenProjectRoot = (e) => {
    e.stopPropagation();
    selectWorkspace(project.id, {
      name: project.name,
      path: project.path,
      branch: '',
      isCurrent: true,
      isProjectRoot: true,
    });
  };

  return (
    <li className="select-none w-full border-b border-[color:var(--border-color)] last:border-b-0 py-1.5 transition-colors">
      {/* Header do Projeto */}
      <div
        className={cn(
          "group w-full min-h-10 flex items-center justify-between px-3 rounded-lg cursor-pointer transition-all duration-300",
          project.isExpanded ? "bg-[color:var(--border-color)]/30" : "hover:bg-[color:var(--border-color)]/30"
        )}
        onClick={handleHeaderClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        title={project.path}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          <ChevronRight 
            className={cn(
              "h-3.5 w-3.5 shrink-0 text-[color:var(--text-tertiary)] transition-transform duration-300", 
              project.isExpanded && "rotate-90 text-[color:var(--text-primary)]"
            )} 
          />
          <Folder className="h-4 w-4 shrink-0 text-[color:var(--text-secondary)]" />
          <span className="truncate text-sm font-medium tracking-tight text-[color:var(--text-primary)] drop-shadow-sm font-display">
            {project.name}
          </span>
        </div>

        {/* Ações do Projeto */}
        <div className={cn(
          "flex items-center gap-0.5 transition-opacity duration-300",
          showActions ? "opacity-100" : "opacity-0"
        )}>
          <button
            onClick={handleOpenProjectRoot}
            className="p-1.5 rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)] hover:text-[color:var(--text-primary)] transition-colors"
            title="Abrir raiz do projeto"
          >
            <Terminal className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleCreateWorkspace}
            disabled={isCreatingWorkspace}
            className="p-1.5 rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--border-color)] hover:text-[color:var(--text-primary)] transition-colors disabled:opacity-50"
            title="Create new workspace"
          >
            <GitBranch className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={handleRemove}
            className="p-1.5 rounded-md text-[color:var(--text-secondary)] hover:bg-[color:var(--danger-color)]/20 hover:text-[color:var(--danger-color)] transition-colors"
            title="Remove project"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {project.isExpanded && (
        <div className="mt-1.5 flex flex-col gap-0.5 pl-[26px]">
          {workspaces.map(workspace => (
            <WorkspaceItem
              key={workspace.name}
              workspace={{
                ...workspace,
                isSelected: selectedWorkspace?.workspace?.name === workspace.name && 
                           selectedWorkspace?.projectId === project.id
              }}
              projectId={project.id}
              projectPath={project.path}
              onDeleted={loadWorkspaces}
              onRenamed={loadWorkspaces}
            />
          ))}
          {workspaces.length === 0 && (
            <div className="py-2 px-2 text-xs font-mono text-[color:var(--text-tertiary)] flex items-center justify-between group">
              <span>No active workspaces</span>
              <button 
                onClick={handleCreateWorkspace}
                className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-[color:var(--text-primary)]"
              >
                + Create
              </button>
            </div>
          )}
        </div>
      )}
    </li>
  );
}
