<template>
  <div class="sales-report-container">
    <div class="report-header">
      <h1 class="page-title">{{ $t('sales_report') }}</h1>
      <p class="page-subtitle">
        Sélectionnez un mois pour générer et sauvegarder vos rapports de ventes.
      </p>
    </div>

    <div class="report-card">
      <div class="form-group">
        <label for="month-picker" class="form-label">{{ $t('choose_month') }}</label>
        <div class="input-wrapper">
          <input
            id="month-picker"
            type="month"
            v-model="selectedMonth"
            class="month-input"
            @change="handleMonthChange"
          />
        </div>
      </div>

      <div class="report-actions">
        <button
          class="report-btn csv-btn"
          :disabled="isGenerating || !selectedMonth"
          @click="generateReport('csv')"
        >
          <span class="btn-icon">📊</span>
          <span class="btn-text">{{ $t('generate_csv') }}</span>
        </button>

        <button
          class="report-btn pdf-btn"
          :disabled="isGenerating || !selectedMonth"
          @click="generateReport('pdf')"
        >
          <span class="btn-icon">📄</span>
          <span class="btn-text">{{ $t('generate_pdf') }}</span>
        </button>
      </div>

      <!-- Success/Error alert banner -->
      <transition name="fade">
        <div v-if="alertMessage" :class="['alert-banner', alertType]">
          <span class="alert-icon">{{ alertType === 'success' ? '✅' : '⚠️' }}</span>
          <span class="alert-text">{{ alertMessage }}</span>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  name: 'SalesReportView',
  data() {
    return {
      selectedMonth: new Date().toISOString().substring(0, 7), // Default to YYYY-MM
      isGenerating: false,
      alertMessage: '',
      alertType: '',
      alertTimeout: null,
    };
  },
  methods: {
    handleMonthChange() {
      this.clearAlert();
    },
    clearAlert() {
      this.alertMessage = '';
      this.alertType = '';
      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout);
        this.alertTimeout = null;
      }
    },
    async generateReport(format) {
      if (!this.selectedMonth) return;
      this.clearAlert();
      this.isGenerating = true;

      try {
        if (window.electronAPI && typeof window.electronAPI.generateSalesReport === 'function') {
          const success = await window.electronAPI.generateSalesReport(this.selectedMonth, format);
          if (success) {
            this.alertMessage = this.$t('sales_report_success');
            this.alertType = 'success';
          }
        } else {
          // Fallback mock saving for browser environment
          console.log(`Mock generating ${format} report for ${this.selectedMonth}`);
          await new Promise((resolve) => setTimeout(resolve, 1000));
          this.alertMessage = this.$t('sales_report_success');
          this.alertType = 'success';
        }
      } catch (err) {
        console.error(err);
        this.alertMessage = this.$t('sales_report_error');
        this.alertType = 'error';
      } finally {
        this.isGenerating = false;
        this.alertTimeout = setTimeout(() => {
          this.clearAlert();
        }, 5000);
      }
    },
  },
  beforeUnmount() {
    this.clearAlert();
  },
};
</script>
