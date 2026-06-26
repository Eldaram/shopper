import { selectImage } from './imageUploadHelper.js';

export function parsePrice(val) {
  if (val === undefined || val === null) return 0;
  let str = String(val).trim();
  if (str.includes(',') && str.includes('.')) {
    str = str.replace(/,/g, '');
  } else if (str.includes(',')) {
    str = str.replace(/,/g, '.');
  }
  const clean = str.replace(/[^\d.]/g, '');
  return parseFloat(clean) || 0;
}

export function formatPricePlain(price) {
  if (typeof price !== 'number') return '0.00';
  return price.toFixed(2);
}

export function formatDate(dateStr) {
  if (!dateStr) return '';
  let normalized = dateStr;
  if (!dateStr.includes('Z') && !dateStr.includes('+') && dateStr.includes('-')) {
    normalized = dateStr.replace(' ', 'T') + 'Z';
  }
  try {
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString('fr-FR');
  } catch (e) {
    return dateStr;
  }
}

export { getCategoryDisplayName, getCategoryTreeOptions } from './categoryTreeHelpers.js';

export function checkIfFormDirty(localProduct, initial, parser) {
  return (
    (localProduct.name || '') !== (initial.name || '') ||
    (localProduct.barcode || '') !== (initial.barcode || '') ||
    localProduct.category_id !== initial.category_id ||
    localProduct.tva_id !== initial.tva_id ||
    parser(localProduct.price_ht) !== initial.price_ht ||
    parser(localProduct.price_ttc) !== initial.price_ttc ||
    localProduct.image_path !== initial.image_path
  );
}

export function applyBarcodeResult(localProduct, result) {
  localProduct.name = result.name;
  localProduct.barcode = result.barcode || localProduct.barcode || '';
  localProduct.image_preview = result.image_url || result.image_preview;
  localProduct.image_url_openfoodfacts = result.image_url || result.image_url_openfoodfacts;
  localProduct.is_openfoodfacts = 1;
}

export function prepareProductData(localProduct, finalImagePath, parsePrice) {
  return {
    name: localProduct.name.trim(),
    barcode: localProduct.barcode ? localProduct.barcode.trim() : null,
    category_id: localProduct.category_id != null ? Number(localProduct.category_id) : null,
    tva_id: Number(localProduct.tva_id),
    price_ht: parsePrice(localProduct.price_ht),
    price_ttc: parsePrice(localProduct.price_ttc),
    image_path: finalImagePath,
    is_openfoodfacts: localProduct.is_openfoodfacts || 0,
    image_url_openfoodfacts: localProduct.image_url_openfoodfacts || null,
  };
}

export function initForm(vm) {
  vm.imageLoadError = false;
  vm.barcodeNotFound = false;
  vm.showSuggestions = false;
  if (vm.currentStateName === 'create') {
    if (vm.draft) {
      vm.localProduct = {
        name: vm.draft.name || '',
        barcode: vm.draft.barcode || '',
        category_id: vm.draft.category_id || null,
        tva_id: vm.draft.tva_id || vm.tvaRates[0]?.id || null,
        price_ht: vm.draft.price_ht || '0.00',
        price_ttc: vm.draft.price_ttc || '0.00',
        image_path: vm.draft.image_path || null,
        image_preview: vm.draft.image_preview || null,
        is_openfoodfacts: vm.draft.is_openfoodfacts || 0,
        image_url_openfoodfacts: vm.draft.image_url_openfoodfacts || null,
      };
    } else {
      vm.localProduct = {
        name: '',
        barcode: '',
        category_id: vm.preselectedCategoryId || null,
        tva_id: vm.localProduct.tva_id || vm.tvaRates[0]?.id || null,
        price_ht: '0.00',
        price_ttc: '0.00',
        image_path: null,
        image_preview: null,
        is_openfoodfacts: 0,
        image_url_openfoodfacts: null,
      };
    }
  } else if (vm.product) {
    vm.localProduct = {
      name: vm.product.name || '',
      barcode: vm.product.barcode || '',
      category_id: vm.product.category_id || null,
      tva_id: vm.product.tva_id || null,
      price_ht: formatPricePlain(vm.product.price_ht),
      price_ttc: formatPricePlain(vm.product.price_ttc),
      image_path: vm.product.image_path || null,
      image_preview: null,
      is_openfoodfacts: vm.product.is_openfoodfacts || 0,
      image_url_openfoodfacts: vm.product.image_url_openfoodfacts || null,
    };
  }
}

