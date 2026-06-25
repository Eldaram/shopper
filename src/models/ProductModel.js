const BaseModel = require('./BaseModel');

class ProductModel extends BaseModel {
  /**
   * Finds all non-deleted products.
   * @returns {any[]}
   */
  findAll() {
    return this.all('SELECT * FROM Product WHERE deleted_at IS NULL');
  }

  /**
   * Finds all products, including soft-deleted ones.
   * @returns {any[]}
   */
  findAllWithDeleted() {
    return this.all('SELECT * FROM Product');
  }

  /**
   * Finds all non-deleted products with their joined Category, TVA, and Type details.
   * @returns {any[]}
   */
  findAllWithDetails() {
    return this.all(`
      SELECT 
        p.*, 
        c.name AS category_name,
        t.rate AS tva_rate,
        t.name AS tva_name,
        tp.name AS type_name
      FROM Product p
      INNER JOIN TVA t ON p.tva_id = t.id
      LEFT JOIN Category c ON p.category_id = c.id
      LEFT JOIN Type tp ON p.type_id = tp.id
      WHERE p.deleted_at IS NULL
    `);
  }

  /**
   * Finds a product by its ID if not deleted.
   * @param {number} id
   * @returns {any|undefined}
   */
  findById(id) {
    return this.get('SELECT * FROM Product WHERE id = ? AND deleted_at IS NULL', [id]);
  }

  /**
   * Finds a product by its barcode if not deleted.
   * @param {string} barcode
   * @returns {any|undefined}
   */
  findByBarcode(barcode) {
    return this.get('SELECT * FROM Product WHERE barcode = ? AND deleted_at IS NULL', [barcode]);
  }

  /**
   * Creates a new product.
   * @param {object} product
   * @param {string|null} product.barcode
   * @param {string} product.name
   * @param {number} product.price_ht
   * @param {number} product.price_ttc
   * @param {number} product.tva_id
   * @param {number} [product.is_openfoodfacts=0]
   * @param {number} product.category_id
   * @param {number|null} [product.type_id=null]
   * @param {string|null} [product.image_path=null]
   * @param {string|null} [product.image_url_openfoodfacts=null]
   * @returns {number} The ID of the newly created product.
   */
  create({
    barcode = null,
    name,
    price_ht,
    price_ttc,
    tva_id,
    is_openfoodfacts = 0,
    category_id,
    type_id = null,
    image_path = null,
    image_url_openfoodfacts = null,
  }) {
    const result = this.run(
      `INSERT INTO Product (
        barcode, name, price_ht, price_ttc, tva_id, is_openfoodfacts,
        category_id, type_id, image_path, image_url_openfoodfacts
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        barcode,
        name,
        price_ht,
        price_ttc,
        tva_id,
        is_openfoodfacts,
        category_id,
        type_id,
        image_path,
        image_url_openfoodfacts,
      ]
    );
    return result.lastInsertRowid;
  }

  /**
   * Updates an existing product and sets updated_at.
   * @param {number} id
   * @param {object} product
   * @param {string|null} product.barcode
   * @param {string} product.name
   * @param {number} product.price_ht
   * @param {number} product.price_ttc
   * @param {number} product.tva_id
   * @param {number} product.is_openfoodfacts
   * @param {number} product.category_id
   * @param {number|null} product.type_id
   * @param {string|null} product.image_path
   * @param {string|null} product.image_url_openfoodfacts
   * @returns {boolean} True if updated.
   */
  update(
    id,
    {
      barcode,
      name,
      price_ht,
      price_ttc,
      tva_id,
      is_openfoodfacts,
      category_id,
      type_id,
      image_path,
      image_url_openfoodfacts,
    }
  ) {
    const result = this.run(
      `UPDATE Product SET 
        barcode = ?,
        name = ?,
        price_ht = ?,
        price_ttc = ?,
        tva_id = ?,
        is_openfoodfacts = ?,
        category_id = ?,
        type_id = ?,
        image_path = ?,
        image_url_openfoodfacts = ?,
        updated_at = datetime('now')
      WHERE id = ? AND deleted_at IS NULL`,
      [
        barcode,
        name,
        price_ht,
        price_ttc,
        tva_id,
        is_openfoodfacts,
        category_id,
        type_id,
        image_path,
        image_url_openfoodfacts,
        id,
      ]
    );
    return result.changes > 0;
  }

  /**
   * Soft deletes a product by setting deleted_at.
   * @param {number} id
   * @returns {boolean} True if soft-deleted.
   */
  softDelete(id) {
    const result = this.run(
      "UPDATE Product SET deleted_at = datetime('now') WHERE id = ? AND deleted_at IS NULL",
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Restores a soft-deleted product.
   * @param {number} id
   * @returns {boolean} True if restored.
   */
  restore(id) {
    const result = this.run(
      'UPDATE Product SET deleted_at = NULL WHERE id = ? AND deleted_at IS NOT NULL',
      [id]
    );
    return result.changes > 0;
  }

  /**
   * Moves all non-deleted products from one category to another (or to null).
   * Used when a category is deleted to reparent its direct products.
   * @param {number} oldCategoryId
   * @param {number|null} newCategoryId
   * @returns {number} Number of products updated.
   */
  reparentByCategory(oldCategoryId, newCategoryId) {
    const result = this.run(
      'UPDATE Product SET category_id = ? WHERE category_id = ? AND deleted_at IS NULL',
      [newCategoryId, oldCategoryId]
    );
    return result.changes;
  }

  /**
   * Hard deletes a product.
   * @param {number} id
   * @returns {boolean} True if hard-deleted.
   */
  hardDelete(id) {
    const result = this.run('DELETE FROM Product WHERE id = ?', [id]);
    return result.changes > 0;
  }
}

module.exports = new ProductModel();
