<template>
  <div class="detail-container">
    <div class="detail-header">
      <button class="btn-back" @click="handleCancel"><span>←</span> Retour au catalogue</button>
      <span class="detail-badge-mode">{{ isCreateMode ? '➕ Création' : '🔍 Consultation' }}</span>
    </div>

    <div class="detail-card">
      <div
        class="detail-image-sec"
        :class="{ clickable: isCreateMode, 'drag-over': isDragOver }"
        @click="handleImageClick"
        @dragover.prevent="handleDragOver"
        @dragenter.prevent="handleDragEnter"
        @dragleave.prevent="handleDragLeave"
        @drop.prevent="handleDrop"
      >
        <button
          v-if="isCreateMode && imageUrl"
          class="btn-delete-img"
          @click.stop="handleRemoveImage"
          title="Supprimer l'image"
        >
          <span>🗑️</span>
        </button>
        <img
          v-if="imageUrl"
          :src="imageUrl"
          :alt="localProduct.name || 'Produit'"
          class="detail-large-img"
          @error="handleImageError"
        />
        <div v-else class="detail-img-placeholder">
          <template v-if="isCreateMode">
            <span class="upload-icon">📷</span>
            <span class="upload-text"
              >Choisir une image<br /><span style="font-size: 11px; opacity: 0.7"
                >(ou glisser-déposer)</span
              ></span
            >
          </template>
          <template v-else>
            {{ initials }}
          </template>
        </div>
      </div>

      <div class="detail-form-sec">
        <h2 class="detail-form-title">
          {{ isCreateMode ? 'Créer un produit' : 'Détails du Produit' }}
        </h2>

        <form class="form-grid" @submit.prevent="handleSubmit">
          <div class="form-group form-field-full">
            <label class="form-label">Nom de l'article</label>
            <input
              type="text"
              v-model="localProduct.name"
              class="form-input"
              :disabled="!isCreateMode"
              required
              placeholder="Ex: Coca-Cola 1.5L"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Code-barres (EAN)</label>
            <input
              type="text"
              v-model="localProduct.barcode"
              class="form-input"
              :disabled="!isCreateMode"
              placeholder="Ex: 5449000000996"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Catégorie</label>
            <select
              v-model="localProduct.category_id"
              class="form-input"
              :disabled="!isCreateMode"
              required
            >
              <option :value="null" disabled>Choisir une catégorie</option>
              <option v-for="opt in categoryTreeOptions" :key="opt.id" :value="opt.id">
                {{ getCategoryDisplayName(opt) }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Prix HT (€)</label>
            <input
              type="text"
              v-model="localProduct.price_ht"
              @input="onPriceHtInput"
              class="form-input"
              :disabled="!isCreateMode"
              required
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Prix TTC (€)</label>
            <input
              type="text"
              v-model="localProduct.price_ttc"
              @input="onPriceTtcInput"
              class="form-input"
              :disabled="!isCreateMode"
              required
              placeholder="0.00"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Taux TVA</label>
            <select
              v-model="localProduct.tva_id"
              @change="onTvaChange"
              class="form-input"
              :disabled="!isCreateMode"
              required
            >
              <option v-for="rate in tvaRates" :key="rate.id" :value="rate.id">
                {{ rate.name }} ({{ rate.rate }}%)
              </option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">Origine des données</label>
            <input
              type="text"
              :value="
                isCreateMode
                  ? 'Import Local'
                  : product && product.is_openfoodfacts
                    ? 'Open Food Facts'
                    : 'Import Local'
              "
              class="form-input"
              disabled
            />
          </div>
        </form>

        <div class="detail-actions">
          <button v-if="!isCreateMode" class="btn-secondary" disabled>Modifier</button>
          <button v-if="!isCreateMode" class="btn-primary" disabled>Enregistrer</button>

          <button v-if="isCreateMode" class="btn-secondary active-btn" @click="handleCancel">
            Annuler
          </button>
          <button v-if="isCreateMode" class="btn-primary active-btn" @click="handleSubmit">
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ProductDetail',
  props: {
    product: {
      type: Object,
      default: null,
    },
    mode: {
      type: String,
      default: 'view', // 'view' or 'create'
    },
    preselectedCategoryId: {
      type: Number,
      default: null,
    },
    draft: {
      type: Object,
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
  emits: ['close', 'product-created'],
  data() {
    return {
      isDragOver: false,
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
    isCreateMode() {
      return this.mode === 'create';
    },
    imageUrl() {
      if (this.isCreateMode) {
        return this.localProduct.image_preview || this.localProduct.image_path || null;
      }
      return this.product
        ? this.product.image_path || this.product.image_url_openfoodfacts || null
        : null;
    },
    initials() {
      const name = this.isCreateMode ? this.localProduct.name : this.product?.name;
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

      // Add orphaned categories (e.g. if parent_id is not null but parent is not found in categories)
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
    mode() {
      this.initForm();
    },
    draft: {
      handler() {
        this.initForm();
      },
      deep: true,
    },
    tvaRates: {
      handler(newRates) {
        if (this.isCreateMode && !this.localProduct.tva_id && newRates && newRates.length > 0) {
          this.localProduct.tva_id = newRates[0].id;
        }
      },
      immediate: true,
    },
  },
  methods: {
    initForm() {
      if (this.isCreateMode) {
        if (this.draft) {
          this.localProduct = {
            name: this.draft.name || '',
            barcode: this.draft.barcode || '',
            category_id: this.draft.category_id || null,
            tva_id: this.draft.tva_id || this.tvaRates[0]?.id || null,
            price_ht: this.draft.price_ht || '0.00',
            price_ttc: this.draft.price_ttc || '0.00',
            image_path: this.draft.image_path || null,
            image_preview: this.draft.image_preview || null,
          };
        } else {
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
        }
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
      if (!this.isCreateMode) return false;
      const initial = this.getInitialProductState();
      return (
        this.localProduct.name !== initial.name ||
        this.localProduct.barcode !== initial.barcode ||
        this.localProduct.category_id !== initial.category_id ||
        this.localProduct.tva_id !== initial.tva_id ||
        this.parsePrice(this.localProduct.price_ht) !== initial.price_ht ||
        this.parsePrice(this.localProduct.price_ttc) !== initial.price_ttc ||
        this.localProduct.image_path !== initial.image_path
      );
    },
    getInitialProductState() {
      if (this.draft) {
        return {
          name: this.draft.name || '',
          barcode: this.draft.barcode || '',
          category_id: this.draft.category_id || null,
          tva_id: this.draft.tva_id || this.tvaRates[0]?.id || null,
          price_ht: this.parsePrice(this.draft.price_ht),
          price_ttc: this.parsePrice(this.draft.price_ttc),
          image_path: this.draft.image_path || null,
        };
      }
      return {
        name: '',
        barcode: '',
        category_id: this.preselectedCategoryId || null,
        tva_id: this.tvaRates[0]?.id || null,
        price_ht: 0,
        price_ttc: 0,
        image_path: null,
      };
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
      if (!this.isCreateMode) return;

      try {
        if (window.electronAPI && typeof window.electronAPI.selectImage === 'function') {
          const res = await window.electronAPI.selectImage();
          if (res) {
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
    handleImageError(e) {
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'detail-img-placeholder';
      placeholder.innerText = this.initials;
      e.target.parentNode.appendChild(placeholder);
    },
    handleRemoveImage() {
      this.localProduct.image_path = null;
      this.localProduct.image_preview = null;
    },
    handleDragOver() {
      if (!this.isCreateMode) return;
      this.isDragOver = true;
    },
    handleDragEnter() {
      if (!this.isCreateMode) return;
      this.isDragOver = true;
    },
    handleDragLeave() {
      if (!this.isCreateMode) return;
      this.isDragOver = false;
    },
    handleDrop(e) {
      if (!this.isCreateMode) return;
      this.isDragOver = false;

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          this.localProduct.image_path = file.path || 'mock-path-for-testing';
          this.localProduct.image_preview = URL.createObjectURL(file);
        }
      }
    },
    async handleSubmit() {
      if (!this.isCreateMode) return;

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

        const newProduct = {
          name: this.localProduct.name.trim(),
          barcode: this.localProduct.barcode ? this.localProduct.barcode.trim() : null,
          category_id: Number(this.localProduct.category_id),
          tva_id: Number(this.localProduct.tva_id),
          price_ht: priceHt,
          price_ttc: priceTtc,
          image_path: finalImagePath,
          is_openfoodfacts: 0,
        };

        if (window.electronAPI && typeof window.electronAPI.createProduct === 'function') {
          await window.electronAPI.createProduct(newProduct);
        } else {
          console.log('Mock: Product created', newProduct);
        }

        this.$emit('product-created', newProduct);
      } catch (err) {
        console.error('Error creating product:', err);
        alert(`Erreur lors de la création du produit: ${err.message}`);
      }
    },
    handleCancel() {
      this.$emit('close');
    },
  },
};
</script>
