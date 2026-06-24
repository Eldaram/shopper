<template>
  <div class="detail-container">
    <div class="detail-header">
      <button class="btn-back" @click="$emit('close')"><span>←</span> Retour au catalogue</button>
      <span class="detail-badge-mode">🔍 Consultation</span>
    </div>

    <div class="detail-card">
      <div class="detail-image-sec">
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="product.name"
          class="detail-large-img"
          @error="handleImageError"
        />
        <div v-else class="detail-img-placeholder">
          {{ initials }}
        </div>
      </div>

      <div class="detail-form-sec">
        <h2 class="detail-form-title">Détails du Produit</h2>

        <form class="form-grid" @submit.prevent>
          <div class="form-group form-field-full">
            <label class="form-label">Nom de l'article</label>
            <input type="text" :value="product.name" class="form-input" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Code-barres (EAN)</label>
            <input type="text" :value="product.barcode || 'Aucun'" class="form-input" disabled />
          </div>

          <div class="form-group">
            <label class="form-label">Catégorie</label>
            <select :value="product.category_id" class="form-input" disabled>
              <option v-for="cat in categories" :key="cat.id" :value="cat.id">
                {{ cat.name }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Prix HT</label>
            <input
              type="text"
              :value="formatPricePlain(product.price_ht)"
              class="form-input"
              disabled
            />
          </div>

          <div class="form-group">
            <label class="form-label">Prix TTC</label>
            <input
              type="text"
              :value="formatPricePlain(product.price_ttc)"
              class="form-input"
              disabled
            />
          </div>

          <div class="form-group">
            <label class="form-label">Taux TVA</label>
            <select :value="product.tva_id" class="form-input" disabled>
              <option v-for="rate in tvaRates" :key="rate.id" :value="rate.id">
                {{ rate.name }} ({{ rate.rate }}%)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Origine des données</label>
            <input
              type="text"
              :value="product.is_openfoodfacts ? 'Open Food Facts' : 'Import Local'"
              class="form-input"
              disabled
            />
          </div>
        </form>

        <div class="detail-actions">
          <button class="btn-secondary" disabled>Modifier</button>
          <button class="btn-primary" disabled>Enregistrer</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductDetail',
  props: {
    product: {
      type: Object,
      required: true,
    },
    categories: {
      type: Array,
      required: true,
    },
    tvaRates: {
      type: Array,
      required: true,
    },
  },
  emits: ['close'],
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
    formatPricePlain(price) {
      if (typeof price !== 'number') return '0,00';
      return (
        new Intl.NumberFormat('fr-FR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(price) + ' €'
      );
    },
    handleImageError(e) {
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'detail-img-placeholder';
      placeholder.innerText = this.initials;
      e.target.parentNode.appendChild(placeholder);
    },
  },
};
</script>
