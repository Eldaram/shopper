<template>
  <div class="basket-container">
    <div class="basket-header">
      <h1 class="basket-title">
        <span class="basket-title-icon">🛒</span>
        <span>{{ readonlyTicket ? $t('read_only_basket') : $t('basket') }}</span>
        <span v-if="readonlyTicket" class="basket-ticket-id"> #{{ readonlyTicket.id }}</span>
        <span class="basket-badge">
          {{ totalItems }} {{ totalItems > 1 ? $t('items') : $t('item') }}
        </span>
      </h1>
      <button
        v-if="basketState.items.length > 0 && !readonlyTicket"
        class="btn-clear-basket"
        @click="confirmAndClearBasket"
      >
        <span class="clear-icon">🗑️</span>
        <span>{{ $t('clear_basket') }}</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="displayItems.length === 0" class="basket-empty-state">
      <span class="empty-cart-icon">🛒</span>
      <h2>{{ $t('basket_empty_title') }}</h2>
      <p>{{ $t('basket_empty_desc') }}</p>
      <button class="btn-back-catalog" @click="$emit('close')">
        {{ $t('back_to_explorer') }}
      </button>
    </div>

    <!-- Basket Table Grid -->
    <div v-else class="basket-content">
      <div class="basket-table-wrapper">
        <table class="basket-table">
          <thead>
            <tr>
              <th>{{ $t('image') }}</th>
              <th>{{ $t('product') }}</th>
              <th>{{ $t('tax') }}</th>
              <th>{{ $t('unit_price_ttc') }}</th>
              <th>{{ $t('quantity') }}</th>
              <th>{{ $t('total_ttc') }}</th>
              <th v-if="!readonlyTicket">{{ $t('action') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in displayItems" :key="item.product.id" class="basket-row">
              <td class="col-img">
                <div class="basket-img-container">
                  <img
                    v-if="imageUrl(item.product)"
                    :src="imageUrl(item.product)"
                    :alt="item.product.name"
                    class="basket-prod-img"
                    @error="handleImageError($event, item.product)"
                  />
                  <div v-else class="basket-img-placeholder">
                    {{ initials(item.product) }}
                  </div>
                </div>
              </td>
              <td class="col-name">
                <div class="basket-item-name">{{ item.product.name }}</div>
                <div class="basket-item-barcode">{{ item.product.barcode }}</div>
              </td>
              <td class="col-tax">
                <span class="tax-badge">{{ getTaxLabel(item) }}</span>
              </td>
              <td class="col-price-unit">
                {{ formatPrice(item.product.price_ttc) }}
              </td>
              <td class="col-qty">
                <div v-if="readonlyTicket" class="qty-readonly">x {{ item.quantity }}</div>
                <div v-else class="qty-stepper">
                  <button
                    class="qty-btn minus"
                    :disabled="item.quantity <= 1"
                    @click="decrementQty(item)"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    v-model.number="item.quantity"
                    @input="validateQty(item)"
                    @change="validateQtyChange(item)"
                    class="qty-input"
                    min="1"
                    step="1"
                  />
                  <button class="qty-btn plus" @click="incrementQty(item)">+</button>
                </div>
              </td>
              <td class="col-price-total">
                {{ formatPrice(item.product.price_ttc * item.quantity) }}
              </td>
              <td v-if="!readonlyTicket" class="col-actions">
                <button
                  class="btn-remove-item"
                  @click="handleRemoveBasketItem(item.product.id)"
                  :title="$t('delete_item')"
                >
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Summary / Footer -->
      <div class="basket-footer">
        <div class="basket-footer-left">
          <button class="btn-back-catalog-link" @click="$emit('close')">
            ← {{ readonlyTicket ? $t('dashboard') : $t('back_to_explorer') }}
          </button>
        </div>
        <div class="basket-summary-card">
          <div class="summary-row">
            <span>{{ $t('num_items') }}</span>
            <span class="summary-value">{{ totalItems }}</span>
          </div>
          <div class="summary-row total-row">
            <span>{{ $t('total_amount_ttc') }}</span>
            <span class="summary-total-price">{{ formatPrice(totalTtc) }}</span>
          </div>
          <button v-if="!readonlyTicket" class="btn-validate-sale" @click="handleValidateSale">
            {{ $t('validate_sale') }}
          </button>
          <div v-else class="receipt-footer-stamp">
            {{ $t('date') }}: {{ formatDate(readonlyTicket.created_at) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import {
  basketState,
  handleUpdateBasketQuantity,
  handleRemoveBasketItem,
  confirmAndClearBasket,
  handleValidateSale,
} from '../utils/basketStore';

export default {
  name: 'BasketView',
  props: {
    tvaRates: {
      type: Array,
      required: true,
    },
    readonlyTicket: {
      type: Object,
      default: null,
    },
  },
  emits: ['close'],
  data() {
    return {
      basketState,
    };
  },
  computed: {
    displayItems() {
      if (this.readonlyTicket) {
        return this.readonlyTicket.lines.map((line) => ({
          product: {
            id: line.product_id,
            name: line.product_name || `Product #${line.product_id}`,
            barcode: line.product_barcode || '',
            image_path: line.product_image_path,
            image_url_openfoodfacts: line.product_image_url,
            tva_id: null,
            price_ttc: line.final_unit_price_ttc,
          },
          quantity: line.quantity,
          applied_tva_rate: line.applied_tva_rate,
          isReadonly: true,
        }));
      }
      return this.basketState.items;
    },
    totalItems() {
      return this.displayItems.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    },
    totalTtc() {
      if (this.readonlyTicket) {
        return this.readonlyTicket.total_amount_ttc;
      }
      return this.displayItems.reduce(
        (sum, item) =>
          sum + (parseFloat(item.product.price_ttc) || 0) * (parseInt(item.quantity) || 0),
        0
      );
    },
  },
  methods: {
    imageUrl(product) {
      return product.image_path || product.image_url_openfoodfacts || null;
    },
    initials(product) {
      if (!product.name) return '';
      return product.name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
    formatPrice(price) {
      if (typeof price !== 'number') return this.$currentLang === 'fr' ? '0,00 €' : '€0.00';
      const locale = this.$currentLang === 'fr' ? 'fr-FR' : 'en-GB';
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(price);
    },
    getTaxLabel(item) {
      if (item.applied_tva_rate !== undefined) {
        return `TVA (${item.applied_tva_rate}%)`;
      }
      const rate = this.tvaRates.find((r) => r.id === item.product.tva_id);
      return rate ? `${rate.name} (${rate.rate}%)` : 'TVA 0%';
    },
    decrementQty(item) {
      if (item.quantity > 1) {
        const newQty = (parseInt(item.quantity, 10) || 1) - 1;
        handleUpdateBasketQuantity(item.product.id, newQty);
      }
    },
    incrementQty(item) {
      const newQty = (parseInt(item.quantity, 10) || 0) + 1;
      handleUpdateBasketQuantity(item.product.id, newQty);
    },
    validateQty(item) {
      if (item.quantity !== '') {
        const val = parseInt(item.quantity, 10);
        if (isNaN(val) || val < 1) {
          item.quantity = 1;
        } else {
          item.quantity = val;
        }
      }
      handleUpdateBasketQuantity(item.product.id, item.quantity);
    },
    validateQtyChange(item) {
      const val = parseInt(item.quantity, 10);
      if (isNaN(val) || val < 1) {
        item.quantity = 1;
      } else {
        item.quantity = val;
      }
      handleUpdateBasketQuantity(item.product.id, item.quantity);
    },
    handleImageError(e, product) {
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'basket-img-placeholder';
      placeholder.innerText = this.initials(product);
      e.target.parentNode.appendChild(placeholder);
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
    confirmAndClearBasket,
    handleRemoveBasketItem,
    handleValidateSale,
  },
};
</script>
