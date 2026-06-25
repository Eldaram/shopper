<template>
  <div id="app">
    <!-- Sidebar Navigation -->
    <Sidebar
      :categories="categories"
      :products="products"
      :selected-category-id="selectedCategoryId"
      :active-ancestor-id="activeAncestorId"
      :is-viewing-basket="isViewingBasket"
      @select-category="handleSelectCategory"
      @contextmenu-category="handleCategoryContextMenu"
    />

    <!-- Main Workspace -->
    <main class="workspace">
      <!-- Top Header Bar -->
      <header class="topbar">
        <Breadcrumbs :path="breadcrumbsPath" @select-category="handleSelectCategory" />

        <div class="topbar-right">
          <!-- Search Bar (Visible only when not viewing product details, creation, or basket) -->
          <div v-if="!focusedProduct && !isCreatingProduct && !isViewingBasket" class="search-container">
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Rechercher un article..."
              class="search-input"
            />
          </div>

          <!-- Basket Button: Accessible at all times -->
          <button
            class="basket-header-btn"
            :class="{ active: isViewingBasket }"
            @click="handleToggleBasket"
            title="Voir le panier"
          >
            <span class="basket-btn-icon">🛒</span>
            <span class="basket-btn-text">Panier ({{ totalBasketItems }})</span>
          </button>
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-area" @contextmenu="handleWorkspaceContextMenu">
        <!-- Transition between basket view, grid view and details/creation view -->
        <div v-if="isViewingBasket">
          <BasketView
            :basket="basket"
            :tva-rates="tvaRates"
            @close="handleCloseBasket"
            @update-quantity="handleUpdateBasketQuantity"
            @remove-item="handleRemoveBasketItem"
            @clear-basket="confirmAndClearBasket"
            @validate-sale="handleValidateSale"
          />
        </div>

        <div v-else-if="focusedProduct || isCreatingProduct">
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
            @delete="deleteFocusedProduct"
            @add-to-basket="addToBasket"
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
                @contextmenu.prevent.stop="handleProductContextMenu($event, prod)"
                @add-to-basket="addToBasket"
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

    <!-- Floating Action Button (FAB) for fast item creation (hidden on basket page) -->
    <button v-if="!isViewingBasket" class="fab-btn" @click="handleFabClick" title="Créer un article">
      <span>+</span>
    </button>

    <!-- Custom Context Menu -->
    <div
      v-if="contextMenu.visible"
      class="context-menu"
      :style="{ top: contextMenu.y + 'px', left: contextMenu.x + 'px' }"
    >
      <template v-if="contextMenu.targetProduct">
        <div class="context-menu-item" @click="handleDeleteProductFromContextMenu">
          <span class="context-menu-icon">🗑️</span>
          <span>Supprimer l'article</span>
        </div>
      </template>
      <template v-else>
        <div class="context-menu-item" @click="handleCreateItemFromContextMenu">
          <span class="context-menu-icon">➕</span>
          <span
            >Ajouter un article
            {{ contextMenu.targetCategory ? `dans ${contextMenu.targetCategory.name}` : '' }}</span
          >
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import CategoryCard from './components/CategoryCard.vue';
import ProductCard from './components/ProductCard.vue';
import ProductDetail from './components/ProductDetail.vue';
import BasketView from './components/BasketView.vue';