export function getFormData(localProduct) {
  return {
    name: localProduct.name,
    barcode: localProduct.barcode,
    category_id: localProduct.category_id,
    tva_id: localProduct.tva_id,
    price_ht: localProduct.price_ht,
    price_ttc: localProduct.price_ttc,
    image_path: localProduct.image_path,
    image_preview: localProduct.image_preview,
  };
}

export function getInitialProductState(vm) {
  if (vm.currentStateName === 'create') {
    if (vm.draft) {
      return {
        name: vm.draft.name || '',
        barcode: vm.draft.barcode || '',
        category_id: vm.draft.category_id || null,
        tva_id: vm.draft.tva_id || vm.tvaRates[0]?.id || null,
        price_ht: parsePrice(vm.draft.price_ht),
        price_ttc: parsePrice(vm.draft.price_ttc),
        image_path: vm.draft.image_path || null,
      };
    }
    return {
      name: '',
      barcode: '',
      category_id: vm.preselectedCategoryId || null,
      tva_id: vm.tvaRates[0]?.id || null,
      price_ht: 0,
      price_ttc: 0,
      image_path: null,
    };
  } else if (vm.product) {
    return {
      name: vm.product.name || '',
      barcode: vm.product.barcode || '',
      category_id: vm.product.category_id || null,
      tva_id: vm.product.tva_id || null,
      price_ht: vm.product.price_ht || 0,
      price_ttc: vm.product.price_ttc || 0,
      image_path: vm.product.image_path || null,
    };
  }
  return {};
}

export function onPriceHtInput(vm) {
  const ht = parsePrice(vm.localProduct.price_ht);
  if (!isNaN(ht)) {
    vm.localProduct.price_ttc = (ht * (1 + vm.selectedTvaRatePercent / 100)).toFixed(2);
  }
}

export function onPriceTtcInput(vm) {
  const ttc = parsePrice(vm.localProduct.price_ttc);
  if (!isNaN(ttc)) {
    vm.localProduct.price_ht = (ttc / (1 + vm.selectedTvaRatePercent / 100)).toFixed(4);
  }
}

export async function handleImageClick(vm) {
  if (vm.activeState && vm.activeState.isViewMode()) return;
  try {
    const res = await selectImage();
    if (res) {
      vm.imageLoadError = false;
      vm.localProduct.image_path = res.path;
      vm.localProduct.image_preview = res.preview;
    }
  } catch (err) {
    console.error('Error selecting image:', err);
  }
}

export async function handleSave(vm) {
  if (!vm.localProduct.name?.trim()) {
    alert("Le nom de l'article est requis.");
    return;
  }
  if (!vm.localProduct.tva_id) {
    alert('Le taux de TVA est requis.');
    return;
  }

  try {
    let finalImagePath = null;
    if (vm.localProduct.image_path) {
      if (window.electronAPI && typeof window.electronAPI.saveImage === 'function') {
        if (
          vm.localProduct.image_path.startsWith('media://') ||
          vm.localProduct.image_path.startsWith('http://') ||
          vm.localProduct.image_path.startsWith('https://')
        ) {
          finalImagePath = vm.localProduct.image_path;
        } else if (vm.localProduct.image_path !== 'mock-path-for-testing') {
          finalImagePath = await window.electronAPI.saveImage(vm.localProduct.image_path);
        } else {
          finalImagePath = 'mock-image.png';
        }
      } else {
        finalImagePath = vm.localProduct.image_preview || 'mock-image.png';
      }
    }

    const productData = prepareProductData(vm.localProduct, finalImagePath, parsePrice);

    if (vm.currentStateName === 'create') {
      if (window.electronAPI && typeof window.electronAPI.createProduct === 'function') {
        await window.electronAPI.createProduct(productData);
      }
      vm.$emit('product-created', productData);
    } else {
      if (window.electronAPI && typeof window.electronAPI.updateProduct === 'function') {
        await window.electronAPI.updateProduct(vm.product.id, productData);
      } else {
        const idx = vm.$parent.products.findIndex((p) => p.id === vm.product.id);
        if (idx !== -1) {
          vm.$parent.products.splice(idx, 1, {
            ...vm.product,
            ...productData,
            category_name: vm.categories.find((c) => c.id === productData.category_id)?.name || '',
          });
        }
      }
      vm.$emit('product-updated', vm.product.id);
      vm.transitionTo('view');
    }
  } catch (err) {
    console.error('Error saving product:', err);
    alert(`Erreur lors de l'enregistrement du produit: ${err.message}`);
  }
}

