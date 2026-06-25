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
  getSubcategories: (parentId) => ipcRenderer.invoke('get-subcategories', parentId),
  getProducts: () => ipcRenderer.invoke('get-products'),
  getTvaRates: () => ipcRenderer.invoke('get-tva-rates'),
  createProduct: (data) => ipcRenderer.invoke('create-product', data),
  updateProduct: (id, data) => ipcRenderer.invoke('update-product', id, data),
  deleteProduct: (id) => ipcRenderer.invoke('delete-product', id),
  deleteCategory: (id) => ipcRenderer.invoke('delete-category', id),
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (filePath) => ipcRenderer.invoke('save-image', filePath),
  showExitConfirmationDialog: () => ipcRenderer.invoke('show-exit-dialog'),
  confirmDeleteProduct: (productName) =>
    ipcRenderer.invoke('show-delete-confirm-dialog', productName),
  confirmDeleteCategory: (categoryName) =>
    ipcRenderer.invoke('show-delete-category-dialog', categoryName),
  setDeleteItemState: (enabled, label) => ipcRenderer.send('set-delete-item-state', enabled, label),
  onMenuCreateProduct: (callback) =>
    ipcRenderer.on('menu-create-product', (_event, value) => callback(value)),
  onMenuDeleteItem: (callback) =>
    ipcRenderer.on('menu-delete-item', (_event, value) => callback(value)),
  setClearBasketEnabled: (enabled) => ipcRenderer.send('set-clear-basket-enabled', enabled),
  confirmClearBasket: () => ipcRenderer.invoke('show-clear-basket-dialog'),
  onMenuClearBasket: (callback) =>
    ipcRenderer.on('menu-clear-basket', (_event, value) => callback(value)),
  getAvailableLanguages: () => ipcRenderer.invoke('get-available-languages'),
  getLanguageDetails: (code) => ipcRenderer.invoke('get-language-details', code),
  getText: (textCode) => ipcRenderer.invoke('get-text', textCode),
  getCurrentLanguage: () => ipcRenderer.invoke('get-current-language'),
  setLanguage: (code) => ipcRenderer.invoke('set-current-language', code),
  searchOffByBarcode: (barcode) => ipcRenderer.invoke('search-off-by-barcode', barcode),
  searchOffByName: (query) => ipcRenderer.invoke('search-off-by-name', query),
  isOnline: () => ipcRenderer.invoke('is-online'),
  onOfflineStatusChanged: (callback) =>
    ipcRenderer.on('offline-status-changed', (_event, value) => callback(value)),
  getTicketsPage: (page, limit) => ipcRenderer.invoke('get-tickets-page', page, limit),
  getTicketDetails: (id) => ipcRenderer.invoke('get-ticket-details', id),
  getDashboardStats: () => ipcRenderer.invoke('get-dashboard-stats'),
  checkout: (data) => ipcRenderer.invoke('checkout', data),
});
