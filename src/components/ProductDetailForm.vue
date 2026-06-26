<template>
  <form class="form-grid" @submit.prevent>
    <div class="form-group form-field-full" style="position: relative">
      <label class="form-label">{{ $t('item_name') }}</label>
      <input
        type="text"
        v-model="product.name"
        class="form-input"
        :disabled="!isEditable"
        required
        placeholder="Ex: Coca-Cola 1.5L"
        @input="$emit('name-input')"
        @focus="$emit('name-focus')"
        @blur="$emit('name-blur')"
      />
      <!-- OpenFoodFacts Suggestions Dropdown -->
      <div v-if="showSuggestions" class="search-suggestions-container">
        <div v-if="loadingSearch" class="suggestion-loading">
          {{ $t('searching_openfoodfacts') }}
        </div>
        <div v-else-if="suggestions.length > 0" class="suggestions-list">
          <div
            v-for="item in suggestions"
            :key="item.barcode"
            class="suggestion-item"
            @mousedown="$emit('select-suggestion', item)"
          >
            <img
              v-if="item.image_url"
              :src="item.image_url"
              class="suggestion-img"
              @error="item.image_url = null"
            />
            <div v-else class="suggestion-img-placeholder">🍽️</div>
            <div class="suggestion-info">
              <span class="suggestion-name">{{ item.name }}</span>
              <span class="suggestion-barcode">{{ item.barcode }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label class="form-label">{{ $t('barcode_ean') }}</label>
      <input
        type="text"
        v-model="product.barcode"
        class="form-input"
        :class="{ 'form-input-warning': barcodeNotFound }"
        :disabled="!isEditable"
        :title="barcodeNotFound ? $t('barcode_not_found') : ''"
        placeholder="Ex: 5449000000996"
        @blur="$emit('barcode-blur')"
        @input="$emit('barcode-change')"
      />
    </div>

    <div class="form-group">
      <label class="form-label">{{ $t('category') }}</label>
      <select v-model="product.category_id" class="form-input" :disabled="!isEditable">
        <option :value="null">{{ $t('no_category') }}</option>
        <option v-for="opt in categoryTreeOptions" :key="opt.id" :value="opt.id">
          {{ getCategoryDisplayName(opt) }}
        </option>
      </select>
    </div>

    <div class="form-group">
      <label class="form-label">{{ $t('price_ht') }}</label>
      <input
        type="text"
        v-model="product.price_ht"
        @input="$emit('price-ht-input')"
        class="form-input"
        :disabled="!isEditable"
        required
        placeholder="0.00"
      />
    </div>

    <div class="form-group">
      <label class="form-label">{{ $t('price_ttc') }}</label>
      <input
        type="text"
        v-model="product.price_ttc"
        @input="$emit('price-ttc-input')"
        class="form-input"
        :disabled="!isEditable"
        required
        placeholder="0.00"
      />
    </div>

    <div class="form-group">
      <label class="form-label">{{ $t('tva_rate') }}</label>
      <select
        v-model="product.tva_id"
        @change="$emit('tva-change')"
        class="form-input"
        :disabled="!isEditable"
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
          isCreateMode
            ? $t('local_import')
            : productModel && productModel.is_openfoodfacts
              ? $t('open_food_facts')
              : $t('local_import')
        "
        class="form-input"
        disabled
      />
    </div>

    <div v-if="!isCreateMode && productModel && productModel.updated_at" class="form-group">
      <label class="form-label">{{ $t('last_modified') }}</label>
      <input type="text" :value="formatDate(productModel.updated_at)" class="form-input" disabled />
    </div>
  </form>
</template>

<script>
export default {
  name: 'ProductDetailForm',
  props: {
    product: {
      type: Object,
      required: true,
    },
    productModel: {
      type: Object,
      default: null,
    },
    isEditable: {
      type: Boolean,
      default: false,
    },
    isCreateMode: {
      type: Boolean,
      default: false,
    },
    categories: {
      type: Array,
      required: true,
    },
    tvaRates: {
      type: Array,
      required: true,
    },
    barcodeNotFound: {
      type: Boolean,
      default: false,
    },
    suggestions: {
      type: Array,
      default: () => [],
    },
    loadingSearch: {
      type: Boolean,
      default: false,
    },
    showSuggestions: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'name-input',
    'name-focus',
    'name-blur',
    'barcode-blur',
    'barcode-change',
    'select-suggestion',
    'price-ht-input',
    'price-ttc-input',
    'tva-change',
  ],
  computed: {
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
  methods: {
    getCategoryDisplayName(opt) {
      const spaces = '\u00A0\u00A0\u00A0\u00A0';
      return spaces.repeat(opt.indent) + (opt.indent > 0 ? '└─ ' : '') + opt.name;
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
