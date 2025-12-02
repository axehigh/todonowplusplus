<template>
  <ion-page>
    <ion-content class="ion-padding ion-text-center">
      <ion-spinner></ion-spinner>
      <p>Authenticating...</p>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonContent, IonSpinner } from '@ionic/vue';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { dropboxService } from '../services';

const router = useRouter();

onMounted(() => {
  if (window.location.hash) {
    const success = dropboxService.handleAuthCallback(window.location.hash);
    if (success) {
      router.replace('/home');
    } else {
      alert('Authentication failed');
      router.replace('/settings');
    }
  } else {
    router.replace('/settings');
  }
});
</script>
