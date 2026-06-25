import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
const fs = require('fs');
const path = require('path');

// Mock electron in require cache for testing
const mockUserData = path.join(__dirname, 'mock-user-data');
require.cache[require.resolve('electron')] = {
  exports: {
    app: {
      getPath: (name) => {
        if (name === 'userData') return mockUserData;
        return 'mock-path';
      },
    },
  },
};

const DatabaseController = require('../controllers/DatabaseController');
const TicketController = require('../controllers/TicketController');
const CustomerController = require('../controllers/CustomerController');
const ProductController = require('../controllers/ProductController');
const connection = require('../database/connection');

const TEST_DB_PATH = path.join(__dirname, 'dashboard_test.sqlite');

describe('Shopper Sales History and Stats Dashboard Integration', () => {
  beforeAll(() => {
    cleanUpTestFiles();
    DatabaseController.start(TEST_DB_PATH, true);
  });

  afterAll(() => {
    DatabaseController.shutdown();
    cleanUpTestFiles();
  });

  function cleanUpTestFiles() {
    const files = [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`];
    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {}
      }
    }
  }

  it('should retrieve paginated ticket history', () => {
    // There are 2 seeded tickets in the DB from seeder
    const paginated = TicketController.getPaginatedTickets(1, 1);
    expect(paginated.tickets).toBeDefined();
    expect(paginated.tickets.length).toBe(1);
    expect(paginated.totalPages).toBe(2);
    expect(paginated.totalCount).toBe(2);
    expect(paginated.page).toBe(1);
    expect(paginated.limit).toBe(1);

    // Check columns inside ticket
    const ticket = paginated.tickets[0];
    expect(ticket.id).toBeDefined();
    expect(ticket.created_at).toBeDefined();
    expect(ticket.total_amount_ttc).toBeDefined();
    expect(ticket.total_amount_ht).toBeDefined();
    expect(ticket.item_count).toBeDefined();
    // Ticket 2 (Marie Curie) was inserted last in seeder, so it is returned first
    expect(ticket.customer_name).toBe('Marie Curie');
  });

  it('should retrieve full details of a ticket including joined product names', () => {
    const paginated = TicketController.getPaginatedTickets(1, 2);
    const ticket1 = paginated.tickets.find((t) => t.customer_name === 'Jean Dupont');
    expect(ticket1).toBeDefined();

    const details = TicketController.getTicketDetails(ticket1.id);
    expect(details.lines).toBeDefined();
    expect(details.lines.length).toBe(2);

    // Verify product details joined
    const cocaLine = details.lines.find(
      (l) => l.product_name && l.product_name.toLowerCase().includes('coca')
    );
    expect(cocaLine).toBeDefined();
    expect(cocaLine.product_barcode).toBeDefined();
    expect(cocaLine.quantity).toBe(2);
  });

  it('should calculate correct dashboard statistics', () => {
    const db = connection.getDb();

    // Clear all existing tickets first for clean test
    db.prepare('DELETE FROM TicketLine').run();
    db.prepare('DELETE FROM Ticket').run();

    // Create products
    const prodId1 = ProductController.getAll()[0].id;
    const prodId2 = ProductController.getAll()[1].id;

    // Create 1 ticket for today
    const t1Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prodId1, quantity: 5 }],
    });

    // Create 1 ticket for yesterday (which is within this week, and this month)
    const t2Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prodId2, quantity: 3 }],
    });
    db.prepare(
      "UPDATE Ticket SET created_at = datetime('now', 'localtime', '-1 day') WHERE id = ?"
    ).run(t2Id);

    // Create 1 ticket for last month (same product 1)
    const t3Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prodId1, quantity: 2 }],
    });
    db.prepare(
      "UPDATE Ticket SET created_at = datetime('now', 'localtime', '-1 month') WHERE id = ?"
    ).run(t3Id);

    // Fetch stats
    const stats = TicketController.getDashboardStats();

    // Today's total should count only t1
    const t1 = TicketController.getById(t1Id);
    expect(stats.today.count).toBe(1);
    expect(stats.today.total_ttc).toBe(t1.total_amount_ttc);

    // Most sold today should be prodId1 with quantity 5
    expect(stats.mostSoldToday).not.toBeNull();
    expect(stats.mostSoldToday.qty_sold).toBe(5);

    // Growth comparison:
    // prodId1 sold 5 units this month and 2 units last month. Growth: 5 - 2 = 3 units.
    expect(stats.itemMostGrowth).not.toBeNull();
    expect(stats.itemMostGrowth.growth).toBe(3);
    expect(stats.itemMostGrowth.qty_this_month).toBe(5);
    expect(stats.itemMostGrowth.qty_last_month).toBe(2);
  });
});
