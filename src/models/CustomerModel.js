const BaseModel = require('./BaseModel');

class CustomerModel extends BaseModel {
  /**
   * Finds all non-deleted customers.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM Customer WHERE deleted_at IS NULL');
  }

  /**
   * Finds all customers, including soft-deleted ones.
   * @returns {any[]}
   */
  findAllWithDeleted() {
    return this.all('SELECT * FROM Customer');
  }

  /**
   * Finds a customer by ID if not deleted.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM Customer WHERE id = ? AND deleted_at IS NULL', [id]);
  }

  /**
   * Creates a new customer.
   * @param {object} customer
   * @param {string} customer.name
   * @param {string|null} [customer.phone=null]
   * @param {number} [customer.loyalty_points=0]
   * @returns {number} The ID of the newly created customer.
   */
  create({ name, phone = null, loyalty_points = 0 }) {
    const result = this.run('INSERT INTO Customer (name, phone, loyalty_points) VALUES (?, ?, ?)', [
      name,
      phone,
      loyalty_points,
    ]);
    return result.lastInsertRowid;
  }

  /**
   * Updates an existing customer and sets edited_at.
   * @param {number} id
   * @param {object} customer
   * @param {string} customer.name
   * @param {string|null} customer.phone
   * @param {number} customer.loyalty_points
   * @returns {boolean} True if updated.
   */
  update(id, { name, phone, loyalty_points }) {
    const result = this.run(
      `UPDATE Customer SET 
        name = ?,
        phone = ?,
        loyalty_points = ?,
        edited_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL`,
      [name, phone, loyalty_points, id]
    );
    return result.changes > 0;
  }

  /**
   * Updates the loyalty points of a customer.
   * @param {number} id
   * @param {number} points
   * @returns {boolean} True if updated.
   */
  updateLoyaltyPoints(id, points) {
    const result = this.run(
      `UPDATE Customer SET 
        loyalty_points = ?,
        edited_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL`,
      [points, id]
    );
    return result.changes > 0;
  }

  /**
   * Soft deletes a customer.
   * @param {number} id
   * @returns {boolean} True if soft-deleted.
   */
  softDelete(id) {
    const result = this.run(
      "UPDATE Customer SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Restores a soft-deleted customer.
   * @param {number} id
   * @returns {boolean} True if restored.
   */
  restore(id) {
    const result = this.run(
      'UPDATE Customer SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Hard deletes a customer.
   * @param {number} id
   * @returns {boolean} True if hard-deleted.
   */
  hardDelete(id) {
    const result = this.run('DELETE FROM Customer WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new CustomerModel();
