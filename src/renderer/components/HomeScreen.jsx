import { FolderOpen } from 'lucide-react';
import { motion } from 'motion/react';
import Lottie from 'lottie-react';
import rippleAnimation from 'lottie-web/test/animations/ripple.json';
import { useEffect, useState, useCallback } from 'react';
import { useWorkspace } from '@context/WorkspaceContext';
import { Button } from '@components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@components/ui/card';

export function HomeScreen() {
  const { projects, activeScreen, addProjectFromPath, selectWorkspace, showAlert } = useWorkspace();
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
            title: 'Nenhum workspace',
            message: `O projeto "${project.name}" ainda não possui workspaces criados. Expanda o projeto na barra lateral para criar um.`,
            confirmText: 'Entendi'
          });
        }
      }
    } catch (error) {
      console.error('Erro ao carregar workspaces:', error);
      await showAlert({
        title: 'Erro',
        message: 'Não foi possível carregar os workspaces desse projeto.',
        confirmText: 'Fechar',
        variant: 'danger'
      });
    }
  };

  return (
    <div className="panel-grid relative flex-1 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(245,159,57,0.15),transparent_20%),radial-gradient(circle_at_80%_0%,rgba(56,189,248,0.12),transparent_24%)]" />
      <div className="relative flex h-full flex-col gap-4 overflow-auto px-6 pb-6 pt-6 scrollbar-thin">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="flex flex-col gap-4"
        >
          {/* Command Center Card — compacto */}
          <Card className="overflow-hidden">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr] items-center">
                <div className="space-y-4">
                  <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--border-color)] bg-[#eff6ff] dark:bg-white/5 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-[color:var(--primary-color)]">
                    <span className="h-2 w-2 rounded-full bg-[color:var(--primary-color)]" />
                    Command center
                  </div>
                  <div className="space-y-2">
                    <h1 className="font-display max-w-3xl text-2xl font-semibold tracking-[-0.04em] text-[color:var(--text-primary)] md:text-3xl">
                      Orquestre projetos, workspaces e sessões AI em uma única superfície operacional.
                    </h1>
                    <p className="max-w-2xl text-sm leading-6 text-[color:var(--text-secondary)]">
                      Contexto persistente, acesso rápido aos worktrees e sessões paralelas com Codex, Claude, Qwen e OpenCode.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button onClick={handleOpenProject}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Abrir repositório
                    </Button>
                    <Button variant="secondary" type="button">
                      {projects.length} projetos indexados
                    </Button>
                  </div>
                </div>
                <div className="relative flex min-h-[180px] items-center justify-center rounded-[16px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)]">
                  <div className="absolute inset-6 rounded-full border border-dashed border-[color:var(--border-color)]" />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent_36%)]" />
                  <Lottie animationData={rippleAnimation} loop className="h-full w-full max-w-[280px]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Projetos Recentes Card */}
          <Card className="flex flex-col overflow-hidden">
            <CardHeader className="rounded-t-[12px] border-b border-[color:var(--border-color)] bg-[color:var(--bg-surface)] py-4">
              <CardTitle className="text-[color:var(--text-primary)]">Projetos recentes</CardTitle>
              <CardDescription className="text-[color:var(--text-secondary)]">
                Atalhos persistentes para voltar ao contexto de trabalho sem reconfigurar providers ou workspaces.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 p-6">
              {projects.length === 0 && (
                <div className="rounded-[12px] border border-dashed border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-8 text-center">
                  <p className="font-display text-xl text-[color:var(--text-primary)]">Nenhum repositório conectado</p>
                  <p className="mt-2 text-[0.95rem] leading-6 text-[color:var(--text-secondary)]">
                    Abra uma pasta para começar a operar múltiplos workspaces e terminais a partir da sidebar.
                  </p>
                </div>
              )}

              <div className="grid gap-3 grid-cols-1">
                {projects.slice(0, 6).map((project, index) => (
                  <motion.div
                    key={project.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.14 + index * 0.06, duration: 0.35 }}
                    onClick={() => handleProjectClick(project)}
                    className="group rounded-[12px] border border-[color:var(--border-color)] bg-[color:var(--bg-body)] p-4 transition-colors hover:border-[color:var(--text-tertiary)] shadow-sm cursor-pointer"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[8px] bg-[#eff6ff] font-display text-base font-bold text-[color:var(--primary-color)] dark:bg-[color:var(--primary-color)]/10">
                        {project.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <p className="truncate font-semibold text-[color:var(--text-primary)]">{project.name}</p>
                          <span className="rounded-full border border-[color:var(--border-color)] bg-[color:var(--bg-surface)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[color:var(--text-tertiary)] group-hover:bg-[#eff6ff] group-hover:text-[color:var(--primary-color)] dark:group-hover:bg-white/5 transition-colors">
                            {workspaceCounts[project.id] ?? '—'} workspaces
                          </span>
                        </div>
                        <p className="mt-1 truncate text-[0.8rem] text-[color:var(--text-secondary)]">{project.path}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
