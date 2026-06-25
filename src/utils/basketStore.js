import { reactive } from 'vue';
import { i18n } from './i18n';

export const basketState = reactive({
  items: [],
  isViewing: false,
});

function syncClearBasketMenu() {
  if (window.electronAPI && typeof window.electronAPI.setClearBasketEnabled === 'function') {
    window.electronAPI.setClearBasketEnabled(basketState.items.length > 0);
  }
}

export function addToBasket(product) {
  const existing = basketState.items.find((item) => item.product.id === product.id);
  if (existing) {
    existing.quantity = (parseInt(existing.quantity) || 0) + 1;
  } else {
    basketState.items.push({
      product: { ...product },
      quantity: 1,
    });
  }
  syncClearBasketMenu();
}

export function handleUpdateBasketQuantity(productId, quantity) {
  const item = basketState.items.find((item) => item.product.id === productId);
  if (item) {
    item.quantity = Math.max(1, quantity);
  }
}

export function handleRemoveBasketItem(productId) {
  const idx = basketState.items.findIndex((item) => item.product.id === productId);
  if (idx !== -1) {
    basketState.items.splice(idx, 1);
  }
  syncClearBasketMenu();
}

export function clearBasket() {
  basketState.items = [];
  syncClearBasketMenu();
}

export async function confirmAndClearBasket() {
  if (basketState.items.length === 0) return;
  let confirmed = false;
  if (window.electronAPI && typeof window.electronAPI.confirmClearBasket === 'function') {
    confirmed = await window.electronAPI.confirmClearBasket();
  } else {
    confirmed = window.confirm(i18n.t('clear_basket_msg'));
  }
  if (confirmed) {
    clearBasket();
  }
}

export async function handleValidateSale() {
  const lines = basketState.items.map((item) => ({
    product_id: item.product.id,
    quantity: item.quantity,
    discount_value: 0,
    is_discount_percentage: false,
  }));

  if (window.electronAPI && typeof window.electronAPI.checkout === 'function') {
    try {
      await window.electronAPI.checkout({
        customer_id: null,
        lines,
        delivery_address: null,
      });
    } catch (err) {
      console.error('Checkout failed:', err);
      alert('Error during checkout: ' + err.message);
      return;
    }
  }

  const locale = i18n.currentLang.value === 'fr' ? 'fr-FR' : 'en-GB';
  const formattedTotal = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'EUR',
  }).format(
    basketState.items.reduce(
      (sum, item) =>
        sum + (parseFloat(item.product.price_ttc) || 0) * (parseInt(item.quantity) || 0),
      0
    )
  );
  alert(i18n.t('sale_validated_msg').replace('{amount}', formattedTotal));
  clearBasket();
  basketState.isViewing = false;
}
