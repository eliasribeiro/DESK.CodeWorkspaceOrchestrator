import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

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
export function WorkspaceItem({ workspace, projectId, projectPath, onDeleted }) {
  const { removeWorkspace, selectWorkspace } = useWorkspace();
  const [showActions, setShowActions] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  /**
   * Handler para remover workspace
   */
  const handleRemove = async (e) => {
    e.stopPropagation();
    
    if (isRemoving) return;
    
    if (!confirm(`Tem certeza que deseja remover o workspace "${workspace.name}"?`)) {
      return;
    }

    setIsRemoving(true);
    
    try {
      const result = await window.electronAPI.git.removeWorktree({
        projectPath,
        worktreePath: workspace.path
      });
      
      if (result.success) {
        // Se este era o workspace selecionado, limpar seleção
        if (workspace.isSelected) {
          selectWorkspace(null, null);
        }
        
        removeWorkspace(projectId, workspace.name);
        if (onDeleted) onDeleted();
      } else {
        throw new Error(result.error || 'Erro desconhecido');
      }
    } catch (error) {
      console.error('Erro ao remover workspace:', error);
      alert(`Erro ao remover workspace: ${error.message}`);
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

  return (
    <li
      className={`group flex items-center gap-2 px-2 py-1.5 mx-2 rounded-lg
                  cursor-pointer transition-colors duration-150
                  hover:bg-slate-100 dark:hover:bg-slate-800 border-l-2 
                  ${workspace.isSelected
                    ? 'border-slate-900 dark:border-white bg-slate-100 dark:bg-slate-800/20' 
                    : 'border-transparent'}`}
      onClick={handleSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      title={workspace.path}
    >
      {/* Ícone do Workspace (Branch) */}
      <svg 
        className={`w-4 h-4 flex-shrink-0 ${workspace.isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
        viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      >
        <line x1="6" y1="3" x2="6" y2="15"></line>
        <circle cx="18" cy="6" r="3"></circle>
        <circle cx="6" cy="18" r="3"></circle>
        <path d="M18 9a9 9 0 0 1-9 9"></path>
      </svg>

      {/* Nome do Workspace */}
      <span className={`flex-1 text-sm truncate ${workspace.isSelected ? 'font-medium text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
        {workspace.name}
      </span>

      {/* Indicador de workspace atual */}
      {workspace.isCurrent && (
        <span className="text-xs text-slate-700 dark:text-slate-400 font-medium mr-1">
          Git
        </span>
      )}

      {/* Ações do Workspace */}
      <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        {/* Remover */}
        <button
          onClick={handleRemove}
          disabled={isRemoving}
          className="p-1 rounded hover:bg-red-500 hover:text-white
                     disabled:opacity-50 disabled:cursor-not-allowed"
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
