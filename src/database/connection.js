const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const log = require('../utils/logger');

let dbInstance = null;
let currentDbPath = null;

/**
 * Initializes the SQLite database.
 * @param {string|null} dbPath - Custom path to SQLite file, or ':memory:' for tests.
 * @returns {Database} The better-sqlite3 database instance.
 */
function initialize(dbPath = null) {
  if (dbInstance) {
    return dbInstance;
  }

  if (!dbPath) {
    let app;
    try {
      // Attempt to load electron app context
      const electron = require('electron');
      app = electron.app;
    } catch (e) {
      log.warn('Electron module not available in database connection. Using fallback path.');
    }

    if (app && typeof app.getPath === 'function') {
      try {
        const userDataPath = app.getPath('userData');
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        dbPath = path.join(userDataPath, 'shopper.sqlite');
      } catch (err) {
        log.error('Failed to get userData path, falling back to CWD database:', err);
        dbPath = path.join(process.cwd(), 'database.sqlite');
      }
    } else {
      // Fallback for tests / CLI runner
      dbPath = path.join(process.cwd(), 'database.sqlite');
    }
  }

  currentDbPath = dbPath;
  log.info(`Initializing SQLite database at: ${dbPath}`);

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        log.error(`Failed to create database directory ${dir}:`, err);
      }
    }
  }

  try {
    dbInstance = new Database(dbPath);

    // Enable foreign keys
    dbInstance.pragma('foreign_keys = ON');

    // Enable Write-Ahead Log (WAL) for concurrency & performance
    dbInstance.pragma('journal_mode = WAL');

    log.info('Database initialized successfully with WAL enabled.');
  } catch (err) {
    log.error(`Failed to initialize SQLite database at ${dbPath}:`, err);
    throw err;
  }

  return dbInstance;
}

/**
 * Gets the active database connection.
 * @returns {Database} The active database instance.
 */
function getDb() {
  if (!dbInstance) {
    const err = new Error('Database has not been initialized. Call initialize() first.');
    log.error(err.message);
    throw err;
  }
  return dbInstance;
}

/**
 * Closes the active database connection.
 */
function close() {
  if (dbInstance) {
    log.info(`Closing SQLite database connection for path: ${currentDbPath}`);
    dbInstance.close();
    dbInstance = null;
    currentDbPath = null;
  }
}

/**
 * Returns the current database path.
 * @returns {string|null}
 */
function getDbPath() {
  return currentDbPath;
}

module.exports = {
  initialize,
  getDb,
  close,
  getDbPath,
};
