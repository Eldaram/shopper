const fs = require('fs');
const path = require('path');
const { app } = require('electron');

class Store {
  constructor(opts = {}) {
    let userDataPath = '';
    try {
      userDataPath = app.getPath('userData');
    } catch (e) {
      // Fallback for tests or when app is not fully initialized
      userDataPath = path.join(__dirname, '../../__mocks__');
    }

    // Ensure the folder exists if it's a real path
    if (userDataPath && userDataPath !== 'mock-path') {
      try {
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
      } catch (err) {
        console.error('Failed to create store directory:', err);
      }
    }

    const configName = opts.configName || 'config';
    this.path = path.join(userDataPath, `${configName}.json`);
    this.defaults = opts.defaults || {};
    this.data = this.loadData();
  }

  loadData() {
    if (this.path.includes('mock-path')) {
      return { ...this.defaults };
    }
    try {
      if (fs.existsSync(this.path)) {
        const content = fs.readFileSync(this.path, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('Store: Failed to read settings file, returning defaults', error);
    }
    return { ...this.defaults };
  }

  get(key) {
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    if (this.path.includes('mock-path')) {
      return;
    }
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data, null, 2), 'utf8');
    } catch (error) {
      console.error('Store: Failed to save settings file', error);
    }
  }
}

module.exports = Store;
