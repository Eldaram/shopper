const Store = require('../utils/Store');

class ThemeController {
  constructor() {
    this.store = new Store({
      configName: 'user-preferences',
      defaults: {
        theme: 'dark',
      },
    });
  }

  getTheme() {
    let theme = this.store.get('theme');
    if (!theme) {
      theme = 'dark';
      this.store.set('theme', theme);
    }
    return theme;
  }

  setTheme(theme) {
    if (theme !== 'light' && theme !== 'dark') {
      throw new Error(`Invalid theme: ${theme}`);
    }
    this.store.set('theme', theme);
    return theme;
  }
}

module.exports = new ThemeController();
