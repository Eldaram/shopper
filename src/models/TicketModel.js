const BaseModel = require('./BaseModel');

class TicketModel extends BaseModel {
  /**
   * Finds all tickets.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM Ticket ORDER BY created_at DESC');
  }

  /**
   * Finds a ticket by ID.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM Ticket WHERE id = ?', [id]);
  }

  /**
   * Finds all tickets for a specific customer.
   * @param {number} customerId
   * @returns {any[]}
   */
  findByCustomerId(customerId) {
    return this.all('SELECT * FROM Ticket WHERE customer_id = ? ORDER BY created_at DESC', [
      customerId,
    ]);
  }

  /**
   * Creates a new ticket.
   * @param {object} ticket
   * @param {number} ticket.total_amount_ht
   * @param {number} ticket.total_amount_ttc
   * @param {number|null} [ticket.customer_id=null]
   * @returns {number} The ID of the newly created ticket.
   */
  create({ total_amount_ht, total_amount_ttc, customer_id = null }) {
    const result = this.run(
      'INSERT INTO Ticket (total_amount_ht, total_amount_ttc, customer_id) VALUES (?, ?, ?)',
      [total_amount_ht, total_amount_ttc, customer_id]
    );
    return result.lastInsertRowid;
  }

  /**
   * Deletes a ticket (cascades to TicketLine).
   * @param {number} id
   * @returns {boolean} True if deleted.
   */
  delete(id) {
    const result = this.run('DELETE FROM Ticket WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new TicketModel();
