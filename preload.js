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
  selectImage: () => ipcRenderer.invoke('select-image'),
  saveImage: (filePath) => ipcRenderer.invoke('save-image', filePath),
  showExitConfirmationDialog: () => ipcRenderer.invoke('show-exit-dialog'),
  onMenuCreateProduct: (callback) =>
    ipcRenderer.on('menu-create-product', (_event, value) => callback(value)),
});
