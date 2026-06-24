const CategoryController = require('../controllers/CategoryController');

module.exports = {
  'get-categories': () => CategoryController.getAll(),
};
