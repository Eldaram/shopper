let appInstance;
let BrowserWindowMock;
let ipcMainInstance;
let ipcRendererInstance;
let contextBridgeInstance;

module.exports = {
  get app() {
    if (!appInstance) {
      appInstance = {
        isPackaged: false,
        whenReady: () => Promise.resolve(),
        on: vi.fn(),
        quit: vi.fn(),
        requestSingleInstanceLock: vi.fn().mockReturnValue(true),
        getPath: vi.fn().mockReturnValue('mock-path'),
      };
    }
    return appInstance;
  },
  get BrowserWindow() {
    if (!BrowserWindowMock) {
      BrowserWindowMock = class MockBrowserWindow {
        constructor(options) {
          this.options = options;
          MockBrowserWindow.lastInstance = this;
        }
        loadURL = vi.fn();
        loadFile = vi.fn();
        webContents = {
          openDevTools: vi.fn(),
        };
      };
      BrowserWindowMock.lastInstance = null;
    }
    return BrowserWindowMock;
  },
  get ipcMain() {
    if (!ipcMainInstance) {
      ipcMainInstance = {
        handle: vi.fn(),
        removeHandler: vi.fn(),
        on: vi.fn(),
      };
    }
    return ipcMainInstance;
  },
  get ipcRenderer() {
    if (!ipcRendererInstance) {
      ipcRendererInstance = {
        invoke: vi.fn().mockResolvedValue('pong'),
        send: vi.fn(),
      };
    }
    return ipcRendererInstance;
  },
  get contextBridge() {
    if (!contextBridgeInstance) {
      contextBridgeInstance = {
        exposeInMainWorld: vi.fn(),
      };
    }
    return contextBridgeInstance;
  },
  get protocol() {
    return {
      registerSchemesAsPrivileged: vi.fn(),
      handle: vi.fn(),
    };
  },
  get Menu() {
    return {
      buildFromTemplate: vi.fn().mockReturnValue({}),
      setApplicationMenu: vi.fn(),
    };
  },
  get net() {
    return {
      fetch: vi.fn(),
    };
  },
};
