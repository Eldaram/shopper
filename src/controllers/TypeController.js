const TypeModel = require('../models/TypeModel');

class TypeController {
  getAll() {
    return TypeModel.findAll();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return TypeModel.findById(id);
  }

  create({ name }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    return TypeModel.create({ name: name.trim() });
  }

  update(id, { name }) {
    if (!id) throw new Error('ID is required');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    return TypeModel.update(id, { name: name.trim() });
  }

  delete(id) {
    if (!id) throw new Error('ID is required');
    return TypeModel.delete(id);
  }
}

module.exports = new TypeController();
