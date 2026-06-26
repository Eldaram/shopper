const connection = require('../database/connection');
const migrations = require('../database/migrations');
const seeder = require('../database/seeder');
const log = require('../utils/logger');
const { app } = require('electron');

class DatabaseController {
  /**
   * Initializes the database connection, runs migrations, and conditionally seeds.
   * @param {string|null} [dbPath=null] - Specific database file path or ':memory:'.
   * @param {boolean} [forceSeed=false] - Force runs the database seeder if true.
   * @returns {Database} The active database instance.
   */
  start(dbPath = null, forceSeed = false) {
    log.info(`DatabaseController: Starting database initialization (forceSeed: ${forceSeed})`);
    const db = connection.initialize(dbPath);

    // Apply any outstanding migrations
    log.info('DatabaseController: Running database migrations...');
    try {
      migrations.runMigrations(db);
      log.info('DatabaseController: Migrations run successfully.');
    } catch (err) {
      log.error('DatabaseController: Failed to run migrations:', err);
      throw err;
    }

    // Never seed in a packaged/production build — the app is delivered without sample data.
    const isPackaged = app?.isPackaged === true;
    const isDevOrTest =
      !isPackaged &&
      (process.env.NODE_ENV === 'development' ||
        process.env.NODE_ENV === 'test' ||
        typeof process.env.NODE_ENV === 'undefined'); // default fallback for local dev

    const empty = seeder.isEmpty(db);
    log.debug(
      `DatabaseController: Seeder check (empty: ${empty}, isDevOrTest: ${isDevOrTest}, isPackaged: ${isPackaged})`
    );

    if (forceSeed || (isDevOrTest && empty)) {
      log.info('DatabaseController: Seeding database...');
      try {
        seeder.seed(db);
        log.info('DatabaseController: Database seeded successfully.');
      } catch (err) {
        log.error('DatabaseController: Seeding failed:', err);
        throw err;
      }
    }

    return db;
  }

  /**
   * Shuts down and closes the database connection.
   */
  shutdown() {
    log.info('DatabaseController: Shutting down database connection...');
    connection.close();
  }
}

module.exports = new DatabaseController();
