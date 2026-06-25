<template>
  <div id="app">
    <!-- Sidebar Navigation -->
    <Sidebar
      :categories="categories"
      :products="products"
      :selected-category-id="selectedCategoryId"
      :active-ancestor-id="activeAncestorId"
      :is-viewing-dashboard="isViewingDashboard"
      @select-category="handleSelectCategory"
      @contextmenu-category="handleCategoryContextMenu"
      @select-dashboard="handleSelectDashboard"
    />

    <!-- Main Workspace -->
    <main class="workspace">
      <!-- Top Header Bar -->
      <header class="topbar">
        <Breadcrumbs
          :categories="categories"
          :selected-category-id="selectedCategoryId"
          :focused-product="focusedProduct"
          :is-creating-product="isCreatingProduct"
          :is-viewing-dashboard="isViewingDashboard"
          :readonly-ticket="readonlyTicket"
          @select-category="handleSelectCategory"
          @select-dashboard="handleSelectDashboard"
        />

        <div class="topbar-right">
          <!-- Search Bar (Visible only when not viewing product details, creation, dashboard or basket) -->
          <SearchBar
            v-if="
              !focusedProduct && !isCreatingProduct && !basketState.isViewing && !isViewingDashboard
            "
          />

          <!-- Offline Indicator -->
          <span
            v-if="isOffline"
            class="offline-indicator"
            title="Application hors ligne - Les recherches OpenFoodFacts sont désactivées / App is offline - OpenFoodFacts search is disabled"
          >
            ✈️
          </span>

          <!-- Language Selector -->
          <LanguageSelector />

          <!-- Basket Button: Accessible at all times -->
          <BasketHeaderButton @click="handleToggleBasket" />
        </div>
      </header>

      <!-- Content Area -->
      <div class="content-area" @contextmenu="handleWorkspaceContextMenu">
        <!-- Transition between basket view, grid view and details/creation view -->
        <div v-if="basketState.isViewing">
          <BasketView
            :tva-rates="tvaRates"
            :readonly-ticket="readonlyTicket"
            @close="handleCloseBasket"
          />
        </div>

        <div v-else-if="isViewingDashboard">
          <DashboardView @view-ticket="handleViewTicket" />
        </div>

        <div v-else-if="focusedProduct || isCreatingProduct">
          <ProductDetail
            ref="productDetail"
            :product="focusedProduct"
            :mode="isCreatingProduct ? 'create' : 'view'"
            :preselected-category-id="preselectedCategoryId"
            :categories="categories"
            :tva-rates="tvaRates"
            :is-offline="isOffline"
            @close="handleCloseDetail"
            @product-created="handleProductCreated"
            @product-updated="handleProductUpdated"
            @delete="deleteFocusedProduct"
          />
        </div>

        <CatalogueView
          v-else
          :categories="categories"
          :products="products"
          :selected-category-id="selectedCategoryId"
          @select-category="handleSelectCategory"
          @select-product="handleSelectProduct"
          @contextmenu-category="handleCategoryContextMenu"
          @contextmenu-product="handleProductContextMenu"
        />
      </div>
    </main>

    <!-- Floating Action Button (FAB) for fast item creation (hidden on basket/dashboard pages) -->
    <button
      v-if="!basketState.isViewing && !isViewingDashboard"
      class="fab-btn"
      @click="handleFabClick"
      title="Créer un article"
    >
      <span>+</span>
    </button>

    <!-- Custom Context Menu -->
    <ContextMenu
      ref="contextMenu"
      @delete-product="handleDeleteProductFromContextMenu"
      @delete-category="handleDeleteCategoryFromContextMenu"
      @create-item="handleCreateItemFromContextMenu"
    />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import ProductDetail from './components/ProductDetail.vue';
import BasketView from './components/BasketView.vue';
import CatalogueView from './components/CatalogueView.vue';
import DashboardView from './components/DashboardView.vue';
import SearchBar from './components/SearchBar.vue';
import BasketHeaderButton from './components/BasketHeaderButton.vue';
import ContextMenu from './components/ContextMenu.vue';
import LanguageSelector from './components/LanguageSelector.vue';
import { loadBrowserMocks as getBrowserMocks } from './utils/mockData';
import { basketState, confirmAndClearBasket } from './utils/basketStore';
import catalogMethods from './utils/catalogManager';

