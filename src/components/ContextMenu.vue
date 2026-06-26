<template>
  <div v-if="visible" class="context-menu" :style="{ top: y + 'px', left: x + 'px' }">
    <template v-if="targetProduct">
      <div class="context-menu-item" @click="handleDeleteProduct">
        <span class="context-menu-icon">🗑️</span>
        <span>{{ $t('delete_item') }}</span>
      </div>
    </template>
    <template v-else>
      <div class="context-menu-item" @click="handleCreate">
        <span class="context-menu-icon">➕</span>
        <span>
          <template v-if="hasDraft">{{ $t('resume_draft') }}</template>
          <template v-else>{{
            $t('add_item') + (targetCategory ? ` ${$t('in')} ${targetCategory.name}` : '')
          }}</template>
        </span>
      </div>
      <div class="context-menu-item" @click="handleCreateCategory">
        <span class="context-menu-icon">📁</span>
        <span>{{
          $t('add_category') + (targetCategory ? ` ${$t('in')} ${targetCategory.name}` : '')
        }}</span>
      </div>
      <div
        v-if="targetCategory"
        class="context-menu-item"
        @click="handleEditCategory"
      >
        <span class="context-menu-icon">✏️</span>
        <span>{{ $t('edit_category') }}</span>
      </div>
      <div
        v-if="targetCategory"
        class="context-menu-item context-menu-item--danger"
        @click="handleDeleteCategory"
      >
        <span class="context-menu-icon">🗑️</span>
        <span>{{ $t('delete_category') }}</span>
      </div>
    </template>
  </div>
</template>

<script>
export default {
  name: 'ContextMenu',
  props: {
    hasDraft: { type: Boolean, default: false },
  },
  emits: ['delete-product', 'delete-category', 'create-item', 'create-category', 'edit-category'],
  data() {
    return {
      visible: false,
      x: 0,
      y: 0,
      targetProduct: null,
      targetCategory: null,
    };
  },
  mounted() {
    window.addEventListener('click', this.close);
  },
  beforeUnmount() {
    window.removeEventListener('click', this.close);
  },
  methods: {
    showForCategory(event, category) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      this.visible = true;
      this.x = event ? event.clientX : 0;
      this.y = event ? event.clientY : 0;
      this.targetCategory = category;
      this.targetProduct = null;
    },
    showForProduct(event, product) {
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      if (event && typeof event.stopPropagation === 'function') event.stopPropagation();
      this.visible = true;
      this.x = event ? event.clientX : 0;
      this.y = event ? event.clientY : 0;
      this.targetCategory = null;
      this.targetProduct = product;
    },
    showForWorkspace(event, selectedCategoryId, categories) {
      if (event && event.target) {
        if (
          event.target.tagName === 'INPUT' ||
          event.target.tagName === 'SELECT' ||
          event.target.tagName === 'BUTTON' ||
          event.target.closest('input') ||
          event.target.closest('select') ||
          event.target.closest('button')
        ) {
          return;
        }
      }
      if (event && typeof event.preventDefault === 'function') event.preventDefault();
      let currentCategory = null;
      if (selectedCategoryId !== null) {
        currentCategory = categories.find((c) => c.id === selectedCategoryId) || null;
      }
      this.visible = true;
      this.x = event ? event.clientX : 0;
      this.y = event ? event.clientY : 0;
      this.targetCategory = currentCategory;
      this.targetProduct = null;
    },
    close() {
      this.visible = false;
      this.targetProduct = null;
      this.targetCategory = null;
    },
    handleDeleteProduct() {
      if (this.targetProduct) {
        this.$emit('delete-product', this.targetProduct);
      }
      this.close();
    },
    handleDeleteCategory() {
      if (this.targetCategory) {
        this.$emit('delete-category', this.targetCategory);
      }
      this.close();
    },
    handleCreate() {
      this.$emit('create-item', this.targetCategory);
      this.close();
    },
    handleCreateCategory() {
      this.$emit('create-category', this.targetCategory);
      this.close();
    },
    handleEditCategory() {
      if (this.targetCategory) {
        this.$emit('edit-category', this.targetCategory);
      }
      this.close();
    },
  },
};
</script>
