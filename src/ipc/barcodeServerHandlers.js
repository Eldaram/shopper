const barcodeServerController = require('../controllers/BarcodeServerController');
const mainModule = require('../../main');

module.exports = {
  'get-socket-status': () => {
    return { connected: !!barcodeServerController.activeSocket };
  },
  'close-socket': () => {
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;
    barcodeServerController.closeActiveSocket(mainWindow);
    return { success: true };
  },
  'get-qr-code': () => {
    return barcodeServerController.qrCodeDataUri;
  },
};
