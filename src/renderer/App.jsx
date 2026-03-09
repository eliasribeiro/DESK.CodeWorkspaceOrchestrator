import { useState, useCallback } from 'react';
import { TitleBar } from './components/TitleBar';
import { ResizableLayout } from './components/Layout/ResizableLayout';
import './styles/index.css';

/**
 * Componente principal da aplicação
 * Gerencia o estado global do layout e seleção de projeto.
 */
function App() {
  // Estado para controle de visibilidade das sidebars
  const [showPrimary, setShowPrimary] = useState(true);
  const [showSecondary, setShowSecondary] = useState(false);
  
  // Estado para o caminho do projeto selecionado
  const [projectPath, setProjectPath] = useState(null);

  /**
   * Abre o diálogo do sistema para selecionar uma pasta de projeto
   */
  const handleSelectProject = useCallback(async () => {
    // Check if API exists
    if (!window.electronAPI?.dialog?.openDirectory) {
      console.error('Electron API not available');
      return;
    }

    try {
      const path = await window.electronAPI.dialog.openDirectory();
      if (path) {
        setProjectPath(path);
      }
    } catch (error) {
      console.error('Erro ao selecionar diretório:', error);
    }
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen bg-background-light dark:bg-background-dark overflow-hidden">
      {/* Barra de título customizada com controles de layout */}
      <TitleBar 
        showPrimary={showPrimary}
        onTogglePrimary={() => setShowPrimary(prev => !prev)}
        showSecondary={showSecondary}
        onToggleSecondary={() => setShowSecondary(prev => !prev)}
      />

      {/* Área Principal com Layout Redimensionável */}
      <main className="flex-1 flex flex-col overflow-hidden min-h-0">
        <ResizableLayout 
          showPrimary={showPrimary}
          showSecondary={showSecondary}
          projectPath={projectPath}
          onSelectProject={handleSelectProject}
        />
      </main>

      {/* Barra de status inferior */}
      <footer className="h-6 px-3 flex items-center justify-between 
                         bg-surface-light dark:bg-surface-dark
                         border-t border-slate-200 dark:border-slate-800
                         text-[10px] text-slate-500 dark:text-slate-500 select-none flex-shrink-0">
        <div className="flex items-center gap-4 overflow-hidden">
          <span className="flex items-center gap-1.5 flex-shrink-0">
            <div className={`w-2 h-2 rounded-full ${projectPath ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-300 dark:bg-slate-700'}`} />
            {projectPath ? 'Projeto Ativo' : 'Nenhum Projeto'}
          </span>
          {projectPath && <span className="font-mono opacity-80 truncate" title={projectPath}>{projectPath}</span>}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span>UTF-8</span>
          <span>v1.0.0</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
