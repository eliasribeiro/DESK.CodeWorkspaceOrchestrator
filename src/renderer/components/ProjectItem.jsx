import { useState, useEffect } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { ChatItem } from './ChatItem';
import { WorkspaceItem } from './WorkspaceItem';
import { generateRandomName } from '@utils/nameGenerator';

/**
 * Componente ProjectItem
 * Item de projeto expansível na sidebar
 * 
 * @param {Object} props
 * @param {Object} props.project - Projeto a ser renderizado
 * @returns {JSX.Element} Item de projeto com lista de chats e workspaces
 */
export function ProjectItem({ project }) {
  const {
    toggleProjectExpanded,
    removeProject,
    addWorkspace,
    selectedChatId,
    selectedWorkspace,
    showConfirm,
    showAlert
  } = useWorkspace();
  
  const [showActions, setShowActions] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);
  const [isCreatingWorkspace, setIsCreatingWorkspace] = useState(false);
  const [showWorkspaces, setShowWorkspaces] = useState(false);

  /**
   * Carrega workspaces ao montar ou expandir projeto
   */
  useEffect(() => {
    if (project.isExpanded && project.path) {
      loadWorkspaces();
    }
  }, [project.isExpanded, project.path]);

  /**
   * Carrega lista de worktrees do projeto
   */
  const loadWorkspaces = async () => {
    try {
      const result = await window.electronAPI.git.listWorktrees({
        projectPath: project.path
      });
      
      if (result.success && result.worktrees) {
        // Filtra e formata workspaces (exclui o main e extrai nome da pasta)
        const formattedWorkspaces = result.worktrees
          .filter(wt => {
            // Extrai nome da pasta do worktree
            const pathParts = wt.path.split(/[/\\]/);
            const folderName = pathParts.pop();
            // Inclui apenas workspaces dentro de .cwo
            return pathParts[pathParts.length - 1] === '.cwo' && folderName !== '.cwo';
          })
          .map(wt => {
            const pathParts = wt.path.split(/[/\\]/);
            return {
              ...wt,
              name: pathParts.pop(), // Nome da pasta = nome do workspace
              isCurrent: wt.isCurrent
            };
          });
        
        setWorkspaces(formattedWorkspaces);
        setShowWorkspaces(formattedWorkspaces.length > 0);
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
    }
  };

  /**
   * Handler para clique no header do projeto
   */
  const handleHeaderClick = () => {
    toggleProjectExpanded(project.id);
  };

  /**
   * Handler para remover projeto
   */
  const handleRemove = async (e) => {
    e.stopPropagation();
    const shouldRemove = await showConfirm({
      title: 'Remover projeto?',
      message: `Tem certeza que deseja remover "${project.name}" e todos os seus chats?`,
      confirmText: 'Remover projeto',
      cancelText: 'Cancelar',
      variant: 'danger',
    });
    if (shouldRemove) {
      removeProject(project.id);
    }
  };

  /**
   * Handler para criar novo workspace
   */
  const handleCreateWorkspace = async () => {
    if (isCreatingWorkspace) return;

    setIsCreatingWorkspace(true);
    
    try {
      // Gera nome aleatório
      const workspaceName = generateRandomName({
        useSeparator: true,
        separator: '-',
        includeNumber: false
      });

      // Cria worktree
      const result = await window.electronAPI.git.createWorktree({
        projectPath: project.path,
        worktreeName: workspaceName
      });

      if (result.success) {
        // Adiciona workspace ao estado
        addWorkspace(project.id, {
          name: workspaceName,
          path: result.path,
          branch: result.branch,
          isCurrent: false
        });
        
        // Recarrega lista de workspaces
        await loadWorkspaces();
      } else {
        await showAlert({
          title: 'Erro ao criar workspace',
          message: result.error || 'Erro desconhecido',
          confirmText: 'Fechar',
          variant: 'danger',
        });
      }
    } catch (error) {
      console.error('Erro ao criar workspace:', error);
      await showAlert({
        title: 'Erro ao criar workspace',
        message: error.message || 'Erro desconhecido',
        confirmText: 'Fechar',
        variant: 'danger',
      });
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <li className="select-none w-full border-b border-slate-200/50 dark:border-white/10 last:border-b-0 py-1">
      {/* Header do Projeto */}
      <div
        className="group w-full min-h-9 flex items-center gap-1 px-3 text-sm rounded-[6px]
                    cursor-pointer transition-colors duration-150
                    hover:bg-white/10"
        onClick={handleHeaderClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        title={project.path}
      >
        {/* Ícone de expansão */}
        <button
          className="p-0.5 rounded text-slate-400 hover:text-white"
          aria-label={project.isExpanded ? 'Recolher' : 'Expandir'}
        >
          {project.isExpanded ? (
            <svg 
              className="w-3.5 h-3.5 rotate-90"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg 
              className="w-3.5 h-3.5"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          )}
        </button>

        {/* Nome do Projeto */}
        <span className="flex-1 text-[0.95rem] font-medium text-slate-200 truncate">
          {project.name}
        </span>

        {/* Ações do Projeto */}
        <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          {/* Remover */}
          <button
            onClick={handleRemove}
            className="p-1 rounded-[6px] text-slate-400 hover:bg-[color:var(--danger-color)] hover:text-white"
            title="Remover"
            aria-label="Remover projeto"
          >
            <svg className="w-3.5 h-3.5" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Lista de Chats */}
      {project.isExpanded && project.chats.length > 0 && (
        <ul className="mt-1 space-y-0.5">
          {project.chats.map(chat => (
            <ChatItem 
              key={chat.id} 
              chat={chat} 
              projectId={project.id}
              isSelected={selectedChatId === chat.id}
            />
          ))}
        </ul>
      )}

      {/* Seção de Workspaces */}
      {project.isExpanded && (
        <div className="mt-2">
          <button
            onClick={handleCreateWorkspace}
            disabled={isCreatingWorkspace}
            className="w-full min-h-9 flex items-center gap-2 px-3 text-sm font-medium
                       text-slate-300
                       hover:bg-white/5
                       rounded-md transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            title="Criar novo workspace com git worktree"
          >
            {isCreatingWorkspace ? (
              <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" 
                        stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" 
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            )}
            <span className="font-medium">Novo workspace</span>
          </button>

          {/* Lista de workspaces */}
          {workspaces.length > 0 && (
            <ul className="mt-1 space-y-0.5">
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
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
