<template>
  <div>
    <!-- Category Selection/Subcategories Grid -->
    <div v-if="subcategoriesList.length > 0 && !searchQuery.trim()" class="section-container">
      <div class="section-header">
        <h2 class="section-title">
          <span>📁</span>
          <span>{{ selectedCategoryId === null ? $t('main_categories') : $t('subcategories') }}</span>
          <span class="section-title-badge">{{ subcategoriesList.length }}</span>
        </h2>
      </div>
      <div class="cards-grid">
        <CategoryCard
          v-for="sub in subcategoriesList"
          :key="sub.id"
          :category="sub"
          @click="$emit('select-category', sub.id)"
          @contextmenu="$emit('contextmenu-category', $event, sub)"
        />
      </div>
    </div>

    <!-- Products Grid -->
    <div class="section-container">
      <div class="section-header">
        <h2 class="section-title">
          <span>📦</span>
          <span>{{ $t('products') }}</span>
          <span class="section-title-badge">{{ filteredProducts.length }}</span>
        </h2>
      </div>

      <div v-if="filteredProducts.length > 0" class="cards-grid">
        <ProductCard
          v-for="prod in filteredProducts"
          :key="prod.id"
          :product="prod"
          @click="$emit('select-product', prod)"
          @contextmenu.prevent.stop="$emit('contextmenu-product', $event, prod)"
          @add-to-basket="addToBasket"
        />
      </div>

      <div v-else class="empty-state">
        <span class="empty-state-icon">🔍</span>
        <h3 class="empty-state-title">{{ $t('no_products_found') }}</h3>
        <p>{{ $t('try_modifying_filters') }}</p>
      </div>
    </div>
  </div>
</template>

<script>
import CategoryCard from './CategoryCard.vue';
import ProductCard from './ProductCard.vue';
import { searchState } from '../utils/searchState';
import { addToBasket } from '../utils/basketStore';

export default {
  name: 'CatalogueView',
  components: {
    CategoryCard,
    ProductCard,
  },
  props: {
    categories: {
      type: Array,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    selectedCategoryId: {
      type: [Number, null],
      default: null,
    },
  },
  emits: ['select-category', 'select-product', 'contextmenu-category', 'contextmenu-product'],
  data() {
    return {
      subcategoriesList: [],
    };
  },
  watch: {
    selectedCategoryId: {
      async handler(newVal) {
        await this.loadSubcategories(newVal);
      },
      immediate: true,
    },
    categories: {
      async handler() {
        await this.loadSubcategories(this.selectedCategoryId);
      },
      deep: true,
    },
  },
  computed: {
    searchQuery() {
      return searchState.query;
    },
    filteredProducts() {
      let result = this.products;

      // Filter by category recursively
      if (this.selectedCategoryId !== null) {
        const allowedIds = this.getCategoryAndDescendantIds(this.selectedCategoryId);
        result = result.filter((p) => allowedIds.includes(p.category_id));
      }

      // Filter by search query
      if (this.searchQuery && this.searchQuery.trim() !== '') {
        const query = this.searchQuery.toLowerCase().trim();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(query) ||
            (p.barcode && p.barcode.includes(query)) ||
            (p.category_name && p.category_name.toLowerCase().includes(query))
        );
      }

      return result;
    },
  },
  methods: {
    addToBasket,
    async loadSubcategories(catId) {
      if (window.electronAPI && typeof window.electronAPI.getSubcategories === 'function') {
        try {
          this.subcategoriesList = await window.electronAPI.getSubcategories(catId);
        } catch (err) {
          console.error('Failed to load subcategories via IPC:', err);
          this.fallbackSubcategories(catId);
        }
      } else {
        this.fallbackSubcategories(catId);
      }
    },
    fallbackSubcategories(catId) {
      if (catId === null) {
        this.subcategoriesList = this.categories.filter((c) => c.parent_id === null);
      } else {
        this.subcategoriesList = this.categories.filter((c) => c.parent_id === catId);
      }
    },
    getCategoryAndDescendantIds(catId) {
      const ids = [catId];
      const findChildren = (parentId) => {
        const children = this.categories.filter((c) => c.parent_id === parentId);
        for (const child of children) {
          ids.push(child.id);
          findChildren(child.id);
        }
      };
      findChildren(catId);
      return ids;
    },
  },
};
</script>
