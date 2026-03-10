import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente ChatItem
 * Item de chat dentro de um projeto
 * 
 * @param {Object} props
 * @param {Object} props.chat - Chat a ser renderizado
 * @param {string} props.projectId - ID do projeto pai
 * @param {boolean} props.isSelected - Se o chat está selecionado
 * @returns {JSX.Element} Item de chat
 */
export function ChatItem({ chat, projectId, isSelected }) {
  const { selectChat, removeChat, renameChat } = useWorkspace();
  
  const [showActions, setShowActions] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(chat.name);

  /**
   * Handler para selecionar chat
   */
  const handleSelect = () => {
    selectChat(chat.id);
  };

  /**
   * Handler para iniciar edição
   */
  const startEditing = (e) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditName(chat.name);
  };

  /**
   * Handler para salvar edição
   */
  const saveEdit = () => {
    if (editName.trim()) {
      renameChat(projectId, chat.id, editName.trim());
    } else {
      setEditName(chat.name);
    }
    setIsEditing(false);
  };

  /**
   * Handler para cancelar edição
   */
  const cancelEdit = () => {
    setEditName(chat.name);
    setIsEditing(false);
  };

  /**
   * Handler para tecla Enter/Escape
   */
  const handleEditKeyDown = (e) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  /**
   * Handler para remover chat
   */
  const handleRemove = (e) => {
    e.stopPropagation();
    if (confirm(`Tem certeza que deseja remover "${chat.name}"?`)) {
      removeChat(projectId, chat.id);
    }
  };

  return (
    <li
      className={`group w-full min-h-9 flex items-center gap-2 px-3 text-sm rounded-md
                  cursor-pointer transition-colors duration-150
                  ${isSelected 
                    ? 'bg-slate-200 dark:bg-white/10 border-l-2 border-slate-900 dark:border-white' 
                    : 'hover:bg-slate-100 dark:hover:bg-white/5 border-l-2 border-transparent'}`}
      onClick={handleSelect}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Ícone do Chat */}
      <svg 
        className={`w-4 h-4 flex-shrink-0 ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}
        fill="none" 
        viewBox="0 0 24 24" 
        stroke="currentColor" 
        strokeWidth="2"
      >
        <path strokeLinecap="round" strokeLinejoin="round" 
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>

      {/* Nome do Chat */}
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
                     bg-white dark:bg-surface-dark
                     border border-border-light dark:border-white/10
                     focus:outline-none focus:ring-1 focus:ring-primary-light
                     text-slate-900 dark:text-slate-100"
        />
      ) : (
        <span className={`flex-1 text-sm truncate ${isSelected ? 'font-medium text-black dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
          {chat.name}
        </span>
      )}

      {/* Ações do Chat */}
      <div className={`flex items-center gap-0.5 ${showActions ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
        {/* Renomear */}
        <button
          onClick={startEditing}
          className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-white/10"
          title="Renomear"
          aria-label="Renomear chat"
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
          className="p-1 rounded-md hover:bg-red-500 hover:text-white"
          title="Remover"
          aria-label="Remover chat"
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
