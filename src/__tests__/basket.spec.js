// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import BasketView from '../components/BasketView.vue';
import App from '../App.vue';

// Mock electron API globally
const mockElectronAPI = {
  getCategories: vi.fn(),
  getProducts: vi.fn(),
  getTvaRates: vi.fn(),
  setClearBasketEnabled: vi.fn(),
  confirmClearBasket: vi.fn(),
  onMenuCreateProduct: vi.fn(),
  onMenuDeleteProduct: vi.fn(),
  onMenuClearBasket: vi.fn(),
};

globalThis.window = globalThis.window || {};
globalThis.window.electronAPI = mockElectronAPI;

describe('Shopping Basket Tests', () => {
  const tvaRatesMock = [
    { id: 1, name: 'Taux normal (20%)', rate: 20.0, is_active: 1 },
    { id: 2, name: 'Taux réduit (5.5%)', rate: 5.5, is_active: 1 },
  ];

  const product1 = {
    id: 1,
    name: 'Coca-Cola 1.5L',
    price_ht: 1.5,
    price_ttc: 1.8,
    tva_id: 1,
    category_id: 9,
  };

  const product2 = {
    id: 2,
    name: 'Chips Lays 150g',
    price_ht: 1.25,
    price_ttc: 1.5,
    tva_id: 2,
    category_id: 1,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockElectronAPI.getCategories.mockResolvedValue([]);
    mockElectronAPI.getProducts.mockResolvedValue([]);
    mockElectronAPI.getTvaRates.mockResolvedValue([]);
  });

  describe('App.vue Basket Actions', () => {
    it('should add new product to basket', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Sidebar: true,
            Breadcrumbs: true,
            CategoryCard: true,
            ProductCard: true,
            ProductDetail: true,
            BasketView: true,
          },
        },
      });

      expect(wrapper.vm.basket).toEqual([]);

      wrapper.vm.addToBasket(product1);
      expect(wrapper.vm.basket.length).toBe(1);
      expect(wrapper.vm.basket[0].product.id).toBe(1);
      expect(wrapper.vm.basket[0].quantity).toBe(1);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenCalledWith(true);
    });

    it('should increment quantity when product is added multiple times', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Sidebar: true,
            Breadcrumbs: true,
            CategoryCard: true,
            ProductCard: true,
            ProductDetail: true,
            BasketView: true,
          },
        },
      });

      wrapper.vm.addToBasket(product1);
      wrapper.vm.addToBasket(product1);

      expect(wrapper.vm.basket.length).toBe(1);
      expect(wrapper.vm.basket[0].product.id).toBe(1);
      expect(wrapper.vm.basket[0].quantity).toBe(2);
    });

    it('should update quantity of an item in the basket', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Sidebar: true,
            Breadcrumbs: true,
            CategoryCard: true,
            ProductCard: true,
            ProductDetail: true,
            BasketView: true,
          },
        },
      });

      wrapper.vm.addToBasket(product1);
      wrapper.vm.handleUpdateBasketQuantity(product1.id, 5);

      expect(wrapper.vm.basket[0].quantity).toBe(5);
    });

    it('should remove a product from the basket and disable clear menu item when empty', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Sidebar: true,
            Breadcrumbs: true,
            CategoryCard: true,
            ProductCard: true,
            ProductDetail: true,
            BasketView: true,
          },
        },
      });

      wrapper.vm.addToBasket(product1);
      wrapper.vm.addToBasket(product2);
      expect(wrapper.vm.basket.length).toBe(2);

      wrapper.vm.handleRemoveBasketItem(product1.id);
      expect(wrapper.vm.basket.length).toBe(1);
      expect(wrapper.vm.basket[0].product.id).toBe(product2.id);

      wrapper.vm.handleRemoveBasketItem(product2.id);
      expect(wrapper.vm.basket.length).toBe(0);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenLastCalledWith(false);
    });

    it('should clear all items in the basket', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            Sidebar: true,
            Breadcrumbs: true,
            CategoryCard: true,
            ProductCard: true,
            ProductDetail: true,
            BasketView: true,
          },
        },
      });

      wrapper.vm.addToBasket(product1);
      wrapper.vm.addToBasket(product2);

      wrapper.vm.clearBasket();
      expect(wrapper.vm.basket).toEqual([]);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenLastCalledWith(false);
    });
  });

  describe('BasketView.vue Component', () => {
    it('should compute totals correctly', () => {
      const basket = [
        { product: product1, quantity: 2 }, // 2 * 1.8 = 3.6
        { product: product2, quantity: 3 }, // 3 * 1.5 = 4.5
      ];

      const wrapper = mount(BasketView, {
        props: {
          basket,
          tvaRates: tvaRatesMock,
        },
      });

      expect(wrapper.vm.totalItems).toBe(5);
      expect(wrapper.vm.totalTtc).toBeCloseTo(8.1); // 3.6 + 4.5 = 8.1
    });

    it('should emit appropriate events', async () => {
      const basket = [{ product: product1, quantity: 2 }];
      const wrapper = mount(BasketView, {
        props: {
          basket,
          tvaRates: tvaRatesMock,
        },
      });

      // Trigger clear basket click
      const clearBtn = wrapper.find('.btn-clear-basket');
      await clearBtn.trigger('click');
      expect(wrapper.emitted('clear-basket')).toBeTruthy();

      // Trigger single item removal
      const removeBtn = wrapper.find('.btn-remove-item');
      await removeBtn.trigger('click');
      expect(wrapper.emitted('remove-item')).toBeTruthy();
      expect(wrapper.emitted('remove-item')[0]).toEqual([product1.id]);
    });
  });
});
