const ThemeController = require('../controllers/ThemeController');

module.exports = {
  'get-current-theme': () => ThemeController.getTheme(),
  'set-current-theme': (event, theme) => ThemeController.setTheme(theme),
};
