<template>
  <div class="detail-container">
    <div class="detail-header">
      <button class="btn-back" @click="handleCancel">
        <span>←</span> {{ $t('back_to_catalogue') }}
      </button>
      <span class="detail-badge-mode">{{ activeState ? activeState.getBadgeText() : '' }}</span>
    </div>

    <div class="detail-card">
      <ProductDetailImage
        :image-url="imageUrl"
        :image-load-error="imageLoadError"
        :is-editable="activeState && activeState.isImageClickable()"
        :show-delete-button="activeState && activeState.showDeleteImageButton() && !!imageUrl"
        :alt-text="localProduct.name || $t('product')"
        :initials="initials"
        @select-image="handleImageClick"
        @remove-image="handleRemoveImage"
        @image-error="handleImageError"
        @drop-image="handleDropImage"
      />

      <div class="detail-form-sec">
        <h2 class="detail-form-title">
          {{ activeState ? activeState.getTitle() : '' }}
        </h2>

        <ProductDetailForm
          :product="localProduct"
          :product-model="product"
          :is-editable="activeState && activeState.isEditable()"
          :is-create-mode="activeState && activeState.isCreateMode()"
          :categories="categories"
          :tva-rates="tvaRates"
          :barcode-not-found="barcodeNotFound"
          :suggestions="suggestions"
          :loading-search="loadingSearch"
          :show-suggestions="showSuggestions"
          @name-input="handleNameInput"
          @name-focus="handleNameFocus"
          @name-blur="handleNameBlur"
          @barcode-blur="handleBarcodeBlur"
          @barcode-change="handleBarcodeChange"
          @select-suggestion="selectSuggestion"
          @price-ht-input="onPriceHtInput"
          @price-ttc-input="onPriceTtcInput"
          @tva-change="onTvaChange"
        />

        <ProductDetailActions
          :is-view-mode="activeState && activeState.isViewMode()"
          :is-create-mode="activeState && activeState.isCreateMode()"
          @add-to-basket="addToBasket(product)"
          @edit="activeState.handleEdit()"
          @delete="$emit('delete')"
          @cancel="handleCancel"
          @save="handleSubmit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import BaseButton from './BaseButton.vue';
import ProductDetailImage from './ProductDetailImage.vue';
import ProductDetailForm from './ProductDetailForm.vue';
import ProductDetailActions from './ProductDetailActions.vue';
import { addToBasket } from '../utils/basketStore';
import { ViewState, EditState, CreateState } from './ProductDetailState.js';
import * as helpers from '../utils/productHelpers.js';

