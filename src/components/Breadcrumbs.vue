<template>
  <div class="breadcrumbs">
    <div
      v-for="(item, index) in path"
      :key="index"
      style="display: flex; align-items: center; gap: 8px"
    >
      <span v-if="index > 0" class="breadcrumb-separator"> &gt; </span>
      <span
        class="breadcrumb-item"
        :class="{ active: index === path.length - 1 }"
        @click="handleClick(item, index)"
      >
        {{ item.name }}
      </span>
    </div>
  </div>
</template>

<script>
import { basketState } from '../utils/basketStore';

export default {
  name: 'Breadcrumbs',
  props: {
    categories: {
      type: Array,
      required: true,
    },
    selectedCategoryId: {
      type: [Number, null],
      default: null,
    },
    focusedProduct: {
      type: Object,
      default: null,
    },
    isCreatingProduct: {
      type: Boolean,
      default: false,
    },
    isViewingDashboard: {
      type: Boolean,
      default: false,
    },
    isViewingSalesReport: {
      type: Boolean,
      default: false,
    },
    readonlyTicket: {
      type: Object,
      default: null,
    },
    focusedCategory: {
      type: Object,
      default: null,
    },
    isCreatingCategory: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['select-category', 'select-dashboard', 'select-sales-report'],
  data() {
    return {
      basketState,
    };
  },
  computed: {
    path() {
      if (this.readonlyTicket) {
        return [
          { name: this.$t('dashboard'), type: 'dashboard' },
          { name: `${this.$t('read_only_basket')} #${this.readonlyTicket.id}`, type: 'ticket' },
        ];
      }
      if (this.isViewingDashboard) {
        return [{ name: this.$t('dashboard'), type: 'dashboard' }];
      }
      if (this.isViewingSalesReport) {
        return [{ name: this.$t('sales_report'), type: 'sales_report' }];
      }

      const result = [{ name: this.$t('all_catalogue'), type: 'home' }];
      const targetCategoryId = this.focusedCategory !== null
        ? this.focusedCategory.parent_id
        : this.selectedCategoryId;

      if (targetCategoryId !== null && targetCategoryId !== undefined) {
        const catPath = [];
        let current = this.categories.find((c) => c.id === targetCategoryId);
        while (current) {
          catPath.push({ id: current.id, name: current.name, type: 'category' });
          current = current.parent_id
            ? this.categories.find((c) => c.id === current.parent_id)
            : null;
        }
        result.push(...catPath.reverse());
      }
      if (this.basketState.isViewing) {
        result.push({ name: this.$t('basket'), type: 'basket' });
      } else if (this.focusedProduct !== null) {
        result.push({ name: this.focusedProduct.name, type: 'product' });
      } else if (this.isCreatingProduct) {
        result.push({ name: this.$t('create_product'), type: 'product' });
      } else if (this.focusedCategory !== null) {
        result.push({ name: this.focusedCategory.name, type: 'category-detail' });
      } else if (this.isCreatingCategory) {
        result.push({ name: this.$t('create_category'), type: 'category-detail' });
      }
      return result;
    },
  },
  methods: {
    handleClick(item, index) {
      if (index === this.path.length - 1) return;

      if (item.type === 'home') {
        this.$emit('select-category', null);
      } else if (item.type === 'category') {
        this.$emit('select-category', item.id);
      } else if (item.type === 'dashboard') {
        this.$emit('select-dashboard');
      }
    },
  },
};
</script>
