const { contextBridge, ipcRenderer } = require('electron');

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
