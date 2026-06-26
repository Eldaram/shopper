<template>
  <div id="app">
    <!-- Sidebar Navigation -->
    <Sidebar
      :categories="categories"
      :products="products"
      :selected-category-id="selectedCategoryId"
      :active-ancestor-id="activeAncestorId"
      :is-viewing-dashboard="isViewingDashboard"
      :is-viewing-sales-report="isViewingSalesReport"
      @select-category="handleSelectCategory"
      @contextmenu-category="handleCategoryContextMenu"
      @select-dashboard="handleSelectDashboard"
      @select-sales-report="handleSelectSalesReport"
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
          :focused-category="focusedCategory"
          :is-creating-category="categoryDetailMode === 'create'"
          :is-viewing-dashboard="isViewingDashboard"
          :is-viewing-sales-report="isViewingSalesReport"
          :readonly-ticket="readonlyTicket"
          @select-category="handleSelectCategory"
          @select-dashboard="handleSelectDashboard"
          @select-sales-report="handleSelectSalesReport"
        />

        <div class="topbar-right">
          <!-- Search Bar (Visible only when not viewing product details, creation, dashboard or basket) -->
          <SearchBar
            v-if="
              !focusedProduct &&
              !isCreatingProduct &&
              categoryDetailMode === null &&
              !basketState.isViewing &&
              !isViewingDashboard &&
              !isViewingSalesReport
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

          <!-- Theme Selector -->
          <ThemeSelector />

          <!-- Barcode Scanner -->
          <BarcodeScannerButton />

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

        <div v-else-if="isViewingSalesReport">
          <SalesReportView />
        </div>

        <div v-else-if="focusedProduct || isCreatingProduct">
          <ProductDetail
            ref="productDetail"
            :product="focusedProduct"
            :mode="isCreatingProduct ? 'create' : 'view'"
            :preselected-category-id="preselectedCategoryId"
            :draft="draftState.draftProduct"
            :categories="categories"
            :tva-rates="tvaRates"
            :is-offline="isOffline"
            @close="handleCloseDetail"
            @product-created="handleProductCreated"
            @product-updated="handleProductUpdated"
            @delete="deleteFocusedProduct"
          />
        </div>

        <div v-else-if="categoryDetailMode !== null">
          <CategoryDetail
            ref="categoryDetail"
            :category="focusedCategory"
            :mode="categoryDetailMode"
            :preselected-parent-id="preselectedParentCategoryId"
            :categories="categories"
            @close="handleCloseCategoryDetail"
            @category-created="handleCategoryCreated"
            @category-updated="handleCategoryUpdated"
            @delete="deleteFocusedCategory"
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
      v-if="
        !basketState.isViewing &&
        !isViewingDashboard &&
        !isViewingSalesReport &&
        categoryDetailMode === null &&
        !focusedProduct &&
        !isCreatingProduct
      "
      class="fab-btn"
      @click="handleFabClick"
      title="Créer un article"
    >
      <span>+</span>
    </button>

    <!-- Custom Context Menu -->
    <ContextMenu
      ref="contextMenu"
      :has-draft="draftState.draftProduct !== null"
      @delete-product="handleDeleteProductFromContextMenu"
      @delete-category="handleDeleteCategoryFromContextMenu"
      @create-item="handleCreateItemFromContextMenu"
      @create-category="handleCreateCategoryFromContextMenu"
      @edit-category="handleEditCategoryFromContextMenu"
    />
  </div>
</template>

<script>
import Sidebar from './components/Sidebar.vue';
import Breadcrumbs from './components/Breadcrumbs.vue';
import ProductDetail from './components/ProductDetail.vue';
import CategoryDetail from './components/CategoryDetail.vue';
import BasketView from './components/BasketView.vue';
import CatalogueView from './components/CatalogueView.vue';
import DashboardView from './components/DashboardView.vue';
import SalesReportView from './components/SalesReportView.vue';
import SearchBar from './components/SearchBar.vue';
import BasketHeaderButton from './components/BasketHeaderButton.vue';
import ContextMenu from './components/ContextMenu.vue';
import LanguageSelector from './components/LanguageSelector.vue';
import ThemeSelector from './components/ThemeSelector.vue';
import BarcodeScannerButton from './components/BarcodeScannerButton.vue';
import { loadBrowserMocks as getBrowserMocks } from './utils/mockData';
import { basketState, confirmAndClearBasket, addToBasket } from './utils/basketStore';
import { draftState, saveDraft, clearDraft } from './utils/draftStore';
import { searchState } from './utils/searchState';
import catalogMethods from './utils/catalogManager';

