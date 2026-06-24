/**
 * Binds a list of IPC handler objects to electron's ipcMain.
 * @param {object} ipcMain - The Electron ipcMain instance.
 * @param {object[]} handlerGroups - Array of objects where keys are channel names and values are handler functions.
 */
function bindHandlers(ipcMain, handlerGroups) {
  for (const handlers of handlerGroups) {
    for (const [channel, handler] of Object.entries(handlers)) {
      ipcMain.handle(channel, handler);
    }
  }
}

module.exports = bindHandlers;
