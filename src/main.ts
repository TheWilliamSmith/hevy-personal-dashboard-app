import { createApp } from 'vue';

import App from './App.vue';
import { clearSession } from './lib/auth-session';
import { onSessionExpired } from './lib/session-expiry';
import { i18n } from './i18n';
import { router, sessionExpiredTarget } from './router';
import './style.css';

onSessionExpired(() => {
  clearSession();
  window.location.assign(router.resolve(sessionExpiredTarget(router.currentRoute.value)).href);
});

const app = createApp(App).use(router).use(i18n);

void router.isReady().then(() => app.mount('#app'));
