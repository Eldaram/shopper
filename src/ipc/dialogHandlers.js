const { dialog } = require('electron');

module.exports = {
  'show-exit-dialog': async (event, mode) => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const TranslationController = require('../controllers/TranslationController');
    const t = (key) =>
      TranslationController.getText(TranslationController.getCurrentLanguage(), key);

    if (mode === 'product_create' || mode === true) {
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'question',
        buttons: [t('keep_draft'), t('cancel'), t('abandon')],
        defaultId: 0,
        cancelId: 1,
        title: t('creation_exit_title'),
        message: t('creation_exit_msg'),
        detail: t('creation_exit_detail'),
      });
      return result.response;
    } else if (mode === 'category') {
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: [t('abandon'), t('stay')],
        defaultId: 1,
        cancelId: 1,
        title: t('unsaved_changes_category_title'),
        message: t('unsaved_changes_category_msg'),
        detail: t('unsaved_changes_category_detail'),
      });
      return result.response;
    } else if (mode === 'tva') {
      const result = await dialog.showMessageBox(mainWindow, {
        type: 'warning',
        buttons: [t('abandon'), t('stay')],
        defaultId: 1,
        cancelId: 1,
        title: t('unsaved_changes_tva_title'),
        message: t('unsaved_changes_tva_msg'),
        detail: t('unsaved_changes_tva_detail'),
      });
      return result.response;
    } else {
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
    }
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

  'show-delete-category-dialog': async (event, categoryName) => {
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
      title: t('delete_category_title'),
      message: t('delete_category_msg').replace('{categoryName}', categoryName),
      detail: t('delete_category_detail'),
    });
    return result.response === 0;
  },
};
