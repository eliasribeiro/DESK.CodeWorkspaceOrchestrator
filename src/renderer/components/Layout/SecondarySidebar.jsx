import { useWorkspace } from '@context/WorkspaceContext';

/**
 * Componente da barra lateral direita (Secundária)
 * Área limpa conforme solicitado.
 */
export function SecondarySidebar() {
  const { selectedWorkspace } = useWorkspace();

  return (
    <aside className="h-full flex flex-col bg-background-light dark:bg-background-dark border-l border-border-light dark:border-white/5 overflow-hidden">
      {/* Área vazia */}
    </aside>
  );
}
