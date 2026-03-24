import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { SUPPORTED_LANGUAGES, translate } from '@utils/i18n';
import {
  fetchModelsFromProvider,
  normalizeProviderApiType,
} from '@lib/providerApi';

const WorkspaceContext = createContext(null);
export const SUPPORTED_THEMES = ['dark', 'light', 'graphite'];

const defaultPreferences = {
  projects: [],
  aiProviders: [],
  theme: 'dark',
  language: 'pt',
  sidebarWidth: 280,
  secondarySidebarWidth: 250,
  showPrimarySidebar: true,
  showSecondarySidebar: false,
  workspaceViewMode: 'chat',
  selectedModel: '',
  selectedEditor: 'claude-code-native',
  selectedProvider: '',
  selectedChatId: null,
  selectedWorkspace: null,
};

function normalizeProvider(provider = {}) {
  return {
    ...provider,
    apiType: normalizeProviderApiType(provider.apiType),
    enabled: provider.enabled !== false,
  };
}

function normalizePreferences(preferences = {}) {
  const normalizedTheme = SUPPORTED_THEMES.includes(preferences?.theme)
    ? preferences.theme
    : defaultPreferences.theme;

  return {
    ...defaultPreferences,
    ...(preferences && typeof preferences === 'object' ? preferences : {}),
    projects: Array.isArray(preferences?.projects) ? preferences.projects : [],
    aiProviders: Array.isArray(preferences?.aiProviders)
      ? preferences.aiProviders.map(normalizeProvider)
      : [],
    theme: normalizedTheme,
    language: SUPPORTED_LANGUAGES.includes(preferences?.language) ? preferences.language : defaultPreferences.language,
    sidebarWidth: Number.isFinite(preferences?.sidebarWidth) ? preferences.sidebarWidth : defaultPreferences.sidebarWidth,
    secondarySidebarWidth: Number.isFinite(preferences?.secondarySidebarWidth)
      ? preferences.secondarySidebarWidth
      : defaultPreferences.secondarySidebarWidth,
    showPrimarySidebar: preferences?.showPrimarySidebar !== false,
    showSecondarySidebar: Boolean(preferences?.showSecondarySidebar),
    workspaceViewMode: preferences?.workspaceViewMode === 'grid' ? 'grid' : 'chat',
    selectedModel: typeof preferences?.selectedModel === 'string' ? preferences.selectedModel : '',
    selectedEditor: typeof preferences?.selectedEditor === 'string'
      ? preferences.selectedEditor
      : defaultPreferences.selectedEditor,
    selectedProvider: typeof preferences?.selectedProvider === 'string' ? preferences.selectedProvider : '',
    selectedChatId: typeof preferences?.selectedChatId === 'string' ? preferences.selectedChatId : null,
    selectedWorkspace:
      preferences?.selectedWorkspace &&
      typeof preferences.selectedWorkspace === 'object' &&
      typeof preferences.selectedWorkspace.projectId === 'string' &&
      preferences.selectedWorkspace.workspace &&
      typeof preferences.selectedWorkspace.workspace === 'object'
        ? preferences.selectedWorkspace
        : null,
  };
}

