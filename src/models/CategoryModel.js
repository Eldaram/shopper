const BaseModel = require('./BaseModel');

class CategoryModel extends BaseModel {
  /**
   * Finds all categories.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM Category');
  }

  /**
   * Finds a category by ID.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM Category WHERE id = ?', [id]);
  }

  /**
   * Finds all subcategories of a given parent category.
   * @param {number|null} parentId - Use null for root categories.
   * @returns {any[]}
   */
  findByParentId(parentId) {
    if (parentId === null) {
      return this.all('SELECT * FROM Category WHERE parent_id IS NULL');
    }
    return this.all('SELECT * FROM Category WHERE parent_id = ?', [parentId]);
  }

  /**
   * Creates a new category.
   * @param {object} category
   * @param {string} category.name
   * @param {number|null} [category.parent_id=null]
   * @param {string|null} [category.image_path=null]
   * @returns {number} The ID of the newly created category.
   */
  create({ name, parent_id = null, image_path = null }) {
    const result = this.run('INSERT INTO Category (name, parent_id, image_path) VALUES (?, ?, ?)', [
      name,
      parent_id,
      image_path,
    ]);
    return result.lastInsertRowid;
  }

  /**
   * Updates an existing category.
   * @param {number} id
   * @param {object} category
   * @param {string} category.name
   * @param {number|null} category.parent_id
   * @param {string|null} category.image_path
   * @returns {boolean} True if updated.
   */
  update(id, { name, parent_id, image_path }) {
    const result = this.run(
      'UPDATE Category SET name = ?, parent_id = ?, image_path = ? WHERE id = ?',
      [name, parent_id, image_path, id]
    );
    return result.changes > 0;
  }

  /**
   * Deletes a category. Subcategories will have parent_id set to NULL due to ON DELETE SET NULL constraint.
   * @param {number} id
   * @returns {boolean} True if deleted.
   */
  delete(id) {
    const result = this.run('DELETE FROM Category WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new CategoryModel();
