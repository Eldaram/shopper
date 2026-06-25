const fs = require('fs');
const path = require('path');
const ProductModel = require('../models/ProductModel');
const TvaModel = require('../models/TvaModel');
const CategoryModel = require('../models/CategoryModel');
const TypeModel = require('../models/TypeModel');

class ProductController {
  getAll() {
    return ProductModel.findAll();
  }

  getAllWithDetails() {
    return ProductModel.findAllWithDetails();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return ProductModel.findById(id);
  }

  getByBarcode(barcode) {
    if (!barcode) throw new Error('Barcode is required');
    return ProductModel.findByBarcode(barcode);
  }

  create(data) {
    this._validate(data);

    // Barcode uniqueness check
    if (data.barcode) {
      const existing = ProductModel.findByBarcode(data.barcode);
      if (existing) {
        throw new Error(`Product with barcode ${data.barcode} already exists`);
      }
    }

    return ProductModel.create(data);
  }

  update(id, data) {
    if (!id) throw new Error('ID is required');
    this._validate(data);

    // Barcode uniqueness check
    if (data.barcode) {
      const existing = ProductModel.findByBarcode(data.barcode);
      if (existing && Number(existing.id) !== Number(id)) {
        throw new Error(`Another product with barcode ${data.barcode} already exists`);
      }
    }

    const existingProduct = ProductModel.findById(id);
    const oldImagePath = existingProduct ? existingProduct.image_path : null;

    const updated = ProductModel.update(id, data);
    if (!updated) {
      throw new Error(`Product with ID ${id} not found or has been deleted`);
    }

    // Clean up replaced or deleted image file
    if (oldImagePath && oldImagePath.startsWith('media://') && oldImagePath !== data.image_path) {
      this._deleteImageFile(oldImagePath);
    }

    return updated;
  }

  _deleteImageFile(imagePath) {
    try {
      let electron;
      try {
        electron = require('electron');
      } catch (e) {
        // Safe catch if not in Electron environment
      }
      const app = electron && electron.app;
      if (!app) {
        console.warn('Electron app is not available, skipping image file deletion.');
        return;
      }
      const filename = imagePath.slice('media://'.length);
      const destDir = path.join(app.getPath('userData'), 'product-images');
      const destPath = path.join(destDir, filename);
      if (fs.existsSync(destPath)) {
        fs.unlinkSync(destPath);
        console.log(`Deleted product image file: ${destPath}`);
      }
    } catch (err) {
      console.error(`Failed to delete image file ${imagePath}:`, err);
    }
  }

  delete(id) {
    if (!id) throw new Error('ID is required');

    const existing = ProductModel.findById(id);
    if (existing && existing.image_path && existing.image_path.startsWith('media://')) {
      this._deleteImageFile(existing.image_path);
    }

    return ProductModel.softDelete(id);
  }

  restore(id) {
    if (!id) throw new Error('ID is required');
    return ProductModel.restore(id);
  }

  _validate(data) {
    const { name, price_ht, price_ttc, tva_id, category_id, type_id } = data;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (price_ht === undefined || typeof price_ht !== 'number' || price_ht < 0) {
      throw new Error('Price HT must be a positive number');
    }
    if (price_ttc === undefined || typeof price_ttc !== 'number' || price_ttc < 0) {
      throw new Error('Price TTC must be a positive number');
    }
    if (!tva_id) {
      throw new Error('TVA ID is required');
    }
    if (!category_id) {
      throw new Error('Category ID is required');
    }

    // Reference existence checks
    const tva = TvaModel.findById(tva_id);
    if (!tva) {
      throw new Error(`TVA rate with ID ${tva_id} does not exist`);
    }

    const category = CategoryModel.findById(category_id);
    if (!category) {
      throw new Error(`Category with ID ${category_id} does not exist`);
    }

    if (type_id) {
      const type = TypeModel.findById(type_id);
      if (!type) {
        throw new Error(`Type with ID ${type_id} does not exist`);
      }
    }
  }
}

module.exports = new ProductController();
