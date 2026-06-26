const CategoryController = require('../controllers/CategoryController');

module.exports = {
  'get-categories': () => CategoryController.getAll(),
  'get-subcategories': (event, parentId) => CategoryController.getByParentId(parentId),
  'create-category': (event, data) => CategoryController.create(data),
  'update-category': (event, id, data) => CategoryController.update(id, data),
  'delete-category': (event, id) => CategoryController.deleteWithReparent(id),
};
