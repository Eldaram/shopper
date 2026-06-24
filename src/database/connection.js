const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

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
      // Fallback if electron module isn't available
    }

    if (app && typeof app.getPath === 'function') {
      try {
        const userDataPath = app.getPath('userData');
        if (!fs.existsSync(userDataPath)) {
          fs.mkdirSync(userDataPath, { recursive: true });
        }
        dbPath = path.join(userDataPath, 'shopper.sqlite');
      } catch (err) {
        dbPath = path.join(process.cwd(), 'database.sqlite');
      }
    } else {
      // Fallback for tests / CLI runner
      dbPath = path.join(process.cwd(), 'database.sqlite');
    }
  }

  currentDbPath = dbPath;

  if (dbPath !== ':memory:') {
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  dbInstance = new Database(dbPath);

  // Enable foreign keys
  dbInstance.pragma('foreign_keys = ON');

  // Enable Write-Ahead Log (WAL) for concurrency & performance
  dbInstance.pragma('journal_mode = WAL');

  return dbInstance;
}

/**
 * Gets the active database connection.
 * @returns {Database} The active database instance.
 */
function getDb() {
  if (!dbInstance) {
    throw new Error('Database has not been initialized. Call initialize() first.');
  }
  return dbInstance;
}

/**
 * Closes the active database connection.
 */
function close() {
  if (dbInstance) {
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