export default {
  name: 'App',
  components: {
    Sidebar,
    Breadcrumbs,
    ProductDetail,
    CategoryDetail,
    BasketView,
    CatalogueView,
    DashboardView,
    SalesReportView,
    SearchBar,
    BasketHeaderButton,
    ContextMenu,
    LanguageSelector,
    ThemeSelector,
    BarcodeScannerButton,
  },
  data() {
    return {
      categories: [],
      products: [],
      tvaRates: [],
      selectedCategoryId: null,
      focusedProduct: null,
      isCreatingProduct: false,
      focusedCategory: null,
      categoryDetailMode: null,
      preselectedParentCategoryId: null,
      draftState,
      preselectedCategoryId: null,
      basketState,
      isOffline: !navigator.onLine,
      isViewingDashboard: false,
      isViewingSalesReport: false,
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
    if (window.electronAPI && typeof window.electronAPI.onMenuCreateCategory === 'function') {
      window.electronAPI.onMenuCreateCategory(() => {
        this.openCreateCategory(this.selectedCategoryId);
      });
    }
    if (window.electronAPI && typeof window.electronAPI.onMenuDeleteItem === 'function') {
      window.electronAPI.onMenuDeleteItem(async () => {
        if (this.focusedProduct) {
          await this.deleteProduct(this.focusedProduct);
        } else if (this.focusedCategory) {
          await this.deleteCategory(this.focusedCategory);
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

    if (window.electronAPI && typeof window.electronAPI.onBarcodeScanned === 'function') {
      window.electronAPI.onBarcodeScanned((barcode) => {
        console.log('Renderer: Received scanned barcode:', barcode);

        // 1. If currently creating or editing a product, populate the barcode input!
        if (this.isCreatingProduct || this.focusedProduct) {
          const detailComponent = this.$refs.productDetail;
          if (detailComponent && typeof detailComponent.handleBarcodeScanned === 'function') {
            detailComponent.handleBarcodeScanned(barcode);
            return;
          }
        }

        // 2. Otherwise, check if a product matches this barcode in our list
        const matchedProduct = this.products.find((p) => p.barcode === barcode);
        if (matchedProduct) {
          // Add it to the basket!
          addToBasket(matchedProduct);
          console.log(`Product added to basket: ${matchedProduct.name}`);
        } else {
          console.log(`Scanned barcode ${barcode} does not exist in catalogue. Doing nothing.`);
        }
      });
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
    focusedCategory: {
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
      this.isViewingSalesReport = false;
      this.readonlyTicket = null;
      this.selectedCategoryId = catId;
      this.focusedProduct = null;
      this.focusedCategory = null;
      this.isCreatingCategory = false;
    },
    async handleSelectProduct(prod) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.isViewingDashboard = false;
      this.isViewingSalesReport = false;
      this.readonlyTicket = null;
      this.focusedProduct = prod;
      this.focusedCategory = null;
      this.isCreatingCategory = false;
    },
    openCreateProduct(categoryId = null) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      this.isViewingDashboard = false;
      this.isViewingSalesReport = false;
      this.readonlyTicket = null;
      if (this.draftState.draftProduct) {
        this.preselectedCategoryId = this.draftState.draftProduct.category_id;
      } else {
        this.preselectedCategoryId = categoryId;
      }
      this.isCreatingProduct = true;
      this.focusedProduct = null;
      this.focusedCategory = null;
      this.categoryDetailMode = null;
    },
    openCreateCategory(parentCategoryId = null) {
      if (this.basketState.isViewing) {
        this.basketState.isViewing = false;
      }
      this.isViewingDashboard = false;
      this.isViewingSalesReport = false;
      this.readonlyTicket = null;
      this.preselectedParentCategoryId = parentCategoryId;
      this.categoryDetailMode = 'create';
      this.focusedCategory = null;
      this.focusedProduct = null;
      this.isCreatingProduct = false;
    },
    async confirmExitCreateMode() {
      const detail = this.$refs.productDetail;
      const catDetail = this.$refs.categoryDetail;

      if (detail) {
        if (detail.currentStateName === 'view') {
          this.isCreatingProduct = false;
          return true;
        }

        const isDirty = detail.isFormDirty();
        const isDraftLoaded = this.draftState.draftProduct !== null;
        if (!isDirty && !isDraftLoaded) {
          this.isCreatingProduct = false;
          return true;
        }

        if (this.isCreatingProduct) {
          let choice = 2; // Default to Discard
          if (
            window.electronAPI &&
            typeof window.electronAPI.showExitConfirmationDialog === 'function'
          ) {
            choice = await window.electronAPI.showExitConfirmationDialog(true);
          } else {
            const res = window.confirm(
              "Voulez-vous garder l'article en brouillon ?\n\nOK = Garder le brouillon\nAnnuler = Abandonner"
            );
            choice = res ? 0 : 2;
          }

          if (choice === 0) {
            saveDraft(detail.getFormData());
            this.isCreatingProduct = false;
            return true;
          } else if (choice === 1) {
            return false; // Stay on page
          } else {
            clearDraft();
            this.isCreatingProduct = false;
            return true;
          }
        } else {
          let choice = 1; // Default to stay
          if (
            window.electronAPI &&
            typeof window.electronAPI.showExitConfirmationDialog === 'function'
          ) {
            choice = await window.electronAPI.showExitConfirmationDialog(false);
          } else {
            const res = window.confirm(this.$t('unsaved_changes_msg'));
            choice = res ? 0 : 1;
          }
          if (choice === 0) {
            return true;
          } else {
            return false;
          }
        }
      }

      if (catDetail) {
        const isDirty = catDetail.isFormDirty();
        if (!isDirty) {
          this.categoryDetailMode = null;
          return true;
        }

        let choice = 1; // Default to stay
        if (
          window.electronAPI &&
          typeof window.electronAPI.showExitConfirmationDialog === 'function'
        ) {
          choice = await window.electronAPI.showExitConfirmationDialog('category');
        } else {
          const res = window.confirm(this.$t('unsaved_changes_msg'));
          choice = res ? 0 : 1;
        }

        if (choice === 0) {
          this.categoryDetailMode = null;
          this.focusedCategory = null;
          return true;
        } else {
          return false; // Stay
        }
      }

      this.isCreatingProduct = false;
      this.categoryDetailMode = null;
      return true;
    },
    async handleCloseDetail() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.focusedProduct = null;
      this.isCreatingProduct = false;
    },
    async handleCloseCategoryDetail() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.focusedCategory = null;
      this.categoryDetailMode = null;
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
        this.focusedCategory = null;
        this.categoryDetailMode = null;
        this.isViewingDashboard = false;
        this.isViewingSalesReport = false;
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
      this.focusedCategory = null;
      this.categoryDetailMode = null;
      this.readonlyTicket = null;
      this.selectedCategoryId = null;
      this.isViewingDashboard = true;
      this.isViewingSalesReport = false;
    },
    async handleSelectSalesReport() {
      const proceed = await this.confirmExitCreateMode();
      if (!proceed) return;
      this.basketState.isViewing = false;
      this.focusedProduct = null;
      this.focusedCategory = null;
      this.categoryDetailMode = null;
      this.readonlyTicket = null;
      this.selectedCategoryId = null;
      this.isViewingDashboard = false;
      this.isViewingSalesReport = true;
    },
    handleViewTicket(ticket) {
      this.readonlyTicket = ticket;
      this.basketState.isViewing = true;
      this.isViewingDashboard = false;
      this.isViewingSalesReport = false;
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
    handleCreateCategoryFromContextMenu(category) {
      const cat = category || this.contextMenu.targetCategory;
      this.openCreateCategory(cat?.id || null);
    },
    handleEditCategoryFromContextMenu(category) {
      const cat = category || this.contextMenu.targetCategory;
      if (cat) {
        if (this.basketState.isViewing) {
          this.basketState.isViewing = false;
        }
        this.isViewingDashboard = false;
        this.isViewingSalesReport = false;
        this.readonlyTicket = null;
        this.focusedCategory = cat;
        this.categoryDetailMode = 'edit';
        this.focusedProduct = null;
        this.isCreatingProduct = false;
      }
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
    async handleCategoryCreated(newCategory) {
      this.categoryDetailMode = null;
      this.focusedCategory = null;
      await this.fetchData();
      this.selectedCategoryId = newCategory.id;
    },
    async handleCategoryUpdated(catId) {
      await this.fetchData();
      this.focusedCategory = null;
      this.categoryDetailMode = null;
    },
    async deleteFocusedCategory() {
      if (this.focusedCategory) {
        const cat = this.focusedCategory;
        await this.deleteCategory(cat);
        if (!this.categories.some((c) => c.id === cat.id)) {
          this.focusedCategory = null;
        }
      }
    },
    updateDeleteMenuState() {
      if (!window.electronAPI || typeof window.electronAPI.setDeleteItemState !== 'function')
        return;
      if (this.focusedProduct !== null) {
        window.electronAPI.setDeleteItemState(true, this.$t('menu_delete_product'));
      } else if (this.focusedCategory !== null) {
        window.electronAPI.setDeleteItemState(true, this.$t('menu_delete_category'));
      } else if (this.selectedCategoryId !== null) {
        window.electronAPI.setDeleteItemState(true, this.$t('menu_delete_category'));
      } else {
        window.electronAPI.setDeleteItemState(false, this.$t('menu_delete_product'));
      }
    },
  },
};
</script>