export default {
  name: 'App',
  components: {
    Sidebar,
    Breadcrumbs,
    CategoryCard,
    ProductCard,
    ProductDetail,
    BasketView,
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
      basket: [],
      isViewingBasket: false,
      contextMenu: {
        visible: false,
        x: 0,
        y: 0,
        targetCategory: null,
        targetProduct: null,
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
      if (this.isViewingBasket) {
        path.push({ name: 'Panier', type: 'basket' });
      } else if (this.focusedProduct !== null) {
        path.push({ name: this.focusedProduct.name, type: 'product' });
      } else if (this.isCreatingProduct) {
        path.push({ name: "Création d'un article", type: 'product' });
      }
      return path;
    },
    totalBasketItems() {
      return this.basket.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
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
    if (window.electronAPI && typeof window.electronAPI.onMenuDeleteProduct === 'function') {
      window.electronAPI.onMenuDeleteProduct(async () => {
        if (this.focusedProduct) {
          await this.deleteProduct(this.focusedProduct);
        }
      });
    }
    if (window.electronAPI && typeof window.electronAPI.onMenuClearBasket === 'function') {
      window.electronAPI.onMenuClearBasket(() => {
        this.confirmAndClearBasket();
      });
    }
    if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
      window.electronAPI.setClearBasketEnabled(this.basket.length > 0);
    }
  },
  beforeUnmount() {
    window.removeEventListener('click', this.closeContextMenu);
    if (window.electronAPI && typeof window.electronAPI.setDeleteMenuEnabled === 'function') {
      window.electronAPI.setDeleteMenuEnabled(false);
    }
    if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
      window.electronAPI.setClearBasketEnabled(false);
    }
  },
  watch: {
    focusedProduct: {
      handler(newVal) {
        if (window.electronAPI && typeof window.electronAPI.setDeleteMenuEnabled === 'function') {
          window.electronAPI.setDeleteMenuEnabled(newVal !== null);
        }
      },
      immediate: true,
    },
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
      if (this.isViewingBasket) {
        this.isViewingBasket = false;
      }
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.selectedCategoryId = catId;
      this.focusedProduct = null;
    },
    async handleSelectProduct(prod) {
      if (this.isViewingBasket) {
        this.isViewingBasket = false;
      }
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
      if (this.isViewingBasket) {
        this.isViewingBasket = false;
      }
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
          'Vous avez des modifications non enregistrées. Voulez-vous abandonner vos modifications ?'
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
      this.focusedProduct = this.products.find((p) => p.id === prodId) || null;
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
        targetProduct: null,
      };
    },
    handleProductContextMenu(event, product) {
      this.contextMenu = {
        visible: true,
        x: event.clientX,
        y: event.clientY,
        targetCategory: null,
        targetProduct: product,
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
        targetProduct: null,
      };
    },
    handleCreateItemFromContextMenu() {
      this.openCreateProduct(this.contextMenu.targetCategory?.id || null);
      this.closeContextMenu();
    },
    async handleDeleteProductFromContextMenu() {
      const product = this.contextMenu.targetProduct;
      this.closeContextMenu();
      if (product) {
        await this.deleteProduct(product);
      }
    },
    closeContextMenu() {
      this.contextMenu.visible = false;
      this.contextMenu.targetProduct = null;
      this.contextMenu.targetCategory = null;
    },
    async deleteFocusedProduct() {
      if (this.focusedProduct) {
        await this.deleteProduct(this.focusedProduct);
      }
    },
    async deleteProduct(product) {
      if (!product) return;

      let confirmed = false;
      if (window.electronAPI && typeof window.electronAPI.confirmDeleteProduct === 'function') {
        confirmed = await window.electronAPI.confirmDeleteProduct(product.name);
      } else {
        confirmed = window.confirm(`Voulez-vous vraiment supprimer le produit "${product.name}" ?`);
      }

      if (confirmed) {
        try {
          if (window.electronAPI && typeof window.electronAPI.deleteProduct === 'function') {
            await window.electronAPI.deleteProduct(product.id);
          } else {
            console.log('Mock: Product deleted', product.id);
            const idx = this.products.findIndex((p) => p.id === product.id);
            if (idx !== -1) {
              this.products.splice(idx, 1);
            }
          }
          if (this.focusedProduct && this.focusedProduct.id === product.id) {
            this.focusedProduct = null;
          }
          await this.fetchData();
        } catch (err) {
          console.error('Error deleting product:', err);
          alert(`Erreur lors de la suppression: ${err.message}`);
        }
      }
    },
    async handleToggleBasket() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.isViewingBasket = !this.isViewingBasket;
      if (this.isViewingBasket) {
        this.focusedProduct = null;
        this.isCreatingProduct = false;
      }
    },
    handleCloseBasket() {
      this.isViewingBasket = false;
    },
    addToBasket(product) {
      const existing = this.basket.find((item) => item.product.id === product.id);
      if (existing) {
        existing.quantity += 1;
      } else {
        this.basket.push({
          product: { ...product },
          quantity: 1,
        });
      }
      if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
        window.electronAPI.setClearBasketEnabled(true);
      }
    },
    handleUpdateBasketQuantity(productId, quantity) {
      const item = this.basket.find((item) => item.product.id === productId);
      if (item) {
        item.quantity = Math.max(1, quantity);
      }
    },
    handleRemoveBasketItem(productId) {
      const idx = this.basket.findIndex((item) => item.product.id === productId);
      if (idx !== -1) {
        this.basket.splice(idx, 1);
      }
      if (this.basket.length === 0) {
        if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
          window.electronAPI.setClearBasketEnabled(false);
        }
      }
    },
    async confirmAndClearBasket() {
      if (this.basket.length === 0) return;
      let confirmed = false;
      if (window.electronAPI && typeof window.electronAPI.confirmClearBasket === 'function') {
        confirmed = await window.electronAPI.confirmClearBasket();
      } else {
        confirmed = window.confirm("Voulez vous vraiment vider tout le panier ?");
      }
      if (confirmed) {
        this.clearBasket();
      }
    },
    clearBasket() {
      this.basket = [];
      if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
        window.electronAPI.setClearBasketEnabled(false);
      }
    },
    handleValidateSale() {
      const formattedTotal = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
        this.basket.reduce((sum, item) => sum + (parseFloat(item.product.price_ttc) || 0) * (parseInt(item.quantity) || 0), 0)
      );
      alert(`Vente validée d'un montant de ${formattedTotal} !`);
      this.clearBasket();
      this.isViewingBasket = false;
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
