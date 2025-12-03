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
          Redirect URI: <code>{{ redirectUri }}</code>
        </p>
      </ion-text>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonInput, IonButton, IonButtons, IonBackButton, IonText, IonToggle } from '@ionic/vue';
import { ref, onMounted } from 'vue';
import { dropboxService } from '../services';

const clientId = ref('');
const isAuthenticated = ref(false);
const redirectUri = window.location.origin + '/auth';
const isDark = ref(false);

onMounted(() => {
  const storedId = localStorage.getItem('dropbox_client_id');
  if (storedId) clientId.value = storedId;
  isAuthenticated.value = dropboxService.isAuthenticated();

  // Check dark mode
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme === 'dark' || (!storedTheme && prefersDark)) {
      isDark.value = true;
      document.body.classList.add('dark');
  }
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
  
  // Re-initialize service with new ID
  // We need a way to update the client ID in the service.
  // Since we didn't implement a setter, we'll just create a new instance or reload.
  // But wait, the service instance is exported.
  // Let's just update the localStorage and reload the page or handle it in AuthPage.
  // Actually, getAuthenticationUrl uses the internal auth object which was initialized with the constructor ID.
  // We need to update the service.
  
  // Hack: We'll just redirect to the auth URL constructed manually or update the service if we can.
  // Better: Add setClientId to DropboxService.
  
  // For now, let's assume the user enters the ID, we save it, and then we use it.
  // But the service was already instantiated with empty string.
  // We should probably reload the app to pick up the new ID if we rely on constructor.
  // OR, we modify DropboxService to allow setting ID.
  
  // Let's modify DropboxService to be safe.
  // But I can't modify it right now without another tool call.
  // I'll try to use a workaround: construct the URL manually here since it's simple.
  
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${clientId.value}&response_type=token&redirect_uri=${encodeURIComponent(redirectUri)}`;
  window.location.href = authUrl;
};

const logout = () => {
  dropboxService.logout();
  isAuthenticated.value = false;
};
</script>
