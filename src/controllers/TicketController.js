const TicketModel = require('../models/TicketModel');
const TicketLineModel = require('../models/TicketLineModel');
const ProductModel = require('../models/ProductModel');
const TvaModel = require('../models/TvaModel');
const CustomerController = require('./CustomerController');
const DeliveryOrderModel = require('../models/DeliveryOrderModel');
const connection = require('../database/connection');

class TicketController {
  getAll() {
    return TicketModel.findAll();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return TicketModel.findById(id);
  }

  getPaginatedTickets(page = 1, limit = 15) {
    const p = Math.max(1, parseInt(page) || 1);
    const lim = Math.max(1, parseInt(limit) || 15);
    const tickets = TicketModel.findPaginated(p, lim);
    const totalCount = TicketModel.countAll();
    const totalPages = Math.ceil(totalCount / lim);

    return {
      tickets,
      totalCount,
      totalPages,
      page: p,
      limit: lim,
    };
  }

  getDashboardStats() {
    const db = connection.getDb();

    // Today's Stats
    const todayStats = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(total_amount_ttc), 0) AS total_ttc,
        COALESCE(SUM(total_amount_ht), 0) AS total_ht,
        COUNT(*) AS count,
        COALESCE(AVG(total_amount_ttc), 0) AS avg_ttc
      FROM Ticket
      WHERE date(created_at, 'localtime') = date('now', 'localtime')
    `
      )
      .get();

    // This Week (Monday-based)
    const weekStats = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(total_amount_ttc), 0) AS total_ttc,
        COALESCE(SUM(total_amount_ht), 0) AS total_ht,
        COUNT(*) AS count,
        COALESCE(AVG(total_amount_ttc), 0) AS avg_ttc
      FROM Ticket
      WHERE strftime('%Y-%W', created_at, 'localtime') = strftime('%Y-%W', 'now', 'localtime')
    `
      )
      .get();

    // This Month
    const monthStats = db
      .prepare(
        `
      SELECT 
        COALESCE(SUM(total_amount_ttc), 0) AS total_ttc,
        COALESCE(SUM(total_amount_ht), 0) AS total_ht,
        COUNT(*) AS count,
        COALESCE(AVG(total_amount_ttc), 0) AS avg_ttc
      FROM Ticket
      WHERE strftime('%Y-%m', created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
    `
      )
      .get();

    // Most sold item today
    const mostSoldToday =
      db
        .prepare(
          `
      SELECT 
        p.id, 
        p.name, 
        SUM(tl.quantity) AS qty_sold
      FROM TicketLine tl
      JOIN Ticket t ON tl.ticket_id = t.id
      JOIN Product p ON tl.product_id = p.id
      WHERE date(t.created_at, 'localtime') = date('now', 'localtime')
      GROUP BY p.id
      ORDER BY qty_sold DESC
      LIMIT 1
    `
        )
        .get() || null;

    // Item with most growth this month vs last month
    const itemMostGrowth =
      db
        .prepare(
          `
      SELECT 
        p.id, 
        p.name,
        COALESCE(this_month.qty_this_month, 0) AS qty_this_month,
        COALESCE(last_month.qty_last_month, 0) AS qty_last_month,
        (COALESCE(this_month.qty_this_month, 0) - COALESCE(last_month.qty_last_month, 0)) AS growth
      FROM Product p
      INNER JOIN (
        SELECT product_id, SUM(quantity) AS qty_this_month
        FROM TicketLine tl
        JOIN Ticket t ON tl.ticket_id = t.id
        WHERE strftime('%Y-%m', t.created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime')
        GROUP BY product_id
      ) this_month ON p.id = this_month.product_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) AS qty_last_month
        FROM TicketLine tl
        JOIN Ticket t ON tl.ticket_id = t.id
        WHERE strftime('%Y-%m', t.created_at, 'localtime') = strftime('%Y-%m', 'now', 'localtime', '-1 month')
        GROUP BY product_id
      ) last_month ON p.id = last_month.product_id
      ORDER BY growth DESC
      LIMIT 1
    `
        )
        .get() || null;

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
      mostSoldToday,
      itemMostGrowth,
    };
  }

  /**
   * Retrieves full details of a ticket including its lines and delivery status.
   * @param {number} id - Ticket ID.
   * @returns {object|null}
   */
  getTicketDetails(id) {
    if (!id) throw new Error('ID is required');
    const ticket = TicketModel.findById(id);
    if (!ticket) return null;

    const lines = TicketLineModel.findByTicketId(id);
    const delivery = DeliveryOrderModel.findByTicketId(id);

    return {
      ...ticket,
      lines,
      delivery: delivery || null,
    };
  }

  /**
   * Executes the checkout transaction.
   * @param {object} checkoutData
   * @param {number|null} [checkoutData.customer_id=null] - Optional customer ID.
   * @param {any[]} checkoutData.lines - Product lines [{ product_id, quantity, discount_value, is_discount_percentage }]
   * @param {string|null} [checkoutData.delivery_address=null] - Optional delivery address.
   * @returns {number} The ID of the created ticket.
   */
  checkout({ customer_id = null, lines, delivery_address = null }) {
    if (!lines || !Array.isArray(lines) || lines.length === 0) {
      throw new Error('Checkout requires at least one product line');
    }

    const db = connection.getDb();

    // Execute checkout steps inside a database transaction
    const runCheckout = db.transaction(() => {
      let totalHt = 0;
      let totalTtc = 0;
      const preparedLines = [];

      for (const line of lines) {
        const {
          product_id,
          quantity = 1,
          discount_value = 0,
          is_discount_percentage = false,
        } = line;

        if (!product_id) {
          throw new Error('product_id is required for all ticket lines');
        }
        if (quantity <= 0) {
          throw new Error('Product quantity must be greater than 0');
        }

        const product = ProductModel.findById(product_id);
        if (!product) {
          throw new Error(`Product with ID ${product_id} does not exist or has been deleted`);
        }

        const tva = TvaModel.findById(product.tva_id);
        if (!tva) {
          throw new Error(
            `TVA rate with ID ${product.tva_id} not found for product ${product.name}`
          );
        }

        const tvaRate = tva.rate;
        const originalUnitHt = product.price_ht;
        const originalUnitTtc = product.price_ttc;

        // Apply discount on unit price
        let finalUnitTtc = originalUnitTtc;
        if (discount_value > 0) {
          if (is_discount_percentage) {
            finalUnitTtc = originalUnitTtc * (1 - discount_value / 100);
          } else {
            finalUnitTtc = originalUnitTtc - discount_value;
          }
        }

        // Avoid negative pricing
        finalUnitTtc = Math.max(0, finalUnitTtc);

        // Derive HT from TTC and TVA rate
        let finalUnitHt = finalUnitTtc / (1 + tvaRate / 100);

        // Internal precision rounding (4 decimals)
        finalUnitTtc = Math.round(finalUnitTtc * 10000) / 10000;
        finalUnitHt = Math.round(finalUnitHt * 10000) / 10000;

        const lineTotalHt = finalUnitHt * quantity;
        const lineTotalTtc = finalUnitTtc * quantity;

        totalHt += lineTotalHt;
        totalTtc += lineTotalTtc;

        preparedLines.push({
          product_id,
          quantity,
          original_unit_price_ht: originalUnitHt,
          original_unit_price_ttc: originalUnitTtc,
          applied_tva_rate: tvaRate,
          is_discount_percentage: is_discount_percentage ? 1 : 0,
          discount_value: discount_value > 0 ? discount_value : null,
          final_unit_price_ht: Math.round(finalUnitHt * 100) / 100, // round to 2 decimals for history
          final_unit_price_ttc: Math.round(finalUnitTtc * 100) / 100,
        });
      }

      // Round overall ticket totals
      totalHt = Math.round(totalHt * 100) / 100;
      totalTtc = Math.round(totalTtc * 100) / 100;

      // 1. Create the Ticket receipt
      const ticketId = TicketModel.create({
        total_amount_ht: totalHt,
        total_amount_ttc: totalTtc,
        customer_id,
      });

      // 2. Create individual lines
      for (const pLine of preparedLines) {
        TicketLineModel.create({
          ticket_id: ticketId,
          ...pLine,
        });
      }

      // 3. Process Customer loyalty points: 1 point per 10€ TTC spent
      if (customer_id) {
        const pointsToAward = Math.floor(totalTtc / 10);
        if (pointsToAward > 0) {
          CustomerController.addLoyaltyPoints(customer_id, pointsToAward);
        }
      }

      // 4. Process Delivery Order if address is supplied
      if (delivery_address && delivery_address.trim() !== '') {
        DeliveryOrderModel.create({
          ticket_id: ticketId,
          status: 'a_preparer',
          delivery_address: delivery_address.trim(),
        });
      }

      return ticketId;
    });

    return runCheckout();
  }
}

module.exports = new TicketController();
