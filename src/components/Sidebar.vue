<template>
  <aside class="sidebar">
    <div class="sidebar-header">
      <button class="logo-btn" @click="$emit('select-category', null)">
        <span class="logo-icon">🛍️</span>
        <span class="logo-text">Shopper</span>
        <span class="logo-badge">Gérante</span>
      </button>
    </div>

    <div class="sidebar-content">
      <div class="nav-title">{{ $t('categories') }}</div>
      <nav>
        <ul class="nav-list">
          <SidebarItem
            :active="
              !basketState.isViewing &&
              selectedCategoryId === null &&
              !isViewingDashboard &&
              !isViewingSalesReport &&
              !isViewingTvaManagement
            "
            @click="$emit('select-category', null)"
            @contextmenu="$emit('contextmenu-category', $event, null)"
            :count="products.length"
          >
            {{ $t('all_catalogue') }}
          </SidebarItem>
          <SidebarItem
            v-for="category in mainCategories"
            :key="category.id"
            :active="
              !basketState.isViewing &&
              !isViewingDashboard &&
              !isViewingSalesReport &&
              !isViewingTvaManagement &&
              (category.id === selectedCategoryId || category.id === activeAncestorId)
            "
            @click="$emit('select-category', category.id)"
            @contextmenu="$emit('contextmenu-category', $event, category)"
            :count="countProducts(category.id)"
          >
            {{ category.name }}
          </SidebarItem>
        </ul>
      </nav>

      <!-- Management Section -->
      <div class="nav-title" style="margin-top: 24px">{{ $t('management') }}</div>
      <nav>
        <ul class="nav-list">
          <SidebarItem
            :active="!basketState.isViewing && isViewingDashboard"
            @click="$emit('select-dashboard')"
          >
            📊 {{ $t('dashboard') }}
          </SidebarItem>
          <SidebarItem
            :active="!basketState.isViewing && isViewingSalesReport"
            @click="$emit('select-sales-report')"
          >
            📄 {{ $t('sales_report') }}
          </SidebarItem>
          <SidebarItem
            :active="!basketState.isViewing && isViewingTvaManagement"
            @click="$emit('select-tva-management')"
          >
            ⚙️ {{ $t('tva_management') }}
          </SidebarItem>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script>
import SidebarItem from './SidebarItem.vue';
import { basketState } from '../utils/basketStore';

export default {
  name: 'Sidebar',
  components: {
    SidebarItem,
  },
  props: {
    categories: {
      type: Array,
      required: true,
    },
    products: {
      type: Array,
      required: true,
    },
    selectedCategoryId: {
      type: [Number, null],
      default: null,
    },
    activeAncestorId: {
      type: [Number, null],
      default: null,
    },
    isViewingDashboard: {
      type: Boolean,
      default: false,
    },
    isViewingSalesReport: {
      type: Boolean,
      default: false,
    },
    isViewingTvaManagement: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'select-category',
    'contextmenu-category',
    'select-dashboard',
    'select-sales-report',
    'select-tva-management',
  ],
  data() {
    return {
      basketState,
    };
  },
  computed: {
    mainCategories() {
      return this.categories.filter((c) => c.parent_id === null);
    },
  },
  methods: {
    getDescendantIds(catId) {
      const ids = [catId];
      const findChildren = (parentId) => {
        const children = this.categories.filter((c) => c.parent_id === parentId);
        for (const child of children) {
          ids.push(child.id);
          findChildren(child.id);
        }
      };
      findChildren(catId);
      return ids;
    },
    countProducts(catId) {
      const descendants = this.getDescendantIds(catId);
      return this.products.filter((p) => descendants.includes(p.category_id)).length;
    },
  },
};
</script>
