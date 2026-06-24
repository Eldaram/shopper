import { describe, it, expect, vi, beforeEach } from 'vitest';
globalThis.vi = vi;
import path from 'path';
import Module from 'module';

// Mock electron-log to prevent test output clutter and log errors in test mode
const mockLogger = {
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn(),
  transports: {
    file: { level: 'debug', resolvePathFn: vi.fn() },
    console: { level: 'debug' },
  },
};
vi.mock('electron-log', () => {
  return {
    default: mockLogger,
    error: mockLogger.error,
    warn: mockLogger.warn,
    info: mockLogger.info,
    debug: mockLogger.debug,
    transports: mockLogger.transports,
  };
});

// Hijack Node's require to intercept 'electron' imports in CommonJS
const mockElectron = {
  app: {
    isPackaged: false,
    whenReady: () => Promise.resolve(),
    on: vi.fn(),
    quit: vi.fn(),
    requestSingleInstanceLock: vi.fn().mockReturnValue(true),
  },
  BrowserWindow: class MockBrowserWindow {
    constructor(options) {
      this.options = options;
      MockBrowserWindow.lastInstance = this;
    }
    loadURL = vi.fn();
    loadFile = vi.fn();
    webContents = {
      openDevTools: vi.fn(),
    };
  },
  ipcMain: {
    handle: vi.fn(),
    removeHandler: vi.fn(),
  },
};
mockElectron.BrowserWindow.lastInstance = null;

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return mockElectron;
  }
  if (id === 'electron-log' || id.includes('logger')) {
    return mockLogger;
  }
  return originalRequire.apply(this, arguments);
};

// Now import the main.js module under test
const { createWindow, initializeApp } = require('../../main.js');

describe('Electron Main Process', () => {
  beforeEach(() => {
    mockElectron.BrowserWindow.lastInstance = null;
    mockElectron.app.isPackaged = false;
    mockElectron.app.requestSingleInstanceLock.mockReturnValue(true);
    mockLogger.error.mockClear();
    mockLogger.warn.mockClear();
    mockLogger.info.mockClear();
    mockLogger.debug.mockClear();
    vi.clearAllMocks();
  });

  describe('Window Creation', () => {
    it('should create a BrowserWindow with webPreferences and correct dimensions', () => {
      const win = createWindow();
      expect(win).toBeDefined();
      expect(mockElectron.BrowserWindow.lastInstance).toBe(win);
      expect(win.options).toEqual({
        width: 800,
        height: 600,
        webPreferences: {
          preload: expect.stringContaining('preload.js'),
          contextIsolation: true,
          nodeIntegration: false,
        },
      });
    });

    it('should load localhost URL in development mode', () => {
      mockElectron.app.isPackaged = false;
      process.env.NODE_ENV = 'development';
      const win = createWindow();
      expect(win.loadURL).toHaveBeenCalledWith('http://localhost:5173');
      expect(win.webContents.openDevTools).toHaveBeenCalled();
    });

    it('should load index.html in production mode', () => {
      mockElectron.app.isPackaged = true;
      process.env.NODE_ENV = 'production';
      const win = createWindow();
      expect(win.loadFile).toHaveBeenCalledWith(
        expect.stringContaining(path.join('dist', 'index.html'))
      );
    });
  });

  describe('Single Instance Lock', () => {
    it('should continue initialization if primary instance', () => {
      mockElectron.app.requestSingleInstanceLock.mockReturnValue(true);

      const result = initializeApp();
      expect(result).toBe(true);
      expect(mockElectron.app.quit).not.toHaveBeenCalled();
      expect(mockElectron.app.on).toHaveBeenCalledWith('second-instance', expect.any(Function));
    });

    it('should quit the app if secondary instance', () => {
      mockElectron.app.requestSingleInstanceLock.mockReturnValue(false);

      const result = initializeApp();
      expect(result).toBe(false);
      expect(mockElectron.app.quit).toHaveBeenCalled();
    });
  });

  describe('Global Error Nets', () => {
    it('should register process exception and rejection handlers', () => {
      const uncaughtListeners = process.listeners('uncaughtException');
      const unhandledListeners = process.listeners('unhandledRejection');
      expect(uncaughtListeners.length).toBeGreaterThan(0);
      expect(unhandledListeners.length).toBeGreaterThan(0);
    });

    it('should register app crash handlers on initializeApp', () => {
      initializeApp();
      expect(mockElectron.app.on).toHaveBeenCalledWith('render-process-gone', expect.any(Function));
      expect(mockElectron.app.on).toHaveBeenCalledWith('child-process-gone', expect.any(Function));
    });

    it('should log render-process-gone details when triggered', () => {
      initializeApp();
      const renderGoneHandler = mockElectron.app.on.mock.calls.find(
        (call) => call[0] === 'render-process-gone'
      )[1];
      expect(renderGoneHandler).toBeDefined();

      const mockWebContents = { id: 101 };
      const mockDetails = { reason: 'crashed', exitCode: 139 };

      renderGoneHandler({}, mockWebContents, mockDetails);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Render process gone. WebContents ID: 101. Reason: crashed, Exit Code: 139'
        )
      );
    });

    it('should log child-process-gone details when triggered', () => {
      initializeApp();
      const childGoneHandler = mockElectron.app.on.mock.calls.find(
        (call) => call[0] === 'child-process-gone'
      )[1];
      expect(childGoneHandler).toBeDefined();

      const mockDetails = { reason: 'killed', exitCode: 1, name: 'gpu-process' };

      childGoneHandler({}, mockDetails);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining(
          'Child process gone. Reason: killed, Exit Code: 1, Name: gpu-process'
        )
      );
    });
  });

  describe('IPC Setup', () => {
    it('should register IPC handlers on initializeApp', async () => {
      initializeApp();
      await Promise.resolve();
      expect(mockElectron.ipcMain.handle).toHaveBeenCalledWith(
        'get-categories',
        expect.any(Function)
      );
      expect(mockElectron.ipcMain.handle).toHaveBeenCalledWith(
        'get-products',
        expect.any(Function)
      );
      expect(mockElectron.ipcMain.handle).toHaveBeenCalledWith(
        'get-tva-rates',
        expect.any(Function)
      );
    });
  });
});
