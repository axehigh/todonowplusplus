<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home"></ion-back-button>
        </ion-buttons>
        <ion-title>Settings</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-searchbar v-model="searchText" placeholder="Search settings..." @ionInput="handleSearch"></ion-searchbar>

      <ion-list>
        <ion-item v-if="isAuthenticated">
          <ion-label>
            <span v-if="isSyncing">🔄 Syncing...</span>
            <span v-else-if="lastSyncTime">☁️ Last synced: {{ formatSyncTime(lastSyncTime) }}</span>
            <span v-else>☁️ Not synced yet</span>
          </ion-label>
        </ion-item>
        <ion-item v-if="!searchText || 'dropbox app key'.includes(searchText.toLowerCase())">
          <ion-label position="stacked">Dropbox App Key</ion-label>
          <ion-input v-model="clientId" placeholder="Enter your App Key"></ion-input>
        </ion-item>
        <ion-item v-if="!searchText || 'theme'.includes(searchText.toLowerCase())">
          <ion-label>Theme</ion-label>
          <ion-select interface="popover" :value="themeMode" @ionChange="changeTheme($event)" placeholder="Follow System">
            <ion-select-option value="system">System</ion-select-option>
            <ion-select-option value="light">Light</ion-select-option>
            <ion-select-option value="dark">Dark</ion-select-option>
          </ion-select>
        </ion-item>
        <ion-item-divider v-if="!searchText || 'fun gamification'.includes(searchText.toLowerCase())">
          <ion-label>Fun & Gamification</ion-label>
        </ion-item-divider>
        <ion-item v-if="!searchText || 'fun mode'.includes(searchText.toLowerCase())">
          <ion-label>Fun Mode</ion-label>
          <ion-toggle slot="end" :checked="funMode" @ionChange="toggleFunMode"></ion-toggle>
        </ion-item>
        <ion-item v-if="!searchText || 'sound effects'.includes(searchText.toLowerCase())">
          <ion-label>Sound Effects</ion-label>
          <ion-toggle slot="end" :checked="sound" @ionChange="toggleSound"></ion-toggle>
        </ion-item>
        <ion-item v-if="!searchText || 'reduced motion'.includes(searchText.toLowerCase())">
          <ion-label>Reduced Motion</ion-label>
          <ion-select interface="popover" :value="reducedMotionSetting" @ionChange="changeReducedMotion($event)" placeholder="Follow System">
            <ion-select-option value="system">Follow System</ion-select-option>
            <ion-select-option value="on">On</ion-select-option>
            <ion-select-option value="off">Off</ion-select-option>
          </ion-select>
        </ion-item>
      </ion-list>

      <ion-list class="ion-margin-top" v-if="!searchText || 'maintenance archive'.includes(searchText.toLowerCase())">
        <ion-item-divider>
          <ion-label>Maintenance</ion-label>
        </ion-item-divider>
        <ion-item lines="none">
          <ion-button expand="block" color="medium" @click="confirmArchive">
            Archive Completed Tasks
          </ion-button>
        </ion-item>
      </ion-list>

      <div class="ion-padding" v-if="!searchText || 'connect dropbox logout'.includes(searchText.toLowerCase())">
        <ion-button expand="block" @click="connect" :disabled="!clientId">Connect to Dropbox</ion-button>
        <ion-button expand="block" color="danger" @click="logout" v-if="isAuthenticated">Logout</ion-button>
      </div>

      <ion-text color="medium" class="ion-text-center">
        <p>
          You need to create a Dropbox App to get an App Key.
          <br>
          Redirect URI: <code>{{ computedRedirectUri }}</code>
        </p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonText, IonItemDivider, IonSelect, IonSelectOption, IonToggle, IonSearchbar, alertController, loadingController } from '@ionic/vue';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { dropboxService, todoService } from '../services';
import { gamificationService } from '../services';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';
import { getTheme, setTheme } from '../theme/theme';

