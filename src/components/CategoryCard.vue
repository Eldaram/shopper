<template>
  <div class="square-card" @click="$emit('click')">
    <div class="card-img-container">
      <img
        v-if="category.image_path"
        :src="category.image_path"
        :alt="category.name"
        class="card-img"
        @error="handleImageError"
      />
      <div v-else class="card-img-placeholder">
        {{ initials }}
      </div>
    </div>
    <div class="card-overlay"></div>
    <div class="card-content">
      <div class="card-name">{{ category.name }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'CategoryCard',
  props: {
    category: {
      type: Object,
      required: true,
    },
  },
  emits: ['click'],
  computed: {
    initials() {
      if (!this.category.name) return '';
      return this.category.name
        .split(' ')
        .map((word) => word.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
  },
  methods: {
    handleImageError(e) {
      // Fallback if image fails to load
      e.target.style.display = 'none';
      const placeholder = document.createElement('div');
      placeholder.className = 'card-img-placeholder';
      placeholder.innerText = this.initials;
      e.target.parentNode.appendChild(placeholder);
    },
  },
};
</script>
