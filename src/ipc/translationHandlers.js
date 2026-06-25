const TranslationController = require('../controllers/TranslationController');

module.exports = {
  'get-available-languages': () => TranslationController.getAvailableLanguages(),
  'get-language-details': (event, code) => TranslationController.getLanguageDetails(code),
  'get-text': (event, textCode) => TranslationController.getTextForRenderer(textCode),
  'get-current-language': () => TranslationController.getCurrentLanguage(),
  'set-current-language': (event, code) => TranslationController.setCurrentLanguage(code),
};
