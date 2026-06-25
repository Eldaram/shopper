<template>
  <div class="basket-container">
    <div class="basket-header">
      <h1 class="basket-title">
        <span class="basket-title-icon">🛒</span>
        <span>Panier</span>
        <span class="basket-badge">
          {{ totalItems }} {{ totalItems > 1 ? 'articles' : 'article' }}
        </span>
      </h1>
      <button v-if="basket.length > 0" class="btn-clear-basket" @click="$emit('clear-basket')">
        <span class="clear-icon">🗑️</span>
        <span>Vider le panier</span>
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="basket.length === 0" class="basket-empty-state">
      <span class="empty-cart-icon">🛒</span>
      <h2>Le panier est vide</h2>
      <p>Ajoutez des articles depuis le catalogue pour commencer une vente.</p>
      <button class="btn-back-catalog" @click="$emit('close')">
        Retour à l'exploreur des produits
      </button>
    </div>

    <!-- Basket Table Grid -->
    <div v-else class="basket-content">
      <div class="basket-table-wrapper">
        <table class="basket-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>Article</th>
              <th>Taxe</th>
              <th>Prix unitaire TTC</th>
              <th>Quantité</th>
              <th>Total TTC</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in basket" :key="item.product.id" class="basket-row">
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
                <span class="tax-badge">{{ getTaxLabel(item.product) }}</span>
              </td>
              <td class="col-price-unit">
                {{ formatPrice(item.product.price_ttc) }}
              </td>
              <td class="col-qty">
                <div class="qty-stepper">
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
              <td class="col-actions">
                <button
                  class="btn-remove-item"
                  @click="$emit('remove-item', item.product.id)"
                  title="Supprimer l'article"
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
            ← Retour à l'exploreur des produits
          </button>
        </div>
        <div class="basket-summary-card">
          <div class="summary-row">
            <span>Nombre d'articles :</span>
            <span class="summary-value">{{ totalItems }}</span>
          </div>
          <div class="summary-row total-row">
            <span>Montant total (TTC) :</span>
            <span class="summary-total-price">{{ formatPrice(totalTtc) }}</span>
          </div>
          <button class="btn-validate-sale" @click="$emit('validate-sale')">
            Valider la vente
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BasketView',
  props: {
    basket: {
      type: Array,
      required: true,
    },
    tvaRates: {
      type: Array,
      required: true,
    },
  },
  emits: ['close', 'update-quantity', 'remove-item', 'clear-basket', 'validate-sale'],
  computed: {
    totalItems() {
      return this.basket.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    },
    totalTtc() {
      return this.basket.reduce(
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
      if (typeof price !== 'number') return '0,00 €';
      return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(price);
    },
    getTaxLabel(product) {
      const rate = this.tvaRates.find((r) => r.id === product.tva_id);
      return rate ? `${rate.name} (${rate.rate}%)` : 'TVA 0%';
    },
    decrementQty(item) {
      if (item.quantity > 1) {
        const newQty = (parseInt(item.quantity, 10) || 1) - 1;
        this.$emit('update-quantity', item.product.id, newQty);
      }
    },
    incrementQty(item) {
      const newQty = (parseInt(item.quantity, 10) || 0) + 1;
      this.$emit('update-quantity', item.product.id, newQty);
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
      this.$emit('update-quantity', item.product.id, item.quantity);
    },
    validateQtyChange(item) {
      const val = parseInt(item.quantity, 10);
      if (isNaN(val) || val < 1) {
        item.quantity = 1;
      } else {
        item.quantity = val;
      }
      this.$emit('update-quantity', item.product.id, item.quantity);
    },
    handleImageError(e, product) {
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'basket-img-placeholder';
      placeholder.innerText = this.initials(product);
      e.target.parentNode.appendChild(placeholder);
    },
  },
};
</script>
