const { dialog } = require('electron');

module.exports = {
  'show-exit-dialog': async () => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Abandonner', 'Rester'],
      defaultId: 1,
      cancelId: 1,
      title: 'Modifications non enregistrées',
      message: 'Voulez-vous abandonner vos modifications ?',
      detail: 'Si vous quittez, toutes les modifications non enregistrées seront perdues.',
    });
    return result.response;
  },

  'show-delete-confirm-dialog': async (event, productName) => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Supprimer', 'Annuler'],
      defaultId: 1,
      cancelId: 1,
      title: 'Suppression de produit',
      message: `Voulez-vous vraiment supprimer le produit "${productName}" ?`,
      detail: "Cette action est irréversible (le produit sera masqué de l'inventaire).",
    });
    return result.response === 0;
  },

  'show-clear-basket-dialog': async () => {
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const result = await dialog.showMessageBox(mainWindow, {
      type: 'warning',
      buttons: ['Vider le panier', 'Annuler'],
      defaultId: 1,
      cancelId: 1,
      title: 'Vider le panier',
      message: 'Voulez vous vraiment vider tout le panier ?',
    });
    return result.response === 0;
  },
};
