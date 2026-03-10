import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente HomeScreen
 * Tela inicial com cards de ações rápidas
 * 
 * @returns {JSX.Element} Tela inicial
 */
export function HomeScreen() {
  const { projects, addProjectFromPath } = useWorkspace();

  /**
   * Handler para abrir projeto existente
   */
  const handleOpenProject = async () => {
    const folderPath = await window.electronAPI.dialog.openDirectory();
    if (folderPath) {
      addProjectFromPath(folderPath);
    }
  };

  /**
   * Handler para clonar repositório
   */
  const handleClone = () => {
    // Será tratado pelo componente pai via evento
    const event = new CustomEvent('open-clone-modal');
    window.dispatchEvent(event);
  };

  return (
    <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark p-8">
      <div className="w-full h-full max-w-none flex flex-col justify-center">
        {/* Cabeçalho */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Code Workspace Orchestrator
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            Gerencie seus projetos e chats em um só lugar
          </p>
        </div>

        {/* Cards de ação */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Card: Open Project */}
          <button
            onClick={handleOpenProject}
            className="group p-8 rounded-2xl bg-surface-light dark:bg-surface-dark 
                       border border-slate-200 dark:border-slate-700
                       hover:border-slate-700 dark:hover:border-slate-600
                       hover:shadow-xl hover:shadow-slate-700/10
                       transition-all duration-200
                       text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-200 dark:bg-slate-800/30 
                            flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-200">
              <svg className="w-7 h-7 text-slate-900 dark:text-white" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Open Project
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Abra uma pasta existente como projeto
            </p>
          </button>

          {/* Card: Clone from URL */}
          <button
            onClick={handleClone}
            className="group p-8 rounded-2xl bg-surface-light dark:bg-surface-dark 
                       border border-slate-200 dark:border-slate-700
                       hover:border-slate-800 dark:hover:border-slate-400
                       hover:shadow-xl hover:shadow-slate-800/10
                       transition-all duration-200
                       text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-800/20 
                            flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-200">
              <svg className="w-7 h-7 text-black dark:text-white" 
                   fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" 
                      d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H2a2 2 0 01-2-2V5a2 2 0 012-2h6" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
              Clone from URL
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Clone um repositório Git remoto
            </p>
          </button>
        </div>

        {/* Projetos recentes */}
        {projects.length > 0 && (
          <div className="mt-12">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
              Projetos Recentes
            </h2>
            <div className="space-y-2">
              {projects.slice(0, 5).map(project => (
                <div
                  key={project.id}
                  className="flex items-center gap-3 p-3 rounded-lg 
                             bg-surface-light dark:bg-surface-dark
                             border border-slate-200 dark:border-slate-700"
                >
                  <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-800 
                                  flex items-center justify-center flex-shrink-0 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-600 dark:text-slate-400 text-xs font-bold">
                      {project.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {project.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                      {project.path}
                    </p>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500">
                    {project.chats.length} chats
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
