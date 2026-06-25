const fs = require('fs');
const path = require('path');

class TranslationParser {
  constructor() {
    this.jsonPath = path.join(__dirname, '../database/translations.json');
    this.data = this.loadJson();
  }

  loadJson() {
    try {
      if (fs.existsSync(this.jsonPath)) {
        const content = fs.readFileSync(this.jsonPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.error('TranslationParser: Failed to load translations JSON:', error);
    }
    return { header: { languages: [] }, texts: {} };
  }

  getAvailableCodes() {
    const langs = this.data?.header?.languages || [];
    return langs.map((l) => l.code);
  }

  getDetails(code) {
    const langs = this.data?.header?.languages || [];
    const lang = langs.find((l) => l.code === code);
    if (!lang) return null;
    return {
      name: lang.name,
      flag: lang.flag,
    };
  }

  getText(code, textCode) {
    const textObj = this.data?.texts?.[textCode];
    if (!textObj) {
      return textCode; // fallback to key
    }
    return textObj[code] || textObj['en'] || textCode;
  }
}

module.exports = new TranslationParser();
