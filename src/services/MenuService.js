const { Menu, app } = require('electron');

class MenuService {
  setAppMenu(window) {
    const isMac = process.platform === 'darwin';
    const template = [
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about', label: 'À propos' },
                { type: 'separator' },
                { role: 'services', label: 'Services' },
                { type: 'separator' },
                { role: 'hide', label: 'Masquer' },
                { role: 'hideOthers', label: 'Masquer les autres' },
                { role: 'unhide', label: 'Tout afficher' },
                { type: 'separator' },
                { role: 'quit', label: 'Quitter' },
              ],
            },
          ]
        : []),
      {
        label: 'Fichier',
        submenu: [
          {
            label: 'Ajouter un item',
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              if (window && !window.isDestroyed()) {
                window.webContents.send('menu-create-product');
              }
            },
          },
          { type: 'separator' },
          isMac ? { role: 'close', label: 'Fermer' } : { role: 'quit', label: 'Quitter' },
        ],
      },
      {
        label: 'Édition',
        submenu: [
          { role: 'undo', label: 'Annuler' },
          { role: 'redo', label: 'Rétablir' },
          { type: 'separator' },
          { role: 'cut', label: 'Couper' },
          { role: 'copy', label: 'Copier' },
          { role: 'paste', label: 'Coller' },
          { role: 'selectAll', label: 'Tout sélectionner' },
        ],
      },
      {
        label: 'Affichage',
        submenu: [
          { role: 'reload', label: 'Recharger' },
          { role: 'forceReload', label: 'Forcer le rechargement' },
          { role: 'toggleDevTools', label: 'Outils de développement' },
          { type: 'separator' },
          { role: 'resetZoom', label: 'Réinitialiser le zoom' },
          { role: 'zoomIn', label: 'Zoom avant' },
          { role: 'zoomOut', label: 'Zoom arrière' },
          { type: 'separator' },
          { role: 'togglefullscreen', label: 'Plein écran' },
        ],
      },
      {
        label: 'Fenêtre',
        submenu: [
          { role: 'minimize', label: 'Réduire' },
          { role: 'zoom', label: 'Agrandir' },
          ...(isMac
            ? [
                { type: 'separator' },
                { role: 'front', label: 'Tout mettre au premier plan' },
                { type: 'separator' },
                { role: 'window', label: 'Fenêtre' },
              ]
            : [{ role: 'close', label: 'Fermer' }]),
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }
}

module.exports = new MenuService();
