import { createApp } from 'vue';
import App from './App.vue';
import './styles/base.css';
import './styles/sidebar.css';
import './styles/topbar.css';
import './styles/breadcrumbs.css';
import './styles/catalogue.css';
import './styles/product-detail.css';
import './styles/category-detail.css';
import './styles/basket.css';
import './styles/dashboard.css';
import './styles/sales-report.css';
import { i18n } from './utils/i18n';
import { theme } from './utils/theme';

const app = createApp(App);

app.config.globalProperties.$t = (key) => i18n.t(key);
Object.defineProperty(app.config.globalProperties, '$currentLang', {
  get() {
    return i18n.currentLang.value;
  },
  configurable: true,
});

Promise.all([i18n.loadLanguageInfo(), theme.initTheme()]).then(() => {
  app.mount('#app');
});
