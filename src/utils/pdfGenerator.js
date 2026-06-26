/**
 * Generates an HTML string representing the monthly sales report.
 * Formatted with print styles to look premium when printed to PDF.
 *
 * @param {object} params
 * @param {string} params.month - YYYY-MM
 * @param {any[]} params.salesData - List of tickets for the month
 * @param {any[]} params.tvaData - TVA breakdown by rate
 * @param {object} params.totals - Total amounts
 * @returns {string} The HTML content
 */
function generatePDFTemplate({ month, salesData, tvaData, totals }) {
  const formatDate = (isoString) => {
    if (!isoString) return '';
    return isoString.replace('T', ' ').substring(0, 19);
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return '0,00';
    return Number(num).toFixed(2).replace('.', ',');
  };

  const salesRows = salesData
    .map((sale) => {
      const date = formatDate(sale.created_at);
      const ht = formatNumber(sale.total_amount_ht);
      const ttc = formatNumber(sale.total_amount_ttc);
      const tva = formatNumber(sale.total_amount_ttc - sale.total_amount_ht);
      return `
      <tr>
        <td>${date}</td>
        <td>#${sale.id}</td>
        <td class="text-right">${ht} €</td>
        <td class="text-right">${tva} €</td>
        <td class="text-right font-semibold">${ttc} €</td>
      </tr>
    `;
    })
    .join('');

  const tvaRows = tvaData
    .map((rateData) => {
      const rate = formatNumber(rateData.applied_tva_rate) + ' %';
      const ht = formatNumber(rateData.total_ht);
      const tva = formatNumber(rateData.total_tva);
      const ttc = formatNumber(rateData.total_ttc);
      return `
      <tr>
        <td class="font-semibold">${rate}</td>
        <td class="text-right">${ht} €</td>
        <td class="text-right">${tva} €</td>
        <td class="text-right font-semibold">${ttc} €</td>
      </tr>
    `;
    })
    .join('');

  const yearMonth = month.split('-');
  const formattedMonth = yearMonth.length === 2 ? `${yearMonth[1]}/${yearMonth[0]}` : month;

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Rapport de ventes - ${month}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    @page {
      size: A4;
      margin: 15mm 15mm 20mm 15mm;
    }

    body {
      font-family: 'Inter', sans-serif;
      color: #1f2937;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.5;
    }

    .header-container {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 15px;
      margin-bottom: 25px;
    }

    .company-title {
      font-size: 20px;
      font-weight: 700;
      color: #4f46e5;
      margin: 0;
    }

    .company-subtitle {
      font-size: 11px;
      color: #6b7280;
      margin: 2px 0 0 0;
    }

    .report-title-container {
      text-align: right;
    }

    .report-title {
      font-size: 16px;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .report-meta {
      font-size: 10px;
      color: #6b7280;
      margin: 4px 0 0 0;
    }

    .totals-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }

    .total-card {
      background-color: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 12px;
      text-align: center;
    }

    .total-card-label {
      font-size: 10px;
      color: #6b7280;
      text-transform: uppercase;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .total-card-value {
      font-size: 18px;
      font-weight: 700;
      color: #111827;
      margin-top: 5px;
    }

    .total-card.primary {
      background-color: #f5f3ff;
      border-color: #ddd6fe;
    }

    .total-card.primary .total-card-value {
      color: #4f46e5;
    }

    h2 {
      font-size: 13px;
      font-weight: 600;
      color: #111827;
      margin-top: 0;
      margin-bottom: 10px;
      border-bottom: 1px solid #f3f4f6;
      padding-bottom: 4px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 25px;
    }

    th {
      background-color: #f3f4f6;
      font-weight: 600;
      text-align: left;
      padding: 6px 8px;
      color: #374151;
      border-bottom: 1px solid #e5e7eb;
    }

    td {
      padding: 6px 8px;
      border-bottom: 1px solid #f3f4f6;
      color: #4b5563;
    }

    tr:last-child td {
      border-bottom: none;
    }

    .text-right {
      text-align: right;
    }

    .font-semibold {
      font-weight: 600;
    }

    .bg-gray-50 {
      background-color: #f9fafb;
    }

    .tva-section {
      page-break-inside: avoid;
    }

    .footer {
      position: fixed;
      bottom: 0;
      left: 0;
      right: 0;
      text-align: center;
      font-size: 9px;
      color: #9ca3af;
      border-top: 1px solid #f3f4f6;
      padding-top: 8px;
    }
  </style>
</head>
<body>

  <div class="header-container">
    <div>
      <h1 class="company-title">Shopper</h1>
      <p class="company-subtitle">Gestion de caisse enregistreuse</p>
    </div>
    <div class="report-title-container">
      <h2 class="report-title">Rapport mensuel de ventes</h2>
      <p class="report-meta">Mois : <strong>${formattedMonth}</strong> | Généré le : ${formatDate(new Date().toISOString())}</p>
    </div>
  </div>

  <div class="totals-grid">
    <div class="total-card">
      <div class="total-card-label">Total HT</div>
      <div class="total-card-value">${formatNumber(totals.total_ht)} €</div>
    </div>
    <div class="total-card">
      <div class="total-card-label">Total TVA</div>
      <div class="total-card-value">${formatNumber(totals.total_tva)} €</div>
    </div>
    <div class="total-card primary">
      <div class="total-card-label">Total TTC</div>
      <div class="total-card-value">${formatNumber(totals.total_ttc)} €</div>
    </div>
  </div>

  <h2>Détail des transactions</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 30%;">Date</th>
        <th style="width: 20%;">Référence</th>
        <th style="width: 15%;" class="text-right">HT</th>
        <th style="width: 15%;" class="text-right">TVA</th>
        <th style="width: 20%;" class="text-right">TTC</th>
      </tr>
    </thead>
    <tbody>
      ${salesRows.length > 0 ? salesRows : '<tr><td colspan="5" style="text-align: center; padding: 20px;">Aucune transaction pour ce mois.</td></tr>'}
      ${
        salesRows.length > 0
          ? `
      <tr class="bg-gray-50 font-semibold">
        <td colspan="2">Total</td>
        <td class="text-right">${formatNumber(totals.total_ht)} €</td>
        <td class="text-right">${formatNumber(totals.total_tva)} €</td>
        <td class="text-right">${formatNumber(totals.total_ttc)} €</td>
      </tr>
      `
          : ''
      }
    </tbody>
  </table>

  <div class="tva-section">
    <h2>Détail de la TVA par taux</h2>
    <table>
      <thead>
        <tr>
          <th style="width: 30%;">Taux TVA</th>
          <th style="width: 23%;" class="text-right">Base HT</th>
          <th style="width: 23%;" class="text-right">Montant TVA</th>
          <th style="width: 24%;" class="text-right">Total TTC</th>
        </tr>
      </thead>
      <tbody>
        ${tvaRows.length > 0 ? tvaRows : '<tr><td colspan="4" style="text-align: center; padding: 20px;">Aucune TVA appliquée pour ce mois.</td></tr>'}
        ${
          tvaRows.length > 0
            ? `
        <tr class="bg-gray-50 font-semibold">
          <td>Total</td>
          <td class="text-right">${formatNumber(totals.total_ht)} €</td>
          <td class="text-right">${formatNumber(totals.total_tva)} €</td>
          <td class="text-right">${formatNumber(totals.total_ttc)} €</td>
        </tr>
        `
            : ''
        }
      </tbody>
    </table>
  </div>

  <div class="footer">
    Shopper - Document de synthèse comptable
  </div>

</body>
</html>
  `;
}

module.exports = { generatePDFTemplate };
