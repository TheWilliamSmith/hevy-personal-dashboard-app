import { createApp } from 'vue';

import App from './App.vue';
import { clearSession } from './lib/auth-session';
import { onSessionExpired } from './lib/session-expiry';
import { router, sessionExpiredTarget } from './router';
import './style.css';

onSessionExpired(() => {
  clearSession();
  window.location.assign(router.resolve(sessionExpiredTarget(router.currentRoute.value)).href);
});

const app = createApp(App).use(router);

void router.isReady().then(() => app.mount('#app'));
