import { describe, it, expect, vi, beforeEach } from 'vitest';
import path from 'path';
import Module from 'module';

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
  }
};
mockElectron.BrowserWindow.lastInstance = null;

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return mockElectron;
  }
  return originalRequire.apply(this, arguments);
};

// Now import the main.js module under test
const { createWindow, initializeApp } = require('../../main.js');

describe('Electron Main Process', () => {
  beforeEach(() => {
    mockElectron.BrowserWindow.lastInstance = null;
    mockElectron.app.isPackaged = false;
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
      expect(win.webContents.openDevTools).not.toHaveBeenCalled();
    });

    it('should load index.html in production mode', () => {
      mockElectron.app.isPackaged = true;
      process.env.NODE_ENV = 'production';
      const win = createWindow();
      expect(win.loadFile).toHaveBeenCalledWith(expect.stringContaining(path.join('dist', 'index.html')));
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
});
