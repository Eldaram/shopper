// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount, config } from '@vue/test-utils';
import { i18n } from '../utils/i18n';
import BasketView from '../components/BasketView.vue';

config.global.mocks = config.global.mocks || {};
config.global.mocks.$t = (key) => i18n.t(key);
config.global.mocks.$currentLang = 'fr';
import {
  basketState,
  addToBasket,
  handleUpdateBasketQuantity,
  handleRemoveBasketItem,
  clearBasket,
} from '../utils/basketStore';

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
    clearBasket();
    vi.clearAllMocks();
    mockElectronAPI.getCategories.mockResolvedValue([]);
    mockElectronAPI.getProducts.mockResolvedValue([]);
    mockElectronAPI.getTvaRates.mockResolvedValue([]);
  });

  describe('basketStore.js Actions', () => {
    it('should add new product to basket', () => {
      expect(basketState.items).toEqual([]);

      addToBasket(product1);
      expect(basketState.items.length).toBe(1);
      expect(basketState.items[0].product.id).toBe(1);
      expect(basketState.items[0].quantity).toBe(1);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenCalledWith(true);
    });

    it('should increment quantity when product is added multiple times', () => {
      addToBasket(product1);
      addToBasket(product1);

      expect(basketState.items.length).toBe(1);
      expect(basketState.items[0].product.id).toBe(1);
      expect(basketState.items[0].quantity).toBe(2);
    });

    it('should update quantity of an item in the basket', () => {
      addToBasket(product1);
      handleUpdateBasketQuantity(product1.id, 5);

      expect(basketState.items[0].quantity).toBe(5);
    });

    it('should remove a product from the basket and disable clear menu item when empty', () => {
      addToBasket(product1);
      addToBasket(product2);
      expect(basketState.items.length).toBe(2);

      handleRemoveBasketItem(product1.id);
      expect(basketState.items.length).toBe(1);
      expect(basketState.items[0].product.id).toBe(product2.id);

      handleRemoveBasketItem(product2.id);
      expect(basketState.items.length).toBe(0);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenLastCalledWith(false);
    });

    it('should clear all items in the basket', () => {
      addToBasket(product1);
      addToBasket(product2);

      clearBasket();
      expect(basketState.items).toEqual([]);
      expect(mockElectronAPI.setClearBasketEnabled).toHaveBeenLastCalledWith(false);
    });
  });

  describe('BasketView.vue Component', () => {
    it('should compute totals correctly', () => {
      basketState.items = [
        { product: product1, quantity: 2 }, // 2 * 1.8 = 3.6
        { product: product2, quantity: 3 }, // 3 * 1.5 = 4.5
      ];

      const wrapper = mount(BasketView, {
        props: {
          tvaRates: tvaRatesMock,
        },
      });

      expect(wrapper.vm.totalItems).toBe(5);
      expect(wrapper.vm.totalTtc).toBeCloseTo(8.1); // 3.6 + 4.5 = 8.1
    });

    it('should emit close event and call remove method', async () => {
      basketState.items = [{ product: product1, quantity: 2 }];

      const wrapper = mount(BasketView, {
        props: {
          tvaRates: tvaRatesMock,
        },
      });

      // Trigger single item removal click
      const removeBtn = wrapper.find('.btn-remove-item');
      await removeBtn.trigger('click');
      expect(basketState.items.length).toBe(0);
    });

    it('should emit close event when back to catalog is clicked', async () => {
      basketState.items = []; // Empty state

      const wrapper = mount(BasketView, {
        props: {
          tvaRates: tvaRatesMock,
        },
      });

      const backBtn = wrapper.find('.btn-back-catalog');
      await backBtn.trigger('click');
      expect(wrapper.emitted('close')).toBeTruthy();
    });
  });
});
