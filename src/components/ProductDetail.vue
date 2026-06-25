<template>
  <div class="detail-container">
    <div class="detail-header">
      <button class="btn-back" @click="handleCancel">
        <span>←</span> {{ $t('back_to_catalogue') }}
      </button>
      <span class="detail-badge-mode">{{ activeState ? activeState.getBadgeText() : '' }}</span>
    </div>

    <div class="detail-card">
      <div
        class="detail-image-sec"
        :class="{
          clickable: activeState && activeState.isImageClickable(),
          'drag-over': isDragOver,
        }"
        @click="handleImageClick"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <button
          v-if="activeState && activeState.showDeleteImageButton() && imageUrl"
          class="btn-delete-img"
          @click.stop="handleRemoveImage"
          :title="$t('delete')"
        >
          <span>🗑️</span>
        </button>
        <img
          v-if="imageUrl && !imageLoadError"
          :src="imageUrl"
          :alt="localProduct.name || $t('product')"
          class="detail-large-img"
          @error="handleImageError"
        />
        <div v-else class="detail-img-placeholder">
          <template v-if="activeState && !activeState.isViewMode()">
            <span class="upload-icon">📷</span>
            <span class="upload-text"
              >{{ $t('choose_image') }}<br /><span style="font-size: 11px; opacity: 0.7">{{
                $t('or_drag_drop')
              }}</span></span
            >
          </template>
          <template v-else>
            {{ initials }}
          </template>
        </div>
      </div>

      <div class="detail-form-sec">
        <h2 class="detail-form-title">
          {{ activeState ? activeState.getTitle() : '' }}
        </h2>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <div class="form-group form-field-full">
            <label class="form-label">{{ $t('item_name') }}</label>
            <input
              type="text"
              v-model="localProduct.name"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
              placeholder="Ex: Coca-Cola 1.5L"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('barcode_ean') }}</label>
            <input
              type="text"
              v-model="localProduct.barcode"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              placeholder="Ex: 5449000000996"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('category') }}</label>
            <select
              v-model="localProduct.category_id"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
            >
              <option :value="null" disabled>{{ $t('choose_category') }}</option>
              <option v-for="opt in categoryTreeOptions" :key="opt.id" :value="opt.id">
                {{ getCategoryDisplayName(opt) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('price_ht') }}</label>
            <input
              type="text"
              v-model="localProduct.price_ht"
              @input="onPriceHtInput"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('price_ttc') }}</label>
            <input
              type="text"
              v-model="localProduct.price_ttc"
              @input="onPriceTtcInput"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('tva_rate') }}</label>
            <select
              v-model="localProduct.tva_id"
              @change="onTvaChange"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
            >
              <option v-for="rate in tvaRates" :key="rate.id" :value="rate.id">
                {{ rate.name }} ({{ rate.rate }}%)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">{{ $t('data_origin') }}</label>
            <input
              type="text"
              :value="
                activeState && activeState.isCreateMode()
                  ? $t('local_import')
                  : product && product.is_openfoodfacts
                    ? $t('open_food_facts')
                    : $t('local_import')
              "
              class="form-input"
              disabled
            />
          </div>

          <div
            v-if="activeState && !activeState.isCreateMode() && product && product.updated_at"
            class="form-group"
          >
            <label class="form-label">{{ $t('last_modified') }}</label>
            <input
              type="text"
              :value="formatDate(product.updated_at)"
              class="form-input"
              disabled
            />
          </div>
        </form>

        <div class="detail-actions">
          <!-- View mode buttons -->
          <template v-if="activeState && activeState.isViewMode()">
            <BaseButton variant="success" @click="addToBasket(product)">{{
              $t('add_to_basket')
            }}</BaseButton>
            <BaseButton variant="secondary" @click="activeState.handleEdit()">{{
              $t('edit')
            }}</BaseButton>
            <BaseButton variant="danger" @click="$emit('delete')">{{ $t('delete') }}</BaseButton>
            <BaseButton variant="primary" :disabled="true">{{ $t('save') }}</BaseButton>
          </template>

          <!-- Edit/Create mode buttons -->
          <template v-else-if="activeState">
            <BaseButton variant="secondary" @click="activeState.handleCancel()">{{
              $t('cancel')
            }}</BaseButton>
            <BaseButton
              v-if="!activeState.isCreateMode()"
              variant="danger"
              @click="$emit('delete')"
              >{{ $t('delete') }}</BaseButton
            >
            <BaseButton variant="primary" @click="activeState.handleSubmit()">{{
              $t('save')
            }}</BaseButton>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import BaseButton from './BaseButton.vue';
