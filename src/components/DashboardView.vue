<template>
  <div class="dashboard-container">
    <!-- Top Statistics Cards -->
    <div class="stats-grid">
      <!-- Card 1: Today -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-icon">📅</span>
          <span class="stat-title">{{ $t('today') }}</span>
        </div>
        <div class="stat-main-val">{{ formatPrice(stats.today.total_ttc) }}</div>
        <div class="stat-details">
          <div class="stat-sub">HT: {{ formatPrice(stats.today.total_ht) }}</div>
          <div class="stat-sub">
            {{ stats.today.count }} {{ stats.today.count > 1 ? $t('items') : $t('item') }} (tx)
          </div>
          <div class="stat-sub">{{ $t('avg_basket') }}: {{ formatPrice(stats.today.avg_ttc) }}</div>
        </div>
      </div>

      <!-- Card 2: This Week -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-icon">📊</span>
          <span class="stat-title">{{ $t('this_week') }}</span>
        </div>
        <div class="stat-main-val">{{ formatPrice(stats.week.total_ttc) }}</div>
        <div class="stat-details">
          <div class="stat-sub">HT: {{ formatPrice(stats.week.total_ht) }}</div>
          <div class="stat-sub">{{ stats.week.count }} tx</div>
          <div class="stat-sub">{{ $t('avg_basket') }}: {{ formatPrice(stats.week.avg_ttc) }}</div>
        </div>
      </div>

      <!-- Card 3: This Month -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-icon">📈</span>
          <span class="stat-title">{{ $t('this_month') }}</span>
        </div>
        <div class="stat-main-val">{{ formatPrice(stats.month.total_ttc) }}</div>
        <div class="stat-details">
          <div class="stat-sub">HT: {{ formatPrice(stats.month.total_ht) }}</div>
          <div class="stat-sub">{{ stats.month.count }} tx</div>
          <div class="stat-sub">{{ $t('avg_basket') }}: {{ formatPrice(stats.month.avg_ttc) }}</div>
        </div>
      </div>

      <!-- Card 4: Most Sold Today -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-icon">🏆</span>
          <span class="stat-title">{{ $t('most_sold_today') }}</span>
        </div>
        <div
          class="stat-main-val product-name"
          :title="stats.mostSoldToday ? stats.mostSoldToday.name : $t('no_data')"
        >
          {{ stats.mostSoldToday ? stats.mostSoldToday.name : $t('no_data') }}
        </div>
        <div class="stat-details">
          <div class="stat-sub" v-if="stats.mostSoldToday">
            {{ $t('quantity') }}: <strong>{{ stats.mostSoldToday.qty_sold }}</strong>
          </div>
          <div class="stat-sub" v-else>{{ $t('no_data') }}</div>
        </div>
      </div>

      <!-- Card 5: Highest Growth This Month -->
      <div class="stat-card">
        <div class="stat-card-header">
          <span class="stat-icon">🚀</span>
          <span class="stat-title">{{ $t('most_growth_month') }}</span>
        </div>
        <div
          class="stat-main-val product-name"
          :title="stats.itemMostGrowth ? stats.itemMostGrowth.name : $t('no_data')"
        >
          {{ stats.itemMostGrowth ? stats.itemMostGrowth.name : $t('no_data') }}
        </div>
        <div class="stat-details">
          <div class="stat-sub" v-if="stats.itemMostGrowth">
            {{ $t('growth') }}:
            <span class="growth-positive">+{{ stats.itemMostGrowth.growth }} units</span>
          </div>
          <div class="stat-sub" v-if="stats.itemMostGrowth">
            ({{ stats.itemMostGrowth.qty_this_month }} vs {{ stats.itemMostGrowth.qty_last_month }})
          </div>
          <div class="stat-sub" v-else>{{ $t('no_data') }}</div>
        </div>
      </div>
    </div>

    <!-- History list section -->
    <div class="history-section">
      <div class="history-header">
        <h2 class="history-title">🕒 {{ $t('all_catalogue') }} - Transactions</h2>
      </div>

      <div v-if="tickets.length === 0" class="history-empty">
        <span class="empty-icon">📂</span>
        <p>{{ $t('no_transactions') }}</p>
      </div>

      <div v-else class="table-container">
        <table class="history-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>{{ $t('date') }}</th>
              <th>{{ $t('client') }}</th>
              <th>{{ $t('items_count') }}</th>
              <th>{{ $t('total_ttc') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="ticket in tickets"
              :key="ticket.id"
              class="history-row"
              @click="viewTicket(ticket)"
            >
              <td class="col-id">#{{ ticket.id }}</td>
              <td class="col-date">{{ formatDate(ticket.created_at) }}</td>
              <td class="col-client">
                <span class="client-badge" :class="{ anonymous: !ticket.customer_name }">
                  {{ ticket.customer_name || 'Client anonyme' }}
                </span>
              </td>
              <td class="col-items">{{ ticket.item_count }}</td>
              <td class="col-total">{{ formatPrice(ticket.total_amount_ttc) }}</td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination -->
        <div class="pagination">
          <button
            class="page-btn"
            :disabled="currentPage === 1"
            @click="changePage(currentPage - 1)"
          >
            ← {{ $t('previous') }}
          </button>
          <span class="page-info">
            {{ $t('page') }} <strong>{{ currentPage }}</strong> / {{ totalPages }}
          </span>
          <button
            class="page-btn"
            :disabled="currentPage === totalPages"
            @click="changePage(currentPage + 1)"
          >
            {{ $t('next') }} →
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DashboardView',
  emits: ['view-ticket'],
  data() {
    return {
      tickets: [],
      currentPage: 1,
      totalPages: 1,
      totalCount: 0,
      stats: {
        today: { total_ttc: 0, total_ht: 0, count: 0, avg_ttc: 0 },
        week: { total_ttc: 0, total_ht: 0, count: 0, avg_ttc: 0 },
        month: { total_ttc: 0, total_ht: 0, count: 0, avg_ttc: 0 },
        mostSoldToday: null,
        itemMostGrowth: null,
      },
    };
  },
  async mounted() {
    await this.loadStats();
    await this.loadTickets(1);
  },
  methods: {
    async loadStats() {
      if (window.electronAPI && typeof window.electronAPI.getDashboardStats === 'function') {
        try {
          const res = await window.electronAPI.getDashboardStats();
          if (res) {
            this.stats = res;
          }
        } catch (err) {
          console.error('Failed to load dashboard stats:', err);
        }
      }
    },
    async loadTickets(page) {
      if (window.electronAPI && typeof window.electronAPI.getTicketsPage === 'function') {
        try {
          const res = await window.electronAPI.getTicketsPage(page, 15);
          if (res) {
            this.tickets = res.tickets;
            this.currentPage = res.page;
            this.totalPages = res.totalPages || 1;
            this.totalCount = res.totalCount;
          }
        } catch (err) {
          console.error('Failed to load tickets page:', err);
        }
      }
    },
    async changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      await this.loadTickets(page);
    },
    async viewTicket(ticket) {
      if (window.electronAPI && typeof window.electronAPI.getTicketDetails === 'function') {
        try {
          const ticketDetails = await window.electronAPI.getTicketDetails(ticket.id);
          if (ticketDetails) {
            this.$emit('view-ticket', ticketDetails);
          }
        } catch (err) {
          console.error('Failed to get ticket details:', err);
        }
      }
    },
    formatPrice(price) {
      if (typeof price !== 'number') return this.$currentLang === 'fr' ? '0,00 €' : '€0.00';
      const locale = this.$currentLang === 'fr' ? 'fr-FR' : 'en-GB';
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(price);
    },
    formatDate(dateStr) {
      if (!dateStr) return '';
      try {
        const locale = this.$currentLang === 'fr' ? 'fr-FR' : 'en-GB';
        const parts = dateStr.split(/[- :]/);
        if (parts.length >= 6) {
          const date = new Date(
            Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])
          );
          return new Intl.DateTimeFormat(locale, {
            dateStyle: 'medium',
            timeStyle: 'short',
          }).format(date);
        }
        return dateStr;
      } catch (err) {
        return dateStr;
      }
    },
  },
};
</script>