function readLegacyLocalPreferences() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { ...defaultPreferences };
  }

  const browserLanguage = SUPPORTED_LANGUAGES.includes(String(window.navigator?.language || '').slice(0, 2))
    ? String(window.navigator?.language || '').slice(0, 2)
    : 'en';
  const nextPreferences = { ...defaultPreferences, language: browserLanguage };

  try {
    const savedProjects = window.localStorage.getItem('workspace-projects');
    if (savedProjects) {
      nextPreferences.projects = JSON.parse(savedProjects);
    }
  } catch (error) {
    console.error('Erro ao migrar projetos do localStorage:', error);
  }

  try {
    const savedProviders = window.localStorage.getItem('workspace-ai-providers');
    if (savedProviders) {
      const parsedProviders = JSON.parse(savedProviders);
      nextPreferences.aiProviders = Array.isArray(parsedProviders)
        ? parsedProviders.map(normalizeProvider)
        : [];
    }
  } catch (error) {
    console.error('Erro ao migrar provedores do localStorage:', error);
  }

  try {
    const savedTheme = window.localStorage.getItem('workspace-theme');
    if (savedTheme) {
      nextPreferences.theme = SUPPORTED_THEMES.includes(savedTheme) ? savedTheme : defaultPreferences.theme;
    }
  } catch (error) {
    console.error('Erro ao migrar tema do localStorage:', error);
  }

  try {
    const savedLanguage = window.localStorage.getItem('workspace-language');
    if (SUPPORTED_LANGUAGES.includes(savedLanguage)) {
      nextPreferences.language = savedLanguage;
    }
  } catch (error) {
    console.error('Erro ao migrar idioma do localStorage:', error);
  }

  return nextPreferences;
}

