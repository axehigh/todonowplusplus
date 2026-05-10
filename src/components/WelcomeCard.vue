<template>
  <div class="ion-padding welcome-container">
    <ion-card class="welcome-card">
      <div class="welcome-icon-container">
        <ion-icon :icon="cloudOfflineOutline" class="welcome-icon"></ion-icon>
      </div>
      <ion-card-header>
        <ion-card-title class="welcome-title">Welcome to Todo++</ion-card-title>
        <ion-card-subtitle>Cloud Sync Required</ion-card-subtitle>
      </ion-card-header>
      <ion-card-content>
        <p class="welcome-text">
          Connect your Dropbox account to sync your tasks across devices and keep them safe in the cloud.
        </p>
        <ion-button
          expand="block"
          router-link="/settings"
          class="ion-margin-top action-button"
          color="primary"
          shape="round"
        >
          <ion-icon slot="start" :icon="settingsOutline"></ion-icon>
          Go to Settings
        </ion-button>
      </ion-card-content>
    </ion-card>
  </div>
</template>

<script setup lang="ts">
import { IonCard, IonCardHeader, IonCardTitle, IonCardSubtitle, IonCardContent, IonButton, IonIcon } from '@ionic/vue';
import { cloudOfflineOutline, settingsOutline } from 'ionicons/icons';
</script>

<style scoped>
.welcome-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
}

.welcome-card {
  max-width: 400px;
  width: 100%;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  text-align: center;
  padding: 10px;
}

.welcome-icon-container {
  background: linear-gradient(135deg, var(--ion-color-primary-tint) 0%, var(--ion-color-primary) 100%);
  width: 80px;
  height: 80px;
  margin: 20px auto 10px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 15px rgba(98, 0, 234, 0.3);
}

.welcome-icon {
  font-size: 40px;
  color: white;
}

.welcome-title {
  font-weight: 700;
  font-size: 1.5rem;
  color: var(--ion-color-step-900);
}

.welcome-text {
  font-size: 1rem;
  line-height: 1.5;
  color: var(--ion-color-step-600);
  margin-bottom: 20px;
}

.action-button {
  --box-shadow: 0 4px 12px rgba(98, 0, 234, 0.2);
  font-weight: 600;
  height: 48px;
}
</style>

