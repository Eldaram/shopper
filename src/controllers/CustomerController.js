const CustomerModel = require('../models/CustomerModel');

class CustomerController {
  getAll() {
    return CustomerModel.findAll();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return CustomerModel.findById(id);
  }

  create({ name, phone = null, loyalty_points = 0 }) {
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (loyalty_points === undefined || typeof loyalty_points !== 'number' || loyalty_points < 0) {
      throw new Error('Loyalty points must be a positive integer');
    }
    return CustomerModel.create({
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      loyalty_points: Math.floor(loyalty_points),
    });
  }

  update(id, { name, phone = null, loyalty_points }) {
    if (!id) throw new Error('ID is required');
    if (!name || typeof name !== 'string' || name.trim() === '') {
      throw new Error('Name is required and must be a valid string');
    }
    if (loyalty_points === undefined || typeof loyalty_points !== 'number' || loyalty_points < 0) {
      throw new Error('Loyalty points must be a positive integer');
    }

    const updated = CustomerModel.update(id, {
      name: name.trim(),
      phone: phone ? phone.trim() : null,
      loyalty_points: Math.floor(loyalty_points),
    });
    if (!updated) {
      throw new Error(`Customer with ID ${id} not found or deleted`);
    }
    return updated;
  }

  addLoyaltyPoints(id, points) {
    if (!id) throw new Error('ID is required');
    if (typeof points !== 'number') throw new Error('Points must be a number');

    const customer = CustomerModel.findById(id);
    if (!customer) {
      throw new Error(`Customer with ID ${id} not found or deleted`);
    }

    const newPoints = Math.max(0, customer.loyalty_points + Math.floor(points));
    return CustomerModel.updateLoyaltyPoints(id, newPoints);
  }

  delete(id) {
    if (!id) throw new Error('ID is required');
    return CustomerModel.softDelete(id);
  }

  restore(id) {
    if (!id) throw new Error('ID is required');
    return CustomerModel.restore(id);
  }
}

module.exports = new CustomerController();
