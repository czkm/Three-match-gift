import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';

import './assets/tokens.css';
import './assets/global.css';
import './assets/tile.css';
import './assets/animations.css';

const app = createApp(App);
app.use(createPinia());
app.mount('#app');

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    const swUrl = new URL('sw.js', window.location.href);
    navigator.serviceWorker.register(swUrl).catch(() => {});
  });
}
