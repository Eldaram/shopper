<template>
  <div class="lang-selector-container" v-click-outside="closeDropdown">
    <button class="lang-btn" @click="toggleDropdown" :title="t('choose_language') || 'Language'">
      <span class="lang-flag">{{ currentLanguageDetails?.flag }}</span>
    </button>

    <transition name="fade">
      <div v-if="isOpen" class="lang-dropdown">
        <div
          v-for="lang in availableLanguages"
          :key="lang.code"
          class="lang-dropdown-item"
          :class="{ active: lang.code === currentLang }"
          @click="selectLanguage(lang.code)"
        >
          <span class="lang-flag">{{ lang.flag }}</span>
          <span class="lang-name">{{ lang.name }}</span>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { i18n } from '../utils/i18n';

export default {
  name: 'LanguageSelector',
  data() {
    return {
      isOpen: false,
    };
  },
  computed: {
    currentLang() {
      return i18n.currentLang.value;
    },
    availableLanguages() {
      return i18n.availableLanguages.value;
    },
    currentLanguageDetails() {
      return this.availableLanguages.find((l) => l.code === this.currentLang);
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
    async selectLanguage(code) {
      await i18n.setLanguage(code);
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