import { addToBasket } from '../utils/basketStore';

class ProductDetailState {
  constructor(vm) {
    this.vm = vm;
  }
  isCreateMode() {
    return false;
  }
  isEditMode() {
    return false;
  }
  isViewMode() {
    return false;
  }
  isEditable() {
    return false;
  }
  isImageClickable() {
    return false;
  }
  showDeleteImageButton() {
    return false;
  }
  getBadgeText() {
    return '';
  }
  getTitle() {
    return '';
  }

  handleEdit() {}
  handleCancel() {}
  handleSubmit() {}
}

class ViewState extends ProductDetailState {
  isViewMode() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('view_mode');
  }
  getTitle() {
    return this.vm.$t('product_details');
  }

  handleEdit() {
    this.vm.transitionTo('edit');
  }

  handleCancel() {
    this.vm.$emit('close');
  }
}

class EditState extends ProductDetailState {
  isEditMode() {
    return true;
  }
  isEditable() {
    return true;
  }
  isImageClickable() {
    return true;
  }
  showDeleteImageButton() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('edit_mode');
  }
  getTitle() {
    return this.vm.$t('edit_product');
  }

  async handleCancel() {
    if (this.vm.isFormDirty()) {
      const proceed = await this.vm.confirmDiscardChanges();
      if (!proceed) return;
    }
    this.vm.initForm();
    this.vm.transitionTo('view');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}

class CreateState extends ProductDetailState {
  isCreateMode() {
    return true;
  }
  isEditable() {
    return true;
  }
  isImageClickable() {
    return true;
  }
  showDeleteImageButton() {
    return true;
  }
  getBadgeText() {
    return this.vm.$t('create_mode');
  }
  getTitle() {
    return this.vm.$t('create_product');
  }

  async handleCancel() {
    if (this.vm.isFormDirty()) {
      const proceed = await this.vm.confirmDiscardChanges();
      if (!proceed) return;
    }
    this.vm.$emit('close');
  }

  async handleSubmit() {
    await this.vm.handleSave();
  }
}

