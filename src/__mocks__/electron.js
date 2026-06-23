const app = {
  isPackaged: false,
  whenReady: () => Promise.resolve(),
  on: () => {},
  quit: () => {},
};

class BrowserWindow {
  constructor(options) {
    this.options = options;
    BrowserWindow.lastInstance = this;
  }
  loadURL() {}
  loadFile() {}
  webContents = {
    openDevTools: () => {},
  };
}
BrowserWindow.lastInstance = null;

module.exports = {
  app,
  BrowserWindow,
};
