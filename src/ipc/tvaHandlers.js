const TvaController = require('../controllers/TvaController');

module.exports = {
  'get-tva-rates': () => TvaController.getAll(),
};
