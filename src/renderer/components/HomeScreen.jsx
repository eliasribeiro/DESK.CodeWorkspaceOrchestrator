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
        <div className="grid grid-cols-1 gap-6 w-full">
          {/* Card: Open Project */}
          <button
            onClick={handleOpenProject}
            className="group p-8 rounded-2xl bg-surface-light dark:bg-surface-dark 
                       border border-border-light dark:border-white/5
                       hover:border-primary-light dark:hover:border-white/20
                       hover:shadow-lg hover:shadow-primary-light/5 dark:hover:shadow-white/5
                       transition-all duration-200
                       text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-white/5 
                            flex items-center justify-center mb-4
                            group-hover:scale-110 transition-transform duration-200">
              <svg className="w-7 h-7 text-primary-light dark:text-white" 
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
                             border border-border-light dark:border-white/5
                             hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-white/5 
                                  flex items-center justify-center flex-shrink-0 border border-border-light dark:border-white/5">
                    <span className="text-slate-600 dark:text-slate-300 text-xs font-bold">
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
