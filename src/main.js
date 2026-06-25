import { createApp } from 'vue';
import App from './App.vue';
import './style.css';
import { i18n } from './utils/i18n';

const app = createApp(App);

app.config.globalProperties.$t = (key) => i18n.t(key);
Object.defineProperty(app.config.globalProperties, '$currentLang', {
  get() {
    return i18n.currentLang.value;
  },
  configurable: true
});

i18n.loadLanguageInfo().then(() => {
  app.mount('#app');
});
