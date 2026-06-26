const { Menu, app } = require('electron');

class MenuService {
  setAppMenu(window) {
    const isMac = process.platform === 'darwin';

    // Dynamically require TranslationController to prevent circular dependency
    const TranslationController = require('../controllers/TranslationController');
    const t = (key) =>
      TranslationController.getText(TranslationController.getCurrentLanguage(), key);

    const template = [
      ...(isMac
        ? [
            {
              label: app.name,
              submenu: [
                { role: 'about', label: t('menu_about') },
                { type: 'separator' },
                { role: 'services', label: t('menu_services') },
                { type: 'separator' },
                { role: 'hide', label: t('menu_hide') },
                { role: 'hideOthers', label: t('menu_hide_others') },
                { role: 'unhide', label: t('menu_show_all') },
                { type: 'separator' },
                { role: 'quit', label: t('menu_quit') },
              ],
            },
          ]
        : []),
      {
        label: t('menu_file'),
        submenu: [
          {
            label: t('menu_add_item'),
            accelerator: 'CmdOrCtrl+N',
            click: () => {
              if (window && !window.isDestroyed()) {
                window.webContents.send('menu-create-product');
              }
            },
          },
          {
            label: t('menu_add_category'),
            accelerator: 'CmdOrCtrl+Shift+N',
            click: () => {
              if (window && !window.isDestroyed()) {
                window.webContents.send('menu-create-category');
              }
            },
          },
          {
            id: 'delete-item',
            label: t('menu_delete_product'),
            accelerator: 'CmdOrCtrl+D',
            enabled: false,
            click: () => {
              if (window && !window.isDestroyed()) {
                window.webContents.send('menu-delete-item');
              }
            },
          },
          {
            id: 'clear-basket-item',
            label: t('menu_clear_basket'),
            accelerator: 'CmdOrCtrl+Shift+Delete',
            enabled: false,
            click: () => {
              if (window && !window.isDestroyed()) {
                window.webContents.send('menu-clear-basket');
              }
            },
          },
          { type: 'separator' },
          isMac
            ? { role: 'close', label: t('menu_close') }
            : { role: 'quit', label: t('menu_quit') },
        ],
      },
      {
        label: t('menu_edit'),
        submenu: [
          { role: 'undo', label: t('menu_undo') },
          { role: 'redo', label: t('menu_redo') },
          { type: 'separator' },
          { role: 'cut', label: t('menu_cut') },
          { role: 'copy', label: t('menu_copy') },
          { role: 'paste', label: t('menu_paste') },
          { role: 'selectAll', label: t('menu_select_all') },
        ],
      },
      {
        label: t('menu_view'),
        submenu: [
          { role: 'reload', label: t('menu_reload') },
          { role: 'forceReload', label: t('menu_force_reload') },
          { role: 'toggleDevTools', label: t('menu_devtools') },
          { type: 'separator' },
          { role: 'resetZoom', label: t('menu_reset_zoom') },
          { role: 'zoomIn', label: t('menu_zoom_in') },
          { role: 'zoomOut', label: t('menu_zoom_out') },
          { type: 'separator' },
          { role: 'togglefullscreen', label: t('menu_fullscreen') },
        ],
      },
      {
        label: t('menu_window'),
        submenu: [
          { role: 'minimize', label: t('menu_minimize') },
          { role: 'zoom', label: t('menu_zoom') },
          ...(isMac
            ? [
                { type: 'separator' },
                { role: 'front', label: t('menu_front') },
                { type: 'separator' },
                { role: 'window', label: t('menu_window') },
              ]
            : [{ role: 'close', label: t('menu_close') }]),
        ],
      },
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  setDeleteItemState(enabled, label) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const item = menu.getMenuItemById('delete-item');
      if (item) {
        item.enabled = enabled;
        if (label) item.label = label;
      }
    }
  }

  setClearBasketEnabled(enabled) {
    const menu = Menu.getApplicationMenu();
    if (menu) {
      const item = menu.getMenuItemById('clear-basket-item');
      if (item) {
        item.enabled = enabled;
      }
    }
  }
}

module.exports = new MenuService();
