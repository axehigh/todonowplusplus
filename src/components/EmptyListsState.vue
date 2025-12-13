<template>
  <div class="ion-padding ion-text-center empty-state">
    <ion-icon :icon="documentsOutline" size="large" color="medium"></ion-icon>
    <ion-text color="medium">
      <h3>No lists found</h3>
      <p>Open the menu to create one!</p>
    </ion-text>
    <ion-button @click="$emit('create-list')" color="tertiary">Create List</ion-button>
  </div>
</template>

<script setup lang="ts">
import { IonIcon, IonText, IonButton } from '@ionic/vue';
import { documentsOutline } from 'ionicons/icons';

const emit = defineEmits<{
  (e: 'create-list'): void;
}>();
</script>

