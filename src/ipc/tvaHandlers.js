const TvaController = require('../controllers/TvaController');

module.exports = {
  'get-tva-rates': () => TvaController.getAll(),
  'save-tva-rates': (event, rates) => TvaController.saveTvaRates(rates),
};
