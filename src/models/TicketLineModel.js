const BaseModel = require('./BaseModel');

class TicketLineModel extends BaseModel {
  /**
   * Finds all ticket lines for a given ticket ID.
   * @param {number} ticketId
   * @returns {any[]}
   */
  findByTicketId(ticketId) {
    return this.all('SELECT * FROM TicketLine WHERE ticket_id = ?', [ticketId]);
  }

  /**
   * Creates a new ticket line.
   * @param {object} line
   * @param {number} line.ticket_id
   * @param {number} line.product_id
   * @param {number} [line.quantity=1]
   * @param {number} line.original_unit_price_ht
   * @param {number} line.original_unit_price_ttc
   * @param {number} line.applied_tva_rate
   * @param {number} [line.is_discount_percentage=0]
   * @param {number|null} [line.discount_value=null]
   * @param {number} line.final_unit_price_ht
   * @param {number} line.final_unit_price_ttc
   * @returns {number} The ID of the newly created line.
   */
  create({
    ticket_id,
    product_id,
    quantity = 1,
    original_unit_price_ht,
    original_unit_price_ttc,
    applied_tva_rate,
    is_discount_percentage = 0,
    discount_value = null,
    final_unit_price_ht,
    final_unit_price_ttc,
  }) {
    const result = this.run(
      `INSERT INTO TicketLine (
        ticket_id, product_id, quantity, original_unit_price_ht, original_unit_price_ttc,
        applied_tva_rate, is_discount_percentage, discount_value, final_unit_price_ht, final_unit_price_ttc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        ticket_id,
        product_id,
        quantity,
        original_unit_price_ht,
        original_unit_price_ttc,
        applied_tva_rate,
        is_discount_percentage,
        discount_value,
        final_unit_price_ht,
        final_unit_price_ttc,
      ]
    );
    return result.lastInsertRowid;
  }

  /**
   * Deletes a ticket line.
   * @param {number} id
   * @returns {boolean} True if deleted.
   */
  delete(id) {
    const result = this.run('DELETE FROM TicketLine WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new TicketLineModel();
