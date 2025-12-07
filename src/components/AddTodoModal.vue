<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>New Todo</ion-title>
      <ion-buttons slot="end">
        <ion-button @click="cancel">Cancel</ion-button>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>

  <ion-content class="ion-padding">
    <ion-item>
      <ion-label position="stacked">Task</ion-label>
      <ion-input v-model="text" placeholder="What needs to be done?"></ion-input>
    </ion-item>

    <ion-item>
      <ion-label>Priority</ion-label>
      <ion-select v-model="priority" interface="popover">
        <ion-select-option value="">None</ion-select-option>
        <ion-select-option value="A">High (A)</ion-select-option>
        <ion-select-option value="B">Medium (B)</ion-select-option>
        <ion-select-option value="C">Low (C)</ion-select-option>
        <ion-select-option value="D">Optional (D)</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item>
      <ion-label>Category</ion-label>
      <ion-select v-model="category" interface="popover">
        <ion-select-option value="">None</ion-select-option>
        <ion-select-option value="Reminder">Reminder</ion-select-option>
        <ion-select-option value="Do">Do</ion-select-option>
        <ion-select-option value="Long Task">Long Task</ion-select-option>
      </ion-select>
    </ion-item>

    <ion-item id="open-date-modal">
      <ion-label>Due Date</ion-label>
      <ion-text slot="end">{{ dueDate || 'None' }}</ion-text>
      <ion-icon :icon="calendarOutline" slot="end"></ion-icon>
    </ion-item>

    <ion-modal trigger="open-date-modal" :keep-contents-mounted="true">
      <ion-content>
        <ion-datetime
          presentation="date"
          v-model="dueDate"
          :show-default-buttons="true"
          @ionChange="onDateChange"
        ></ion-datetime>
      </ion-content>
    </ion-modal>

    <div class="ion-padding-top">
      <ion-button expand="block" @click="save" :disabled="!text">Add Task</ion-button>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonModal, IonDatetime, IonText, IonIcon, modalController } from '@ionic/vue';
import { calendarOutline } from 'ionicons/icons';
import { ref } from 'vue';

const text = ref('');
const priority = ref('');
const category = ref('');
const dueDate = ref('');

const cancel = () => {
  modalController.dismiss(null, 'cancel');
};

const save = () => {
  // Construct the todo string
  let todoString = '';

  if (priority.value) {
      todoString += `(${priority.value}) `;
  }

  todoString += text.value;

  if (dueDate.value) {
      // IonDatetime returns ISO string (YYYY-MM-DDTHH:mm:ss...), we just need YYYY-MM-DD
      const datePart = dueDate.value.split('T')[0];
      todoString += ` due:${datePart}`;
  }

  if (category.value) {
      todoString += ` cat:${category.value}`;
  }

  modalController.dismiss(todoString, 'confirm');
};

const onDateChange = (ev: any) => {
    // Optional: handle date change if needed, but v-model handles it
};
</script>
