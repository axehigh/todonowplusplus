<template>
  <div class="ion-padding">
    <ion-card class="welcome-card">
      <ion-card-header>
        <ion-card-title>Welcome to Todo App</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <p>Please connect to Dropbox in Settings to manage your todos.</p>
        <ion-button
          expand="block"
          router-link="/settings"
          class="ion-margin-top"
          color="secondary"
        >
          Go to Settings
        </ion-button>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/vue';
</script>

