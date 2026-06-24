<template>
  <div id="app">
    <!-- Sidebar Navigation -->
    <Sidebar
      :categories="categories"
      :products="products"
      :selected-category-id="selectedCategoryId"
      :active-ancestor-id="activeAncestorId"
      @select-category="handleSelectCategory"
    />

    <!-- Main Workspace -->
    <main class="workspace">
      <!-- Top Header Bar -->
      <header class="topbar">
        <Breadcrumbs :path="breadcrumbsPath" @select-category="handleSelectCategory" />

        <!-- Search Bar (Visible only when not viewing product details) -->
        <div v-if="!focusedProduct" class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un article..."
            class="search-input"
          />
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-area">
        <!-- Transition between grid view and details view -->
        <div v-if="focusedProduct">
          <ProductDetail
            :product="focusedProduct"
            :categories="categories"
            :tva-rates="tvaRates"
            @close="focusedProduct = null"
          />
        </div>

        <div v-else>
          <!-- Category Selection/Subcategories Grid -->
          <div v-if="subcategories.length > 0 && !searchQuery.trim()" class="section-container">
            <div class="section-header">
              <h2 class="section-title">
                <span>📁</span>
                <span>{{
                  selectedCategoryId === null ? 'Rayons principaux' : 'Sous-catégories'
                }}</span>
                <span class="section-title-badge">{{ subcategories.length }}</span>
              </h2>
            </div>
            <div class="cards-grid">
              <CategoryCard
                v-for="sub in subcategories"
                :key="sub.id"
                :category="sub"
                @click="handleSelectCategory(sub.id)"
              />
            </div>
          </div>

          <!-- Products Grid -->
          <div class="section-container">
            <div class="section-header">
              <h2 class="section-title">
                <span>📦</span>
                <span>Articles</span>
                <span class="section-title-badge">{{ filteredProducts.length }}</span>
              </h2>
            </div>

            <div v-if="filteredProducts.length > 0" class="cards-grid">
              <ProductCard
                v-for="prod in filteredProducts"
                :key="prod.id"
                :product="prod"
                @click="focusedProduct = prod"
              />
            </div>

            <div v-else class="empty-state">
              <span class="empty-state-icon">🔍</span>
              <h3 class="empty-state-title">Aucun article trouvé</h3>
              <p>Essayez de modifier vos filtres ou de taper une autre recherche.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import CategoryCard from './components/CategoryCard.vue';
import ProductCard from './components/ProductCard.vue';
import ProductDetail from './components/ProductDetail.vue';

export default {
  name: 'App',
  components: {
    Sidebar,
    Breadcrumbs,
    CategoryCard,
    ProductCard,
    ProductDetail,
  },
  data() {
    return {
      categories: [],
      products: [],
      tvaRates: [],
      selectedCategoryId: null,
      focusedProduct: null,
      searchQuery: '',
    };
  },
  computed: {
    activeAncestorId() {
      if (this.selectedCategoryId === null) return null;
      let current = this.categories.find((c) => c.id === this.selectedCategoryId);
      if (!current) return null;
      // Loop up to find the root category (which has parent_id = null)
      while (current.parent_id !== null) {
        const parent = this.categories.find((c) => c.id === current.parent_id);
        if (!parent) break;
        current = parent;
      }
      return current.id;
    },
    breadcrumbsPath() {
      const path = [{ name: 'Accueil', type: 'home' }];
      if (this.selectedCategoryId !== null) {
        const catPath = [];
        let current = this.categories.find((c) => c.id === this.selectedCategoryId);
        while (current) {
          catPath.push({ id: current.id, name: current.name, type: 'category' });
          current = current.parent_id
            ? this.categories.find((c) => c.id === current.parent_id)
            : null;
        }
        path.push(...catPath.reverse());
      }
      if (this.focusedProduct !== null) {
        path.push({ name: this.focusedProduct.name, type: 'product' });
      }
      return path;
    },
    subcategories() {
      if (this.selectedCategoryId === null) {
        // At the root, list main categories
        return this.categories.filter((c) => c.parent_id === null);
      }
      return this.categories.filter((c) => c.parent_id === this.selectedCategoryId);
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
  async mounted() {
    await this.fetchData();
  },
  methods: {
    async fetchData() {
      try {
        if (window.electronAPI && typeof window.electronAPI.getCategories === 'function') {
          this.categories = await window.electronAPI.getCategories();
          this.products = await window.electronAPI.getProducts();
          this.tvaRates = await window.electronAPI.getTvaRates();
        } else {
          console.warn('window.electronAPI not found. Loading browser mock data...');
          this.loadBrowserMocks();
        }
      } catch (err) {
        console.error('Failed to load catalogue data:', err);
      }
    },
    handleSelectCategory(catId) {
      this.selectedCategoryId = catId;
      this.focusedProduct = null;
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
    loadBrowserMocks() {
      // Mock data matching the seeder for browser-only mode / tests fallback
      this.categories = [
        {
          id: 1,
          name: 'Épicerie',
          parent_id: null,
          image_path:
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 2,
          name: 'Boissons',
          parent_id: null,
          image_path:
            'https://images.unsplash.com/photo-1527960650-26df2cef137c?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 8,
          name: 'Pâtes & Riz',
          parent_id: 1,
          image_path:
            'https://images.unsplash.com/photo-1551462147-ff29053bfc14?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 9,
          name: 'Sodas',
          parent_id: 2,
          image_path:
            'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
        },
      ];
      this.products = [
        {
          id: 1,
          barcode: '5449000000996',
          name: 'Coca-Cola 1.5L',
          price_ht: 1.5,
          price_ttc: 1.8,
          tva_id: 1,
          category_id: 9,
          category_name: 'Sodas',
          image_url_openfoodfacts:
            'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
        },
        {
          id: 2,
          barcode: '3168930009078',
          name: 'Chips Lays Nature 150g',
          price_ht: 1.25,
          price_ttc: 1.5,
          tva_id: 1,
          category_id: 1,
          category_name: 'Épicerie',
          image_url_openfoodfacts:
            'https://images.unsplash.com/photo-1566478989037-eec170784d20?auto=format&fit=crop&w=400&q=80',
        },
      ];
      this.tvaRates = [{ id: 1, name: 'Taux normal (20%)', rate: 20.0, is_active: 1 }];
    },
  },
};
</script>
