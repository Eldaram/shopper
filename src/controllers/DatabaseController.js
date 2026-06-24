const connection = require('../database/connection');
const migrations = require('../database/migrations');
const seeder = require('../database/seeder');

class DatabaseController {
  /**
   * Initializes the database connection, runs migrations, and conditionally seeds.
   * @param {string|null} [dbPath=null] - Specific database file path or ':memory:'.
   * @param {boolean} [forceSeed=false] - Force runs the database seeder if true.
   * @returns {Database} The active database instance.
   */
  start(dbPath = null, forceSeed = false) {
    const db = connection.initialize(dbPath);

    // Apply any outstanding migrations
    migrations.runMigrations(db);

    // Seed database if empty and in development/test, or if forceSeed is true
    const isDevOrTest =
      process.env.NODE_ENV === 'development' ||
      process.env.NODE_ENV === 'test' ||
      typeof process.env.NODE_ENV === 'undefined'; // default fallback

    const empty = seeder.isEmpty(db);

    if (forceSeed || (isDevOrTest && empty)) {
      seeder.seed(db);
    }

    return db;
  }

  /**
   * Shuts down and closes the database connection.
   */
  shutdown() {
    connection.close();
  }
}

module.exports = new DatabaseController();
