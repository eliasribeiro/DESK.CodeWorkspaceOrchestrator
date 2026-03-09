import { useState, useEffect } from 'react';

/**
 * Componente ThemeToggle
 * Botão para alternar entre tema claro e escuro
 * 
 * @returns {JSX.Element} Botão toggle de tema
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  /**
   * Inicializa o tema baseado no localStorage ou preferência do sistema
   */
  useEffect(() => {
    // Verifica preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme');
    
    if (savedTheme) {
      // Usa tema salvo
      const dark = savedTheme === 'dark';
      setIsDark(dark);
      applyTheme(dark);
    } else {
      // Usa preferência do sistema
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDark(prefersDark);
      applyTheme(prefersDark);
    }
  }, []);

  /**
   * Aplica o tema ao elemento HTML
   */
  const applyTheme = (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  /**
   * Alterna entre tema claro e escuro
   */
  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    applyTheme(newIsDark);
    
    // Salva preferência no localStorage
    localStorage.setItem('theme', newIsDark ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggleTheme}
      className="w-8 h-8 flex items-center justify-center rounded-lg
                 hover:bg-slate-200 dark:hover:bg-slate-700
                 active:scale-95
                 transition-all duration-150
                 no-drag"
      title={isDark ? 'Tema claro' : 'Tema escuro'}
      aria-label={isDark ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
    >
      {isDark ? (
        // Ícone de sol (tema claro)
        <svg 
          className="w-4 h-4 text-amber-400"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" 
          />
        </svg>
      ) : (
        // Ícone de lua (tema escuro)
        <svg 
          className="w-4 h-4 text-slate-600"
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" 
          />
        </svg>
      )}
    </button>
  );
}