export default {
  name: 'ProductDetail',
  components: {
    BaseButton,
  },
  props: {
    product: {
      type: Object,
      default: null,
    },
    mode: {
      type: String,
      default: 'view', // 'view', 'edit' or 'create'
    },
    preselectedCategoryId: {
      type: Number,
      default: null,
    },
    categories: {
      type: Array,
      required: true,
    },
    tvaRates: {
      type: Array,
      required: true,
    },
  },
  emits: ['close', 'product-created', 'product-updated', 'delete'],
  data() {
    return {
      isDragOver: false,
      currentStateName: this.mode || 'view',
      imageLoadError: false,
      localProduct: {
        name: '',
        barcode: '',
        category_id: null,
        tva_id: null,
        price_ht: '0.00',
        price_ttc: '0.00',
        image_path: null,
        image_preview: null,
      },
    };
  },
  computed: {
    activeState() {
      if (this.currentStateName === 'create') {
        return new CreateState(this);
      } else if (this.currentStateName === 'edit') {
        return new EditState(this);
      } else {
        return new ViewState(this);
      }
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
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
    selectedTvaRatePercent() {
      const rateObj = this.tvaRates.find((r) => r.id === this.localProduct.tva_id);
      return rateObj ? rateObj.rate : 20.0;
    },
    categoryTreeOptions() {
      const roots = this.categories.filter((c) => c.parent_id === null);
      const options = [];

      const traverse = (category, level = 0) => {
        options.push({
          id: category.id,
          name: category.name,
          indent: level,
        });
        const children = this.categories.filter((c) => c.parent_id === category.id);
        for (const child of children) {
          traverse(child, level + 1);
        }
      };

      for (const root of roots) {
        traverse(root, 0);
      }

      const orphaned = this.categories.filter(
        (c) => c.parent_id !== null && !this.categories.some((p) => p.id === c.parent_id)
      );
      for (const orphan of orphaned) {
        options.push({
          id: orphan.id,
          name: orphan.name,
          indent: 0,
        });
      }

      return options;
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
          newRates &&
          newRates.length > 0
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
      this.imageLoadError = false;
      if (this.currentStateName === 'create') {
        this.localProduct = {
          name: '',
          barcode: '',
          category_id: this.preselectedCategoryId || null,
          tva_id: this.localProduct.tva_id || this.tvaRates[0]?.id || null,
          price_ht: '0.00',
          price_ttc: '0.00',
          image_path: null,
          image_preview: null,
        };
      } else if (this.product) {
        this.localProduct = {
          name: this.product.name || '',
          barcode: this.product.barcode || '',
          category_id: this.product.category_id || null,
          tva_id: this.product.tva_id || null,
          price_ht: this.formatPricePlain(this.product.price_ht),
          price_ttc: this.formatPricePlain(this.product.price_ttc),
          image_path: this.product.image_path || null,
          image_preview: null,
        };
      }
    },
    getFormData() {
      return {
        name: this.localProduct.name,
        barcode: this.localProduct.barcode,
        category_id: this.localProduct.category_id,
        tva_id: this.localProduct.tva_id,
        price_ht: this.localProduct.price_ht,
        price_ttc: this.localProduct.price_ttc,
        image_path: this.localProduct.image_path,
        image_preview: this.localProduct.image_preview,
      };
    },
    isFormDirty() {
      if (this.activeState && this.activeState.isViewMode()) return false;
      const initial = this.getInitialProductState();
      return (
        (this.localProduct.name || '') !== (initial.name || '') ||
        (this.localProduct.barcode || '') !== (initial.barcode || '') ||
        this.localProduct.category_id !== initial.category_id ||
        this.localProduct.tva_id !== initial.tva_id ||
        this.parsePrice(this.localProduct.price_ht) !== initial.price_ht ||
        this.parsePrice(this.localProduct.price_ttc) !== initial.price_ttc ||
        this.localProduct.image_path !== initial.image_path
      );
    },
    getInitialProductState() {
      if (this.currentStateName === 'create') {
        return {
          name: '',
          barcode: '',
          category_id: this.preselectedCategoryId || null,
          tva_id: this.tvaRates[0]?.id || null,
          price_ht: 0,
          price_ttc: 0,
          image_path: null,
        };
      } else if (this.product) {
        return {
          name: this.product.name || '',
          barcode: this.product.barcode || '',
          category_id: this.product.category_id || null,
          tva_id: this.product.tva_id || null,
          price_ht: this.product.price_ht || 0,
          price_ttc: this.product.price_ttc || 0,
          image_path: this.product.image_path || null,
        };
      }
      return {};
    },
    onPriceHtInput() {
      const rate = this.selectedTvaRatePercent;
      const ht = this.parsePrice(this.localProduct.price_ht);
      if (!isNaN(ht)) {
        const ttc = ht * (1 + rate / 100);
        this.localProduct.price_ttc = ttc.toFixed(2);
      }
    },
    onPriceTtcInput() {
      const rate = this.selectedTvaRatePercent;
      const ttc = this.parsePrice(this.localProduct.price_ttc);
      if (!isNaN(ttc)) {
        const ht = ttc / (1 + rate / 100);
        this.localProduct.price_ht = ht.toFixed(4);
      }
    },
    onTvaChange() {
      this.onPriceHtInput();
    },
    parsePrice(val) {
      if (val === undefined || val === null) return 0;
      let str = String(val).trim();
      if (str.includes(',') && str.includes('.')) {
        str = str.replace(/,/g, '');
      } else if (str.includes(',')) {
        str = str.replace(/,/g, '.');
      }
      const clean = str.replace(/[^\d.]/g, '');
      return parseFloat(clean) || 0;
    },
    formatPricePlain(price) {
      if (typeof price !== 'number') return '0.00';
      return price.toFixed(2);
    },
    getCategoryDisplayName(opt) {
      const spaces = '\u00A0\u00A0\u00A0\u00A0';
      return spaces.repeat(opt.indent) + (opt.indent > 0 ? '└─ ' : '') + opt.name;
    },
    async handleImageClick() {
      if (this.activeState && this.activeState.isViewMode()) return;

      try {
        if (window.electronAPI && typeof window.electronAPI.selectImage === 'function') {
          const res = await window.electronAPI.selectImage();
          if (res) {
            this.imageLoadError = false;
            this.localProduct.image_path = res.path;
            this.localProduct.image_preview = res.preview;
          }
        } else {
          // Browser mock fallback
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
              this.imageLoadError = false;
              this.localProduct.image_path = 'mock-path-for-testing';
              this.localProduct.image_preview = URL.createObjectURL(file);
            }
          };
          input.click();
        }
      } catch (err) {
        console.error('Error selecting image:', err);
      }
    },
    addToBasket,
    handleImageError() {
      this.imageLoadError = true;
    },
    handleRemoveImage() {
      this.imageLoadError = false;
      this.localProduct.image_path = null;
      this.localProduct.image_preview = null;
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
        const file = files[0];
        if (file.type.startsWith('image/')) {
          this.imageLoadError = false;
          this.localProduct.image_path = file.path || 'mock-path-for-testing';
          this.localProduct.image_preview = URL.createObjectURL(file);
        }
      }
    },
    async handleSave() {
      if (!this.localProduct.name || this.localProduct.name.trim() === '') {
        alert("Le nom de l'article est requis.");
        return;
      }
      if (!this.localProduct.category_id) {
        alert('La catégorie est requise.');
        return;
      }
      if (!this.localProduct.tva_id) {
        alert('Le taux de TVA est requis.');
        return;
      }

      const priceHt = this.parsePrice(this.localProduct.price_ht);
      const priceTtc = this.parsePrice(this.localProduct.price_ttc);

      try {
        let finalImagePath = null;
        if (this.localProduct.image_path) {
          if (window.electronAPI && typeof window.electronAPI.saveImage === 'function') {
            if (this.localProduct.image_path.startsWith('media://')) {
              finalImagePath = this.localProduct.image_path;
            } else if (this.localProduct.image_path !== 'mock-path-for-testing') {
              finalImagePath = await window.electronAPI.saveImage(this.localProduct.image_path);
            } else {
              finalImagePath = 'mock-image.png';
            }
          } else {
            finalImagePath = this.localProduct.image_preview || 'mock-image.png';
          }
        }

        const productData = {
          name: this.localProduct.name.trim(),
          barcode: this.localProduct.barcode ? this.localProduct.barcode.trim() : null,
          category_id: Number(this.localProduct.category_id),
          tva_id: Number(this.localProduct.tva_id),
          price_ht: priceHt,
          price_ttc: priceTtc,
          image_path: finalImagePath,
          is_openfoodfacts: this.product ? this.product.is_openfoodfacts : 0,
        };

        if (this.currentStateName === 'create') {
          if (window.electronAPI && typeof window.electronAPI.createProduct === 'function') {
            await window.electronAPI.createProduct(productData);
          } else {
            console.log('Mock: Product created', productData);
          }
          this.$emit('product-created', productData);
        } else {
          // Edit mode
          if (window.electronAPI && typeof window.electronAPI.updateProduct === 'function') {
            await window.electronAPI.updateProduct(this.product.id, productData);
          } else {
            console.log('Mock: Product updated', this.product.id, productData);
            // Fallback for browser mock mode
            const idx = this.$parent.products.findIndex((p) => p.id === this.product.id);
            if (idx !== -1) {
              const updatedMockProduct = {
                ...this.product,
                ...productData,
                category_name:
                  this.categories.find((c) => c.id === productData.category_id)?.name || '',
              };
              this.$parent.products.splice(idx, 1, updatedMockProduct);
            }
          }
          this.$emit('product-updated', this.product.id);
          this.transitionTo('view');
        }
      } catch (err) {
        console.error('Error saving product:', err);
        alert(`Erreur lors de l'enregistrement du produit: ${err.message}`);
      }
    },
    async confirmDiscardChanges() {
      let choice = 1; // Default to stay (1 is stay)
      if (
        window.electronAPI &&
        typeof window.electronAPI.showExitConfirmationDialog === 'function'
      ) {
        choice = await window.electronAPI.showExitConfirmationDialog();
      } else {
        const res = window.confirm(this.vm.$t('unsaved_changes_msg'));
        choice = res ? 0 : 1; // 0 = Abandonner, 1 = Rester
      }
      return choice === 0;
    },
    handleCancel() {
      if (this.activeState) {
        this.activeState.handleCancel();
      } else {
        this.$emit('close');
      }
    },
    handleSubmit() {
      if (this.activeState) {
        this.activeState.handleSubmit();
      }
    },
    formatDate(dateStr) {
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
    },
  },
};
</script>
