const ProductController = require('../controllers/ProductController');
const OpenFoodFactsService = require('../services/OpenFoodFactsService');

module.exports = {
  'get-products': () => ProductController.getAllWithDetails(),
  'create-product': (event, data) => ProductController.create(data),
  'update-product': (event, id, data) => ProductController.update(id, data),
  'delete-product': (event, id) => ProductController.delete(id),
  'search-off-by-barcode': (event, barcode) => OpenFoodFactsService.searchByBarcode(barcode),
  'search-off-by-name': (event, query) => OpenFoodFactsService.searchByName(query),
  'is-online': () => OpenFoodFactsService.isOnline,
};
