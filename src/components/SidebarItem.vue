<template>
  <li
    class="nav-item"
    :class="{ active }"
    @click="$emit('click', $event)"
    @contextmenu.prevent="$emit('contextmenu', $event)"
  >
    <span>
      <slot />
    </span>
    <span v-if="count !== null && count !== undefined" class="nav-item-count">
      {{ count }}
    </span>
  </li>
</template>

<script>
export default {
  name: 'SidebarItem',
  props: {
    active: {
      type: Boolean,
      default: false,
    },
    count: {
      type: [Number, String],
      default: null,
    },
  },
  emits: ['click', 'contextmenu'],
};
</script>
