const TicketController = require('../controllers/TicketController');

const ticketHandlers = {
  'get-tickets-page': async (event, page, limit) => {
    return TicketController.getPaginatedTickets(page, limit);
  },
  'get-ticket-details': async (event, id) => {
    return TicketController.getTicketDetails(id);
  },
  'get-dashboard-stats': async (event) => {
    return TicketController.getDashboardStats();
  },
  checkout: async (event, checkoutData) => {
    return TicketController.checkout(checkoutData);
  },
};

module.exports = ticketHandlers;
