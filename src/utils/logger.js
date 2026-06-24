const log = require('electron-log');
const path = require('path');

let isPackaged = false;
let userDataPath = null;

try {
  const { app } = require('electron');
  if (app) {
    isPackaged = app.isPackaged;
    if (typeof app.getPath === 'function') {
      userDataPath = app.getPath('userData');
    }
  }
} catch (e) {
  // Ignored in non-electron environments (e.g. CLI tests)
}

// Adjust log levels based on package/environment status
if (isPackaged || process.env.NODE_ENV === 'production') {
  log.transports.console.level = false; // Disable console logging in production
  log.transports.file.level = 'info'; // Record info and above to file in production
} else {
  log.transports.console.level = 'debug'; // Use debug logging in console during dev
  log.transports.file.level = 'debug'; // Keep detailed debug logs in file during dev
}

// Explicitly set log path to the user's userData directory
if (userDataPath) {
  log.transports.file.resolvePathFn = () => path.join(userDataPath, 'logs', 'main.log');
}

module.exports = log;
