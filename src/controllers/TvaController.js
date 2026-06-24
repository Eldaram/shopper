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
}

module.exports = new TvaController();
