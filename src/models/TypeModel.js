const BaseModel = require('./BaseModel');

class TypeModel extends BaseModel {
  /**
   * Finds all product types.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM Type');
  }

  /**
   * Finds a product type by ID.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM Type WHERE id = ?', [id]);
  }

  /**
   * Creates a new product type.
   * @param {object} type
   * @param {string} type.name
   * @returns {number} The ID of the newly created type.
   */
  create({ name }) {
    const result = this.run('INSERT INTO Type (name) VALUES (?)', [name]);
    return result.lastInsertRowid;
  }

  /**
   * Updates an existing product type.
   * @param {number} id
   * @param {object} type
   * @param {string} type.name
   * @returns {boolean} True if updated.
   */
  update(id, { name }) {
    const result = this.run('UPDATE Type SET name = ? WHERE id = ?', [name, id]);
    return result.changes > 0;
  }

  /**
   * Deletes a product type.
   * @param {number} id
   * @returns {boolean} True if deleted.
   */
  delete(id) {
    const result = this.run('DELETE FROM Type WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new TypeModel();