export function handleNameInput(vm) {
  if (vm.currentStateName !== 'create') return;
  clearTimeout(vm.searchTimeout);

  const query = vm.localProduct.name.trim();
  if (query.length < 2 || vm.isOffline) {
    vm.suggestions = [];
    vm.showSuggestions = false;
    return;
  }

  vm.searchTimeout = setTimeout(async () => {
    if (vm.isNameFocused && vm.localProduct.name.trim() === query) {
      await vm.performSearch(query);
    }
  }, 700);
}

export function handleNameFocus(vm) {
  if (vm.currentStateName !== 'create') return;
  vm.isNameFocused = true;
  if (vm.localProduct.name.trim().length >= 2 && !vm.isOffline) {
    vm.showSuggestions = true;
  }
}

export function handleNameBlur(vm) {
  if (vm.currentStateName !== 'create') return;
  vm.isNameFocused = false;
  setTimeout(() => {
    if (!vm.isNameFocused) vm.showSuggestions = false;
  }, 200);
}

export async function performSearch(vm, query) {
  if (vm.isOffline) {
    vm.suggestions = [];
    vm.showSuggestions = false;
    return;
  }
  vm.loadingSearch = true;
  vm.showSuggestions = true;
  try {
    if (window.electronAPI && typeof window.electronAPI.searchOffByName === 'function') {
      vm.suggestions = (await window.electronAPI.searchOffByName(query)) || [];
    } else {
      vm.suggestions = [
        {
          barcode: '1234567890123',
          name: `${query} (Mock OFF French)`,
          image_url:
            'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=100&q=80',
        },
      ];
    }
  } catch (err) {
    console.error('Error searching OpenFoodFacts by name:', err);
    vm.suggestions = [];
  } finally {
    vm.loadingSearch = false;
  }
}

export function selectSuggestion(vm, item) {
  applyBarcodeResult(vm.localProduct, item);
  vm.imageLoadError = false;
  vm.barcodeNotFound = false;
  vm.showSuggestions = false;
}

export async function handleBarcodeBlur(vm) {
  if (vm.currentStateName !== 'create') return;
  const barcode = vm.localProduct.barcode?.trim() || '';
  if (!barcode) {
    vm.barcodeNotFound = false;
    return;
  }
  if (!/^\d{8}$|^\d{12,13}$/.test(barcode)) {
    vm.barcodeNotFound = true;
    return;
  }
  if (vm.isOffline) {
    vm.barcodeNotFound = false;
    return;
  }
  try {
    vm.loadingBarcode = true;
    vm.barcodeNotFound = false;
    const result = await window.electronAPI.searchOffByBarcode(barcode);
    if (result?.found) {
      applyBarcodeResult(vm.localProduct, result);
      vm.imageLoadError = false;
      vm.barcodeNotFound = false;
    } else {
      vm.barcodeNotFound = true;
    }
  } catch (err) {
    console.error('Error fetching barcode from OpenFoodFacts:', err);
    vm.barcodeNotFound = true;
  } finally {
    vm.loadingBarcode = false;
  }
}
