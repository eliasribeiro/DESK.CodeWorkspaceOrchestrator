const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const simpleGit = require('simple-git');
const fs = require('fs');
const { spawn } = require('child_process');
const { createHash } = require('crypto');
const pty = require('node-pty');
const {
  parse: parseJsonc,
  modify: modifyJsonc,
  applyEdits,
} = require('jsonc-parser');

let mainWindow = null;

const terminalProcesses = [];
const embeddedTerminalSessions = new Map();
const embeddedTerminalSessionsById = new Map();
const USER_PREFERENCES_FILENAME = 'preferences.json';

const defaultUserPreferences = {
  projects: [],
  aiProviders: [],
  theme: 'dark',
  sidebarWidth: 280,
  secondarySidebarWidth: 450,
  showPrimarySidebar: true,
  showSecondarySidebar: false,
  workspaceViewMode: 'chat',
  selectedModel: '',
  selectedEditor: 'claude-code',
  selectedProvider: '',
  selectedChatId: null,
  selectedWorkspace: null,
};

function generateSessionId() {
  return `term-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function hashValue(value = '') {
  return createHash('sha256').update(value).digest('hex');
}

function getShellCommand() {
  if (process.platform === 'win32') {
    return process.env.ComSpec || 'cmd.exe';
  }

  return process.env.SHELL || '/bin/bash';
}

function getShellArgs() {
  return process.platform === 'win32' ? [] : ['-i'];
}

function normalizeTerminalBuffer(buffer = '') {
  const maxLength = 200000;
  if (buffer.length <= maxLength) {
    return buffer;
  }

  return buffer.slice(buffer.length - maxLength);
}

function ensureDirectory(directoryPath) {
  if (!fs.existsSync(directoryPath)) {
    fs.mkdirSync(directoryPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const content = fs.readFileSync(filePath, 'utf8').trim();
  if (!content) {
    return {};
  }

  return JSON.parse(content);
}

function writeJsonFile(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function getUserPreferencesPath() {
  return path.join(app.getPath('userData'), USER_PREFERENCES_FILENAME);
}

function normalizeUserPreferences(value = {}) {
  return {
    ...defaultUserPreferences,
    ...(value && typeof value === 'object' ? value : {}),
    projects: Array.isArray(value?.projects) ? value.projects : defaultUserPreferences.projects,
    aiProviders: Array.isArray(value?.aiProviders) ? value.aiProviders : defaultUserPreferences.aiProviders,
    theme: value?.theme === 'light' ? 'light' : 'dark',
    sidebarWidth: Number.isFinite(value?.sidebarWidth) ? value.sidebarWidth : defaultUserPreferences.sidebarWidth,
    secondarySidebarWidth: Number.isFinite(value?.secondarySidebarWidth)
      ? value.secondarySidebarWidth
      : defaultUserPreferences.secondarySidebarWidth,
    showPrimarySidebar: value?.showPrimarySidebar !== false,
    showSecondarySidebar: Boolean(value?.showSecondarySidebar),
    workspaceViewMode: value?.workspaceViewMode === 'grid' ? 'grid' : defaultUserPreferences.workspaceViewMode,
    selectedModel: typeof value?.selectedModel === 'string' ? value.selectedModel : '',
    selectedEditor: typeof value?.selectedEditor === 'string' ? value.selectedEditor : defaultUserPreferences.selectedEditor,
    selectedProvider: typeof value?.selectedProvider === 'string' ? value.selectedProvider : '',
    selectedChatId: typeof value?.selectedChatId === 'string' ? value.selectedChatId : null,
    selectedWorkspace:
      value?.selectedWorkspace &&
      typeof value.selectedWorkspace === 'object' &&
      typeof value.selectedWorkspace.projectId === 'string' &&
      value.selectedWorkspace.workspace &&
      typeof value.selectedWorkspace.workspace === 'object'
        ? value.selectedWorkspace
        : null,
  };
}

function loadUserPreferences() {
  const preferencesPath = getUserPreferencesPath();
  if (!fs.existsSync(preferencesPath)) {
    return {
      exists: false,
      preferences: { ...defaultUserPreferences },
    };
  }

  return {
    exists: true,
    preferences: normalizeUserPreferences(readJsonFile(preferencesPath)),
  };
}

function saveUserPreferences(preferences) {
  const preferencesPath = getUserPreferencesPath();
  ensureDirectory(path.dirname(preferencesPath));
  writeJsonFile(preferencesPath, normalizeUserPreferences(preferences));
}

function updateJsoncFile(filePath, buildUpdates) {
  let content = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : '{}\n';
  const parseErrors = [];
  const parsed = parseJsonc(content, parseErrors) || {};

  if (parseErrors.length > 0) {
    throw new Error(`Arquivo JSONC invalido: ${path.basename(filePath)}`);
  }

  const updates = buildUpdates(parsed);
  const formattingOptions = {
    insertSpaces: true,
    tabSize: 2,
    eol: '\n',
  };

  updates.forEach((entry) => {
    const edits = modifyJsonc(content, entry.path, entry.value, { formattingOptions });
    content = applyEdits(content, edits);
  });

  fs.writeFileSync(filePath, content.endsWith('\n') ? content : `${content}\n`, 'utf8');
}

function sendTerminalEvent(channel, payload) {
  if (!mainWindow || mainWindow.isDestroyed()) {
    return;
  }

  mainWindow.webContents.send(channel, payload);
}

function serializeEmbeddedSession(session) {
  if (!session) {
    return null;
  }

  return {
    sessionId: session.sessionId,
    workspacePath: session.workspacePath,
    editor: session.editor,
    status: session.status,
    buffer: session.buffer,
    exitCode: session.exitCode ?? null,
    signal: session.signal ?? null,
    launchFingerprint: session.launchFingerprint,
    provider: session.provider ?? null,
    model: session.model ?? '',
    yoloMode: Boolean(session.yoloMode),
    createdAt: session.createdAt,
  };
}

function destroyEmbeddedSession(session, options = {}) {
  if (!session) {
    return;
  }

  const workspaceSessions = embeddedTerminalSessions.get(session.workspacePath);
  if (workspaceSessions) {
    workspaceSessions.delete(session.sessionId);

    if (workspaceSessions.size === 0) {
      embeddedTerminalSessions.delete(session.workspacePath);
    }
  }

  embeddedTerminalSessionsById.delete(session.sessionId);

  if (options.skipKill || !session.ptyProcess) {
    return;
  }

  try {
    if (process.platform === 'win32' && session.ptyProcess.pid) {
      const killer = spawn('taskkill', ['/PID', String(session.ptyProcess.pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });

      killer.on('error', (error) => {
        console.log('Erro ao encerrar sessao de terminal:', error);
      });
      return;
    }

    session.ptyProcess.kill();
  } catch (error) {
    console.log('Erro ao encerrar sessao de terminal:', error);
  }
}

function createEmbeddedTerminalSession({
  workspacePath,
  editor,
  command,
  launchFingerprint,
  envOverrides = {},
  provider = null,
  model = '',
  yoloMode = false,
  cols = 120,
  rows = 32,
}) {
  const sessionId = generateSessionId();
  const ptyProcess = pty.spawn(getShellCommand(), getShellArgs(), {
    name: 'xterm-color',
    cols: Math.max(cols || 120, 40),
    rows: Math.max(rows || 32, 12),
    cwd: workspacePath,
    env: {
      ...process.env,
      ...envOverrides,
    },
  });

  const session = {
    sessionId,
    workspacePath,
    editor,
    provider,
    model,
    yoloMode,
    launchFingerprint,
    status: 'starting',
    ptyProcess,
    buffer: '',
    exitCode: null,
    signal: null,
    createdAt: new Date().toISOString(),
  };

  const workspaceSessions = embeddedTerminalSessions.get(workspacePath) || new Map();
  workspaceSessions.set(sessionId, session);
  embeddedTerminalSessions.set(workspacePath, workspaceSessions);
  embeddedTerminalSessionsById.set(sessionId, session);

  ptyProcess.onData((data) => {
    session.status = 'active';
    session.buffer = normalizeTerminalBuffer(`${session.buffer}${data}`);

    sendTerminalEvent('terminal:data', {
      sessionId,
      data,
    });
  });

  ptyProcess.onExit(({ exitCode, signal }) => {
    session.status = 'exited';
    session.exitCode = exitCode;
    session.signal = signal;
    session.ptyProcess = null;

    sendTerminalEvent('terminal:exit', {
      sessionId,
      exitCode,
      signal,
    });
  });

  if (command) {
    ptyProcess.write(`${command}\r`);
  }

  return session;
}

function buildLaunchFingerprint({ editor, provider, model, yoloMode }) {
  return JSON.stringify({
    editor,
    providerId: provider?.id || null,
    providerBaseUrl: provider?.baseUrl || null,
    providerAuthHash: provider?.apiKey ? hashValue(provider.apiKey) : null,
    model: model || null,
    yoloMode: Boolean(yoloMode),
  });
}

function listSerializedSessions(workspacePath) {
  const workspaceSessions = embeddedTerminalSessions.get(workspacePath);

  if (!workspaceSessions) {
    return [];
  }

  return Array.from(workspaceSessions.values())
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .map((session) => serializeEmbeddedSession(session));
}

function resolveLaunchConfiguration({ workspacePath, editor, provider, model, yoloMode }) {
  if (editor === 'codex') {
    return {
      command: yoloMode ? 'codex --yolo' : 'codex',
      envOverrides: {},
    };
  }

  if (editor === 'qwen-code') {
    return {
      command: yoloMode ? 'qwen --yolo' : 'qwen',
      envOverrides: {},
    };
  }

  if (!provider?.baseUrl || !provider?.apiKey || !model) {
    throw new Error('Provedor e modelo sao obrigatorios para este editor');
  }

  if (editor === 'claude-code') {
    const claudeDir = path.join(workspacePath, '.claude');
    const settingsPath = path.join(claudeDir, 'settings.json');

    ensureDirectory(claudeDir);

    const settings = {
      env: {
        ANTHROPIC_BASE_URL: provider.baseUrl,
        ANTHROPIC_AUTH_TOKEN: provider.apiKey,
        API_TIMEOUT_MS: '3000000',
        ANTHROPIC_MODEL: model,
        ANTHROPIC_SMALL_FAST_MODEL: model,
        ANTHROPIC_DEFAULT_SONNET_MODEL: model,
        ANTHROPIC_DEFAULT_OPUS_MODEL: model,
        ANTHROPIC_DEFAULT_HAIKU_MODEL: model,
      },
    };

    writeJsonFile(settingsPath, settings);

    return {
      command: yoloMode ? 'claude --dangerously-skip-permissions' : 'claude',
      envOverrides: {},
    };
  }

  if (editor === 'opcode') {
    const providerId = provider.id || 'workspace-provider';
    const modelKey = `${providerId}/${model}`;
    const configPath = path.join(workspacePath, 'opencode.jsonc');

    updateJsoncFile(configPath, (existingConfig) => {
      const existingProviders = existingConfig.provider || {};
      const existingProviderConfig = existingProviders[providerId] || {};
      const existingModels = existingProviderConfig.models || {};

      return [
        {
          path: ['$schema'],
          value: existingConfig.$schema || 'https://opencode.ai/config.json',
        },
        {
          path: ['provider', providerId],
          value: {
            ...existingProviderConfig,
            npm: '@ai-sdk/openai-compatible',
            name: provider.name || provider.baseUrl || providerId,
            options: {
              ...(existingProviderConfig.options || {}),
              baseURL: provider.baseUrl,
              apiKey: provider.apiKey,
            },
            models: {
              ...existingModels,
              [model]: {
                ...(existingModels[model] || {}),
                name: model,
              },
            },
          },
        },
        {
          path: ['model'],
          value: modelKey,
        },
        {
          path: ['small_model'],
          value: modelKey,
        },
      ];
    });

    return {
      command: 'opencode',
      envOverrides: {
        OPENCODE_CONFIG: configPath,
      },
    };
  }

  throw new Error(`Editor nao suportado: ${editor}`);
}

function cleanupTerminalProcesses() {
  terminalProcesses.forEach((proc) => {
    try {
      if (proc && !proc.killed) {
        proc.kill();
      }
    } catch (error) {
      console.log('Erro ao fechar terminal externo:', error);
    }
  });

  terminalProcesses.length = 0;
}

function cleanupEmbeddedSessions() {
  Array.from(embeddedTerminalSessionsById.values()).forEach((session) => {
    destroyEmbeddedSession(session);
  });

  embeddedTerminalSessions.clear();
  embeddedTerminalSessionsById.clear();
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false,
    backgroundColor: '#161111',
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (process.env.NODE_ENV === 'development' || process.env.DEV_SERVER) {
    mainWindow.loadURL('http://127.0.0.1:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  mainWindow.webContents.setWindowOpenHandler(() => {
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    cleanupTerminalProcesses();
    cleanupEmbeddedSessions();
    mainWindow = null;
  });
}

function parseNumstat(rawDiff = '') {
  const fileStats = new Map();
  const lines = rawDiff.split('\n').filter((line) => line.trim());

  lines.forEach((line) => {
    const parts = line.split('\t');
    if (parts.length < 3) {
      return;
    }

    const [addedRaw, removedRaw, filePath] = parts;
    const added = addedRaw === '-' ? 0 : Number.parseInt(addedRaw, 10) || 0;
    const removed = removedRaw === '-' ? 0 : Number.parseInt(removedRaw, 10) || 0;
    const current = fileStats.get(filePath) || { path: filePath, added: 0, removed: 0 };

    current.added += added;
    current.removed += removed;
    fileStats.set(filePath, current);
  });

  return fileStats;
}

function setupIpcHandlers() {
  ipcMain.on('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  ipcMain.on('window:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  ipcMain.on('devtools:toggle', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  ipcMain.handle('preferences:load', async () => {
    try {
      const result = loadUserPreferences();
      return {
        success: true,
        exists: result.exists,
        preferences: result.preferences,
      };
    } catch (error) {
      console.error('Erro ao carregar preferencias:', error);
      return {
        success: false,
        exists: false,
        preferences: { ...defaultUserPreferences },
        error: error.message || 'Erro ao carregar preferencias',
      };
    }
  });

  ipcMain.handle('preferences:save', async (_event, preferences = {}) => {
    try {
      saveUserPreferences(preferences);
      return { success: true };
    } catch (error) {
      console.error('Erro ao salvar preferencias:', error);
      return {
        success: false,
        error: error.message || 'Erro ao salvar preferencias',
      };
    }
  });

  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null;

    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });

  ipcMain.handle('git:createWorktree', async (_event, { projectPath, worktreeName }) => {
    try {
      if (!mainWindow) {
        return { success: false, error: 'Janela nao disponivel' };
      }

      if (!projectPath) {
        return { success: false, error: 'Caminho do projeto nao fornecido' };
      }

      if (!worktreeName) {
        return { success: false, error: 'Nome do workspace nao fornecido' };
      }

      const cwoPath = path.join(projectPath, '.cwo');
      const worktreePath = path.join(cwoPath, worktreeName);

      if (!fs.existsSync(cwoPath)) {
        fs.mkdirSync(cwoPath, { recursive: true });
      }

      if (fs.existsSync(worktreePath)) {
        return {
          success: false,
          error: `Workspace ja existe: ${worktreeName}`,
        };
      }

      const git = simpleGit(projectPath);
      const isRepo = await git.checkIsRepo();

      if (!isRepo) {
        return {
          success: false,
          error: 'A pasta do projeto nao e um repositorio Git valido',
        };
      }

      const branchName = worktreeName;
      const branches = await git.branch(['-a']);
      const branchExists =
        branches.all.includes(branchName) ||
        branches.all.includes(`remotes/origin/${branchName}`);

      if (branchExists) {
        await git.raw(['worktree', 'add', '-b', `${branchName}-${Date.now()}`, worktreePath]);
      } else {
        await git.raw(['worktree', 'add', '-b', branchName, worktreePath]);
      }

      return {
        success: true,
        path: worktreePath,
        branch: branchName,
        message: `Workspace criado: ${worktreeName}`,
      };
    } catch (error) {
      console.error('Erro ao criar worktree:', error);
      return {
        success: false,
        error: error.message || 'Erro ao criar workspace',
      };
    }
  });

  ipcMain.handle('git:listWorktrees', async (_event, { projectPath }) => {
    try {
      if (!projectPath) {
        return { success: false, error: 'Caminho do projeto nao fornecido' };
      }

      const git = simpleGit(projectPath);
      const worktrees = await git.raw(['worktree', 'list', '--porcelain']);
      const worktreeList = [];
      const lines = worktrees.split('\n').filter((line) => line.trim());

      let currentWorktree = null;
      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          if (currentWorktree) {
            worktreeList.push(currentWorktree);
          }

          currentWorktree = {
            path: line.replace('worktree ', ''),
            branch: '',
            isCurrent: false,
          };
        } else if (line.startsWith('branch ') && currentWorktree) {
          currentWorktree.branch = line.replace('branch ', '');
        }
      }

      if (currentWorktree) {
        worktreeList.push(currentWorktree);
      }

      return {
        success: true,
        worktrees: worktreeList,
      };
    } catch (error) {
      console.error('Erro ao listar worktrees:', error);
      return {
        success: false,
        error: error.message || 'Erro ao listar worktrees',
        worktrees: [],
      };
    }
  });

  ipcMain.handle('git:removeWorktree', async (_event, { projectPath, worktreePath }) => {
    try {
      if (!projectPath || !worktreePath) {
        return { success: false, error: 'Parametros invalidos' };
      }

      const git = simpleGit(projectPath);
      const worktreeName = path.basename(worktreePath);

      await git.raw(['worktree', 'remove', '--force', worktreePath]);

      try {
        await git.branch(['-D', worktreeName]);
      } catch (_branchError) {
        console.log(`Branch "${worktreeName}" ja foi removida ou nao existe`);
      }

      return {
        success: true,
        message: 'Worktree e branch removidos com sucesso',
      };
    } catch (error) {
      console.error('Erro ao remover worktree:', error);
      return {
        success: false,
        error: error.message || 'Erro ao remover worktree',
      };
    }
  });

  ipcMain.handle('git:renameWorktree', async (_event, { projectPath, worktreePath, newName }) => {
    try {
      if (!projectPath || !worktreePath || !newName) {
        return { success: false, error: 'Parametros invalidos' };
      }

      const trimmedName = String(newName).trim();
      if (!/^[a-zA-Z0-9_-]+$/.test(trimmedName)) {
        return { success: false, error: 'Nome de workspace invalido' };
      }

      const oldWorkspaceName = path.basename(worktreePath);
      if (oldWorkspaceName === trimmedName) {
        return {
          success: true,
          workspace: {
            name: oldWorkspaceName,
            path: worktreePath,
            branch: `refs/heads/${oldWorkspaceName}`,
          },
        };
      }

      const newWorktreePath = path.join(path.dirname(worktreePath), trimmedName);
      if (fs.existsSync(newWorktreePath)) {
        return { success: false, error: `Workspace ja existe: ${trimmedName}` };
      }

      const git = simpleGit(projectPath);
      const worktreesRaw = await git.raw(['worktree', 'list', '--porcelain']);
      const lines = worktreesRaw.split('\n').filter((line) => line.trim());

      let currentPath = '';
      let currentBranchRef = '';

      for (const line of lines) {
        if (line.startsWith('worktree ')) {
          currentPath = line.replace('worktree ', '');
          continue;
        }

        if (line.startsWith('branch ') && currentPath === worktreePath) {
          currentBranchRef = line.replace('branch ', '');
          break;
        }
      }

      const sourceBranchName = currentBranchRef.replace(/^refs\/heads\//, '') || oldWorkspaceName;

      await git.raw(['worktree', 'move', worktreePath, newWorktreePath]);
      await git.branch(['-m', sourceBranchName, trimmedName]);

      return {
        success: true,
        workspace: {
          name: trimmedName,
          path: newWorktreePath,
          branch: `refs/heads/${trimmedName}`,
        },
      };
    } catch (error) {
      console.error('Erro ao renomear worktree:', error);
      return {
        success: false,
        error: error.message || 'Erro ao renomear workspace',
      };
    }
  });

  ipcMain.handle('git:getWorktreeChanges', async (_event, { worktreePath }) => {
    try {
      if (!worktreePath) {
        return { success: false, error: 'Caminho do workspace nao fornecido', files: [] };
      }

      if (!fs.existsSync(worktreePath)) {
        return { success: false, error: 'Workspace nao encontrado no disco', files: [] };
      }

      const git = simpleGit(worktreePath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Workspace nao e um repositorio Git valido', files: [] };
      }

      const [unstagedRaw, stagedRaw, status] = await Promise.all([
        git.raw(['diff', '--numstat', '--']),
        git.raw(['diff', '--cached', '--numstat', '--']),
        git.status(),
      ]);

      const filesMap = parseNumstat(unstagedRaw);
      const stagedMap = parseNumstat(stagedRaw);

      stagedMap.forEach((stats, filePath) => {
        const current = filesMap.get(filePath) || { path: filePath, added: 0, removed: 0 };
        current.added += stats.added;
        current.removed += stats.removed;
        filesMap.set(filePath, current);
      });

      const ensureFile = (filePath) => {
        if (!filePath) {
          return;
        }

        if (!filesMap.has(filePath)) {
          filesMap.set(filePath, { path: filePath, added: 0, removed: 0 });
        }
      };

      status.not_added.forEach(ensureFile);
      status.created.forEach(ensureFile);
      status.deleted.forEach(ensureFile);
      status.modified.forEach(ensureFile);
      status.staged.forEach(ensureFile);
      status.conflicted.forEach(ensureFile);
      status.renamed.forEach((entry) => ensureFile(entry.to || entry.from));

      const files = Array.from(filesMap.values())
        .sort((a, b) => {
          const totalA = a.added + a.removed;
          const totalB = b.added + b.removed;
          if (totalA !== totalB) {
            return totalB - totalA;
          }

          return a.path.localeCompare(b.path);
        });

      return {
        success: true,
        files,
      };
    } catch (error) {
      console.error('Erro ao obter alteracoes do workspace:', error);
      return {
        success: false,
        error: error.message || 'Erro ao obter alteracoes do workspace',
        files: [],
      };
    }
  });

  ipcMain.handle('git:commit', async (_event, { worktreePath, message }) => {
    try {
      if (!worktreePath) {
        return { success: false, error: 'Caminho do workspace nao fornecido' };
      }

      const commitMessage = String(message || '').trim();
      if (!commitMessage) {
        return { success: false, error: 'Mensagem de commit nao fornecida' };
      }

      if (!fs.existsSync(worktreePath)) {
        return { success: false, error: 'Workspace nao encontrado no disco' };
      }

      const git = simpleGit(worktreePath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Workspace nao e um repositorio Git valido' };
      }

      await git.add(['-A']);
      const status = await git.status();
      if (status.isClean()) {
        return { success: false, error: 'Nao ha alteracoes para commit' };
      }

      const result = await git.commit(commitMessage);
      return {
        success: true,
        commit: {
          hash: result.commit,
          summary: result.summary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao realizar commit',
      };
    }
  });

  ipcMain.handle('git:push', async (_event, { worktreePath }) => {
    try {
      if (!worktreePath) {
        return { success: false, error: 'Caminho do workspace nao fornecido' };
      }

      if (!fs.existsSync(worktreePath)) {
        return { success: false, error: 'Workspace nao encontrado no disco' };
      }

      const git = simpleGit(worktreePath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Workspace nao e um repositorio Git valido' };
      }

      await git.push();
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao realizar push',
      };
    }
  });

  ipcMain.handle('git:commitAndPush', async (_event, { worktreePath, message }) => {
    try {
      if (!worktreePath) {
        return { success: false, error: 'Caminho do workspace nao fornecido' };
      }

      const commitMessage = String(message || '').trim();
      if (!commitMessage) {
        return { success: false, error: 'Mensagem de commit nao fornecida' };
      }

      if (!fs.existsSync(worktreePath)) {
        return { success: false, error: 'Workspace nao encontrado no disco' };
      }

      const git = simpleGit(worktreePath);
      const isRepo = await git.checkIsRepo();
      if (!isRepo) {
        return { success: false, error: 'Workspace nao e um repositorio Git valido' };
      }

      await git.add(['-A']);
      const status = await git.status();
      if (status.isClean()) {
        return { success: false, error: 'Nao ha alteracoes para commit' };
      }

      const result = await git.commit(commitMessage);
      await git.push();

      return {
        success: true,
        commit: {
          hash: result.commit,
          summary: result.summary,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Erro ao realizar commit e push',
      };
    }
  });

  ipcMain.handle('shell:openPath', async (_event, filePath) => {
    return shell.openPath(filePath);
  });

  ipcMain.handle('terminal:listSessions', async (_event, payload) => {
    const workspacePath = typeof payload === 'string' ? payload : payload?.workspacePath;

    if (!workspacePath) {
      return { success: false, error: 'Workspace nao informado', sessions: [] };
    }

    return {
      success: true,
      sessions: listSerializedSessions(workspacePath),
    };
  });

  ipcMain.handle('terminal:launchSession', async (_event, options = {}) => {
    const {
      workspacePath,
      editor = 'codex',
      provider = null,
      model = '',
      yoloMode = false,
      cols = 120,
      rows = 32,
    } = options;

    if (!workspacePath) {
      return { success: false, error: 'Workspace nao informado', session: null, sessions: [] };
    }

    if (!editor) {
      return { success: false, error: 'Editor nao informado', session: null, sessions: [] };
    }

    if (!fs.existsSync(workspacePath)) {
      return { success: false, error: 'Workspace nao encontrado no disco', session: null, sessions: [] };
    }

    try {
      const launchFingerprint = buildLaunchFingerprint({
        editor,
        provider,
        model,
        yoloMode,
      });
      const launchConfig = resolveLaunchConfiguration({
        workspacePath,
        editor,
        provider,
        model,
        yoloMode,
      });

      const session = createEmbeddedTerminalSession({
        workspacePath,
        editor,
        command: launchConfig.command,
        launchFingerprint,
        envOverrides: launchConfig.envOverrides,
        provider,
        model,
        yoloMode,
        cols,
        rows,
      });

      return {
        success: true,
        session: serializeEmbeddedSession(session),
        sessions: listSerializedSessions(workspacePath),
      };
    } catch (error) {
      console.error('Erro ao criar sessao de terminal:', error);

      sendTerminalEvent('terminal:error', {
        sessionId: null,
        workspacePath,
        editor,
        message: error.message || 'Erro ao criar sessao de terminal',
      });

      return {
        success: false,
        error: error.message || 'Erro ao criar sessao de terminal',
        session: null,
        sessions: [],
      };
    }
  });

  ipcMain.handle('terminal:write', async (_event, payload = {}) => {
    const { sessionId, data = '' } = payload;
    const session = embeddedTerminalSessionsById.get(sessionId);

    if (!session) {
      return { success: false, error: 'Sessao nao encontrada' };
    }

    if (!session.ptyProcess) {
      return { success: false, error: 'Sessao encerrada' };
    }

    try {
      session.ptyProcess.write(data);
      return { success: true };
    } catch (error) {
      console.error('Erro ao escrever no terminal:', error);
      return { success: false, error: error.message || 'Erro ao escrever no terminal' };
    }
  });

  ipcMain.handle('terminal:resize', async (_event, payload = {}) => {
    const { sessionId, cols = 120, rows = 32 } = payload;
    const session = embeddedTerminalSessionsById.get(sessionId);

    if (!session) {
      return { success: false, error: 'Sessao nao encontrada' };
    }

    if (!session.ptyProcess) {
      return { success: true };
    }

    try {
      session.ptyProcess.resize(
        Math.max(cols || 120, 40),
        Math.max(rows || 32, 12)
      );

      return { success: true };
    } catch (error) {
      console.error('Erro ao redimensionar terminal:', error);
      return { success: false, error: error.message || 'Erro ao redimensionar terminal' };
    }
  });

  ipcMain.handle('terminal:close', async (_event, payload = {}) => {
    const { sessionId } = payload;
    const session = embeddedTerminalSessionsById.get(sessionId);

    if (!session) {
      return { success: true };
    }

    destroyEmbeddedSession(session);
    return { success: true };
  });

  ipcMain.handle('shell:openTerminal', async (_event, dirPath) => {
    try {
      if (process.platform === 'win32') {
        try {
          const wt = spawn('wt', ['-d', dirPath], {
            detached: false,
            stdio: 'ignore',
          });
          terminalProcesses.push(wt);

          wt.on('exit', () => {
            const index = terminalProcesses.indexOf(wt);
            if (index > -1) {
              terminalProcesses.splice(index, 1);
            }
          });

          return { success: true };
        } catch (_error) {
          const cmd = spawn('cmd.exe', ['/k', 'cd', '/d', dirPath], {
            detached: false,
            stdio: 'ignore',
          });
          terminalProcesses.push(cmd);

          cmd.on('exit', () => {
            const index = terminalProcesses.indexOf(cmd);
            if (index > -1) {
              terminalProcesses.splice(index, 1);
            }
          });

          return { success: true };
        }
      }

      const detachedShell = spawn(getShellCommand(), getShellArgs(), {
        cwd: dirPath,
        detached: false,
        stdio: 'ignore',
      });

      terminalProcesses.push(detachedShell);
      detachedShell.on('exit', () => {
        const index = terminalProcesses.indexOf(detachedShell);
        if (index > -1) {
          terminalProcesses.splice(index, 1);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao abrir terminal:', error);
      return { success: false, error: error.message };
    }
  });

  ipcMain.handle('shell:runCommandInTerminal', async (_event, dirPath, command) => {
    try {
      if (process.platform === 'win32') {
        try {
          const wt = spawn('wt', ['-d', dirPath, 'cmd.exe', '/k', `${command}`], {
            detached: false,
            stdio: 'ignore',
          });
          terminalProcesses.push(wt);

          wt.on('exit', () => {
            const index = terminalProcesses.indexOf(wt);
            if (index > -1) {
              terminalProcesses.splice(index, 1);
            }
          });

          return { success: true };
        } catch (_error) {
          const cmd = spawn('cmd.exe', ['/k', 'cd', '/d', dirPath, '&&', command], {
            detached: false,
            stdio: 'ignore',
          });
          terminalProcesses.push(cmd);

          cmd.on('exit', () => {
            const index = terminalProcesses.indexOf(cmd);
            if (index > -1) {
              terminalProcesses.splice(index, 1);
            }
          });

          return { success: true };
        }
      }

      const detachedShell = spawn(getShellCommand(), getShellArgs(), {
        cwd: dirPath,
        detached: false,
        stdio: 'ignore',
      });

      terminalProcesses.push(detachedShell);
      detachedShell.on('exit', () => {
        const index = terminalProcesses.indexOf(detachedShell);
        if (index > -1) {
          terminalProcesses.splice(index, 1);
        }
      });

      return { success: true };
    } catch (error) {
      console.error('Erro ao executar comando no terminal:', error);
      return { success: false, error: error.message };
    }
  });

  // Configurar settings.json do Claude Code com modelo selecionado
  ipcMain.handle('claudecode:configureModel', async (_event, modelName) => {
    try {
      // Caminho do settings.json do Claude Code
      // Windows: %APPDATA%\Code\User\globalStorage\anthropic.claude-code\settings.json
      const appData = process.env.APPDATA || path.join(process.env.HOME || '', '.config');
      const claudeCodeSettingsPath = path.join(
        appData,
        'Code',
        'User',
        'globalStorage',
        'anthropic.claude-code',
        'settings.json'
      );

      // Tenta ler o settings.json existente
      let settings = {};
      try {
        if (fs.existsSync(claudeCodeSettingsPath)) {
          const content = fs.readFileSync(claudeCodeSettingsPath, 'utf-8');
          settings = JSON.parse(content);
        }
      } catch (parseError) {
        console.log('Erro ao ler settings.json, criando novo:', parseError);
        settings = {};
      }

      // Configura as variáveis de ambiente no nó "env"
      if (!settings.env) {
        settings.env = {};
      }

      // Adiciona/atualiza as variáveis de ambiente com o modelo selecionado
      settings.env.ANTHROPIC_MODEL = modelName;
      settings.env.ANTHROPIC_SMALL_FAST_MODEL = modelName;
      settings.env.ANTHROPIC_DEFAULT_SONNET_MODEL = modelName;
      settings.env.ANTHROPIC_DEFAULT_OPUS_MODEL = modelName;
      settings.env.ANTHROPIC_DEFAULT_HAIKU_MODEL = modelName;
      settings.env.API_TIMEOUT_MS = '3000000';

      // Garante que o diretório existe
      const settingsDir = path.dirname(claudeCodeSettingsPath);
      if (!fs.existsSync(settingsDir)) {
        fs.mkdirSync(settingsDir, { recursive: true });
      }

      // Escreve o settings.json
      fs.writeFileSync(claudeCodeSettingsPath, JSON.stringify(settings, null, 2), 'utf-8');

      return {
        success: true,
        path: claudeCodeSettingsPath,
        message: `Claude Code configurado com modelo: ${modelName}`,
      };
    } catch (error) {
      console.error('Erro ao configurar Claude Code:', error);
      return {
        success: false,
        error: error.message || 'Erro ao configurar Claude Code',
      };
    }
  });
}

function setupGlobalShortcuts() {
  app.on('browser-window-created', (_event, window) => {
    window.webContents.on('before-input-event', (_beforeInputEvent, input) => {
      if (input.key === 'F12' && !input.isAutoRepeat) {
        if (window.webContents.isDevToolsOpened()) {
          window.webContents.closeDevTools();
        } else {
          window.webContents.openDevTools();
        }
      }
    });
  });
}

app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  setupGlobalShortcuts();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
