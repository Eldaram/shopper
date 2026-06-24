const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const log = require('./src/utils/logger');

const DatabaseController = require('./src/controllers/DatabaseController');

const bindHandlers = require('./src/ipc/binder');
const categoryHandlers = require('./src/ipc/categoryHandlers');
const productHandlers = require('./src/ipc/productHandlers');
const tvaHandlers = require('./src/ipc/tvaHandlers');

// Global error nets for main process
process.on('uncaughtException', (error) => {
  log.error('Uncaught Exception in Main Process:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled Rejection in Main Process at:', promise, 'reason:', reason);
});

let mainWindow;

function createWindow() {
  log.info('Creating main BrowserWindow...');
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
    log.info('Loading dev server URL: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    log.info('Loading production file: dist/index.html');
    mainWindow.loadFile(path.join(__dirname, 'dist/index.html'));
  }

  return mainWindow;
}

function initializeApp() {
  const isPrimaryInstance = app.requestSingleInstanceLock();
  if (!isPrimaryInstance) {
    log.warn('Second instance detected. Quitting...');
    app.quit();
    return false;
  }

  log.info('Application starting, single instance lock acquired.');

  app.on('second-instance', () => {
    log.info('Second instance requested focus.');
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  // Global crash handlers
  app.on('render-process-gone', (event, webContents, details) => {
    log.error(
      `Render process gone. WebContents ID: ${webContents.id}. Reason: ${details.reason}, Exit Code: ${details.exitCode}`
    );
  });

  app.on('child-process-gone', (event, details) => {
    log.error(
      `Child process gone. Reason: ${details.reason}, Exit Code: ${details.exitCode}, Name: ${details.name}`
    );
  });

  app.whenReady().then(() => {
    log.info('App is ready. Initializing database...');
    // Initialize Database
    DatabaseController.start();

    // Register IPC handlers
    bindHandlers(ipcMain, [categoryHandlers, productHandlers, tvaHandlers]);

    createWindow();

    app.on('activate', () => {
      log.info('App activated (macOS).');
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  });

  app.on('window-all-closed', () => {
    log.info('All windows closed. Shutting down database.');
    DatabaseController.shutdown();
    if (process.platform !== 'darwin') {
      log.info('Quitting application.');
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
