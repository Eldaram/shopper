const SalesReportController = require('../controllers/SalesReportController');

module.exports = {
  'generate-sales-report': async (event, { month, format }) => {
    if (format === 'csv') {
      return SalesReportController.generateCSV(month);
    } else if (format === 'pdf') {
      return SalesReportController.generatePDF(month);
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }
  },
};
