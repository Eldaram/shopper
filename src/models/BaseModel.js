const { getDb } = require('../database/connection');

/**
 * Abstract Base Class for all Models.
 * Provides easy access to the database instance and standard helper methods.
 */
class BaseModel {
  /**
   * Accesses the active better-sqlite3 database connection.
   * @returns {Database}
   */
  get db() {
    return getDb();
  }

  /**
   * Prepares and executes a query, returning all rows.
   * @param {string} sql - The SQL statement.
   * @param {object|any[]} params - Named or positional parameters.
   * @returns {any[]}
   */
  all(sql, params = {}) {
    return this.db.prepare(sql).all(params);
  }

  /**
   * Prepares and executes a query, returning a single row.
   * @param {string} sql - The SQL statement.
   * @param {object|any[]} params - Named or positional parameters.
   * @returns {any|undefined}
   */
  get(sql, params = {}) {
    return this.db.prepare(sql).get(params);
  }

  /**
   * Prepares and runs an INSERT, UPDATE, or DELETE query.
   * @param {string} sql - The SQL statement.
   * @param {object|any[]} params - Named or positional parameters.
   * @returns {{changes: number, lastInsertRowid: number}}
   */
  run(sql, params = {}) {
    const result = this.db.prepare(sql).run(params);
    return {
      changes: result.changes,
      lastInsertRowid: Number(result.lastInsertRowid),
    };
  }

  /**
   * Wraps a function in an SQLite transaction.
   * @param {Function} fn - The function containing database queries to run in transaction.
   * @returns {Function} The transaction runner.
   */
  transaction(fn) {
    return this.db.transaction(fn);
  }
}

module.exports = BaseModel;
