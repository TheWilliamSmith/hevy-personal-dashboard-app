import { createApp } from 'vue';

import App from './App.vue';
import { router } from './router';
import './style.css';

const app = createApp(App).use(router);

/**
 * Mount only once the initial navigation is resolved.
 *
 * Mounting earlier renders one frame against START_LOCATION, whose query is
 * empty — so a cold load of `?tab=workouts` paints the Dashboard tab as active
 * before correcting itself.
 */
void router.isReady().then(() => app.mount('#app'));
