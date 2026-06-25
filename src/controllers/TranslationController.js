const TranslationModel = require('../models/TranslationModel');
const Store = require('../utils/Store');

class TranslationController {
  constructor() {
    this.store = new Store({
      configName: 'user-preferences',
      defaults: {
        language: null,
      },
    });

    this.currentLanguage = this.initLanguage();
  }

  initLanguage() {
    let lang = this.store.get('language');
    const available = this.getAvailableLanguages();

    // 1. Check if the saved language is valid and available
    if (lang && available.includes(lang)) {
      return lang;
    }

    // 2. Default to 'fr' if it exists in available languages
    if (available.includes('fr')) {
      lang = 'fr';
    }
    // 3. Otherwise, default to the first one in the header list
    else if (available.length > 0) {
      lang = available[0];
    } else {
      lang = 'en'; // ultimate fallback
    }

    this.store.set('language', lang);
    return lang;
  }

  getAvailableLanguages() {
    return TranslationModel.getAvailableLanguages();
  }

  getLanguageDetails(code) {
    if (!code) throw new Error('Language code is required');
    return TranslationModel.getLanguageDetails(code);
  }

  getText(code, textCode) {
    if (!code) throw new Error('Language code is required');
    if (!textCode) throw new Error('Text code is required');
    return TranslationModel.getText(code, textCode);
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  setCurrentLanguage(code) {
    const available = this.getAvailableLanguages();
    if (!available.includes(code)) {
      throw new Error(`Language code ${code} is not supported`);
    }
    this.currentLanguage = code;
    this.store.set('language', code);

    // Rebuild app menu to update native menu labels on language change
    try {
      const mainModule = require('../../main');
      const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;
      if (mainWindow) {
        const MenuService = require('../services/MenuService');
        MenuService.setAppMenu(mainWindow);
      }
    } catch (e) {
      console.warn('Failed to rebuild application menu:', e);
    }

    return code;
  }

  getTextForRenderer(textCode) {
    return this.getText(this.currentLanguage, textCode);
  }
}

module.exports = new TranslationController();
