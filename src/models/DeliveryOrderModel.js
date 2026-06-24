const BaseModel = require('./BaseModel');

class DeliveryOrderModel extends BaseModel {
  /**
   * Finds all delivery orders.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM DeliveryOrder ORDER BY created_at DESC');
  }

  /**
   * Finds a delivery order by ID.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM DeliveryOrder WHERE id = ?', [id]);
  }

  /**
   * Finds a delivery order by its associated ticket ID.
   * @param {number} ticketId
   * @returns {any|undefined}
   */
  findByTicketId(ticketId) {
    return this.get('SELECT * FROM DeliveryOrder WHERE ticket_id = ?', [ticketId]);
  }

  /**
   * Creates a new delivery order.
   * @param {object} order
   * @param {number} order.ticket_id
   * @param {string} [order.status='a_preparer'] - 'a_preparer', 'en_cours', or 'livree'
   * @param {string} order.delivery_address
   * @returns {number} The ID of the newly created order.
   */
  create({ ticket_id, status = 'a_preparer', delivery_address }) {
    const result = this.run(
      'INSERT INTO DeliveryOrder (ticket_id, status, delivery_address) VALUES (?, ?, ?)',
      [ticket_id, status, delivery_address]
    );
    return result.lastInsertRowid;
  }

  /**
   * Updates the status of a delivery order.
   * @param {number} id
   * @param {string} status - 'a_preparer', 'en_cours', or 'livree'
   * @returns {boolean} True if updated.
   */
  updateStatus(id, status) {
    const result = this.run(
      "UPDATE DeliveryOrder SET status = ?, updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
    return result.changes > 0;
  }

  /**
   * Updates the address of a delivery order.
   * @param {number} id
   * @param {string} address
   * @returns {boolean} True if updated.
   */
  updateAddress(id, address) {
    const result = this.run(
      "UPDATE DeliveryOrder SET delivery_address = ?, updated_at = datetime('now') WHERE id = ?",
      [address, id]
    );
    return result.changes > 0;
  }

  /**
   * Deletes a delivery order.
   * @param {number} id
   * @returns {boolean} True if deleted.
   */
  delete(id) {
    const result = this.run('DELETE FROM DeliveryOrder WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new DeliveryOrderModel();
