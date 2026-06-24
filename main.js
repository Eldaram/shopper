const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

const DatabaseController = require('./src/controllers/DatabaseController');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  return mainWindow;
}

function initializeApp() {
  const isPrimaryInstance = app.requestSingleInstanceLock();
  if (!isPrimaryInstance) {
    app.quit();
    return false;
  }

  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(() => {
    // Initialize Database
    DatabaseController.start();

    // Register IPC handlers
    ipcMain.handle('ping', () => 'pong');

    createWindow();

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    DatabaseController.shutdown();
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  return true;
}

// Only start the app if not running in a test environment
if (process.env.NODE_ENV !== 'test') {
  initializeApp();
}

module.exports = {
  createWindow,
  initializeApp,
  getMainWindow: () => mainWindow,
};
