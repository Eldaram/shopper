import { ref } from 'vue';

const currentTheme = ref('dark');

export const theme = {
  currentTheme,

  async initTheme() {
    if (window.electronAPI && typeof window.electronAPI.getCurrentTheme === 'function') {
      try {
        const t = await window.electronAPI.getCurrentTheme();
        this.applyTheme(t);
      } catch (err) {
        console.error('theme: Failed to get current theme, falling back to dark', err);
        this.applyTheme('dark');
      }
    } else {
      this.applyTheme('dark');
    }
  },

  async setTheme(t) {
    if (t !== 'light' && t !== 'dark') return;
    if (window.electronAPI && typeof window.electronAPI.setTheme === 'function') {
      try {
        await window.electronAPI.setTheme(t);
        this.applyTheme(t);
      } catch (err) {
        console.error('theme: Failed to set theme via IPC, fallback to memory setting', err);
        this.applyTheme(t);
      }
    } else {
      this.applyTheme(t);
    }
  },

  applyTheme(t) {
    currentTheme.value = t;
    document.documentElement.setAttribute('data-theme', t);
  },
};
