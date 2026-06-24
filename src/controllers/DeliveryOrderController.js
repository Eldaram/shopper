const DeliveryOrderModel = require('../models/DeliveryOrderModel');

class DeliveryOrderController {
  getAll() {
    return DeliveryOrderModel.findAll();
  }

  getById(id) {
    if (!id) throw new Error('ID is required');
    return DeliveryOrderModel.findById(id);
  }

  getByTicketId(ticketId) {
    if (!ticketId) throw new Error('Ticket ID is required');
    return DeliveryOrderModel.findByTicketId(ticketId);
  }

  updateStatus(id, status) {
    if (!id) throw new Error('ID is required');
    const validStatuses = ['a_preparer', 'en_cours', 'livree'];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }

    const updated = DeliveryOrderModel.updateStatus(id, status);
    if (!updated) {
      throw new Error(`Delivery order with ID ${id} not found`);
    }
    return updated;
  }

  updateAddress(id, address) {
    if (!id) throw new Error('ID is required');
    if (!address || typeof address !== 'string' || address.trim() === '') {
      throw new Error('Address is required and must be a valid string');
    }

    const updated = DeliveryOrderModel.updateAddress(id, address.trim());
    if (!updated) {
      throw new Error(`Delivery order with ID ${id} not found`);
    }
    return updated;
  }

  delete(id) {
    if (!id) throw new Error('ID is required');
    return DeliveryOrderModel.delete(id);
  }
}

module.exports = new DeliveryOrderController();
