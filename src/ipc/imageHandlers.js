const { dialog, app } = require('electron');
const fs = require('fs');
const path = require('path');
const log = require('../utils/logger');

module.exports = {
  'select-image': async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      filters: [{ name: 'Images', extensions: ['jpg', 'png', 'gif', 'webp', 'jpeg'] }],
      properties: ['openFile'],
    });
    if (canceled || filePaths.length === 0) {
      return null;
    }
    const filePath = filePaths[0];
    const data = fs.readFileSync(filePath);
    const base64 = data.toString('base64');
    const ext = path.extname(filePath).replace('.', '');
    return {
      path: filePath,
      preview: `data:image/${ext};base64,${base64}`,
    };
  },

  'save-image': async (event, sourcePath) => {
    try {
      const ext = path.extname(sourcePath);
      const filename = `img_${Date.now()}${ext}`;
      const destDir = path.join(app.getPath('userData'), 'product-images');
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      const destPath = path.join(destDir, filename);
      fs.copyFileSync(sourcePath, destPath);
      return `media://${filename}`;
    } catch (err) {
      log.error('Error saving image:', err);
      throw err;
    }
  },

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
      detail: 'Cette action est irréversible (le produit sera masqué de l\'inventaire).',
    });
    return result.response === 0;
  },
};
