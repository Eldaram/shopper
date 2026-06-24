const migrations = [
  {
    name: '001_initial_schema',
    up: (db) => {
      // 1. TVA Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS TVA (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          rate REAL NOT NULL,
          is_active INTEGER DEFAULT 1 -- Boolean representation (0 = false, 1 = true)
        )
      `
      ).run();

      // 2. Category Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS Category (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          parent_id INTEGER NULL,
          image_path TEXT NULL,
          FOREIGN KEY (parent_id) REFERENCES Category (id) ON DELETE SET NULL
        )
      `
      ).run();

      // 3. Type Table (for OpenFoodFacts types)
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS Type (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL
        )
      `
      ).run();

      // 4. Product Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS Product (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          barcode TEXT UNIQUE NULL,
          name TEXT NOT NULL,
          price_ht REAL NOT NULL,
          price_ttc REAL NOT NULL,
          tva_id INTEGER NOT NULL,
          is_openfoodfacts INTEGER DEFAULT 0, -- Boolean representation (0 = false, 1 = true)
          category_id INTEGER NOT NULL,
          type_id INTEGER NULL,
          image_path TEXT NULL,
          image_url_openfoodfacts TEXT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          deleted_at TEXT NULL,
          FOREIGN KEY (tva_id) REFERENCES TVA (id),
          FOREIGN KEY (category_id) REFERENCES Category (id),
          FOREIGN KEY (type_id) REFERENCES Type (id) ON DELETE SET NULL
        )
      `
      ).run();

      // 5. Customer Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS Customer (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          phone TEXT NULL,
          loyalty_points INTEGER DEFAULT 0,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          edited_at TEXT DEFAULT CURRENT_TIMESTAMP,
          deleted_at TEXT NULL
        )
      `
      ).run();

      // 6. Ticket Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS Ticket (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          total_amount_ht REAL NOT NULL,
          total_amount_ttc REAL NOT NULL,
          customer_id INTEGER NULL,
          FOREIGN KEY (customer_id) REFERENCES Customer (id) ON DELETE SET NULL
        )
      `
      ).run();

      // 7. TicketLine Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS TicketLine (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER NOT NULL,
          product_id INTEGER NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          original_unit_price_ht REAL NOT NULL,
          original_unit_price_ttc REAL NOT NULL,
          applied_tva_rate REAL NOT NULL,
          is_discount_percentage INTEGER DEFAULT 0, -- Boolean representation (0 = false, 1 = true)
          discount_value REAL NULL,
          final_unit_price_ht REAL NOT NULL,
          final_unit_price_ttc REAL NOT NULL,
          FOREIGN KEY (ticket_id) REFERENCES Ticket (id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES Product (id)
        )
      `
      ).run();

      // 8. DeliveryOrder Table
      db.prepare(
        `
        CREATE TABLE IF NOT EXISTS DeliveryOrder (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          ticket_id INTEGER UNIQUE NOT NULL,
          status TEXT DEFAULT 'a_preparer',
          delivery_address TEXT NULL,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (ticket_id) REFERENCES Ticket (id) ON DELETE CASCADE
        )
      `
      ).run();
    },
  },
];

/**
 * Runs all pending migrations in chronological order.
 * @param {Database} db - The better-sqlite3 database connection.
 */
function runMigrations(db) {
  // Ensure schema migrations table exists (prefixed with underscore to distinguish from business tables)
  db.prepare(
    `
    CREATE TABLE IF NOT EXISTS _migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `
  ).run();

  const appliedRows = db.prepare('SELECT name FROM _migrations').all();
  const appliedNames = appliedRows.map((r) => r.name);

  for (const migration of migrations) {
    if (!appliedNames.includes(migration.name)) {
      const transaction = db.transaction(() => {
        migration.up(db);
        db.prepare('INSERT INTO _migrations (name) VALUES (?)').run(migration.name);
      });
      transaction();
    }
  }
}

module.exports = {
  runMigrations,
  migrations,
};
