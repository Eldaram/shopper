const net = require('net');
const os = require('os');
const log = require('../utils/logger');

class BarcodeServerController {
  constructor() {
    this.server = null;
    this.activeSocket = null;
    this.ip = null;
    this.port = null;
    this.qrCodeDataUri = null;
  }

  /**
   * Resolves the local IPv4 address on the machine.
   * @returns {string} The resolved IP address or loopback address.
   */
  getLocalIpAddress() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const netInterface of interfaces[name]) {
        // Look for non-internal IPv4 address
        if (netInterface.family === 'IPv4' && !netInterface.internal) {
          return netInterface.address;
        }
      }
    }
    return '127.0.0.1';
  }

  /**
   * Starts the raw TCP server.
   * @param {BrowserWindow} mainWindow - The main Electron window instance to communicate with.
   */
  startServer(mainWindow) {
    if (process.env.VITEST || globalThis.vi || process.env.NODE_ENV === 'test') {
      log.info('BarcodeServer: Skipping server startup in test environment.');
      this.qrCodeDataUri = 'data:image/png;base64,mockqr';
      return;
    }
    this.ip = this.getLocalIpAddress();

    this.server = net.createServer((socket) => {
      log.info(`BarcodeServer: Client connected from ${socket.remoteAddress}:${socket.remotePort}`);

      // Allow only one scanner connection at a time to prevent conflicts
      if (this.activeSocket) {
        log.info('BarcodeServer: Closing existing client socket connection to allow new one.');
        this.activeSocket.destroy();
      }

      this.activeSocket = socket;
      this.notifySocketStatus(mainWindow, true);

      socket.on('data', (data) => {
        const message = data.toString().trim();
        log.info(`BarcodeServer: Received scanned barcode data: ${message}`);

        // Forward scanned code to renderer
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('barcode-scanned', message);
        }
      });

      socket.on('close', () => {
        log.info('BarcodeServer: Client connection socket closed.');
        if (this.activeSocket === socket) {
          this.activeSocket = null;
          this.notifySocketStatus(mainWindow, false);
        }
      });

      socket.on('error', (err) => {
        log.error('BarcodeServer: Client connection socket error:', err);
        if (this.activeSocket === socket) {
          this.activeSocket = null;
          this.notifySocketStatus(mainWindow, false);
        }
      });
    });

    // Attempt listening on standard ports or standard ephemeral port assignment (0)
    const portsToTry = [8080, 9000, 0];
    let portIndex = 0;

    const listen = () => {
      const port = portsToTry[portIndex];
      this.server.listen(port, () => {
        const address = this.server.address();
        this.port = address.port;
        log.info(`BarcodeServer: TCP Server listening on ${this.ip}:${this.port}`);

        // Generate QR code and push to renderer
        this.generateQRCode(mainWindow);
      });
    };

    this.server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && portIndex < portsToTry.length - 1) {
        log.warn(
          `BarcodeServer: Port ${portsToTry[portIndex]} is in use, trying next candidate...`
        );
        portIndex++;
        listen();
      } else {
        log.error('BarcodeServer: Failed to start server:', err);
      }
    });

    listen();
  }

  /**
   * Generates QR Code Data URI from the IP:PORT string.
   * @param {BrowserWindow} mainWindow
   */
  async generateQRCode(mainWindow) {
    const QRCode = require('qrcode');
    const connectionString = `${this.ip}:${this.port}`;
    try {
      this.qrCodeDataUri = await QRCode.toDataURL(connectionString);
      log.info('BarcodeServer: QR code successfully generated.');

      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('qr-code-generated', this.qrCodeDataUri);
      }
    } catch (err) {
      log.error('BarcodeServer: Failed to generate QR code:', err);
    }
  }

  /**
   * Notifies the renderer window of the active client socket state.
   */
  notifySocketStatus(mainWindow, isConnected) {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('socket-status-changed', { connected: isConnected });
    }
  }

  /**
   * Manually terminates the current client scanner connection.
   * @param {BrowserWindow} mainWindow
   */
  closeActiveSocket(mainWindow) {
    if (this.activeSocket) {
      log.info('BarcodeServer: Disconnecting scanner manually upon user request.');
      this.activeSocket.destroy();
      this.activeSocket = null;
      this.notifySocketStatus(mainWindow, false);
    }
  }
}

module.exports = new BarcodeServerController();
