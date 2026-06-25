<template>
  <button
    class="basket-header-btn"
    :class="{ active: basketState.isViewing }"
    @click="$emit('click')"
    title="Voir le panier"
  >
    <span class="basket-btn-icon">🛒</span>
    <span class="basket-btn-text">Panier ({{ totalBasketItems }})</span>
  </button>
</template>

<script>
import { basketState } from '../utils/basketStore';

export default {
  name: 'BasketHeaderButton',
  emits: ['click'],
  data() {
    return {
      basketState,
    };
  },
  computed: {
    totalBasketItems() {
      return this.basketState.items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
    },
  },
};
</script>
