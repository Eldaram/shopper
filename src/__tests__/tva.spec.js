import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
const fs = require('fs');
const path = require('path');

// Mock electron in require cache
const mockUserData = path.join(__dirname, 'mock-user-data-tva');
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

const TEST_DB_PATH = path.join(__dirname, 'test_tva.sqlite');

describe('TVA Controller Integration Tests', () => {
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
        } catch (e) {
          console.warn(`Could not delete temp file ${file}:`, e.message);
        }
      }
    }
  }

  it('should retrieve seeded active rates', () => {
    const rates = TvaController.getActive();
    expect(rates.length).toBe(4);
    expect(rates.some((r) => r.rate === 20.0)).toBe(true);
  });

  it('should successfully bulk save TVA rates (create, update, delete)', () => {
    // 1. Get initial active rates
    const activeRates = TvaController.getActive();
    expect(activeRates.length).toBe(4);

    // 2. Prepare modifications
    // - Keep and modify the first rate (id: activeRates[0].id)
    // - Add a new rate (no id)
    // - Delete the other 3 rates by omitting them
    const rateToModify = activeRates[0];
    const originalId = rateToModify.id;
    const modifiedRateName = 'Modified Rate 20%';
    const modifiedRatePercentage = 21.5;

    const newRateName = 'Brand New Tax Rate';
    const newRatePercentage = 15.0;

    const ratesToSave = [
      {
        id: originalId,
        name: modifiedRateName,
        rate: modifiedRatePercentage,
      },
      {
        id: null,
        name: newRateName,
        rate: newRatePercentage,
      },
    ];

    // 3. Save
    const result = TvaController.saveTvaRates(ratesToSave);

    // 4. Verify result contains exactly 2 active rates
    expect(result.length).toBe(2);

    const modifiedObj = result.find((r) => r.id === originalId);
    expect(modifiedObj).toBeDefined();
    expect(modifiedObj.name).toBe(modifiedRateName);
    expect(modifiedObj.rate).toBe(modifiedRatePercentage);

    const newObj = result.find((r) => r.name === newRateName);
    expect(newObj).toBeDefined();
    expect(newObj.rate).toBe(newRatePercentage);
    expect(newObj.id).toBeDefined();
    expect(newObj.id).not.toBeNull();

    // 5. Check other rates are now soft-deleted (is_active = 0)
    const allDbRates = TvaController.getAll();
    expect(allDbRates.length).toBe(5); // 4 initial + 1 new

    const inactiveCount = allDbRates.filter((r) => r.is_active === 0).length;
    expect(inactiveCount).toBe(3); // The 3 omitted ones
  });

  it('should throw validation errors for invalid rates during saveChanges', () => {
    // Empty name
    expect(() => {
      TvaController.saveTvaRates([{ id: null, name: '', rate: 10.0 }]);
    }).toThrow();

    // Negative percentage
    expect(() => {
      TvaController.saveTvaRates([{ id: null, name: 'Invalid', rate: -5.0 }]);
    }).toThrow();

    // String rate that cannot be parsed
    expect(() => {
      TvaController.saveTvaRates([{ id: null, name: 'Invalid', rate: 'abc' }]);
    }).toThrow();
  });
});
