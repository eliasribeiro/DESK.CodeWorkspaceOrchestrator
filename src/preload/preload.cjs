const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

/**
 * Bridge segura para comunicação entre renderer e main process
 * Expõe apenas as APIs necessárias de forma controlada
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Controle da janela
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  // Diálogos do sistema
  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },

  // Operações Git
  git: {
    clone: (options) => ipcRenderer.invoke('git:clone', options),
    createWorktree: (options) => ipcRenderer.invoke('git:createWorktree', options),
    listWorktrees: (options) => ipcRenderer.invoke('git:listWorktrees', options),
    removeWorktree: (options) => ipcRenderer.invoke('git:removeWorktree', options),
  },

  // Shell
  shell: {
    openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
    openTerminal: (dirPath) => ipcRenderer.invoke('shell:openTerminal', dirPath),
    runCommandInTerminal: (dirPath, command) => ipcRenderer.invoke('shell:runCommandInTerminal', dirPath, command),
  },

  // Terminal embutido
  terminal: {
    listSessions: (payload) => ipcRenderer.invoke('terminal:listSessions', payload),
    launchSession: (options) => ipcRenderer.invoke('terminal:launchSession', options),
    write: (payload) => ipcRenderer.invoke('terminal:write', payload),
    resize: (payload) => ipcRenderer.invoke('terminal:resize', payload),
    close: (payload) => ipcRenderer.invoke('terminal:close', payload),
    onData: (callback) => subscribe('terminal:data', callback),
    onExit: (callback) => subscribe('terminal:exit', callback),
    onError: (callback) => subscribe('terminal:error', callback),
  },

  // DevTools
  devTools: {
    toggle: () => ipcRenderer.send('devtools:toggle'),
  },

  // Platform info
  platform: process.platform,

  // Versão do Electron
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
