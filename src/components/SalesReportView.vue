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

<style scoped>
.sales-report-container {
  max-width: 600px;
  margin: 40px auto;
  padding: 0 20px;
  animation: fadeIn 0.4s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.report-header {
  margin-bottom: 30px;
  text-align: center;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #1e1b4b; /* Deep Indigo */
  margin: 0;
}

.page-subtitle {
  font-size: 14px;
  color: #64748b; /* Cool Gray */
  margin-top: 8px;
}

.report-card {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(226, 232, 240, 0.8);
  box-shadow:
    0 10px 25px -5px rgba(0, 0, 0, 0.05),
    0 8px 10px -6px rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: 32px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 600;
  color: #334155;
}

.input-wrapper {
  position: relative;
}

.month-input {
  width: 100%;
  padding: 12px 16px;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background-color: #ffffff;
  color: #1e293b;
  font-size: 16px;
  font-family: inherit;
  outline: none;
  box-sizing: border-box;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.month-input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.report-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 8px;
}

.report-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 14px;
  font-size: 15px;
  font-weight: 600;
  border-radius: 10px;
  cursor: pointer;
  border: none;
  transition: all 0.2s ease;
}

.csv-btn {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.csv-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.2);
}

.pdf-btn {
  background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
  color: white;
}

.pdf-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
}

.report-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
  box-shadow: none !important;
}

.report-btn:active:not(:disabled) {
  transform: translateY(0);
}

.alert-banner {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  margin-top: 8px;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alert-banner.success {
  background-color: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}

.alert-banner.error {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
  color: #991b1b;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
