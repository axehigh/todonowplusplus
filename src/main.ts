import { createApp } from 'vue'
import App from './App.vue'
import router from './router';

import { IonicVue } from '@ionic/vue';

/* Core CSS required for Ionic components to work properly */
import '@ionic/vue/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/vue/css/normalize.css';
import '@ionic/vue/css/structure.css';
import '@ionic/vue/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/vue/css/padding.css';
import '@ionic/vue/css/float-elements.css';
import '@ionic/vue/css/text-alignment.css';
import '@ionic/vue/css/text-transformation.css';
import '@ionic/vue/css/flex-utils.css';
import '@ionic/vue/css/display.css';

/**
 * Ionic Dark Mode
 * -----------------------------------------------------
 * For more info, please see:
 * https://ionicframework.com/docs/theming/dark-mode
 */

/* @import '@ionic/vue/css/palettes/dark.always.css'; */
/* @import '@ionic/vue/css/palettes/dark.class.css'; */
import '@ionic/vue/css/palettes/dark.system.css';

/* Theme variables */
import './theme/variables.css';

/* New: Capacitor deep link handling */
import { App as CapacitorApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { DropboxService } from './services/DropboxService';

/* Configure Dropbox for mobile: custom redirect URI */
const DROPBOX_APP_KEY = 'a318e6pi24hal9y';
const DROPBOX_REDIRECT_URI = 'db-a318e6pi24hal9y://oauth2redirect';
const dropbox = new DropboxService(DROPBOX_APP_KEY, DROPBOX_REDIRECT_URI);

/* Capture deep link and complete OAuth */
CapacitorApp.addListener('appUrlOpen', ({ url }) => {
  if (url && url.startsWith(DROPBOX_REDIRECT_URI)) {
    const ok = dropbox.handleAuthCallbackFromUrl(url);
    if (ok) {
      /* Optionally close the browser if still open */
      Browser.close();
    }
  }
});

const app = createApp(App)
  .use(IonicVue)
  .use(router);

router.isReady().then(() => {
  app.mount('#app');
});

/* Optional helper to start OAuth (can be called from a button handler) */
export async function startDropboxOAuth() {
  const url = dropbox.buildAuthUrlForBrowser();
  await Browser.open({ url });
}
