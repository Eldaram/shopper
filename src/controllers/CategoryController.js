const CategoryModel = require('../models/CategoryModel');

class CategoryController {
  getAll() {
    return CategoryModel.findAll();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return CategoryModel.findById(id);
  }

  getByParentId(parentId) {
    return CategoryModel.findByParentId(parentId);
  }

  create({ name, parent_id = null, image_path = null }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (parent_id) {
      const parent = CategoryModel.findById(parent_id);
      if (!parent) {
        throw new Error(`Parent category with ID ${parent_id} does not exist`);
      }
    }
    return CategoryModel.create({ name: name.trim(), parent_id, image_path });
  }

  update(id, { name, parent_id = null, image_path = null }) {
    if (!id) throw new Error('ID is required');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (parent_id) {
      if (Number(parent_id) === Number(id)) {
        throw new Error('A category cannot be its own parent');
      }
      const parent = CategoryModel.findById(parent_id);
      if (!parent) {
        throw new Error(`Parent category with ID ${parent_id} does not exist`);
      }
    }
    return CategoryModel.update(id, { name: name.trim(), parent_id, image_path });
  }

  delete(id) {
    if (!id) throw new Error('ID is required');
    return CategoryModel.delete(id);
  }

  deleteWithReparent(id) {
    if (!id) throw new Error('ID is required');
    return CategoryModel.deleteWithReparent(id);
  }
}

module.exports = new CategoryController();
