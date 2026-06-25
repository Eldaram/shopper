import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
const fs = require('fs');
const path = require('path');

// Mock electron in require cache for testing image file deletion
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
const TvaController = require('../controllers/TvaController');
const CategoryController = require('../controllers/CategoryController');
const TypeController = require('../controllers/TypeController');
const ProductController = require('../controllers/ProductController');
const CustomerController = require('../controllers/CustomerController');
const TicketController = require('../controllers/TicketController');
const DeliveryOrderController = require('../controllers/DeliveryOrderController');

const TEST_DB_PATH = path.join(__dirname, 'test.sqlite');

describe('Shopper SQLite Database Integration', () => {
  beforeAll(() => {
    // Ensure test db starts completely clean
    cleanUpTestFiles();

    // Start DB with test path and force seeding
    DatabaseController.start(TEST_DB_PATH, true);
  });

  afterAll(() => {
    // Shutdown connection first to release file lock
    DatabaseController.shutdown();

    // Remove DB files
    cleanUpTestFiles();
  });

  function cleanUpTestFiles() {
    const files = [TEST_DB_PATH, `${TEST_DB_PATH}-wal`, `${TEST_DB_PATH}-shm`];
    for (const file of files) {
      if (fs.existsSync(file)) {
        try {
          fs.unlinkSync(file);
        } catch (e) {
          console.warn(`Could not delete temp file ${file}:`, e.message);
        }
      }
    }
  }

  describe('Seeding & Initial Schema Validation', () => {
    it('should have loaded TVA rates', () => {
      const rates = TvaController.getAll();
      expect(rates.length).toBeGreaterThanOrEqual(4);
      expect(rates.some((r) => r.rate === 20.0)).toBe(true);
      expect(rates.some((r) => r.rate === 5.5)).toBe(true);
    });

    it('should have loaded nested Categories', () => {
      const categories = CategoryController.getAll();
      expect(categories.length).toBeGreaterThanOrEqual(7);

      const boissons = categories.find((c) => c.name === 'Boissons');
      expect(boissons).toBeDefined();

      const subCategories = CategoryController.getByParentId(boissons.id);
      expect(subCategories.length).toBe(2);
      expect(subCategories.some((s) => s.name === 'Sodas')).toBe(true);
    });

    it('should have loaded products and detailed records', () => {
      const products = ProductController.getAllWithDetails();
      expect(products.length).toBeGreaterThanOrEqual(10);

      const coca = products.find((p) => p.name === 'Coca-Cola 1.5L');
      expect(coca).toBeDefined();
      expect(coca.barcode).toBe('5449000000996');
      expect(coca.tva_rate).toBe(20.0);
      expect(coca.category_name).toBe('Sodas');
      expect(coca.type_name).toBe('Soda');
    });

    it('should have loaded initial customers with loyalty points', () => {
      const customers = CustomerController.getAll();
      expect(customers.length).toBe(3);

      const marie = customers.find((c) => c.name === 'Marie Curie');
      expect(marie).toBeDefined();
      expect(marie.loyalty_points).toBe(350);
    });
  });

  describe('TVA Operations', () => {
    it('should insert, update and soft delete TVA rates', () => {
      const tvaId = TvaController.create({ name: 'Tax 15%', rate: 15.0 });
      expect(tvaId).toBeDefined();

      const created = TvaController.getById(tvaId);
      expect(created.rate).toBe(15.0);
      expect(created.is_active).toBe(1);

      TvaController.update(tvaId, { name: 'Tax 15.5%', rate: 15.5, is_active: 1 });
      const updated = TvaController.getById(tvaId);
      expect(updated.name).toBe('Tax 15.5%');
      expect(updated.rate).toBe(15.5);

      TvaController.delete(tvaId);
      const deleted = TvaController.getById(tvaId);
      expect(deleted.is_active).toBe(0); // Soft deleted (inactive)
    });
  });

  describe('Product Operations & Validation', () => {
    it('should create products and reject duplicates or invalid references', () => {
      const category = CategoryController.getAll()[0];
      const tva = TvaController.getAll()[0];

      // Successful insert
      const prodId = ProductController.create({
        barcode: '9999999999999',
        name: 'New Product',
        price_ht: 10.0,
        price_ttc: 12.0,
        tva_id: tva.id,
        category_id: category.id,
      });
      expect(prodId).toBeDefined();

      const prod = ProductController.getById(prodId);
      expect(prod.name).toBe('New Product');

      // Duplicate barcode reject
      expect(() => {
        ProductController.create({
          barcode: '9999999999999',
          name: 'Duplicate Barcode Product',
          price_ht: 5.0,
          price_ttc: 6.0,
          tva_id: tva.id,
          category_id: category.id,
        });
      }).toThrow('already exists');

      // Non-existent TVA reject
      expect(() => {
        ProductController.create({
          barcode: '1234567890123',
          name: 'Bad TVA Product',
          price_ht: 5.0,
          price_ttc: 6.0,
          tva_id: 9999,
          category_id: category.id,
        });
      }).toThrow('does not exist');

      // Soft delete product
      ProductController.delete(prodId);
      expect(ProductController.getById(prodId)).toBeUndefined();

      // Restore product
      ProductController.restore(prodId);
      expect(ProductController.getById(prodId)).toBeDefined();
    });

    it('should delete the old image file when image is changed or removed', () => {
      const mockUserData = path.join(__dirname, 'mock-user-data');
      const imgDir = path.join(mockUserData, 'product-images');

      // Ensure test directory exists
      if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
      }

      // Create a fake original image file
      const originalImgPath = path.join(imgDir, 'img_original.png');
      fs.writeFileSync(originalImgPath, 'dummy image content');
      expect(fs.existsSync(originalImgPath)).toBe(true);

      // Create product in database with this image
      const prodId = ProductController.create({
        name: 'Product with Image',
        barcode: '111122223333',
        price_ht: 2.0,
        price_ttc: 2.4,
        tva_id: 1,
        category_id: 1,
        image_path: 'media://img_original.png',
      });

      expect(prodId).toBeDefined();

      // Retrieve product to verify image
      let prod = ProductController.getById(prodId);
      expect(prod.image_path).toBe('media://img_original.png');

      // Update product image to null (removed)
      ProductController.update(prodId, {
        name: 'Product with Image',
        barcode: '111122223333',
        price_ht: 2.0,
        price_ttc: 2.4,
        tva_id: 1,
        category_id: 1,
        image_path: null,
      });

      // Verify that the file was deleted from disk!
      expect(fs.existsSync(originalImgPath)).toBe(false);

      // Clean up after test
      if (fs.existsSync(originalImgPath)) {
        fs.unlinkSync(originalImgPath);
      }
      try {
        fs.rmSync(mockUserData, { recursive: true, force: true });
      } catch (e) {
        // Ignore cleanup failure
      }
    });
  });

  describe('Customer Loyalty Operations', () => {
    it('should add/sub loyalty points', () => {
      const custId = CustomerController.create({
        name: 'Bob Hope',
        phone: '0600000000',
        loyalty_points: 10,
      });
      expect(custId).toBeDefined();

      CustomerController.addLoyaltyPoints(custId, 25);
      let customer = CustomerController.getById(custId);
      expect(customer.loyalty_points).toBe(35);

      // Verify points cannot go below 0
      CustomerController.addLoyaltyPoints(custId, -100);
      customer = CustomerController.getById(custId);
      expect(customer.loyalty_points).toBe(0);
    });
  });

  describe('Checkout Business Logic (Transactions)', () => {
    it('should calculate checkout amounts correctly, apply unit discounts, update loyalty, and add delivery', () => {
      const customerId = CustomerController.create({ name: 'Alice Test', loyalty_points: 0 });
      const products = ProductController.getAllWithDetails();

      // Checkout Scenario:
      // Product 1: Coca-Cola (1.80 TTC, 1.50 HT, 20% TVA) -> Qty 2. Total: 3.60 TTC, 3.00 HT.
      // Product 2: Baguette Tradition (1.00 TTC, 0.95 HT, 5.5% TVA) -> Qty 1, discount 10% (0.10€ unit disc).
      // Final unit TTC: 0.90, final unit HT: 0.90 / 1.055 = 0.853.
      // Total Expected TTC: 3.60 + 0.90 = 4.50
      // Total Expected HT: 3.00 + 0.85 = 3.85
      const coca = products.find((p) => p.name === 'Coca-Cola 1.5L');
      const baguette = products.find((p) => p.name === 'Baguette Tradition');

      const ticketId = TicketController.checkout({
        customer_id: customerId,
        delivery_address: '456 Test Lane',
        lines: [
          {
            product_id: coca.id,
            quantity: 2,
            discount_value: 0,
            is_discount_percentage: false,
          },
          {
            product_id: baguette.id,
            quantity: 1,
            discount_value: 10,
            is_discount_percentage: true,
          },
        ],
      });

      expect(ticketId).toBeDefined();

      const ticketDetails = TicketController.getTicketDetails(ticketId);
      expect(ticketDetails).toBeDefined();
      expect(ticketDetails.total_amount_ttc).toBe(4.5);
      expect(ticketDetails.total_amount_ht).toBe(3.85);

      // Check lines
      expect(ticketDetails.lines.length).toBe(2);

      const baguetteLine = ticketDetails.lines.find((l) => l.product_id === baguette.id);
      expect(baguetteLine.quantity).toBe(1);
      expect(baguetteLine.is_discount_percentage).toBe(1);
      expect(baguetteLine.discount_value).toBe(10);
      expect(baguetteLine.final_unit_price_ttc).toBe(0.9);
      expect(baguetteLine.final_unit_price_ht).toBe(0.85);

      // Verify delivery order was created
      expect(ticketDetails.delivery).toBeDefined();
      expect(ticketDetails.delivery.delivery_address).toBe('456 Test Lane');
      expect(ticketDetails.delivery.status).toBe('a_preparer');

      // Verify customer loyalty points: total was 4.50€ TTC, so 0 points awarded (4.50 < 10.00).
      let alice = CustomerController.getById(customerId);
      expect(alice.loyalty_points).toBe(0);

      // Checkout Scenario 2: High value to verify loyalty points accrue
      const category = CategoryController.getAll()[0];
      const tva = TvaController.getAll()[0];
      const expensiveProdId = ProductController.create({
        name: 'Expensive Item',
        price_ht: 21.67,
        price_ttc: 26.0,
        tva_id: tva.id,
        category_id: category.id,
      });

      const highTicketId = TicketController.checkout({
        customer_id: customerId,
        lines: [
          {
            product_id: expensiveProdId,
            quantity: 2,
          },
        ],
      });

      const highTicket = TicketController.getById(highTicketId);
      expect(highTicket.total_amount_ttc).toBe(52.0);

      // Loyalty points earned: 52 / 10 = 5 points
      alice = CustomerController.getById(customerId);
      expect(alice.loyalty_points).toBe(5);
    });
  });

  describe('Delivery Order State Management', () => {
    it('should retrieve, update status and address, and delete delivery orders', () => {
      const deliveries = DeliveryOrderController.getAll();
      expect(deliveries.length).toBeGreaterThanOrEqual(1);

      const del = deliveries.find(
        (d) => d.delivery_address && d.delivery_address.includes('Paris')
      );
      expect(del).toBeDefined();
      expect(del.status).toBe('en_cours');

      // Update status
      DeliveryOrderController.updateStatus(del.id, 'livree');
      let updated = DeliveryOrderController.getById(del.id);
      expect(updated.status).toBe('livree');

      // Update address
      DeliveryOrderController.updateAddress(del.id, 'New Address 789');
      updated = DeliveryOrderController.getById(del.id);
      expect(updated.delivery_address).toBe('New Address 789');

      // Rejects invalid status
      expect(() => {
        DeliveryOrderController.updateStatus(del.id, 'invalid_status_name');
      }).toThrow('Invalid status');
    });
  });

  describe('Category Deletion & Product Re-attribution', () => {
    let tvaId;

    beforeAll(() => {
      // Use first available TVA rate for product creation in this suite
      tvaId = TvaController.getAll()[0].id;
    });

    it('should reparent products to the grandparent when deleting a subcategory', () => {
      // Create hierarchy: rootA -> childB
      const rootAId = CategoryController.create({ name: 'TestRoot_A' });
      const childBId = CategoryController.create({ name: 'TestChild_B', parent_id: rootAId });

      // Create two products in childB
      const prod1Id = ProductController.create({
        name: 'Prod in B 1',
        price_ht: 1.0,
        price_ttc: 1.2,
        tva_id: tvaId,
        category_id: childBId,
      });
      const prod2Id = ProductController.create({
        name: 'Prod in B 2',
        price_ht: 2.0,
        price_ttc: 2.4,
        tva_id: tvaId,
        category_id: childBId,
      });

      // Delete childB with reparent
      const result = CategoryController.deleteWithReparent(childBId);
      expect(result).toBe(true);

      // childB must no longer exist
      expect(CategoryController.getById(childBId)).toBeUndefined();

      // Both products must now belong to rootA
      const p1 = ProductController.getById(prod1Id);
      const p2 = ProductController.getById(prod2Id);
      expect(p1.category_id).toBe(rootAId);
      expect(p2.category_id).toBe(rootAId);
    });

    it('should set products category_id to null when deleting a root category with no parent', () => {
      // Create a standalone root category
      const rootCId = CategoryController.create({ name: 'TestRoot_C' });

      // Create a product in rootC
      const prodId = ProductController.create({
        name: 'Prod in Root C',
        price_ht: 3.0,
        price_ttc: 3.6,
        tva_id: tvaId,
        category_id: rootCId,
      });

      // Delete rootC with reparent (parent_id is null)
      const result = CategoryController.deleteWithReparent(rootCId);
      expect(result).toBe(true);

      // rootC must no longer exist
      expect(CategoryController.getById(rootCId)).toBeUndefined();

      // Product must now have category_id === null
      const prod = ProductController.getById(prodId);
      expect(prod.category_id).toBeNull();
    });

    it('should reparent direct child subcategories to the grandparent when deleting a middle category', () => {
      // Create hierarchy: rootA -> middleB -> grandchildD
      const rootAId = CategoryController.create({ name: 'TestRoot_A2' });
      const middleBId = CategoryController.create({ name: 'TestMiddle_B2', parent_id: rootAId });
      const grandchildDId = CategoryController.create({
        name: 'TestGrandchild_D',
        parent_id: middleBId,
      });

      // Delete middleB
      const result = CategoryController.deleteWithReparent(middleBId);
      expect(result).toBe(true);

      // middleB no longer exists
      expect(CategoryController.getById(middleBId)).toBeUndefined();

      // grandchildD must now have parent_id === rootAId (moved up one level)
      const grandchild = CategoryController.getById(grandchildDId);
      expect(grandchild).toBeDefined();
      expect(grandchild.parent_id).toBe(rootAId);
    });

    it('should return false when trying to delete a non-existent category', () => {
      const result = CategoryController.deleteWithReparent(99999);
      expect(result).toBe(false);
    });
  });
});
