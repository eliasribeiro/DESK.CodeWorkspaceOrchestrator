import { useState, useCallback, useRef, useEffect } from 'react';
import { PrimarySidebar } from './PrimarySidebar';
import { MainWorkspace } from './MainWorkspace';
import { SecondarySidebar } from './SecondarySidebar';

/**
 * Componente que gerencia o layout principal com colunas redimensionáveis.
 */
export function ResizableLayout({ 
  showPrimary, 
  showSecondary, 
  projectPath, 
  onSelectProject 
}) {
  // Larguras iniciais em pixels
  const [primaryWidth, setPrimaryWidth] = useState(260);
  const [secondaryWidth, setSecondaryWidth] = useState(300);
  
  const isResizingPrimary = useRef(false);
  const isResizingSecondary = useRef(false);

  const startResizingPrimary = useCallback(() => {
    isResizingPrimary.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('select-none');
  }, []);

  const startResizingSecondary = useCallback(() => {
    isResizingSecondary.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.classList.add('select-none');
  }, []);

  const stopResizing = useCallback(() => {
    isResizingPrimary.current = false;
    isResizingSecondary.current = false;
    document.body.style.cursor = 'default';
    document.body.classList.remove('select-none');
  }, []);

  const resize = useCallback((e) => {
    if (isResizingPrimary.current) {
      const newWidth = e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setPrimaryWidth(newWidth);
      }
    } else if (isResizingSecondary.current) {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 150 && newWidth < 500) {
        setSecondaryWidth(newWidth);
      }
    }
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  return (
    <div className="flex-1 flex overflow-hidden w-full relative">
      {/* Coluna Esquerda (Primária) */}
      <div 
        style={{ width: showPrimary ? `${primaryWidth}px` : '0px' }}
        className={`h-full transition-[width] duration-300 ease-in-out overflow-hidden relative group`}
      >
        <PrimarySidebar projectPath={projectPath} onSelectProject={onSelectProject} />
        
        {/* Divisor Redimensionável (Lado Direito da Sidebar) */}
        {showPrimary && (
          <div
            onMouseDown={startResizingPrimary}
            className="absolute top-0 right-0 w-1 h-full cursor-col-resize z-10
                       hover:bg-slate-700/50 transition-colors"
          />
        )}
      </div>

      {/* Coluna Central (Main) */}
      <div className="flex-1 h-full min-w-0">
        <MainWorkspace />
      </div>

      {/* Coluna Direita (Secundária) */}
      <div 
        style={{ width: showSecondary ? `${secondaryWidth}px` : '0px' }}
        className={`h-full transition-[width] duration-300 ease-in-out overflow-hidden relative group`}
      >
        {/* Divisor Redimensionável (Lado Esquerdo da Sidebar) */}
        {showSecondary && (
          <div
            onMouseDown={startResizingSecondary}
            className="absolute top-0 left-0 w-1 h-full cursor-col-resize z-10
                       hover:bg-slate-700/50 transition-colors"
          />
        )}
        <SecondarySidebar />
      </div>
    </div>
  );
}
