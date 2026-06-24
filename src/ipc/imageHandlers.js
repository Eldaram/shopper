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
      type: 'question',
      buttons: ['Garder le brouillon', 'Annuler', 'Abandonner'],
      defaultId: 0,
      cancelId: 1,
      title: 'Changement de page',
      message: 'Vous avez des modifications non enregistrées. Que voulez-vous faire ?',
      detail: 'Si vous quittez sans sauvegarder, vos modifications seront perdues.',
    });
    return result.response;
  },
};
