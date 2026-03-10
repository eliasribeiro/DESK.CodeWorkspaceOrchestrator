import { createContext, useContext, useState, useEffect, useCallback } from 'react';

/**
 * Contexto para gerenciamento de projetos e chats
 */
const WorkspaceContext = createContext(null);

/**
 * Provider do contexto Workspace
 */
export function WorkspaceProvider({ children }) {
  const [projects, setProjects] = useState([]);
  const [selectedChatId, setSelectedChatId] = useState(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(280);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(450);
  const [activeScreen, setActiveScreen] = useState('home');
  const [isCloneModalOpen, setIsCloneModalOpen] = useState(false);
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(true);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(true);
  const [workspaceViewMode, setWorkspaceViewMode] = useState('chat');
  const [selectedModel, setSelectedModel] = useState('');
  const [selectedEditor, setSelectedEditor] = useState('claude-code');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiProviders, setAiProviders] = useState([]);
  const [theme, setTheme] = useState('dark');

  const normalizeProvider = useCallback((provider = {}) => ({
    ...provider,
    enabled: provider.enabled !== false,
  }), []);

  /**
   * Carrega dados do localStorage ao montar
   */
  useEffect(() => {
    const savedProjects = localStorage.getItem('workspace-projects');
    if (savedProjects) {
      try {
        setProjects(JSON.parse(savedProjects));
      } catch (e) {
        console.error('Erro ao carregar projetos:', e);
      }
    }

    const savedProviders = localStorage.getItem('workspace-ai-providers');
    if (savedProviders) {
      try {
        const parsedProviders = JSON.parse(savedProviders);
        setAiProviders(Array.isArray(parsedProviders) ? parsedProviders.map(normalizeProvider) : []);
      } catch (e) {
        console.error('Erro ao carregar provedores:', e);
      }
    }

    const savedTheme = localStorage.getItem('workspace-theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, [normalizeProvider]);

  /**
   * Aplica o tema ao documento
   */
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('workspace-theme', theme);
  }, [theme]);

  /**
   * Salva dados no localStorage
   */
  useEffect(() => {
    localStorage.setItem('workspace-projects', JSON.stringify(projects));
  }, [projects]);

  useEffect(() => {
    localStorage.setItem('workspace-ai-providers', JSON.stringify(aiProviders));
  }, [aiProviders]);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const extractFolderName = (fullPath) => {
    if (!fullPath) return '';
    const normalized = fullPath.replace(/[/\\]$/, '');
    return normalized.split(/[/\\]/).pop() || normalized;
  };

  const addProjectFromPath = useCallback((folderPath) => {
    if (!folderPath) return null;
    const folderName = extractFolderName(folderPath);
    const existing = projects.find(p => p.path === folderPath);
    if (existing) return existing;

    const newProject = {
      id: generateId(),
      name: folderName,
      path: folderPath,
      chats: [],
      isExpanded: true,
      createdAt: new Date().toISOString(),
    };

    setProjects(prev => [...prev, newProject]);
    return newProject;
  }, [projects]);

  const removeProject = useCallback((projectId) => {
    setProjects(prev => prev.filter(p => p.id !== projectId));
  }, []);

  const renameProject = useCallback((projectId, newName) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, name: newName } : p));
  }, []);

  const toggleProjectExpanded = useCallback((projectId) => {
    setProjects(prev => prev.map(p => p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p));
  }, []);

  const addChat = useCallback((projectId, name) => {
    const newChat = {
      id: generateId(),
      name: name || `Novo Chat`,
      createdAt: new Date().toISOString(),
    };
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, chats: [...p.chats, newChat], isExpanded: true };
      }
      return p;
    }));
    return newChat;
  }, []);

  const removeChat = useCallback((projectId, chatId) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, chats: p.chats.filter(c => c.id !== chatId) };
      }
      return p;
    }));
  }, []);

  const selectWorkspace = useCallback((projectId, workspace) => {
    if (!projectId || !workspace) {
      setSelectedWorkspace(null);
      setActiveScreen('home');
    } else {
      setSelectedWorkspace({ projectId, workspace });
      setActiveScreen('workspace');
    }
  }, []);

  const selectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    setActiveScreen('chat');
  }, []);

  const getSelectedChat = useCallback(() => {
    for (const project of projects) {
      const chat = project.chats.find(c => c.id === selectedChatId);
      if (chat) return { chat, project };
    }
    return null;
  }, [projects, selectedChatId]);

  const addWorkspace = useCallback((projectId, workspace) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, workspaces: [...(p.workspaces || []), workspace] };
      }
      return p;
    }));
  }, []);

  const removeWorkspace = useCallback((projectId, workspaceName) => {
    setProjects(prev => prev.map(p => {
      if (p.id === projectId) {
        return { ...p, workspaces: (p.workspaces || []).filter(w => w.name !== workspaceName) };
      }
      return p;
    }));
  }, []);

  const addProvider = useCallback((providerData = null) => {
    const newProvider = normalizeProvider({
      id: `prov-${Date.now()}`,
      name: providerData?.name || '',
      baseUrl: providerData?.baseUrl || '',
      apiKey: providerData?.apiKey || '',
      models: providerData?.models || '',
      enabled: providerData?.enabled,
    });
    setAiProviders(prev => [...prev, newProvider]);
    return newProvider;
  }, [normalizeProvider]);

  const updateProvider = useCallback((id, updates) => {
    setAiProviders(prev => prev.map(p => (
      p.id === id ? normalizeProvider({ ...p, ...updates }) : p
    )));
  }, [normalizeProvider]);

  const removeProvider = useCallback((id) => {
    setAiProviders(prev => prev.filter(p => p.id !== id));
  }, []);

  const fetchProviderModels = useCallback(async (providerId) => {
    const provider = aiProviders.find(p => p.id === providerId);
    if (!provider || !provider.baseUrl || !provider.apiKey) return;

    try {
      const response = await fetch(`${provider.baseUrl}/models`, {
        headers: { 'Authorization': `Bearer ${provider.apiKey}` }
      });
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const modelNames = data.data.map(m => m.id).join(',');
        updateProvider(providerId, { models: modelNames });
      }
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  }, [aiProviders, updateProvider]);

  const value = {
    projects,
    selectedChatId,
    selectedWorkspace,
    sidebarWidth,
    setSidebarWidth,
    secondarySidebarWidth,
    setSecondarySidebarWidth,
    activeScreen,
    setActiveScreen,
    isCloneModalOpen,
    setIsCloneModalOpen,
    showPrimarySidebar,
    setShowPrimarySidebar,
    showSecondarySidebar,
    setShowSecondarySidebar,
    workspaceViewMode,
    setWorkspaceViewMode,
    selectedModel,
    setSelectedModel,
    selectedEditor,
    setSelectedEditor,
    selectedProvider,
    setSelectedProvider,
    isSettingsOpen,
    setIsSettingsOpen,
    aiProviders,
    theme,
    setTheme,
    addProvider,
    updateProvider,
    removeProvider,
    fetchProviderModels,
    addProjectFromPath,
    removeProject,
    renameProject,
    toggleProjectExpanded,
    addChat,
    removeChat,
    selectChat,
    getSelectedChat,
    addWorkspace,
    removeWorkspace,
    selectWorkspace,
    setSelectedWorkspace,
  };

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace deve ser usado dentro de WorkspaceProvider');
  return context;
}
