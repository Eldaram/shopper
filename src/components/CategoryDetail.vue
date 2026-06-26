<template>
  <div class="detail-container">
    <div class="detail-header">
      <button class="btn-back" @click="handleCancel">
        <span>←</span> {{ $t('back_to_catalogue') }}
      </button>
      <span class="detail-badge-mode">{{ activeState ? activeState.getBadgeText() : '' }}</span>
    </div>

    <div class="detail-card">
      <ImageUploader
        :image-url="imageUrl"
        :image-load-error="imageLoadError"
        :is-editable="activeState && activeState.isImageClickable()"
        :show-delete-button="activeState && activeState.showDeleteImageButton() && !!imageUrl"
        :alt-text="localCategory.name || $t('category')"
        :initials="initials"
        @select-image="handleImageClick"
        @remove-image="handleRemoveImage"
        @image-error="handleImageError"
        @drop-image="handleDropImage"
      />

      <div class="detail-form-sec">
        <h2 class="detail-form-title">
          {{ activeState ? activeState.getTitle() : '' }}
        </h2>

        <form class="form-grid" @submit.prevent>
          <div class="form-group form-field-full">
            <label class="form-label">{{ $t('category_name') }}</label>
            <input
              type="text"
              v-model="localCategory.name"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
              required
              placeholder="Ex: Épicerie, Boissons..."
            />
          </div>

          <div class="form-group form-field-full">
            <label class="form-label">{{ $t('parent_category') }}</label>
            <select
              v-model="localCategory.parent_id"
              class="form-input"
              :disabled="!activeState || !activeState.isEditable()"
            >
              <option :value="null">{{ $t('root_category_option') }}</option>
              <option
                v-for="opt in parentCategoryOptions"
                :key="opt.id"
                :value="opt.id"
              >
                {{ getCategoryDisplayName(opt) }}
              </option>
            </select>
          </div>
        </form>

        <div class="detail-actions">
          <BaseButton variant="secondary" @click="handleCancel">
            {{ $t('cancel') }}
          </BaseButton>
          <BaseButton v-if="currentStateName === 'edit'" variant="danger" @click="$emit('delete')">
            {{ $t('delete') }}
          </BaseButton>
          <BaseButton variant="primary" @click="handleSubmit">
            {{ $t('save') }}
          </BaseButton>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ImageUploader from './ImageUploader.vue';
import BaseButton from './BaseButton.vue';
import { EditState, CreateState } from './CategoryDetailState.js';
import * as helpers from '../utils/categoryHelpers.js';
import { getCategoryDisplayName, getParentCategoryOptions } from '../utils/categoryTreeHelpers.js';
import { selectImage, dropImage } from '../utils/imageUploadHelper.js';

export default {
  name: 'CategoryDetail',
  components: {
    ImageUploader,
    BaseButton,
  },
  props: {
    category: { type: Object, default: null },
    mode: { type: String, default: 'edit' },
    preselectedParentId: { type: Number, default: null },
    categories: { type: Array, required: true },
  },
  emits: ['close', 'category-created', 'category-updated', 'delete'],
  data() {
    return {
      currentStateName: this.mode || 'edit',
      imageLoadError: false,
      localCategory: {
        name: '',
        parent_id: null,
        image_path: null,
        image_preview: null,
      },
    };
  },
  computed: {
    activeState() {
      if (this.currentStateName === 'create') return new CreateState(this);
      return new EditState(this);
    },
    imageUrl() {
      return this.localCategory.image_preview || this.localCategory.image_path || null;
    },
    initials() {
      const name = this.localCategory.name;
      if (!name) return '';
      return name
        .split(' ')
        .map((w) => w.charAt(0))
        .join('')
        .substring(0, 2)
        .toUpperCase();
    },
    parentCategoryOptions() {
      const currentId = this.category ? this.category.id : null;
      return getParentCategoryOptions(this.categories, currentId);
    },
  },
  watch: {
    category: {
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
  },
  methods: {
    transitionTo(stateName) {
      this.currentStateName = stateName;
      this.initForm();
    },
    initForm() {
      helpers.initForm(this);
    },
    getFormData() {
      return helpers.getFormData(this.localCategory);
    },
    isFormDirty() {
      return helpers.checkIfFormDirty(
        this.localCategory,
        helpers.getInitialCategoryState(this)
      );
    },
    async handleImageClick() {
      try {
        const res = await selectImage();
        if (res) {
          this.imageLoadError = false;
          this.localCategory.image_path = res.path;
          this.localCategory.image_preview = res.preview;
        }
      } catch (err) {
        console.error('Error selecting image:', err);
      }
    },
    handleImageError() {
      this.imageLoadError = true;
    },
    handleRemoveImage() {
      this.imageLoadError = false;
      this.localCategory.image_path = null;
      this.localCategory.image_preview = null;
    },
    handleDropImage(file) {
      const res = dropImage(file);
      if (res) {
        this.imageLoadError = false;
        this.localCategory.image_path = res.path;
        this.localCategory.image_preview = res.preview;
      }
    },
    handleSave() {
      return helpers.handleSave(this);
    },
    async confirmDiscardChanges() {
      let choice = 1;
      if (
        window.electronAPI &&
        typeof window.electronAPI.showExitConfirmationDialog === 'function'
      ) {
        choice = await window.electronAPI.showExitConfirmationDialog('category');
      } else {
        const res = window.confirm(this.$t('unsaved_changes_msg'));
        choice = res ? 0 : 1;
      }
      return choice === 0;
    },
    async handleCancel() {
      if (this.activeState) await this.activeState.handleCancel();
      else this.$emit('close');
    },
    async handleSubmit() {
      if (this.activeState) await this.activeState.handleSubmit();
    },
    getCategoryDisplayName(opt) {
      return getCategoryDisplayName(opt);
    },
  },
};
</script>
