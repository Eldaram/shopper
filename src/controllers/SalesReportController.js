const TicketModel = require('../models/TicketModel');
const TicketLineModel = require('../models/TicketLineModel');
const { generateCSV } = require('../utils/csvGenerator');
const { generatePDFTemplate } = require('../utils/pdfGenerator');

class SalesReportController {
  /**
   * Retrieves all sales data for a specific month.
   * @param {string} month - YYYY-MM format
   * @returns {any[]}
   */
  getSalesData(month) {
    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }
    return TicketModel.findMonthlySales(month);
  }

  /**
   * Retrieves TVA breakdown for a specific month.
   * @param {string} month - YYYY-MM format
   * @returns {any[]}
   */
  getTvaData(month) {
    if (!month || typeof month !== 'string' || !/^\d{4}-\d{2}$/.test(month)) {
      throw new Error('Invalid month format. Expected YYYY-MM.');
    }
    const rawTva = TicketLineModel.findMonthlyTvaBreakdown(month);
    return rawTva.map((row) => ({
      applied_tva_rate: row.applied_tva_rate,
      total_ht: Math.round(row.total_ht * 100) / 100,
      total_ttc: Math.round(row.total_ttc * 100) / 100,
      total_tva: Math.round(row.total_tva * 100) / 100,
    }));
  }

  /**
   * Retrieves total HT, TTC and TVA amounts for a specific month.
   * @param {string} month - YYYY-MM format
   * @returns {object}
   */
  getReportTotals(month) {
    const sales = this.getSalesData(month);
    let totalHt = 0;
    let totalTtc = 0;

    for (const sale of sales) {
      totalHt += sale.total_amount_ht;
      totalTtc += sale.total_amount_ttc;
    }

    totalHt = Math.round(totalHt * 100) / 100;
    totalTtc = Math.round(totalTtc * 100) / 100;
    const totalTva = Math.round((totalTtc - totalHt) * 100) / 100;

    return {
      total_ht: totalHt,
      total_ttc: totalTtc,
      total_tva: totalTva,
    };
  }

  /**
   * Generates a CSV file and prompts the user to save it.
   * @param {string} month - YYYY-MM format
   * @returns {Promise<boolean>} True if saved successfully, false if cancelled or errored
   */
  async generateCSV(month) {
    const { dialog } = require('electron');
    const fs = require('fs');
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const salesData = this.getSalesData(month);
    const tvaData = this.getTvaData(month);
    const totals = this.getReportTotals(month);

    const csvContent = generateCSV({ month, salesData, tvaData, totals });

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Enregistrer le rapport de ventes (CSV)',
      defaultPath: `rapport_ventes_${month.replace('-', '_')}.csv`,
      filters: [{ name: 'Fichiers CSV', extensions: ['csv'] }],
    });

    if (filePath) {
      fs.writeFileSync(filePath, csvContent, 'utf-8');
      return true;
    }

    return false;
  }

  /**
   * Generates a PDF file and prompts the user to save it.
   * @param {string} month - YYYY-MM format
   * @returns {Promise<boolean>} True if saved successfully, false if cancelled or errored
   */
  async generatePDF(month) {
    const { dialog, BrowserWindow } = require('electron');
    const fs = require('fs');
    const mainModule = require('../../main');
    const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;

    const salesData = this.getSalesData(month);
    const tvaData = this.getTvaData(month);
    const totals = this.getReportTotals(month);

    const htmlContent = generatePDFTemplate({ month, salesData, tvaData, totals });

    const { filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'Enregistrer le rapport de ventes (PDF)',
      defaultPath: `rapport_ventes_${month.replace('-', '_')}.pdf`,
      filters: [{ name: 'Fichiers PDF', extensions: ['pdf'] }],
    });

    if (!filePath) {
      return false;
    }

    const tempWin = new BrowserWindow({
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    await tempWin.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

    const pdfBuffer = await tempWin.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      marginsType: 1, // No margins (rely on CSS margins)
      preferCSSPageSize: true,
    });

    fs.writeFileSync(filePath, pdfBuffer);
    tempWin.close();
    return true;
  }
}

module.exports = new SalesReportController();
