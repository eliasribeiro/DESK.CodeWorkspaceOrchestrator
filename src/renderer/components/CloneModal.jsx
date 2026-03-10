import { useState } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente CloneModal
 * Modal para clonar repositório Git
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Se o modal está aberto
 * @param {Function} props.onClose - Callback para fechar modal
 * @returns {JSX.Element} Modal de clone
 */
export function CloneModal({ isOpen, onClose }) {
  const { addProjectFromPath } = useWorkspace();
  const [gitUrl, setGitUrl] = useState('');
  const [folderPath, setFolderPath] = useState('');
  const [isCloning, setIsCloning] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Handler para selecionar pasta de destino
   */
  const handleSelectFolder = async () => {
    const path = await window.electronAPI.dialog.openDirectory();
    if (path) {
      setFolderPath(path);
      setError('');
    }
  };

  /**
   * Handler para clonar repositório
   */
  const handleClone = async () => {
    setError('');
    setSuccess('');

    // Validações
    if (!gitUrl.trim()) {
      setError('Digite a URL do repositório Git');
      return;
    }

    if (!folderPath) {
      setError('Selecione a pasta de destino');
      return;
    }

    // Valida URL básica
    const gitUrlPattern = /^(https:\/\/|git@|ssh:\/\/)/;
    if (!gitUrlPattern.test(gitUrl)) {
      setError('URL do Git inválida. Use https://, git@ ou ssh://');
      return;
    }

    setIsCloning(true);

    try {
      const result = await window.electronAPI.git.clone({
        url: gitUrl.trim(),
        path: folderPath,
      });

      if (result.success) {
        setSuccess(`Repositório clonado com sucesso em ${result.path}`);
        // Adiciona projeto ao workspace
        addProjectFromPath(result.path);
        
        // Fecha modal após 1.5s
        setTimeout(() => {
          onClose();
          setGitUrl('');
          setFolderPath('');
          setSuccess('');
        }, 1500);
      } else {
        setError(result.error || 'Erro ao clonar repositório');
      }
    } catch (err) {
      setError(err.message || 'Erro ao clonar repositório');
    } finally {
      setIsCloning(false);
    }
  };

  /**
   * Handler para fechar modal
   */
  const handleClose = () => {
    setGitUrl('');
    setFolderPath('');
    setError('');
    setSuccess('');
    onClose();
  };

  /**
   * Handler para tecla Enter
   */
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !isCloning) {
      handleClone();
    } else if (e.key === 'Escape') {
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl
                   bg-white dark:bg-slate-900
                   border border-slate-200 dark:border-slate-700
                   shadow-2xl"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800/20 
                            flex items-center justify-center">
              <svg className="w-5 h-5 text-black dark:text-slate-400" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H2a2 2 0 01-2-2V5a2 2 0 012-2h6" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Clone from URL
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 
                       transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5 text-slate-500 dark:text-slate-400" 
                 fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Campo: URL do Git */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Git URL
            </label>
            <input
              type="text"
              value={gitUrl}
              onChange={(e) => setGitUrl(e.target.value)}
              placeholder="https://github.com/user/repo.git"
              disabled={isCloning || success}
              className="w-full px-4 py-2.5 rounded-lg
                         bg-white dark:bg-slate-800
                         border border-slate-300 dark:border-slate-600
                         focus:outline-none focus:ring-2 focus:ring-slate-800
                         text-slate-900 dark:text-slate-100
                         placeholder-slate-400"
            />
          </div>

          {/* Campo: Pasta de destino */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Pasta de Destino
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={folderPath}
                readOnly
                placeholder="Selecione uma pasta..."
                disabled={isCloning || success}
                className="flex-1 px-4 py-2.5 rounded-lg
                           bg-slate-100 dark:bg-slate-800
                           border border-slate-300 dark:border-slate-600
                           text-slate-900 dark:text-slate-100
                           placeholder-slate-400 cursor-pointer"
                onClick={handleSelectFolder}
              />
              <button
                onClick={handleSelectFolder}
                disabled={isCloning || success}
                className="px-4 py-2.5 rounded-lg
                           bg-slate-200 dark:bg-slate-700
                           hover:bg-slate-300 dark:hover:bg-slate-600
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-colors"
                aria-label="Selecionar pasta"
              >
                <svg className="w-5 h-5 text-slate-600 dark:text-slate-300" 
                     fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Mensagens de erro/sucesso */}
          {error && (
            <div className="p-3 rounded-lg bg-red-100 dark:bg-red-900/30 
                            border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800/20 
                            border border-slate-200 dark:border-slate-700">
              <p className="text-sm text-slate-700 dark:text-slate-400">{success}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={handleClose}
            disabled={isCloning}
            className="px-5 py-2.5 rounded-lg
                       bg-slate-200 dark:bg-slate-700
                       hover:bg-slate-300 dark:hover:bg-slate-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-slate-700 dark:text-slate-300 font-medium
                       transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleClone}
            disabled={isCloning || success}
            className="px-5 py-2.5 rounded-lg
                       bg-black hover:bg-slate-900
                       disabled:opacity-50 disabled:cursor-not-allowed
                       text-white font-medium
                       transition-colors flex items-center gap-2"
          >
            {isCloning ? (
              <>
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" 
                          stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" 
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Clonando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" 
                        d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H2a2 2 0 01-2-2V5a2 2 0 012-2h6" />
                </svg>
                Clonar
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
