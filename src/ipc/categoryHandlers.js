const CategoryController = require('../controllers/CategoryController');

module.exports = {
  'get-categories': () => CategoryController.getAll(),
  'get-subcategories': (event, parentId) => CategoryController.getByParentId(parentId),
  'delete-category': (event, id) => CategoryController.deleteWithReparent(id),
};
