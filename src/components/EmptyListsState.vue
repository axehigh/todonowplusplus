<template>
  <div class="ion-padding ion-text-center empty-state-container">
    <div class="empty-icon-wrapper">
      <ion-icon :icon="listOutline" class="empty-icon"></ion-icon>
    </div>
    <ion-text color="medium">
      <h3 class="empty-title">Your workspace is empty</h3>
      <p class="empty-subtitle">Create your first list to start organizing your tasks.</p>
    </ion-text>
    <ion-button @click="$emit('create-list')" color="tertiary" shape="round" class="create-button">
      <ion-icon slot="start" :icon="addCircleOutline"></ion-icon>
      Create List
    </ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon, IonText, IonButton } from '@ionic/vue';
import { listOutline, addCircleOutline } from 'ionicons/icons';

const emit = defineEmits<{
  (e: 'create-list'): void;
}>();
</script>

<style scoped>
.empty-state-container {
  margin-top: 60px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.empty-icon-wrapper {
  background: color-mix(in oklab, var(--ion-color-tertiary) 15%, transparent);
  width: 100px;
  height: 100px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
}

.empty-icon {
  font-size: 50px;
  color: var(--ion-color-tertiary);
}

.empty-title {
  font-weight: 700;
  margin-bottom: 8px;
  color: var(--ion-color-step-800);
}

.empty-subtitle {
  max-width: 250px;
  margin: 0 auto 24px;
}

.create-button {
  font-weight: 600;
  height: 44px;
}
</style>