const clientId = ref('');
const isAuthenticated = ref(false);
const searchText = ref('');
const themeMode = ref<'system' | 'light' | 'dark'>('system');
const funMode = computed(() => gamificationService.funMode.value);
const sound = computed(() => gamificationService.sound.value);
const reducedMotionSetting = computed(() => {
  const override = gamificationService.reducedMotionOverride.value;
  if (override === null) return 'system';
  return override ? 'on' : 'off';
});
const isSyncing = computed(() => todoService.isSyncing.value);
const lastSyncTime = computed(() => todoService.lastSyncTime.value);

// Compute redirect based on platform and current App Key
const computedRedirectUri = computed(() => {
  // Native must use db-<APP_KEY>://oauth2redirect
  if (Capacitor.isNativePlatform()) {
    const id = clientId.value?.trim();
    return id ? `db-${id}://oauth2redirect` : 'db-<app_key>://oauth2redirect';
  }
  // Web fallback
  return window.location.origin + '/auth';
});

let urlOpenHandle: PluginListenerHandle | null = null;

onMounted(() => {
  const storedId = localStorage.getItem('dropbox_client_id');
  if (storedId) clientId.value = storedId;
  isAuthenticated.value = dropboxService.isAuthenticated();

  // Initialize theme picker with current setting
  themeMode.value = getTheme();

  // Handle OAuth redirect on native: db-<APP_KEY>://oauth2redirect#access_token=...
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', async (data) => {
      try {
        const url = data?.url || '';
        // Ensure the URL looks like a Dropbox OAuth redirect to our app
        const lower = url.toLowerCase();
        if (!lower.startsWith('db-') || !lower.includes('://oauth2redirect')) return;
        // Let the service parse and persist the token
        const ok = await dropboxService.handleAuthCallbackFromUrl(url);
        if (ok) {
          await Browser.close();
          isAuthenticated.value = true;
        }
      } catch (e) {
        // noop: you may log if desired
      }
    }).then(handle => { urlOpenHandle = handle; });
  }
});

onBeforeUnmount(() => {
  urlOpenHandle?.remove?.();
});

const changeTheme = (event: any) => {
  const value = event.detail.value as 'system' | 'light' | 'dark';
  themeMode.value = value;
  setTheme(value);
};

const toggleFunMode = (event: any) => {
  gamificationService.setFunMode(!!event.detail.checked);
};

const toggleSound = (event: any) => {
  gamificationService.setSound(!!event.detail.checked);
};

const changeReducedMotion = (event: any) => {
  const value = event.detail.value;
  if (value === 'system') gamificationService.setReducedMotion(null);
  else if (value === 'on') gamificationService.setReducedMotion(true);
  else gamificationService.setReducedMotion(false);
};

const connect = async () => {
  if (!clientId.value) return;
  localStorage.setItem('dropbox_client_id', clientId.value);

  // Update DropboxService redirect based on current clientId before building URL
  // Note: Service was constructed with initial app key; for different keys, a new instance would be needed.
  // Here we assume the configured key matches the app build. We still delegate URL building to the service.
  const authUrl = await dropboxService.getAuthenticationUrl();

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url: authUrl });
  } else {
    window.location.href = authUrl;
  }
};

const logout = () => {
  dropboxService.logout();
  isAuthenticated.value = false;
};

const formatSyncTime = (isoString: string | null): string => {
  if (!isoString) return 'Never';
  const date = new Date(isoString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const handleSearch = (event: any) => {
  searchText.value = event.detail.value || '';
};

const confirmArchive = async () => {
  const alert = await alertController.create({
    header: 'Archive Completed?',
    message: 'This will move all completed todos to done.txt. This cannot be undone from the app.',
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Archive',
        role: 'confirm',
        handler: async () => {
          const loading = await loadingController.create({
            message: 'Archiving completed tasks…',
            spinner: 'crescent',
          });
          await loading.present();
          try {
            await todoService.archiveCompletedTodos();
          } finally {
            await loading.dismiss();
          }
        }
      }
    ]
  });
  await alert.present();
};
</script>
