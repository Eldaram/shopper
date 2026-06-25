const { contextBridge, ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector);
    if (element) element.textContent = text;
  };

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type]);
  }
});

contextBridge.exposeInMainWorld('electronAPI', {
  getCategories: () => ipcRenderer.invoke('get-categories'),
  getProducts: () => ipcRenderer.invoke('get-products'),
  getTvaRates: () => ipcRenderer.invoke('get-tva-rates'),
  createProduct: (data) => ipcRenderer.invoke('create-product', data),
  updateProduct: (id, data) => ipcRenderer.invoke('update-product', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (filePath) => ipcRenderer.invoke('save-image', filePath),
  showExitConfirmationDialog: () => ipcRenderer.invoke('show-exit-dialog'),
  confirmDeleteProduct: (productName) =>
    ipcRenderer.invoke('show-delete-confirm-dialog', productName),
  setDeleteMenuEnabled: (enabled) => ipcRenderer.send('set-delete-menu-enabled', enabled),
  onMenuCreateProduct: (callback) =>
    ipcRenderer.on('menu-create-product', (_event, value) => callback(value)),
  onMenuDeleteProduct: (callback) =>
    ipcRenderer.on('menu-delete-product', (_event, value) => callback(value)),
  setClearBasketEnabled: (enabled) => ipcRenderer.send('set-clear-basket-enabled', enabled),
  confirmClearBasket: () => ipcRenderer.invoke('show-clear-basket-dialog'),
  onMenuClearBasket: (callback) =>
    ipcRenderer.on('menu-clear-basket', (_event, value) => callback(value)),
});
