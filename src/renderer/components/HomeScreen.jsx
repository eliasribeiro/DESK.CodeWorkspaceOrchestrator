import { FolderOpen, Terminal } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';

export function HomeScreen() {
  const { projects, activeScreen, addProjectFromPath, selectWorkspace, showAlert, t } = useWorkspace();
  const [workspaceCounts, setWorkspaceCounts] = useState({});

  const fetchWorkspaceCounts = useCallback(async () => {
    if (!projects.length) return;

    const counts = {};
    await Promise.all(
      projects.map(async (project) => {
        try {
          const result = await window.electronAPI.git.listWorktrees({ projectPath: project.path });
          if (result.success && result.worktrees) {
            const ws = result.worktrees.filter(wt => {
              const pathParts = wt.path.split(/[/\\]/);
              const folderName = pathParts.pop();
              return pathParts[pathParts.length - 1] === '.cwo' && folderName !== '.cwo';
            });
            counts[project.id] = ws.length;
          } else {
            counts[project.id] = 0;
          }
        } catch {
          counts[project.id] = 0;
        }
      })
    );
    setWorkspaceCounts(counts);
  }, [projects]);

  useEffect(() => {
    if (activeScreen === 'home') {
      fetchWorkspaceCounts();
    }
  }, [activeScreen, fetchWorkspaceCounts]);

  const handleOpenProject = async () => {
    const folderPath = await window.electronAPI.dialog.openDirectory();
    if (folderPath) {
      addProjectFromPath(folderPath);
    }
  };

  const handleProjectClick = async (project) => {
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
              name: pathParts.pop()
            };
          });

        if (formattedWorkspaces.length > 0) {
          selectWorkspace(project.id, formattedWorkspaces[0]);
        } else {
          await showAlert({
            title: t('home.noWorkspace'),
            message: t('home.noWorkspaceDescription', { name: project.name }),
            confirmText: t('home.gotIt')
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      await showAlert({
        title: t('home.error'),
        message: t('home.loadWorkspacesError'),
        confirmText: t('home.close'),
        variant: 'danger'
      });
    }
  };

  return (
    <div className="relative flex-1 overflow-auto bg-[color:var(--bg-body)] scrollbar-thin">
      <div className="mx-auto max-w-5xl px-8 py-12 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.23, 1, 0.32, 1] }}
          className="flex flex-col gap-16"
        >
          {/* Header Section */}
          <div className="flex flex-col gap-6 max-w-2xl">
            <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight text-[color:var(--text-primary)]">
              {t('home.titlePart1')}<br />{t('home.titlePart2')}
            </h1>
            <p className="text-lg leading-relaxed text-[color:var(--text-secondary)]">
              {t('home.description')}
            </p>
            <div className="flex items-center gap-4 pt-4">
              <button 
                onClick={handleOpenProject}
                className="inline-flex h-11 items-center justify-center rounded-full bg-[color:var(--text-primary)] px-6 text-sm font-medium text-[color:var(--bg-body)] transition-transform hover:scale-105"
              >
                <FolderOpen className="mr-2 h-4 w-4" />
                {t('home.openRepository')}
              </button>
              <div className="text-sm font-medium text-[color:var(--text-tertiary)]">
                {t('home.indexedProjects', { count: projects.length })}
              </div>
            </div>
          </div>

          {/* Projects List */}
            <div className="flex flex-col gap-6 border-t border-[color:var(--border-color)] pt-12">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-medium tracking-tight text-[color:var(--text-primary)]">{t('home.recentProjects')}</h2>
            </div>

            {projects.length === 0 ? (
              <div className="flex min-h-[200px] flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border-color)] bg-[color:var(--bg-surface)] p-8 text-center">
                <Terminal className="mb-4 h-8 w-8 text-[color:var(--text-tertiary)]" />
                <p className="font-display text-lg tracking-tight text-[color:var(--text-primary)]">{t('home.noProjects')}</p>
                <p className="mt-2 text-sm text-[color:var(--text-secondary)] max-w-md">
                  {t('home.noProjectsDescription')}
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {projects.slice(0, 6).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                    onClick={() => handleProjectClick(project)}
                    className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] p-6 transition-all hover:border-[color:var(--text-tertiary)] hover:shadow-sm cursor-pointer"
                  >
                    <div className="mb-8">
                      <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--text-primary)] font-display text-lg font-medium text-[color:var(--bg-body)]">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <h3 className="truncate font-display text-lg font-medium tracking-tight text-[color:var(--text-primary)]">
                        {project.name}
                      </h3>
                      <p className="mt-1 truncate text-xs text-[color:var(--text-tertiary)] font-mono">
                        {project.path}
                      </p>
                    </div>
                    <div className="flex items-center justify-between border-t border-[color:var(--border-color)] pt-4">
                      <span className="text-sm font-medium text-[color:var(--text-secondary)]">
                        {t('home.workspacesCount', { count: workspaceCounts[project.id] ?? '0' })}
                      </span>
                      <span className="text-[color:var(--text-primary)] opacity-0 transition-opacity group-hover:opacity-100">&rarr;</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
