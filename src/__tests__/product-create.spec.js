// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ProductDetail from '../components/ProductDetail.vue';
import App from '../App.vue';

// Mock electron API globally
const mockElectronAPI = {
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  getTvaRates: vi.fn(),
  createProduct: vi.fn(),
  selectImage: vi.fn(),
  saveImage: vi.fn(),
  showExitConfirmationDialog: vi.fn(),
  onMenuCreateProduct: vi.fn(),
};

globalThis.window = globalThis.window || {};
globalThis.window.electronAPI = mockElectronAPI;

describe('Product Manual Creation & Draft Tests', () => {
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
    it('should initialize with empty state in create mode without draft', () => {
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

    it('should load draft values if provided in create mode', () => {
      const draftMock = {
        name: 'Draft Soda',
        barcode: '123456',
        category_id: 1,
        tva_id: 2,
        price_ht: '2.50',
        price_ttc: '2.64',
        image_path: 'media://img_draft.png',
        image_preview: 'data:image/png;base64,123',
      };

      const wrapper = mount(ProductDetail, {
        props: {
          mode: 'create',
          categories: categoriesMock,
          tvaRates: tvaRatesMock,
          draft: draftMock,
        },
      });

      expect(wrapper.vm.localProduct.name).toBe('Draft Soda');
      expect(wrapper.vm.localProduct.barcode).toBe('123456');
      expect(wrapper.vm.localProduct.category_id).toBe(1);
      expect(wrapper.vm.localProduct.tva_id).toBe(2);
      expect(wrapper.vm.localProduct.price_ht).toBe('2.50');
      expect(wrapper.vm.localProduct.price_ttc).toBe('2.64');
      expect(wrapper.vm.localProduct.image_path).toBe('media://img_draft.png');
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

      // Set image data
      wrapper.vm.localProduct.image_path = 'C:\\Users\\Mock\\image.jpg';
      wrapper.vm.localProduct.image_preview = 'blob:mock-preview';
      await wrapper.vm.$nextTick();

      // Find delete button and click it
      const btn = wrapper.find('.btn-delete-img');
      expect(btn.exists()).toBe(true);

      await btn.trigger('click');

      expect(wrapper.vm.localProduct.image_path).toBeNull();
      expect(wrapper.vm.localProduct.image_preview).toBeNull();
    });
  });

  describe('App.vue confirmation and draft interactions', () => {
    it('should prompt when trying to select category and creation form is dirty', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      // Wait for fetchData
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.isCreatingProduct = true;
      await wrapper.vm.$nextTick();

      // Make the form dirty by typing in it
      wrapper.vm.$refs.productDetail.localProduct.name = 'Draft Item';
      wrapper.vm.$refs.productDetail.localProduct.category_id = 2;

      // Mock confirmation dialog returning 0 (Keep as draft)
      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0);

      await wrapper.vm.handleSelectCategory(1);

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalled();
      expect(wrapper.vm.draftProduct.name).toBe('Draft Item');
      expect(wrapper.vm.draftProduct.category_id).toBe(2);
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

      // Make the form dirty
      wrapper.vm.$refs.productDetail.localProduct.name = 'Draft Item';

      // Dialog returns 1 (Cancel / Rester)
      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(1);

      await wrapper.vm.handleSelectCategory(1);

      expect(wrapper.vm.selectedCategoryId).toBe(2);
      expect(wrapper.vm.isCreatingProduct).toBe(true);
    });

    it('should prioritize draft category over context category when opening creation page', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.draftProduct = { name: 'Draft Soda', category_id: 1 };

      // Open creation page while context category is 2
      wrapper.vm.openCreateProduct(2);

      // Verify that category 1 from draft prevailed!
      expect(wrapper.vm.preselectedCategoryId).toBe(1);
      expect(wrapper.vm.isCreatingProduct).toBe(true);
    });

    it('should show Reprise du brouillon in the context menu if draftProduct is not null', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      // With draftProduct null
      wrapper.vm.draftProduct = null;
      wrapper.vm.contextMenu = {
        visible: true,
        x: 100,
        y: 100,
        targetCategory: { id: 2, name: 'Boissons' },
      };
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Ajouter un article dans Boissons');
      expect(wrapper.text()).not.toContain('Reprise du brouillon');

      // With draftProduct populated
      wrapper.vm.draftProduct = { name: 'Draft product', category_id: 2 };
      await wrapper.vm.$nextTick();
      expect(wrapper.text()).toContain('Reprise du brouillon');
      expect(wrapper.text()).not.toContain('Ajouter un article dans Boissons');
    });

    it('should prompt exit confirmation dialogue when leaving a loaded draft even if unedited', async () => {
      mockElectronAPI.getCategories.mockResolvedValue(categoriesMock);
      mockElectronAPI.getProducts.mockResolvedValue([]);
      mockElectronAPI.getTvaRates.mockResolvedValue(tvaRatesMock);

      const wrapper = mount(App);
      await new Promise((resolve) => setTimeout(resolve, 50));

      wrapper.vm.draftProduct = { name: 'Draft Soda', category_id: 1 };
      wrapper.vm.isCreatingProduct = true;
      await wrapper.vm.$nextTick();

      const isDirty = wrapper.vm.$refs.productDetail.isFormDirty();
      expect(isDirty).toBe(false);

      mockElectronAPI.showExitConfirmationDialog.mockResolvedValue(0);

      await wrapper.vm.handleSelectCategory(2);

      expect(mockElectronAPI.showExitConfirmationDialog).toHaveBeenCalled();
      expect(wrapper.vm.isCreatingProduct).toBe(false);
      expect(wrapper.vm.selectedCategoryId).toBe(2);
    });
  });
});
