import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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
const ProductController = require('../controllers/ProductController');
const SalesReportController = require('../controllers/SalesReportController');
const connection = require('../database/connection');

const TEST_DB_PATH = path.join(__dirname, 'sales_report_test.sqlite');

describe('Sales Report Controller & Model Queries Integration', () => {
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

  it('should return empty sales report structures for months with no sales', () => {
    const month = '2026-05';
    const sales = SalesReportController.getSalesData(month);
    const tva = SalesReportController.getTvaData(month);
    const totals = SalesReportController.getReportTotals(month);

    expect(sales).toEqual([]);
    expect(tva).toEqual([]);
    expect(totals).toEqual({
      total_ht: 0,
      total_ttc: 0,
      total_tva: 0,
    });
  });

  it('should throw an error for invalid month formats', () => {
    expect(() => SalesReportController.getSalesData('2026/05')).toThrow();
    expect(() => SalesReportController.getSalesData('May 2026')).toThrow();
    expect(() => SalesReportController.getSalesData('')).toThrow();
  });

  it('should calculate correct totals and VAT breakdowns for a month with sales', () => {
    const db = connection.getDb();

    // Clear all existing tickets first for clean test
    db.prepare('DELETE FROM TicketLine').run();
    db.prepare('DELETE FROM Ticket').run();

    // Fetch some available products
    const products = ProductController.getAll();
    expect(products.length).toBeGreaterThanOrEqual(2);

    const prod1 = products[0];
    const prod2 = products[1];

    // Checkout some tickets
    const t1Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prod1.id, quantity: 2 }],
    });

    const t2Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prod2.id, quantity: 3 }],
    });

    // Force their dates to June 2026
    db.prepare("UPDATE Ticket SET created_at = '2026-06-15 10:30:00' WHERE id = ?").run(t1Id);
    db.prepare("UPDATE Ticket SET created_at = '2026-06-16 14:45:00' WHERE id = ?").run(t2Id);

    // Let's create one ticket in July 2026 to verify month filtering
    const t3Id = TicketController.checkout({
      customer_id: null,
      lines: [{ product_id: prod1.id, quantity: 1 }],
    });
    db.prepare("UPDATE Ticket SET created_at = '2026-07-01 09:00:00' WHERE id = ?").run(t3Id);

    // Verify Sales Data for June 2026
    const sales = SalesReportController.getSalesData('2026-06');
    expect(sales.length).toBe(2);
    expect(sales[0].id).toBe(t1Id);
    expect(sales[1].id).toBe(t2Id);

    // Retrieve the tickets themselves to check individual values
    const ticket1 = TicketController.getById(t1Id);
    const ticket2 = TicketController.getById(t2Id);

    // Verify totals calculation for June 2026
    const totals = SalesReportController.getReportTotals('2026-06');
    const expectedHt = Math.round((ticket1.total_amount_ht + ticket2.total_amount_ht) * 100) / 100;
    const expectedTtc =
      Math.round((ticket1.total_amount_ttc + ticket2.total_amount_ttc) * 100) / 100;
    const expectedTva = Math.round((expectedTtc - expectedHt) * 100) / 100;

    expect(totals.total_ht).toBe(expectedHt);
    expect(totals.total_ttc).toBe(expectedTtc);
    expect(totals.total_tva).toBe(expectedTva);

    // Verify TVA breakdown grouping
    const tva = SalesReportController.getTvaData('2026-06');
    expect(tva.length).toBeGreaterThan(0);

    // The sum of breakdowns should match the overall totals
    let breakdownHt = 0;
    let breakdownTtc = 0;
    let breakdownTva = 0;
    for (const rateRow of tva) {
      breakdownHt += rateRow.total_ht;
      breakdownTtc += rateRow.total_ttc;
      breakdownTva += rateRow.total_tva;
    }

    expect(Math.round(breakdownHt * 100) / 100).toBe(expectedHt);
    expect(Math.round(breakdownTtc * 100) / 100).toBe(expectedTtc);
    expect(Math.round(breakdownTva * 100) / 100).toBe(expectedTva);
  });
});
