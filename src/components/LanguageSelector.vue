<template>
  <div class="lang-selector-container" v-click-outside="closeDropdown">
    <button class="lang-btn" @click="toggleDropdown" :title="t('choose_language') || 'Language'">
      <span class="lang-flag">{{ currentLanguageDetails?.flag }}</span>
      <span class="lang-name">{{ currentLanguageDetails?.name }}</span>
      <span class="lang-arrow" :class="{ open: isOpen }">▼</span>
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

<style scoped>
.lang-selector-container {
  position: relative;
  display: inline-block;
}

.lang-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  background-color: rgba(0, 0, 0, 0.15);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
  cursor: pointer;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
  height: 38px;
  box-shadow: none;
}

.lang-btn:hover {
  border-color: var(--color-muted-teal);
  background-color: rgba(132, 169, 140, 0.1);
  color: var(--color-muted-teal);
}

.lang-btn:focus {
  outline: none;
  box-shadow: none;
}

.lang-flag {
  font-size: 16px;
  line-height: 1;
}

.lang-name {
  font-size: 13px;
}

.lang-arrow {
  font-size: 9px;
  color: var(--text-muted);
  transition: transform 0.2s ease;
  margin-left: 2px;
}

.lang-arrow.open {
  transform: rotate(180deg);
}

.lang-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  background-color: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  min-width: 140px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
  z-index: 1000;
  padding: 6px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lang-dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-secondary);
  font-size: 13px;
  font-weight: 500;
}

.lang-dropdown-item:hover {
  background-color: rgba(255, 255, 255, 0.05);
  color: var(--color-muted-teal);
}

.lang-dropdown-item.active {
  background-color: var(--color-deep-teal);
  color: var(--text-primary);
}

.fade-enter-active,
.fade-leave-active {
  transition:
    opacity 0.15s ease,
    transform 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