export function WorkspaceProvider({ children }) {
  const [projects, setProjects] = useState(defaultPreferences.projects);
  const [selectedChatId, setSelectedChatId] = useState(defaultPreferences.selectedChatId);
  const [selectedWorkspace, setSelectedWorkspace] = useState(defaultPreferences.selectedWorkspace);
  const [sidebarWidth, setSidebarWidth] = useState(defaultPreferences.sidebarWidth);
  const [secondarySidebarWidth, setSecondarySidebarWidth] = useState(defaultPreferences.secondarySidebarWidth);
  const [activeScreen, setActiveScreen] = useState('home');
  const [showPrimarySidebar, setShowPrimarySidebar] = useState(defaultPreferences.showPrimarySidebar);
  const [showSecondarySidebar, setShowSecondarySidebar] = useState(defaultPreferences.showSecondarySidebar);
  const [workspaceViewMode, setWorkspaceViewMode] = useState(defaultPreferences.workspaceViewMode);
  const [selectedModel, setSelectedModel] = useState(defaultPreferences.selectedModel);
  const [selectedEditor, setSelectedEditor] = useState(defaultPreferences.selectedEditor);
  const [selectedProvider, setSelectedProvider] = useState(defaultPreferences.selectedProvider);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [aiProviders, setAiProviders] = useState(defaultPreferences.aiProviders);
  const [theme, setTheme] = useState(defaultPreferences.theme);
  const [language, setLanguage] = useState(defaultPreferences.language);
  const [activeSessionsCount, setActiveSessionsCount] = useState(0);
  const [workspaceViews, setWorkspaceViews] = useState({});
  const [filePreview, setFilePreview] = useState({
    isOpen: false,
    file: null,
  });
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'alert',
    variant: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancelar',
  });
  const hasHydratedRef = useRef(false);
  const dialogResolverRef = useRef(null);

  useEffect(() => {
    let isMounted = true;

    const loadPreferences = async () => {
      const electronPreferencesApi = window.electronAPI?.preferences;

      if (!electronPreferencesApi?.load) {
        const legacyPreferences = normalizePreferences(readLegacyLocalPreferences());
        if (!isMounted) {
          return;
        }

        applyLoadedPreferences(legacyPreferences);
        hasHydratedRef.current = true;
        return;
      }

      try {
        const result = await electronPreferencesApi.load();
        if (!isMounted) {
          return;
        }

        const sourcePreferences = result?.success
          ? (result.exists ? result.preferences : readLegacyLocalPreferences())
          : readLegacyLocalPreferences();
        const nextPreferences = normalizePreferences(sourcePreferences);

        applyLoadedPreferences(nextPreferences);
        hasHydratedRef.current = true;

        if (result?.success && !result.exists) {
          await electronPreferencesApi.save(nextPreferences);
        }
      } catch (error) {
        console.error('Erro ao carregar preferencias:', error);

        if (!isMounted) {
          return;
        }

        applyLoadedPreferences(normalizePreferences(readLegacyLocalPreferences()));
        hasHydratedRef.current = true;
      }
    };

    const applyLoadedPreferences = (preferences) => {
      setProjects(preferences.projects);
      setAiProviders(preferences.aiProviders);
      setTheme(preferences.theme);
      setLanguage(preferences.language);
      setSidebarWidth(preferences.sidebarWidth);
      setSecondarySidebarWidth(preferences.secondarySidebarWidth);
      setShowPrimarySidebar(preferences.showPrimarySidebar);
      setShowSecondarySidebar(preferences.showSecondarySidebar);
      setWorkspaceViewMode(preferences.workspaceViewMode);
      setSelectedModel(preferences.selectedModel);
      setSelectedEditor(preferences.selectedEditor);
      setSelectedProvider(preferences.selectedProvider);
      setSelectedChatId(preferences.selectedChatId);

      const restoredWorkspace = preferences.selectedWorkspace;
      const workspaceStillExists =
        restoredWorkspace &&
        preferences.projects.some((project) => (
          project.id === restoredWorkspace.projectId &&
          Array.isArray(project.workspaces) &&
          project.workspaces.some((workspace) => workspace.path === restoredWorkspace.workspace?.path)
        ));

      if (workspaceStillExists) {
        setSelectedWorkspace(restoredWorkspace);
        setActiveScreen('workspace');
        return;
      }

      const selectedChatStillExists = preferences.selectedChatId && preferences.projects.some((project) => (
        Array.isArray(project.chats) && project.chats.some((chat) => chat.id === preferences.selectedChatId)
      ));

      if (selectedChatStillExists) {
        setSelectedWorkspace(null);
        setActiveScreen('chat');
        return;
      }

      setSelectedWorkspace(null);
      setActiveScreen('home');
    };

    loadPreferences();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    document.documentElement.classList.remove(...SUPPORTED_THEMES);
    if (theme && theme !== 'light') {
      document.documentElement.classList.add(theme);
    }
  }, [theme]);

  useEffect(() => {
    if (!hasHydratedRef.current) {
      return;
    }

    const preferences = normalizePreferences({
      projects,
      aiProviders,
      theme,
      language,
      sidebarWidth,
      secondarySidebarWidth,
      showPrimarySidebar,
      showSecondarySidebar,
      workspaceViewMode,
      selectedModel,
      selectedEditor,
      selectedProvider,
      selectedChatId,
      selectedWorkspace,
    });

    const electronPreferencesApi = window.electronAPI?.preferences;

    if (electronPreferencesApi?.save) {
      electronPreferencesApi.save(preferences).catch((error) => {
        console.error('Erro ao salvar preferencias:', error);
      });
      return;
    }

    try {
      window.localStorage?.setItem('workspace-projects', JSON.stringify(projects));
      window.localStorage?.setItem('workspace-ai-providers', JSON.stringify(aiProviders));
      window.localStorage?.setItem('workspace-theme', theme);
      window.localStorage?.setItem('workspace-language', language);
    } catch (error) {
      console.error('Erro ao salvar preferencias locais:', error);
    }
  }, [
    projects,
    aiProviders,
    theme,
    language,
    sidebarWidth,
    secondarySidebarWidth,
    showPrimarySidebar,
    showSecondarySidebar,
    workspaceViewMode,
    selectedModel,
    selectedEditor,
    selectedProvider,
    selectedChatId,
    selectedWorkspace,
  ]);

  const generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  const extractFolderName = (fullPath) => {
    if (!fullPath) return '';
    const normalized = fullPath.replace(/[/\\]$/, '');
    return normalized.split(/[/\\]/).pop() || normalized;
  };

  const addProjectFromPath = useCallback((folderPath) => {
    if (!folderPath) return null;

    const folderName = extractFolderName(folderPath);
    const existing = projects.find((project) => project.path === folderPath);
    if (existing) return existing;

    const newProject = {
      id: generateId(),
      name: folderName,
      path: folderPath,
      chats: [],
      workspaces: [],
      isExpanded: true,
      createdAt: new Date().toISOString(),
    };

    setProjects((current) => [...current, newProject]);
    return newProject;
  }, [projects]);

  const removeProject = useCallback((projectId) => {
    setProjects((current) => current.filter((project) => project.id !== projectId));
    setSelectedWorkspace((current) => (current?.projectId === projectId ? null : current));
    setSelectedChatId((current) => {
      const project = projects.find((item) => item.id === projectId);
      const hasSelectedChat = project?.chats?.some((chat) => chat.id === current);
      return hasSelectedChat ? null : current;
    });
  }, [projects]);

  const renameProject = useCallback((projectId, newName) => {
    setProjects((current) => current.map((project) => (
      project.id === projectId ? { ...project, name: newName } : project
    )));
  }, []);

  const toggleProjectExpanded = useCallback((projectId) => {
    setProjects((current) => current.map((project) => (
      project.id === projectId ? { ...project, isExpanded: !project.isExpanded } : project
    )));
  }, []);

  const addChat = useCallback((projectId, name) => {
    const newChat = {
      id: generateId(),
      name: name || 'Novo Chat',
      createdAt: new Date().toISOString(),
    };

    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        chats: [...(project.chats || []), newChat],
        isExpanded: true,
      };
    }));

    return newChat;
  }, []);

  const removeChat = useCallback((projectId, chatId) => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        chats: (project.chats || []).filter((chat) => chat.id !== chatId),
      };
    }));

    setSelectedChatId((current) => (current === chatId ? null : current));
  }, []);

  const renameChat = useCallback((projectId, chatId, newName) => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        chats: (project.chats || []).map((chat) => (
          chat.id === chatId ? { ...chat, name: newName } : chat
        )),
      };
    }));
  }, []);

  const selectWorkspace = useCallback((projectId, workspace) => {
    if (!projectId || !workspace) {
      setSelectedWorkspace(null);
      setActiveScreen('home');
      return;
    }

    setSelectedWorkspace({ projectId, workspace });
    setActiveScreen('workspace');
  }, []);

  const selectChat = useCallback((chatId) => {
    setSelectedChatId(chatId);
    setSelectedWorkspace(null);
    setActiveScreen('chat');
  }, []);

  const getSelectedChat = useCallback(() => {
    for (const project of projects) {
      const chat = (project.chats || []).find((item) => item.id === selectedChatId);
      if (chat) {
        return { chat, project };
      }
    }

    return null;
  }, [projects, selectedChatId]);

  const addWorkspace = useCallback((projectId, workspace) => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        workspaces: [...(project.workspaces || []), workspace],
      };
    }));
  }, []);

  const removeWorkspace = useCallback((projectId, workspaceName, workspacePath = '') => {
    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        workspaces: (project.workspaces || []).filter((workspace) => workspace.name !== workspaceName),
      };
    }));

    let clearedSelection = false;
    setSelectedWorkspace((current) => {
      const sameProject = current?.projectId === projectId;
      const samePath = workspacePath && current?.workspace?.path === workspacePath;
      const sameName = current?.workspace?.name === workspaceName;

      if (!sameProject || (!samePath && !sameName)) {
        return current;
      }

      clearedSelection = true;
      return null;
    });

    if (clearedSelection) {
      setActiveScreen('home');
    }
  }, []);

  const renameWorkspace = useCallback((projectId, workspacePath, nextWorkspace) => {
    if (!projectId || !workspacePath || !nextWorkspace?.name || !nextWorkspace?.path) {
      return;
    }

    setProjects((current) => current.map((project) => {
      if (project.id !== projectId) {
        return project;
      }

      return {
        ...project,
        workspaces: (project.workspaces || []).map((workspace) => (
          workspace.path === workspacePath
            ? { ...workspace, ...nextWorkspace }
            : workspace
        )),
      };
    }));

    setSelectedWorkspace((current) => {
      if (current?.projectId !== projectId || current?.workspace?.path !== workspacePath) {
        return current;
      }

      return {
        ...current,
        workspace: {
          ...current.workspace,
          ...nextWorkspace,
        },
      };
    });
  }, []);

  const addProvider = useCallback((providerData = null) => {
    const newProvider = normalizeProvider({
      id: providerData?.id || `prov-${Date.now()}`,
      name: providerData?.name || '',
      apiType: providerData?.apiType,
      baseUrl: providerData?.baseUrl || '',
      apiKey: providerData?.apiKey || '',
      models: providerData?.models || '',
      enabled: providerData?.enabled,
    });

    setAiProviders((current) => [...current, newProvider]);
    return newProvider;
  }, []);

  const updateProvider = useCallback((id, updates) => {
    setAiProviders((current) => current.map((provider) => (
      provider.id === id ? normalizeProvider({ ...provider, ...updates }) : provider
    )));
  }, []);

  const removeProvider = useCallback((id) => {
    setAiProviders((current) => current.filter((provider) => provider.id !== id));
    setSelectedProvider((current) => (current === id ? '' : current));
  }, []);

  const fetchProviderModels = useCallback(async (providerId) => {
    const provider = aiProviders.find((item) => item.id === providerId);
    if (!provider || !provider.baseUrl || !provider.apiKey) {
      return;
    }

    try {
      const models = await fetchModelsFromProvider(provider);
      updateProvider(providerId, { models: models.join(',') });
    } catch (error) {
      console.error('Erro ao buscar modelos:', error);
    }
  }, [aiProviders, updateProvider]);

  const resolveDialog = useCallback((value) => {
    if (typeof dialogResolverRef.current === 'function') {
      dialogResolverRef.current(value);
      dialogResolverRef.current = null;
    }
  }, []);

  const closeDialog = useCallback((value = false) => {
    resolveDialog(value);
    setDialogState((current) => ({
      ...current,
      isOpen: false,
    }));
  }, [resolveDialog]);

  const showConfirm = useCallback((options = {}) => {
    resolveDialog(false);

    const nextState = {
      isOpen: true,
      type: 'confirm',
      variant: options.variant === 'danger' ? 'danger' : 'info',
      title: options.title || 'Confirmar ação',
      message: options.message || 'Deseja continuar?',
      confirmText: options.confirmText || 'Confirmar',
      cancelText: options.cancelText || 'Cancelar',
    };

    return new Promise((resolve) => {
      dialogResolverRef.current = resolve;
      setDialogState(nextState);
    });
  }, [resolveDialog]);

  const showAlert = useCallback((options = {}) => {
    resolveDialog(false);

    const nextState = {
      isOpen: true,
      type: 'alert',
      variant: options.variant === 'danger' ? 'danger' : 'info',
      title: options.title || 'Aviso',
      message: options.message || '',
      confirmText: options.confirmText || 'Entendi',
      cancelText: 'Cancelar',
    };

    return new Promise((resolve) => {
      dialogResolverRef.current = () => resolve(true);
      setDialogState(nextState);
    });
  }, [resolveDialog]);

  const t = useCallback((key, vars = {}) => translate(language, key, vars), [language]);

  const openFilePreview = useCallback((file) => {
    setFilePreview({
      isOpen: true,
      file: file || null,
    });
  }, []);

  const closeFilePreview = useCallback(() => {
    setFilePreview({
      isOpen: false,
      file: null,
    });
  }, []);

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
    language,
    setLanguage,
    dialogState,
    closeDialog,
    showConfirm,
    showAlert,
    t,
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
    renameChat,
    selectChat,
    getSelectedChat,
    addWorkspace,
    removeWorkspace,
    renameWorkspace,
    selectWorkspace,
    setSelectedWorkspace,
    activeSessionsCount,
    setActiveSessionsCount,
    workspaceViews,
    setWorkspaceViews,
    filePreview,
    openFilePreview,
    closeFilePreview,
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
