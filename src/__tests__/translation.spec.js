import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import path from 'path';
import fs from 'fs';

import Module from 'module';

// Hijack Node's require to intercept 'electron' imports in CommonJS
const mockElectron = {
  app: {
    getPath: vi.fn().mockReturnValue('mock-path'),
    on: vi.fn(),
    requestSingleInstanceLock: vi.fn().mockReturnValue(true),
  },
  protocol: {
    registerSchemesAsPrivileged: vi.fn(),
    handle: vi.fn(),
  },
  ipcMain: {
    handle: vi.fn(),
    on: vi.fn(),
  },
  Menu: {
    buildFromTemplate: vi.fn().mockReturnValue({}),
    setApplicationMenu: vi.fn(),
  },
  net: {
    fetch: vi.fn(),
  },
  BrowserWindow: class MockBrowserWindow {
    constructor() {
      this.webContents = {
        send: vi.fn(),
      };
    }
  }
};

const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return mockElectron;
  }
  return originalRequire.apply(this, arguments);
};

const TranslationParser = require('../models/TranslationParser');
const TranslationModel = require('../models/TranslationModel');
const TranslationController = require('../controllers/TranslationController');

describe('Translation Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('TranslationParser', () => {
    it('should parse the translations JSON and return available codes', () => {
      const codes = TranslationParser.getAvailableCodes();
      expect(codes).toContain('fr');
      expect(codes).toContain('en');
    });

    it('should return correct language details', () => {
      const frDetails = TranslationParser.getDetails('fr');
      expect(frDetails).toEqual({ name: 'Français', flag: '🇫🇷' });

      const enDetails = TranslationParser.getDetails('en');
      expect(enDetails).toEqual({ name: 'English', flag: '🇬🇧' });

      expect(TranslationParser.getDetails('invalid')).toBeNull();
    });

    it('should return correct translated texts', () => {
      const frText = TranslationParser.getText('fr', 'categories');
      expect(frText).toBe('Catégories');

      const enText = TranslationParser.getText('en', 'categories');
      expect(enText).toBe('Categories');

      // Fallback to key if not found
      expect(TranslationParser.getText('fr', 'non_existent_key')).toBe('non_existent_key');
    });
  });

  describe('TranslationModel', () => {
    it('should implement the three functions exactly', () => {
      expect(TranslationModel.getAvailableLanguages).toBeDefined();
      expect(TranslationModel.getLanguageDetails).toBeDefined();
      expect(TranslationModel.getText).toBeDefined();

      expect(TranslationModel.getAvailableLanguages()).toContain('fr');
      expect(TranslationModel.getLanguageDetails('en')).toEqual({ name: 'English', flag: '🇬🇧' });
      expect(TranslationModel.getText('en', 'basket')).toBe('Basket');
    });
  });

  describe('TranslationController', () => {
    beforeEach(() => {
      TranslationController.setCurrentLanguage('fr');
    });

    it('should know and return the current language', () => {
      expect(TranslationController.getCurrentLanguage()).toBe('fr');
    });

    it('should update the current language when setCurrentLanguage is called', () => {
      TranslationController.setCurrentLanguage('en');
      expect(TranslationController.getCurrentLanguage()).toBe('en');

      TranslationController.setCurrentLanguage('fr');
      expect(TranslationController.getCurrentLanguage()).toBe('fr');
    });

    it('should throw an error for unsupported languages', () => {
      expect(() => TranslationController.setCurrentLanguage('de')).toThrow();
    });

    it('should return translated text based on active language for renderer', () => {
      TranslationController.setCurrentLanguage('fr');
      expect(TranslationController.getTextForRenderer('basket')).toBe('Panier');

      TranslationController.setCurrentLanguage('en');
      expect(TranslationController.getTextForRenderer('basket')).toBe('Basket');
    });
  });
});