export default {
  name: 'ProductDetail',
  components: {
    BaseButton,
    ProductDetailImage,
    ProductDetailForm,
    ProductDetailActions,
  },
  props: {
    product: { type: Object, default: null },
    mode: { type: String, default: 'view' },
    preselectedCategoryId: { type: Number, default: null },
    categories: { type: Array, required: true },
    tvaRates: { type: Array, required: true },
    isOffline: { type: Boolean, default: false },
  },
  emits: ['close', 'product-created', 'product-updated', 'delete'],
  data() {
    return {
      isDragOver: false,
      currentStateName: this.mode || 'view',
      imageLoadError: false,
      isNameFocused: false,
      showSuggestions: false,
      suggestions: [],
      loadingSearch: false,
      loadingBarcode: false,
      barcodeNotFound: false,
      searchTimeout: null,
      localProduct: {
        name: '',
        barcode: '',
        category_id: null,
        tva_id: null,
        price_ht: '0.00',
        price_ttc: '0.00',
        image_path: null,
        image_preview: null,
        is_openfoodfacts: 0,
        image_url_openfoodfacts: null,
      },
    };
  },
  computed: {
    activeState() {
      if (this.currentStateName === 'create') return new CreateState(this);
      if (this.currentStateName === 'edit') return new EditState(this);
      return new ViewState(this);
    },
    imageUrl() {
      if (this.activeState && !this.activeState.isViewMode()) {
        return this.localProduct.image_preview || this.localProduct.image_path || null;
      }
      return this.product
        ? this.product.image_path || this.product.image_url_openfoodfacts || null
        : null;
    },
    initials() {
      const name =
        this.activeState && !this.activeState.isViewMode()
          ? this.localProduct.name
          : this.product?.name;
      if (!name) return '';
      return name
        .split(' ')
        .map((w) => w.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
    selectedTvaRatePercent() {
      const rateObj = this.tvaRates.find((r) => r.id === this.localProduct.tva_id);
      return rateObj ? rateObj.rate : 20.0;
    },
    categoryTreeOptions() {
      return helpers.getCategoryTreeOptions(this.categories);
    },
  },
  watch: {
    product: {
      handler() {
        this.initForm();
      },
      immediate: true,
      deep: true,
    },
    mode(newMode) {
      this.currentStateName = newMode;
      this.initForm();
    },
    tvaRates: {
      handler(newRates) {
        if (
          this.currentStateName === 'create' &&
          !this.localProduct.tva_id &&
          newRates?.length > 0
        ) {
          this.localProduct.tva_id = newRates[0].id;
        }
      },
      immediate: true,
    },
  },
  methods: {
    transitionTo(stateName) {
      this.currentStateName = stateName;
      this.initForm();
    },
    initForm() {
      helpers.initForm(this);
    },
    getFormData() {
      return helpers.getFormData(this.localProduct);
    },
    isFormDirty() {
      if (this.activeState && this.activeState.isViewMode()) return false;
      return helpers.checkIfFormDirty(
        this.localProduct,
        this.getInitialProductState(),
        helpers.parsePrice
      );
    },
    getInitialProductState() {
      return helpers.getInitialProductState(this);
    },
    onPriceHtInput() {
      helpers.onPriceHtInput(this);
    },
    onPriceTtcInput() {
      helpers.onPriceTtcInput(this);
    },
    onTvaChange() {
      this.onPriceHtInput();
    },
    parsePrice(val) {
      return helpers.parsePrice(val);
    },
    formatPricePlain(price) {
      return helpers.formatPricePlain(price);
    },
    getCategoryDisplayName(opt) {
      return helpers.getCategoryDisplayName(opt);
    },
    handleImageClick() {
      return helpers.handleImageClick(this);
    },
    addToBasket,
    handleImageError() {
      this.imageLoadError = true;
    },
    handleRemoveImage() {
      this.imageLoadError = false;
      this.localProduct.image_path = null;
      this.localProduct.image_preview = null;
      this.localProduct.image_url_openfoodfacts = null;
    },
    handleDragOver() {
      if (this.activeState && this.activeState.isViewMode()) return;
      this.isDragOver = true;
    },
    handleDragEnter() {
      if (this.activeState && this.activeState.isViewMode()) return;
      this.isDragOver = true;
    },
    handleDragLeave() {
      if (this.activeState && this.activeState.isViewMode()) return;
      this.isDragOver = false;
    },
    handleDrop(e) {
      if (this.activeState && this.activeState.isViewMode()) return;
      this.isDragOver = false;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleDropImage(files[0]);
      }
    },
    handleDropImage(file) {
      if (file.type.startsWith('image/')) {
        this.imageLoadError = false;
        this.localProduct.image_path = file.path || 'mock-path-for-testing';
        this.localProduct.image_preview = URL.createObjectURL(file);
      }
    },
    handleSave() {
      return helpers.handleSave(this);
    },
    async confirmDiscardChanges() {
      let choice = 1;
      if (
        window.electronAPI &&
        typeof window.electronAPI.showExitConfirmationDialog === 'function'
      ) {
        choice = await window.electronAPI.showExitConfirmationDialog();
      } else {
        const res = window.confirm(this.$t('unsaved_changes_msg'));
        choice = res ? 0 : 1;
      }
      return choice === 0;
    },
    handleCancel() {
      if (this.activeState) this.activeState.handleCancel();
      else this.$emit('close');
    },
    handleSubmit() {
      if (this.activeState) this.activeState.handleSubmit();
    },
    formatDate(dateStr) {
      return helpers.formatDate(dateStr);
    },
    handleNameInput() {
      helpers.handleNameInput(this);
    },
    handleNameFocus() {
      helpers.handleNameFocus(this);
    },
    handleNameBlur() {
      helpers.handleNameBlur(this);
    },
    performSearch(query) {
      return helpers.performSearch(this, query);
    },
    selectSuggestion(item) {
      helpers.selectSuggestion(this, item);
    },
    handleBarcodeBlur() {
      return helpers.handleBarcodeBlur(this);
    },
    handleBarcodeChange() {
      this.barcodeNotFound = false;
    },
  },
};
</script>
