// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { i18n } from '../utils/i18n';
import ProductDetail from '../components/ProductDetail.vue';
import App from '../App.vue';

config.global.mocks = config.global.mocks || {};
config.global.mocks.$t = (key) => i18n.t(key);
config.global.mocks.$currentLang = 'fr';

// Mock electron API globally
const mockElectronAPI = {
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  getTvaRates: vi.fn(),
  createProduct: vi.fn(),
  updateProduct: vi.fn(),
  deleteProduct: vi.fn(),
  selectImage: vi.fn(),
  saveImage: vi.fn(),
  showExitConfirmationDialog: vi.fn(),
  confirmDeleteProduct: vi.fn(),
  setDeleteMenuEnabled: vi.fn(),
  onMenuCreateProduct: vi.fn(),
  onMenuDeleteProduct: vi.fn(),
};

globalThis.window = globalThis.window || {};
globalThis.window.electronAPI = mockElectronAPI;

describe('Product Manual Creation & Edition Tests', () => {
  const categoriesMock = [
    { id: 1, name: 'Epicerie', parent_id: null },
    { id: 2, name: 'Boissons', parent_id: null },
  ];
  const tvaRatesMock = [
    { id: 1, name: '20%', rate: 20.0, is_active: 1 },
    { id: 2, name: '5.5%', rate: 5.5, is_active: 1 },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ProductDetail.vue Component', () => {
    it('should initialize with empty state in create mode', () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
          preselectedCategoryId: 2,
        },
      });

      expect(wrapper.vm.localProduct.name).toBe('');
      expect(wrapper.vm.localProduct.category_id).toBe(2);
      expect(wrapper.vm.localProduct.tva_id).toBe(1); // Defaults to first rate ID
    });

    it('should calculate TTC from HT automatically', async () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      // Set HT price
      wrapper.vm.localProduct.price_ht = '10.00';
      await wrapper.vm.onPriceHtInput();
      expect(wrapper.vm.localProduct.price_ttc).toBe('12.00'); // 10 * 1.20 = 12.00

      // Change TVA rate to 5.5%
      wrapper.vm.localProduct.tva_id = 2; // Rate id 2 has 5.5%
      await wrapper.vm.onTvaChange();
      expect(wrapper.vm.localProduct.price_ttc).toBe('10.55'); // 10 * 1.055 = 10.55
    });

    it('should calculate HT from TTC automatically', async () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      wrapper.vm.localProduct.price_ttc = '12.00';
      await wrapper.vm.onPriceTtcInput();
      expect(wrapper.vm.localProduct.price_ht).toBe('10.0000'); // 12 / 1.20 = 10.00
    });

    it('should detect when form is dirty', async () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
          preselectedCategoryId: null,
        },
      });

      expect(wrapper.vm.isFormDirty()).toBe(false);

      wrapper.vm.localProduct.name = 'New product';
      expect(wrapper.vm.isFormDirty()).toBe(true);
    });

    it('should convert commas to dots when parsing prices', () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      expect(wrapper.vm.parsePrice('12,50')).toBe(12.5);
      expect(wrapper.vm.parsePrice('1,234.56')).toBe(1234.56);
    });

    it('should build categories tree options hierarchically with proper indentation and naming prefix', () => {
      const nestedCategories = [
        { id: 1, name: 'Boissons', parent_id: null },
        { id: 2, name: 'Soda', parent_id: 1 },
        { id: 3, name: 'Jus', parent_id: 1 },
        { id: 4, name: 'Épicerie', parent_id: null },
      ];

      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: nestedCategories,
          tvaRates: tvaRatesMock,
        },
      });

      const options = wrapper.vm.categoryTreeOptions;
      expect(options.length).toBe(4);

      expect(options[0].id).toBe(1);
      expect(options[0].indent).toBe(0);
      expect(options[1].id).toBe(2);
      expect(options[1].indent).toBe(1);
      expect(options[2].id).toBe(3);
      expect(options[2].indent).toBe(1);
      expect(options[3].id).toBe(4);
      expect(options[3].indent).toBe(0);

      expect(wrapper.vm.getCategoryDisplayName(options[0])).toBe('Boissons');
      expect(wrapper.vm.getCategoryDisplayName(options[1])).toBe('\u00A0\u00A0\u00A0\u00A0└─ Soda');
    });

    it('should handle dropped images correctly during drag and drop', async () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      const fileMock = {
        path: 'C:\\Users\\Mock\\image.jpg',
        type: 'image/jpeg',
      };

      globalThis.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-preview');

      const dropEvent = {
        dataTransfer: {
          files: [fileMock],
        },
      };

      await wrapper.vm.handleDrop(dropEvent);

      expect(wrapper.vm.localProduct.image_path).toBe('C:\\Users\\Mock\\image.jpg');
      expect(wrapper.vm.localProduct.image_preview).toBe('blob:mock-preview');
      expect(wrapper.vm.isDragOver).toBe(false);
    });

    it('should clear image path and preview when clicking the delete image button', async () => {
      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      wrapper.vm.localProduct.image_path = 'C:\\Users\\Mock\\image.jpg';
      wrapper.vm.localProduct.image_preview = 'blob:mock-preview';
      await wrapper.vm.$nextTick();

      const btn = wrapper.find('.btn-delete-img');
      expect(btn.exists()).toBe(true);

      await btn.trigger('click');

      expect(wrapper.vm.localProduct.image_path).toBeNull();
      expect(wrapper.vm.localProduct.image_preview).toBeNull();
    });

    it('should transition from view mode to edit mode and update form state', async () => {
      const existingProduct = {
        id: 42,
        name: 'Soda Drink',
        barcode: '9999',
        category_id: 2,
        tva_id: 1,
        price_ht: 1.5,
        price_ttc: 1.8,
        image_path: 'media://soda.png',
        updated_at: '2026-06-25 09:20:00',
      };

      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'view',
          product: existingProduct,
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      expect(wrapper.vm.currentStateName).toBe('view');
      expect(wrapper.vm.activeState.isViewMode()).toBe(true);
      expect(wrapper.vm.activeState.isEditable()).toBe(false);
      expect(wrapper.text()).toContain('Détails du Produit');
      expect(wrapper.text()).toContain('🔍 Consultation');
      expect(wrapper.text()).toContain('Dernière modification');

      wrapper.vm.transitionTo('edit');
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.currentStateName).toBe('edit');
      expect(wrapper.vm.activeState.isEditMode()).toBe(true);
      expect(wrapper.vm.activeState.isEditable()).toBe(true);
      expect(wrapper.text()).toContain('Modifier le produit');
      expect(wrapper.text()).toContain('✏️ Édition');

      wrapper.vm.localProduct.name = 'New Name';
      expect(wrapper.vm.isFormDirty()).toBe(true);
    });

    it('should call updateProduct and emit event on submit in edit mode', async () => {
      const existingProduct = {
        id: 42,
        name: 'Soda Drink',
        barcode: '9999',
        category_id: 2,
        tva_id: 1,
        price_ht: 1.5,
        price_ttc: 1.8,
        image_path: 'media://soda.png',
      };

      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'view',
          product: existingProduct,
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
        },
      });

      wrapper.vm.transitionTo('edit');
      await wrapper.vm.$nextTick();

      wrapper.vm.localProduct.name = 'Updated Soda';

      mockElectronAPI.updateProduct.mockResolvedValue(true);

      await wrapper.vm.handleSave();

      expect(mockElectronAPI.updateProduct).toHaveBeenCalledWith(
        42,
        expect.objectContaining({
          name: 'Updated Soda',
          category_id: 2,
          price_ht: 1.5,
        })
      );
      expect(wrapper.emitted('product-updated')).toBeTruthy();
      expect(wrapper.emitted('product-updated')[0][0]).toBe(42);
      expect(wrapper.vm.currentStateName).toBe('view');
    });
  });

  describe('App.vue confirmation and edit interactions', () => {
    it('should prompt when trying to select category and creation form is dirty, exiting if Abandonner', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.isCreatingProduct = true;
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.localProduct.name = 'New Item';
      wrapper.vm.$refs.productDetail.localProduct.category_id = 2;

      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0); // Abandonner

      await wrapper.vm.handleSelectCategory(1);

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalled();
      expect(wrapper.vm.isCreatingProduct).toBe(false);
      expect(wrapper.vm.selectedCategoryId).toBe(1);
    });

    it('should not change screen if user decides to stay (cancel dialog)', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.isCreatingProduct = true;
      wrapper.vm.selectedCategoryId = 2;
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.localProduct.name = 'New Item';

      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(1); // Rester

      await wrapper.vm.handleSelectCategory(1);

      expect(wrapper.vm.selectedCategoryId).toBe(2);
      expect(wrapper.vm.isCreatingProduct).toBe(true);
    });

    it('should prompt when trying to select category and edition form is dirty, exiting if Abandonner', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([
        { id: 10, name: 'Old Product', category_id: 1, price_ht: 1, price_ttc: 1.2, tva_id: 1 },
      ]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.focusedProduct = wrapper.vm.products[0];
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.transitionTo('edit');
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.localProduct.name = 'Modified Product';

      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0); // Abandonner

      await wrapper.vm.handleSelectCategory(2);

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalled();
      expect(wrapper.vm.focusedProduct).toBeNull();
      expect(wrapper.vm.selectedCategoryId).toBe(2);
    });

    it('should not change screen during edition if user decides to stay (cancel dialog)', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([
        { id: 10, name: 'Old Product', category_id: 1, price_ht: 1, price_ttc: 1.2, tva_id: 1 },
      ]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.focusedProduct = wrapper.vm.products[0];
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.transitionTo('edit');
      await wrapper.vm.$nextTick();

      wrapper.vm.$refs.productDetail.localProduct.name = 'Modified Product';

      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(1); // Rester

      await wrapper.vm.handleSelectCategory(2);

      expect(wrapper.vm.focusedProduct).not.toBeNull();
      expect(wrapper.vm.focusedProduct.id).toBe(10);
    });

    it('should enable/disable delete menu item when focusedProduct changes', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([
        { id: 10, name: 'Old Product', category_id: 1, price_ht: 1, price_ttc: 1.2, tva_id: 1 },
      ]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockElectronAPI.setDeleteMenuEnabled).toHaveBeenCalledWith(false);

      wrapper.vm.focusedProduct = wrapper.vm.products[0];
      await wrapper.vm.$nextTick();

      expect(mockElectronAPI.setDeleteMenuEnabled).toHaveBeenCalledWith(true);
    });

    it('should display product context menu with delete option and invoke deleteProduct', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([
        { id: 10, name: 'Target Product', category_id: 1, price_ht: 1, price_ttc: 1.2, tva_id: 1 },
      ]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      const product = wrapper.vm.products[0];
      wrapper.vm.handleProductContextMenu({ clientX: 150, clientY: 250 }, product);
      await wrapper.vm.$nextTick();

      expect(wrapper.vm.contextMenu.visible).toBe(true);
      expect(wrapper.vm.contextMenu.targetProduct).toBe(product);

      // Trigger deletion from context menu
      mockElectronAPI.confirmDeleteProduct.mockResolvedValue(true);
      mockElectronAPI.deleteProduct.mockResolvedValue(true);

      await wrapper.vm.handleDeleteProductFromContextMenu();

      expect(mockElectronAPI.confirmDeleteProduct).toHaveBeenCalledWith('Target Product');
      expect(mockElectronAPI.deleteProduct).toHaveBeenCalledWith(10);
    });

    it('should emit delete event from ProductDetail and perform deletion', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([
        { id: 10, name: 'Target Product', category_id: 1, price_ht: 1, price_ttc: 1.2, tva_id: 1 },
      ]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.focusedProduct = wrapper.vm.products[0];
      await wrapper.vm.$nextTick();

      // Trigger delete from ProductDetail
      mockElectronAPI.confirmDeleteProduct.mockResolvedValue(true);
      mockElectronAPI.deleteProduct.mockResolvedValue(true);

      wrapper.vm.$refs.productDetail.$emit('delete');
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockElectronAPI.confirmDeleteProduct).toHaveBeenCalledWith('Target Product');
      expect(mockElectronAPI.deleteProduct).toHaveBeenCalledWith(10);
      expect(wrapper.vm.focusedProduct).toBeNull();
    });
  });
});
