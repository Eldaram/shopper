<template>
  <div class="square-card" @click="$emit('click')">
    <div class="card-img-container">
      <img
        v-if="imageUrl"
        :src="imageUrl"
        :alt="product.name"
        class="card-img"
        @error="handleImageError"
      />
      <div v-else class="card-img-placeholder">
        {{ initials }}
      </div>
    </div>
    <div class="card-overlay"></div>
    <button
      class="add-to-basket-btn"
      @click.stop="$emit('add-to-basket', product)"
      :title="$t('add_to_basket')"
    >
      <span>+</span>
    </button>
    <div class="card-content">
      <div class="card-name">{{ product.name }}</div>
      <div class="card-price">{{ formatPrice(product.price_ttc) }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true,
    },
  },
  emits: ['click', 'add-to-basket'],
  computed: {
    imageUrl() {
      return this.product.image_path || this.product.image_url_openfoodfacts || null;
    },
    initials() {
      if (!this.product.name) return '';
      return this.product.name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
  },
  methods: {
    formatPrice(price) {
      if (typeof price !== 'number') return this.$currentLang === 'fr' ? '0,00 €' : '€0.00';
      const locale = this.$currentLang === 'fr' ? 'fr-FR' : 'en-GB';
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR' }).format(price);
    },
    handleImageError(e) {
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'card-img-placeholder';
      placeholder.innerText = this.initials;
      e.target.parentNode.appendChild(placeholder);
    },
  },
};
</script>
