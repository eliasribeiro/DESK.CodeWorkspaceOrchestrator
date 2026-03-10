import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente da barra lateral direita (Secundária)
 * Área limpa conforme solicitado.
 */
export function SecondarySidebar() {
  const { selectedWorkspace } = useWorkspace();

  return (
    <aside className="h-full flex flex-col bg-background-light dark:bg-[#161111] border-l border-slate-200 dark:border-slate-800 overflow-hidden">
      {/* Área vazia */}
    </aside>
  );
}
