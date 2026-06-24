const BaseModel = require('./BaseModel');

class TvaModel extends BaseModel {
  /**
   * Finds all TVA rates.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM TVA');
  }

  /**
   * Finds only active TVA rates.
   * @returns {any[]}
   */
  findAllActive() {
    return this.all('SELECT * FROM TVA WHERE is_active = 1');
  }

  /**
   * Finds a TVA rate by ID.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM TVA WHERE id = ?', [id]);
  }

  /**
   * Creates a new TVA rate.
   * @param {object} tva
   * @param {string} tva.name
   * @param {number} tva.rate
   * @param {number} [tva.is_active=1]
   * @returns {number} The ID of the newly created rate.
   */
  create({ name, rate, is_active = 1 }) {
    const result = this.run('INSERT INTO TVA (name, rate, is_active) VALUES (?, ?, ?)', [
      name,
      rate,
      is_active,
    ]);
    return result.lastInsertRowid;
  }

  /**
   * Updates an existing TVA rate.
   * @param {number} id
   * @param {object} tva
   * @param {string} tva.name
   * @param {number} tva.rate
   * @param {number} tva.is_active
   * @returns {boolean} True if updated.
   */
  update(id, { name, rate, is_active }) {
    const result = this.run('UPDATE TVA SET name = ?, rate = ?, is_active = ? WHERE id = ?', [
      name,
      rate,
      is_active,
      id,
    ]);
    return result.changes > 0;
  }

  /**
   * Soft deletes a TVA rate by marking it inactive.
   * @param {number} id
   * @returns {boolean} True if deactivated.
   */
  softDelete(id) {
    const result = this.run('UPDATE TVA SET is_active = 0 WHERE id = ?', [id]);
    return result.changes > 0;
  }

  /**
   * Hard deletes a TVA rate (use with caution, foreign keys might block it).
   * @param {number} id
   * @returns {boolean}
   */
  hardDelete(id) {
    const result = this.run('DELETE FROM TVA WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new TvaModel();
