const TvaModel = require('../models/TvaModel');

class TvaController {
  getAll() {
    return TvaModel.findAll();
  }

  getActive() {
    return TvaModel.findAllActive();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return TvaModel.findById(id);
  }

  create({ name, rate, is_active = 1 }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (rate === undefined || typeof rate !== 'number' || rate < 0) {
      throw new Error('Rate is required and must be a positive number');
    }
    return TvaModel.create({ name: name.trim(), rate, is_active });
  }

  update(id, { name, rate, is_active }) {
    if (!id) throw new Error('ID is required');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (rate === undefined || typeof rate !== 'number' || rate < 0) {
      throw new Error('Rate is required and must be a positive number');
    }
    return TvaModel.update(id, { name: name.trim(), rate, is_active });
  }

  delete(id) {
    if (!id) throw new Error('ID is required');
    return TvaModel.softDelete(id);
  }

  saveTvaRates(rates) {
    if (!Array.isArray(rates)) {
      throw new Error('Rates must be an array');
    }

    const existingRates = TvaModel.findAllActive();
    const existingIds = existingRates.map((r) => r.id);

    // 1. Validate inputs first
    for (const rate of rates) {
      if (!rate.name || typeof rate.name !== 'string' || rate.name.trim() === '') {
        throw new Error('Name is required and must be a valid string');
      }
      const parsedRate = parseFloat(rate.rate);
      if (isNaN(parsedRate) || parsedRate < 0) {
        throw new Error('Rate is required and must be a positive number');
      }
    }

    const processedIds = [];

    // 2. Perform updates and insertions
    for (const rate of rates) {
      const name = rate.name.trim();
      const parsedRate = parseFloat(rate.rate);
      const id = rate.id;

      if (id && typeof id === 'number' && existingIds.includes(id)) {
        // Update existing record
        TvaModel.update(id, { name, rate: parsedRate, is_active: 1 });
        processedIds.push(id);
      } else {
        // Insert new record
        TvaModel.create({ name, rate: parsedRate, is_active: 1 });
      }
    }

    // 3. Soft delete active rates that are not present in incoming list
    for (const existingId of existingIds) {
      if (!processedIds.includes(existingId)) {
        TvaModel.softDelete(existingId);
      }
    }

    return TvaModel.findAllActive();
  }
}

module.exports = new TvaController();
