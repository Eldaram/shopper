<template>
  <div
    class="detail-image-sec"
    :class="{
      clickable: isEditable,
      'drag-over': isDragOver,
    }"
    @click="handleImageClick"
    @dragover.prevent="handleDragOver"
    @dragenter.prevent="handleDragEnter"
    @dragleave.prevent="handleDragLeave"
    @drop.prevent="handleDrop"
  >
    <button
      v-if="showDeleteButton"
      class="btn-delete-img"
      @click.stop="handleRemoveImage"
      :title="$t('delete')"
    >
      <span>🗑️</span>
    </button>
    <img
      v-if="imageUrl && !imageLoadError"
      :src="imageUrl"
      :alt="altText"
      class="detail-large-img"
      @error="handleImageError"
    />
    <div v-else class="detail-img-placeholder">
      <template v-if="isEditable">
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
</template>

<script>
export default {
  name: 'ProductDetailImage',
  props: {
    imageUrl: {
      type: String,
      default: null,
    },
    imageLoadError: {
      type: Boolean,
      default: false,
    },
    isEditable: {
      type: Boolean,
      default: false,
    },
    showDeleteButton: {
      type: Boolean,
      default: false,
    },
    altText: {
      type: String,
      default: '',
    },
    initials: {
      type: String,
      default: '',
    },
  },
  emits: ['select-image', 'remove-image', 'image-error', 'drop-image'],
  data() {
    return {
      isDragOver: false,
    };
  },
  methods: {
    handleImageClick() {
      if (!this.isEditable) return;
      this.$emit('select-image');
    },
    handleRemoveImage() {
      this.$emit('remove-image');
    },
    handleImageError() {
      this.$emit('image-error');
    },
    handleDragOver() {
      if (!this.isEditable) return;
      this.isDragOver = true;
    },
    handleDragEnter() {
      if (!this.isEditable) return;
      this.isDragOver = true;
    },
    handleDragLeave() {
      if (!this.isEditable) return;
      this.isDragOver = false;
    },
    handleDrop(e) {
      if (!this.isEditable) return;
      this.isDragOver = false;
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        const file = files[0];
        if (file.type.startsWith('image/')) {
          this.$emit('drop-image', file);
        }
      }
    },
  },
};
</script>
