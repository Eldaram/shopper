<template>
  <div class="detail-actions">
    <!-- View mode buttons -->
    <template v-if="isViewMode">
      <BaseButton variant="success" @click="$emit('add-to-basket')">
        {{ $t('add_to_basket') }}
      </BaseButton>
      <BaseButton variant="secondary" @click="$emit('edit')">
        {{ $t('edit') }}
      </BaseButton>
      <BaseButton variant="danger" @click="$emit('delete')">
        {{ $t('delete') }}
      </BaseButton>
      <BaseButton variant="primary" :disabled="true">
        {{ $t('save') }}
      </BaseButton>
    </template>

    <!-- Edit/Create mode buttons -->
    <template v-else>
      <BaseButton variant="secondary" @click="$emit('cancel')">
        {{ $t('cancel') }}
      </BaseButton>
      <BaseButton v-if="!isCreateMode" variant="danger" @click="$emit('delete')">
        {{ $t('delete') }}
      </BaseButton>
      <BaseButton variant="primary" @click="$emit('save')">
        {{ $t('save') }}
      </BaseButton>
    </template>
  </div>
</template>

<script>
import BaseButton from './BaseButton.vue';

export default {
  name: 'ProductDetailActions',
  components: {
    BaseButton,
  },
  props: {
    isViewMode: {
      type: Boolean,
      default: false,
    },
    isCreateMode: {
      type: Boolean,
      default: false,
    },
  },
  emits: ['add-to-basket', 'edit', 'delete', 'cancel', 'save'],
};
</script>
