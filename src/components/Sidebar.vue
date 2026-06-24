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
      <div class="nav-title">Catégories</div>
      <nav>
        <ul class="nav-list">
          <li
            class="nav-item"
            :class="{ active: selectedCategoryId === null }"
            @click="$emit('select-category', null)"
          >
            <span>Tout le catalogue</span>
            <span class="nav-item-count">{{ products.length }}</span>
          </li>
          <li
            v-for="category in mainCategories"
            :key="category.id"
            class="nav-item"
            :class="{
              active: category.id === selectedCategoryId || category.id === activeAncestorId,
            }"
            @click="$emit('select-category', category.id)"
          >
            <span>{{ category.name }}</span>
            <span class="nav-item-count">{{ countProducts(category.id) }}</span>
          </li>
        </ul>
      </nav>
    </div>
  </aside>
</template>

<script>
export default {
  name: 'Sidebar',
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
  },
  emits: ['select-category'],
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
