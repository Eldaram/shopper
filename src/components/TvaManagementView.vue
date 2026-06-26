<template>
  <div class="tva-management-container">
    <header class="tva-header">
      <h1 class="page-title">{{ $t('tva_management') }}</h1>
    </header>

    <div class="tva-card">
      <!-- Success/Error alert banner -->
      <transition name="fade">
        <div v-if="alert.message" :class="['tva-alert', alert.type]">
          <span>{{ alert.message }}</span>
        </div>
      </transition>

      <table class="tva-grid-table">
        <thead>
          <tr>
            <th>{{ $t('rate_name') }}</th>
            <th>{{ $t('rate_value') }}</th>
            <th style="width: 80px; text-align: center">{{ $t('action') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(rate, index) in rates" :key="rate.id">
            <td>
              <input
                type="text"
                v-model="rate.name"
                class="tva-input"
                :placeholder="$t('rate_name')"
                required
              />
            </td>
            <td>
              <input
                type="number"
                v-model.number="rate.rate"
                step="0.1"
                min="0"
                max="100"
                class="tva-input"
                :placeholder="$t('rate_value')"
                required
              />
            </td>
            <td style="text-align: center">
              <button
                type="button"
                class="btn-delete-tva"
                @click="removeRate(index)"
                :title="$t('delete')"
              >
                🗑️
              </button>
            </td>
          </tr>
          <tr v-if="rates.length === 0">
            <td colspan="3" style="text-align: center; color: var(--text-muted); padding: 24px">
              {{ $t('no_data') }}
            </td>
          </tr>
        </tbody>
      </table>

      <div class="tva-actions-row">
        <button type="button" class="btn-add-rate" @click="addRate">
          <span>+</span> {{ $t('add_rate') }}
        </button>
      </div>

      <div class="tva-footer-actions">
        <button
          type="button"
          class="tva-btn tva-btn-cancel"
          @click="cancelChanges"
          :disabled="isSaving"
        >
          {{ $t('cancel') }}
        </button>
        <button
          type="button"
          class="tva-btn tva-btn-save"
          @click="saveChanges"
          :disabled="isSaving || !isValid"
        >
          {{ isSaving ? '...' : $t('save') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TvaManagementView',
  emits: ['close', 'tva-saved'],
  data() {
    return {
      rates: [],
      originalRates: [],
      alert: {
        type: null,
        message: null,
      },
      alertTimeout: null,
      isSaving: false,
    };
  },
  computed: {
    isValid() {
      // Check if all rates are valid
      return this.rates.every((r) => {
        const nameValid = r.name && r.name.trim() !== '';
        const rateVal = parseFloat(r.rate);
        const rateValid = !isNaN(rateVal) && rateVal >= 0 && rateVal <= 100;
        return nameValid && rateValid;
      });
    },
  },
  async mounted() {
    await this.loadRates();
  },
  beforeUnmount() {
    if (this.alertTimeout) {
      clearTimeout(this.alertTimeout);
    }
  },
  methods: {
    async loadRates() {
      try {
        let dbRates = [];
        if (window.electronAPI && typeof window.electronAPI.getTvaRates === 'function') {
          dbRates = await window.electronAPI.getTvaRates();
        }
        // Filter only active ones for editing in the grid
        const activeRates = dbRates.filter((r) => r.is_active === 1 || r.is_active === undefined);
        this.rates = activeRates.map((r) => ({ ...r }));
        this.originalRates = activeRates.map((r) => ({ ...r }));
      } catch (err) {
        console.error('Failed to load TVA rates:', err);
        this.showAlert('error', this.$t('tva_save_error'));
      }
    },
    isDirty() {
      if (this.rates.length !== this.originalRates.length) return true;
      for (let i = 0; i < this.rates.length; i++) {
        const current = this.rates[i];
        const original = this.originalRates[i];
        if (current.id !== original.id) return true;
        if (current.name !== original.name) return true;
        if (parseFloat(current.rate) !== parseFloat(original.rate)) return true;
      }
      return false;
    },
    addRate() {
      // Generate a temporary unique ID for tracking the item in the list
      const tempId = 'temp_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
      this.rates.push({
        id: tempId,
        name: '',
        rate: 0,
      });
    },
    removeRate(index) {
      const rate = this.rates[index];
      const name = rate.name ? `"${rate.name}"` : '';
      const message =
        this.$t('unsaved_changes_msg') || `Voulez-vous vraiment supprimer ce taux de TVA ${name} ?`;

      if (window.confirm(message)) {
        this.rates.splice(index, 1);
      }
    },
    cancelChanges() {
      if (this.isDirty()) {
        const confirmMsg =
          this.$t('unsaved_changes_msg') || 'Voulez-vous abandonner vos modifications ?';
        if (window.confirm(confirmMsg)) {
          this.$emit('close');
        }
      } else {
        this.$emit('close');
      }
    },
    async saveChanges() {
      if (!this.isValid) return;
      this.isSaving = true;
      this.clearAlert();

      try {
        if (window.electronAPI && typeof window.electronAPI.saveTvaRates === 'function') {
          // Map to strip temporary ids before sending, or rather pass them as-is
          // TvaController expects number for existing IDs, others as new records.
          const ratesToSave = this.rates.map((r) => {
            const isTemp = typeof r.id === 'string' && r.id.startsWith('temp_');
            return {
              id: isTemp ? null : r.id,
              name: r.name,
              rate: parseFloat(r.rate),
            };
          });

          const updatedRates = await window.electronAPI.saveTvaRates(ratesToSave);
          this.showAlert('success', this.$t('tva_save_success'));

          // Re-initialize original rates
          const activeRates = updatedRates.filter((r) => r.is_active === 1);
          this.rates = activeRates.map((r) => ({ ...r }));
          this.originalRates = activeRates.map((r) => ({ ...r }));

          this.$emit('tva-saved', updatedRates);
        } else {
          // Simulation for development
          console.log('Mock saving rates:', this.rates);
          this.showAlert('success', 'Mock: Saved successfully!');
          this.originalRates = this.rates.map((r) => ({ ...r }));
          this.$emit('tva-saved', this.rates);
        }
      } catch (err) {
        console.error('Failed to save TVA rates:', err);
        this.showAlert('error', err.message || this.$t('tva_save_error'));
      } finally {
        this.isSaving = false;
      }
    },
    showAlert(type, message) {
      this.alert.type = type;
      this.alert.message = message;

      if (this.alertTimeout) {
        clearTimeout(this.alertTimeout);
      }
      this.alertTimeout = setTimeout(() => {
        this.clearAlert();
      }, 5000);
    },
    clearAlert() {
      this.alert.type = null;
      this.alert.message = null;
    },
  },
};
</script>
