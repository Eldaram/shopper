const ProductController = require('../controllers/ProductController');

module.exports = {
  'get-products': () => ProductController.getAllWithDetails(),
};
