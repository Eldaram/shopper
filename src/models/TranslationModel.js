const TranslationParser = require('./TranslationParser');

class TranslationModel {
  /**
   * Returns the list of available language codes.
   * @returns {string[]} ex: ['fr', 'en']
   */
  getAvailableLanguages() {
    return TranslationParser.getAvailableCodes();
  }

  /**
   * Returns the name and flag emote attached to a language code.
   * @param {string} code - The language code.
   * @returns {{name: string, flag: string}|null}
   */
  getLanguageDetails(code) {
    return TranslationParser.getDetails(code);
  }

  /**
   * Returns the text connected to a language code and a text-code.
   * @param {string} code - The language code.
   * @param {string} textCode - The key of the text.
   * @returns {string} The translated text.
   */
  getText(code, textCode) {
    return TranslationParser.getText(code, textCode);
  }
}

module.exports = new TranslationModel();
