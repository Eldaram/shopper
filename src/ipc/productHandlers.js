const ProductController = require('../controllers/ProductController');

module.exports = {
  'get-products': () => ProductController.getAllWithDetails(),
  'create-product': (event, data) => ProductController.create(data),
  'update-product': (event, id, data) => ProductController.update(id, data),
  'delete-product': (event, id) => ProductController.delete(id),
};
