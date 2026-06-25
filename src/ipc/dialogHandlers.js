const { dialog } = require('electron');

module.exports = {
  'show-exit-dialog': async () => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const TranslationController = require('../controllers/TranslationController');
    const t = (key) =>
      TranslationController.getText(TranslationController.getCurrentLanguage(), key);

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: [t('abandon'), t('stay')],
      defaultId: 1,
      cancelId: 1,
      title: t('unsaved_changes_title'),
      message: t('unsaved_changes_msg'),
      detail: t('unsaved_changes_detail'),
    });
    return result.response;
  },

  'show-delete-confirm-dialog': async (event, productName) => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const TranslationController = require('../controllers/TranslationController');
    const t = (key) =>
      TranslationController.getText(TranslationController.getCurrentLanguage(), key);

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: [t('delete'), t('cancel')],
      defaultId: 1,
      cancelId: 1,
      title: t('delete_product_title'),
      message: t('delete_product_msg').replace('{productName}', productName),
      detail: t('delete_product_detail'),
    });
    return result.response === 0;
  },

  'show-clear-basket-dialog': async () => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const TranslationController = require('../controllers/TranslationController');
    const t = (key) =>
      TranslationController.getText(TranslationController.getCurrentLanguage(), key);

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: [t('clear_basket_confirm'), t('cancel')],
      defaultId: 1,
      cancelId: 1,
      title: t('clear_basket_title'),
      message: t('clear_basket_msg'),
    });
    return result.response === 0;
  },
};
