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
export default {
  name: 'Breadcrumbs',
  props: {
    path: {
      type: Array,
      required: true,
    },
  },
  emits: ['select-category', 'close-product'],
  methods: {
    handleClick(item, index) {
      // If it's the active/last item, do nothing
      if (index === this.path.length - 1) return;

      if (item.type === 'home') {
        this.$emit('select-category', null);
      } else if (item.type === 'category') {
        this.$emit('select-category', item.id);
      }
    },
  },
};
</script>
