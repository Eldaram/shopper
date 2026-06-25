<template>
  <div id="app">
    <!-- Sidebar Navigation -->
    <Sidebar
      :categories="categories"
      :products="products"
      :selected-category-id="selectedCategoryId"
      :active-ancestor-id="activeAncestorId"
      @select-category="handleSelectCategory"
      @contextmenu-category="handleCategoryContextMenu"
    />

    <!-- Main Workspace -->
    <main class="workspace">
      <!-- Top Header Bar -->
      <header class="topbar">
        <Breadcrumbs :path="breadcrumbsPath" @select-category="handleSelectCategory" />

        <!-- Search Bar (Visible only when not viewing product details) -->
        <div v-if="!focusedProduct && !isCreatingProduct" class="search-container">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Rechercher un article..."
            class="search-input"
          />
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-area" @contextmenu="handleWorkspaceContextMenu">
        <!-- Transition between grid view and details/creation view -->
        <div v-if="focusedProduct || isCreatingProduct">
          <ProductDetail
            ref="productDetail"
            :product="focusedProduct"
            :mode="isCreatingProduct ? 'create' : 'view'"
            :preselected-category-id="preselectedCategoryId"
            :categories="categories"
            :tva-rates="tvaRates"
            @close="handleCloseDetail"
            @product-created="handleProductCreated"
            @product-updated="handleProductUpdated"
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
                @contextmenu="handleCategoryContextMenu($event, sub)"
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
                @click="handleSelectProduct(prod)"
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

    <!-- Floating Action Button (FAB) for fast item creation -->
    <button class="fab-btn" @click="handleFabClick" title="Créer un article">
      <span>+</span>
    </button>

    <!-- Custom Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <div class="context-menu-item" @click="handleCreateItemFromContextMenu">
        <span class="context-menu-icon">➕</span>
        <span>Ajouter un article
          {{ contextMenu.targetCategory ? `dans ${contextMenu.targetCategory.name}` : '' }}</span>
      </div>
    </div>
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
      isCreatingProduct: false,
      preselectedCategoryId: null,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        targetCategory: null,
      },
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
      } else if (this.isCreatingProduct) {
        path.push({ name: "Création d'un article", type: 'product' });
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
    window.addEventListener('click', this.closeContextMenu);
    if (window.electronAPI && typeof window.electronAPI.onMenuCreateProduct === 'function') {
      window.electronAPI.onMenuCreateProduct(() => {
        this.openCreateProduct(this.selectedCategoryId);
      });
    }
  },
  beforeUnmount() {
    window.removeEventListener('click', this.closeContextMenu);
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
    async handleSelectCategory(catId) {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.selectedCategoryId = catId;
      this.focusedProduct = null;
    },
    async handleSelectProduct(prod) {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.focusedProduct = prod;
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
    openCreateProduct(categoryId = null) {
      this.preselectedCategoryId = categoryId;
      this.isCreatingProduct = true;
      this.focusedProduct = null;
    },
    async confirmExitCreateMode() {
      const detail = this.$refs.productDetail;
      if (!detail) {
        this.isCreatingProduct = false;
        return true;
      }

      if (detail.currentStateName === 'view') {
        this.isCreatingProduct = false;
        return true;
      }

      const isDirty = detail.isFormDirty();
      if (!isDirty) {
        this.isCreatingProduct = false;
        return true;
      }

      let choice = 1; // Default to stay (1 is stay)
      if (
        window.electronAPI &&
        typeof window.electronAPI.showExitConfirmationDialog === 'function'
      ) {
        choice = await window.electronAPI.showExitConfirmationDialog();
      } else {
        const res = window.confirm(
          "Vous avez des modifications non enregistrées. Voulez-vous abandonner vos modifications ?"
        );
        choice = res ? 0 : 1; // 0 = Abandonner, 1 = Rester
      }

      if (choice === 0) {
        this.isCreatingProduct = false;
        return true;
      } else {
        return false; // Stay on page
      }
    },
    async handleCloseDetail() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.focusedProduct = null;
      this.isCreatingProduct = false;
    },
    async handleProductCreated(newProduct) {
      this.isCreatingProduct = false;
      this.focusedProduct = null;
      await this.fetchData();
      this.selectedCategoryId = newProduct.category_id;
    },
    async handleProductUpdated(prodId) {
      await this.fetchData();
      this.focusedProduct = this.products.find(p => p.id === prodId) || null;
    },
    handleFabClick() {
      this.openCreateProduct(this.selectedCategoryId);
    },
    handleCategoryContextMenu(event, category) {
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetCategory: category,
      };
    },
    handleWorkspaceContextMenu(event) {
      if (
        event.target.tagName === 'INPUT' ||
        event.target.tagName === 'SELECT' ||
        event.target.tagName === 'BUTTON'
      ) {
        return;
      }

      let currentCategory = null;
      if (this.selectedCategoryId !== null) {
        currentCategory = this.categories.find((c) => c.id === this.selectedCategoryId) || null;
      }

      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetCategory: currentCategory,
      };
    },
    handleCreateItemFromContextMenu() {
      this.openCreateProduct(this.contextMenu.targetCategory?.id || null);
      this.closeContextMenu();
    },
    closeContextMenu() {
      this.contextMenu.visible = false;
    },
    loadBrowserMocks() {
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
