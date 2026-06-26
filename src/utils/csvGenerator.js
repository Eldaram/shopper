/**
 * Generates a CSV string representing the monthly sales report.
 * Uses semicolon (;) as separator for compatibility with French Excel.
 *
 * @param {object} params
 * @param {string} params.month - YYYY-MM
 * @param {any[]} params.salesData - List of tickets for the month
 * @param {any[]} params.tvaData - TVA breakdown by rate
 * @param {object} params.totals - Total amounts
 * @returns {string} The CSV content
 */
function generateCSV({ month, salesData, tvaData, totals }) {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    // Format: YYYY-MM-DD HH:mm:ss
    return isoString.replace('T', ' ').substring(0, 19);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0,00';
    return Number(num).toFixed(2).replace('.', ',');
  };

  let csv = [];

  // Header Section
  csv.push(`Rapport de ventes mensuel;${month}`);
  csv.push(`Généré le;${formatDate(new Date().toISOString())}`);
  csv.push('');

  // Transactions Section
  csv.push('Détail des transactions');
  csv.push('Date;Référence;Total HT (€);Total TVA (€);Total TTC (€)');

  for (const sale of salesData) {
    const date = formatDate(sale.created_at);
    const ref = sale.id;
    const ht = formatNumber(sale.total_amount_ht);
    const ttc = formatNumber(sale.total_amount_ttc);
    const tva = formatNumber(sale.total_amount_ttc - sale.total_amount_ht);

    csv.push(`"${date}";"${ref}";${ht};${tva};${ttc}`);
  }

  // Totals Row
  csv.push(
    `Total;;${formatNumber(totals.total_ht)};${formatNumber(totals.total_tva)};${formatNumber(totals.total_ttc)}`
  );
  csv.push('');

  // TVA Breakdown Section
  csv.push('Détail de la TVA');
  csv.push('Taux TVA (%);Base HT (€);Montant TVA (€);Total TTC (€)');

  for (const rateData of tvaData) {
    const rate = formatNumber(rateData.applied_tva_rate) + '%';
    const ht = formatNumber(rateData.total_ht);
    const tva = formatNumber(rateData.total_tva);
    const ttc = formatNumber(rateData.total_ttc);

    csv.push(`${rate};${ht};${tva};${ttc}`);
  }

  // TVA Totals Row
  csv.push(
    `Total;${formatNumber(totals.total_ht)};${formatNumber(totals.total_tva)};${formatNumber(totals.total_ttc)}`
  );

  return csv.join('\r\n');
}

module.exports = { generateCSV };
