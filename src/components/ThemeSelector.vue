<template>
  <div class="theme-selector-container" v-click-outside="closeDropdown">
    <button class="theme-btn" @click="toggleDropdown" :title="t('choose_theme') || 'Theme'">
      <span class="theme-icon">{{ currentThemeDetails?.icon }}</span>
      <span class="theme-name">{{ currentThemeDetails?.name }}</span>
      <span class="theme-arrow" :class="{ open: isOpen }">▼</span>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="theme-dropdown">
        <div
          v-for="item in availableThemes"
          :key="item.code"
          class="theme-dropdown-item"
          :class="{ active: item.code === currentTheme }"
          @click="selectTheme(item.code)"
        >
          <span class="theme-icon">{{ item.icon }}</span>
          <span class="theme-name">{{ item.name }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { theme } from '../utils/theme';
import { i18n } from '../utils/i18n';

export default {
  name: 'ThemeSelector',
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    currentTheme() {
      return theme.currentTheme.value;
    },
    availableThemes() {
      return [
        { code: 'light', name: this.t('theme_light') || 'Light', icon: '☀️' },
        { code: 'dark', name: this.t('theme_dark') || 'Dark', icon: '🌙' },
      ];
    },
    currentThemeDetails() {
      return this.availableThemes.find((t) => t.code === this.currentTheme);
    },
  },
  methods: {
    t(key) {
      return i18n.t(key);
    },
    toggleDropdown() {
      this.isOpen = !this.isOpen;
    },
    closeDropdown() {
      this.isOpen = false;
    },
    async selectTheme(code) {
      await theme.setTheme(code);
      this.closeDropdown();
    },
  },
  directives: {
    'click-outside': {
      beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event);
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      },
    },
  },
};
</script>
