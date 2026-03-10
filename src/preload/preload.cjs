const { contextBridge, ipcRenderer } = require('electron');

const subscribe = (channel, callback) => {
  const listener = (_event, payload) => callback(payload);
  ipcRenderer.on(channel, listener);
  return () => ipcRenderer.removeListener(channel, listener);
};

contextBridge.exposeInMainWorld('electronAPI', {
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized'),
  },

  dialog: {
    openDirectory: () => ipcRenderer.invoke('dialog:openDirectory'),
  },

  preferences: {
    load: () => ipcRenderer.invoke('preferences:load'),
    save: (preferences) => ipcRenderer.invoke('preferences:save', preferences),
  },

  git: {
    createWorktree: (options) => ipcRenderer.invoke('git:createWorktree', options),
    listWorktrees: (options) => ipcRenderer.invoke('git:listWorktrees', options),
    removeWorktree: (options) => ipcRenderer.invoke('git:removeWorktree', options),
    renameWorktree: (options) => ipcRenderer.invoke('git:renameWorktree', options),
    getWorktreeChanges: (options) => ipcRenderer.invoke('git:getWorktreeChanges', options),
    getWorktreeSyncStatus: (options) => ipcRenderer.invoke('git:getWorktreeSyncStatus', options),
    commit: (options) => ipcRenderer.invoke('git:commit', options),
    push: (options) => ipcRenderer.invoke('git:push', options),
    commitAndPush: (options) => ipcRenderer.invoke('git:commitAndPush', options),
  },

  shell: {
    openPath: (filePath) => ipcRenderer.invoke('shell:openPath', filePath),
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),
    openTerminal: (dirPath) => ipcRenderer.invoke('shell:openTerminal', dirPath),
    runCommandInTerminal: (dirPath, command) => ipcRenderer.invoke('shell:runCommandInTerminal', dirPath, command),
  },

  terminal: {
    listSessions: (payload) => ipcRenderer.invoke('terminal:listSessions', payload),
    closeWorkspaceSessions: (payload) => ipcRenderer.invoke('terminal:closeWorkspaceSessions', payload),
    launchSession: (options) => ipcRenderer.invoke('terminal:launchSession', options),
    write: (payload) => ipcRenderer.invoke('terminal:write', payload),
    resize: (payload) => ipcRenderer.invoke('terminal:resize', payload),
    close: (payload) => ipcRenderer.invoke('terminal:close', payload),
    onData: (callback) => subscribe('terminal:data', callback),
    onExit: (callback) => subscribe('terminal:exit', callback),
    onError: (callback) => subscribe('terminal:error', callback),
  },

  devTools: {
    toggle: () => ipcRenderer.send('devtools:toggle'),
  },

  platform: process.platform,

  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
  },
});
