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
    renameProject,
    addChat,
    addWorkspace,
    selectedChatId,
    selectedWorkspace
  } = useWorkspace();
  
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(project.name);
  const [showNewChatInput, setShowNewChatInput] = useState(false);
  const [newChatName, setNewChatName] = useState('');
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
   * Handler para iniciar edição do nome
   */
  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(project.name);
  };

  /**
   * Handler para salvar edição
   */
  const saveEdit = () => {
    if (editName.trim()) {
      renameProject(project.id, editName.trim());
    } else {
      setEditName(project.name);
    }
    setIsEditing(false);
  };

  /**
   * Handler para cancelar edição
   */
  const cancelEdit = () => {
    setEditName(project.name);
    setIsEditing(false);
  };

  /**
   * Handler para tecla Enter/Escape na edição
   */
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  /**
   * Handler para remover projeto
   */
  const handleRemove = (e) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja remover "${project.name}" e todos os seus chats?`)) {
      removeProject(project.id);
    }
  };

  /**
   * Handler para criar novo chat
   */
  const handleCreateChat = () => {
    if (newChatName.trim()) {
      addChat(project.id, newChatName.trim());
      setNewChatName('');
      setShowNewChatInput(false);
    }
  };

  /**
   * Handler para tecla Enter/Escape no input de chat
   */
  const handleChatKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCreateChat();
    } else if (e.key === 'Escape') {
      setShowNewChatInput(false);
      setNewChatName('');
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
        alert(`Erro ao criar workspace: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao criar workspace:', error);
      alert(`Erro ao criar workspace: ${error.message}`);
    } finally {
      setIsCreatingWorkspace(false);
    }
  };

  return (
    <li className="select-none">
      {/* Header do Projeto */}
      <div
        className={`group flex items-center gap-1 px-2 py-2 mx-2 rounded-lg
                    cursor-pointer transition-colors duration-150
                    ${project.isExpanded 
                      ? 'bg-slate-100 dark:bg-slate-800' 
                      : 'hover:bg-slate-100 dark:hover:bg-slate-800'}`}
        onClick={handleHeaderClick}
        onMouseEnter={() => setShowActions(true)}
        onMouseLeave={() => setShowActions(false)}
        title={project.path}
      >
        {/* Ícone de expansão */}
        <button
          className="p-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
          aria-label={project.isExpanded ? 'Recolher' : 'Expandir'}
        >
          {project.isExpanded ? (
            <svg 
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400 rotate-90"
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <svg 
              className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400"
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
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={saveEdit}
            onKeyDown={handleEditKeyDown}
            onClick={(e) => e.stopPropagation()}
            autoFocus
            className="flex-1 px-1 py-0.5 text-sm rounded
                       bg-white dark:bg-slate-700
                       border border-slate-300 dark:border-slate-600
                       focus:outline-none focus:ring-1 focus:ring-slate-700
                       text-slate-900 dark:text-slate-100"
          />
        ) : (
          <span className="flex-1 text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
            {project.name}
          </span>
        )}

        {/* Ações do Projeto */}
        <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
          {/* Adicionar Chat */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowNewChatInput(true);
            }}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Novo Chat"
            aria-label="Adicionar chat"
          >
            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Renomear */}
          <button
            onClick={startEditing}
            className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700"
            title="Renomear"
            aria-label="Renomear projeto"
          >
            <svg className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Remover */}
          <button
            onClick={handleRemove}
            className="p-1 rounded hover:bg-red-500 hover:text-white"
            title="Remover"
            aria-label="Remover projeto"
          >
            <svg className="w-3.5 h-3.5" 
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" 
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Input para novo chat */}
      {showNewChatInput && (
        <div className="px-2 py-1 ml-4">
          <input
            type="text"
            value={newChatName}
            onChange={(e) => setNewChatName(e.target.value)}
            onKeyDown={handleChatKeyDown}
            onBlur={() => {
              if (!newChatName.trim()) {
                setShowNewChatInput(false);
              }
            }}
            placeholder="Nome do chat..."
            autoFocus
            className="w-full px-2 py-1 text-sm rounded
                       bg-white dark:bg-slate-800
                       border border-slate-300 dark:border-slate-600
                       focus:outline-none focus:ring-1 focus:ring-slate-700
                       text-slate-900 dark:text-slate-100
                       placeholder-slate-400"
          />
        </div>
      )}

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
        <div className="mt-2 ml-4">
          <button
            onClick={handleCreateWorkspace}
            disabled={isCreatingWorkspace}
            className="flex items-center gap-2 px-2 py-1.5 text-xs
                       text-slate-900 dark:text-slate-600
                       hover:bg-slate-100 dark:hover:bg-slate-800/20
                       rounded transition-colors
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
            <span className="font-medium">New workspace</span>
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
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </li>
  );
}
