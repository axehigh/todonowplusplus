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
      <ion-list>
        <ion-item>
          <ion-label position="stacked">Dropbox App Key</ion-label>
          <ion-input v-model="clientId" placeholder="Enter your App Key"></ion-input>
        </ion-item>
        <ion-item>
            <ion-label>Dark Mode</ion-label>
            <ion-toggle slot="end" :checked="isDark" @ionChange="toggleDarkMode"></ion-toggle>
        </ion-item>
      </ion-list>

      <div class="ion-padding">
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
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonText, IonToggle } from '@ionic/vue';
import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
import { dropboxService } from '../services';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';
import type { PluginListenerHandle } from '@capacitor/core';

const clientId = ref('');
const isAuthenticated = ref(false);
const isDark = ref(false);

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

  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      isDark.value = true;
      document.body.classList.add('dark');
  }

  // Handle OAuth redirect on native: db-<APP_KEY>://oauth2redirect#access_token=...
  if (Capacitor.isNativePlatform()) {
    App.addListener('appUrlOpen', async (data) => {
      try {
        const url = data?.url || '';
        // Ensure the URL starts with our scheme
        const expectedPrefix = `db-${clientId.value}://oauth2redirect`;
        if (!url.toLowerCase().startsWith(expectedPrefix.toLowerCase())) {
          return;
        }
        // Let the service parse and persist the token
        const ok = dropboxService.handleAuthCallbackFromUrl(url);
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

const toggleDarkMode = (event: any) => {
    isDark.value = event.detail.checked;
    if (isDark.value) {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
};

const connect = async () => {
  if (!clientId.value) return;
  localStorage.setItem('dropbox_client_id', clientId.value);

  const redirectUri = computedRedirectUri.value;
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${encodeURIComponent(clientId.value)}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;

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
</script>