export default {
  name: 'App',
  components: {
    Sidebar,
    Breadcrumbs,
    ProductDetail,
    BasketView,
    CatalogueView,
    DashboardView,
    SearchBar,
    BasketHeaderButton,
    ContextMenu,
    LanguageSelector,
  },
  data() {
    return {
      categories: [],
      products: [],
      tvaRates: [],
      selectedCategoryId: null,
      focusedProduct: null,
      isCreatingProduct: false,
      preselectedCategoryId: null,
      basketState,
      isOffline: !navigator.onLine,
      isViewingDashboard: false,
      readonlyTicket: null,
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
    contextMenu() {
      return (
        this.$refs.contextMenu || { visible: false, targetProduct: null, targetCategory: null }
      );
    },
  },
  async mounted() {
    if (window.electronAPI && typeof window.electronAPI.onOfflineStatusChanged === 'function') {
      window.electronAPI.onOfflineStatusChanged((online) => {
        this.isOffline = !online;
      });
    }

    if (window.electronAPI && typeof window.electronAPI.isOnline === 'function') {
      try {
        const online = await window.electronAPI.isOnline();
        this.isOffline = !online;
      } catch (err) {
        this.isOffline = !navigator.onLine;
      }
    } else {
      this.isOffline = !navigator.onLine;
      window.addEventListener('online', this.updateOnlineStatus);
      window.addEventListener('offline', this.updateOnlineStatus);
    }

    await this.fetchData();
    if (window.electronAPI && typeof window.electronAPI.onMenuCreateProduct === 'function') {
      window.electronAPI.onMenuCreateProduct(() => {
        this.openCreateProduct(this.selectedCategoryId);
      });
    }
    if (window.electronAPI && typeof window.electronAPI.onMenuDeleteItem === 'function') {
      window.electronAPI.onMenuDeleteItem(async () => {
        if (this.focusedProduct) {
          await this.deleteProduct(this.focusedProduct);
        } else if (this.selectedCategoryId !== null) {
          const cat = this.categories.find((c) => c.id === this.selectedCategoryId);
          if (cat) await this.deleteCategory(cat);
        }
      });
    }
    if (window.electronAPI && typeof window.electronAPI.onMenuClearBasket === 'function') {
      window.electronAPI.onMenuClearBasket(() => {
        confirmAndClearBasket();
      });
    }
    if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
      window.electronAPI.setClearBasketEnabled(this.basketState.items.length > 0);
    }
  },
  beforeUnmount() {
    if (!window.electronAPI) {
      window.removeEventListener('online', this.updateOnlineStatus);
      window.removeEventListener('offline', this.updateOnlineStatus);
    }
    if (window.electronAPI && typeof window.electronAPI.setDeleteItemState === 'function') {
      window.electronAPI.setDeleteItemState(false, null);
    }
    if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
      window.electronAPI.setClearBasketEnabled(false);
    }
  },
  watch: {
    focusedProduct: {
      handler() {
        this.updateDeleteMenuState();
      },
      immediate: true,
    },
    selectedCategoryId: {
      handler() {
        this.updateDeleteMenuState();
      },
      immediate: false,
    },
  },
  methods: {
    updateOnlineStatus() {
      this.isOffline = !navigator.onLine;
    },
    ...catalogMethods,
    async handleSelectCategory(catId) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.isViewingDashboard = false;
      this.readonlyTicket = null;
      this.selectedCategoryId = catId;
      this.focusedProduct = null;
    },
    async handleSelectProduct(prod) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.isViewingDashboard = false;
      this.readonlyTicket = null;
      this.focusedProduct = prod;
    },
    openCreateProduct(categoryId = null) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      this.isViewingDashboard = false;
      this.readonlyTicket = null;
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
        const res = window.confirm(this.$t('unsaved_changes_msg'));
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
    handleFabClick() {
      this.openCreateProduct(this.selectedCategoryId);
    },
    loadBrowserMocks() {
      const mocks = getBrowserMocks();
      this.categories = mocks.categories;
      this.products = mocks.products;
      this.tvaRates = mocks.tvaRates;
    },
    async handleToggleBasket() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.basketState.isViewing = !this.basketState.isViewing;
      if (this.basketState.isViewing) {
        this.focusedProduct = null;
        this.isCreatingProduct = false;
        this.isViewingDashboard = false;
        this.readonlyTicket = null;
      }
    },
    handleCloseBasket() {
      if (this.readonlyTicket) {
        this.readonlyTicket = null;
        this.isViewingDashboard = true;
      }
      this.basketState.isViewing = false;
    },
    async handleSelectDashboard() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.basketState.isViewing = false;
      this.focusedProduct = null;
      this.readonlyTicket = null;
      this.selectedCategoryId = null;
      this.isViewingDashboard = true;
    },
    handleViewTicket(ticket) {
      this.readonlyTicket = ticket;
      this.basketState.isViewing = true;
      this.isViewingDashboard = false;
    },
    handleCategoryContextMenu(event, category) {
      if (this.$refs.contextMenu) {
        this.$refs.contextMenu.showForCategory(event, category);
      }
    },
    handleProductContextMenu(event, product) {
      if (this.$refs.contextMenu) {
        this.$refs.contextMenu.showForProduct(event, product);
      }
    },
    handleWorkspaceContextMenu(event) {
      if (this.isViewingDashboard || this.readonlyTicket) return;
      if (this.$refs.contextMenu) {
        this.$refs.contextMenu.showForWorkspace(event, this.selectedCategoryId, this.categories);
      }
    },
    handleCreateItemFromContextMenu(category) {
      const cat = category || this.contextMenu.targetCategory;
      this.openCreateProduct(cat?.id || null);
    },
    async handleDeleteProductFromContextMenu(product) {
      const prod = product || this.contextMenu.targetProduct;
      if (prod) {
        await this.deleteProduct(prod);
      }
    },
    async handleDeleteCategoryFromContextMenu(category) {
      if (category) {
        await this.deleteCategory(category);
      }
    },
    updateDeleteMenuState() {
      if (!window.electronAPI || typeof window.electronAPI.setDeleteItemState !== 'function')
        return;
      if (this.focusedProduct !== null) {
        window.electronAPI.setDeleteItemState(true, this.$t('menu_delete_product'));
      } else if (this.selectedCategoryId !== null) {
        window.electronAPI.setDeleteItemState(true, this.$t('menu_delete_category'));
      } else {
        window.electronAPI.setDeleteItemState(false, this.$t('menu_delete_product'));
      }
    },
  },
};
</script>
