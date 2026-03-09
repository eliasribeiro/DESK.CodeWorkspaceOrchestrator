const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

// Armazena referência da janela para evitar garbage collection
let mainWindow = null;

/**
 * Cria a janela principal do aplicativo
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Remove barra de título padrão do sistema
    backgroundColor: '#1e293b', // Cor de fundo inicial (dark mode)
    webPreferences: {
      preload: path.join(__dirname, '../preload/preload.cjs'),
      contextIsolation: true, // Isola o contexto para segurança
      nodeIntegration: false, // Desabilita Node.js no renderer por segurança
    },
    // Ícone do aplicativo (opcional)
    // icon: path.join(__dirname, '../assets/icon.png'),
  });

  // Carrega a aplicação React
  if (process.env.NODE_ENV === 'development' || process.env.DEV_SERVER) {
    // Em desenvolvimento, carrega do servidor Vite
    mainWindow.loadURL('http://localhost:5173');
    // Abre DevTools automaticamente em desenvolvimento
    mainWindow.webContents.openDevTools();
  } else {
    // Em produção, carrega o build estático
    // __dirname é src/main, então ../../dist/index.html
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }

  // Previne navegação para URLs externas
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Permite apenas navegação interna
    return { action: 'deny' };
  });

  // Evento quando a janela é fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

/**
 * Configura os listeners IPC para comunicação com o renderer
 */
function setupIpcHandlers() {
  // Minimizar janela
  ipcMain.on('window:minimize', () => {
    if (mainWindow) {
      mainWindow.minimize();
    }
  });

  // Maximizar/Restaurar janela
  ipcMain.on('window:maximize', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
      } else {
        mainWindow.maximize();
      }
    }
  });

  // Fechar janela
  ipcMain.on('window:close', () => {
    if (mainWindow) {
      mainWindow.close();
    }
  });

  // Alternar DevTools (atalho F12)
  ipcMain.on('devtools:toggle', () => {
    if (mainWindow) {
      if (mainWindow.webContents.isDevToolsOpened()) {
        mainWindow.webContents.closeDevTools();
      } else {
        mainWindow.webContents.openDevTools();
      }
    }
  });

  // Handler para verificar se a janela está maximizada
  ipcMain.handle('window:isMaximized', () => {
    return mainWindow ? mainWindow.isMaximized() : false;
  });

  // Abrir dialog para selecionar pasta
  ipcMain.handle('dialog:openDirectory', async () => {
    if (!mainWindow) return null;
    
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    return result.filePaths[0];
  });
}

/**
 * Configura atalhos globais de teclado
 */
function setupGlobalShortcuts() {
  // Atalho F12 para DevTools
  app.on('browser-window-created', (event, window) => {
    window.webContents.on('before-input-event', (event, input) => {
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

// Quando o Electron estiver pronto
app.whenReady().then(() => {
  createWindow();
  setupIpcHandlers();
  setupGlobalShortcuts();

  // Em macOS, recria a janela quando o dock é clicado
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Fecha o aplicativo quando todas as janelas são fechadas (exceto em macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Segurança: previne múltiplas instâncias
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Foca na janela existente se tentar abrir outra instância
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
