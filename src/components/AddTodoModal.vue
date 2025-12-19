<template>
  <ion-header>
    <ion-toolbar>
      <ion-title>{{ isEdit ? 'Edit Todo' : 'New Todo' }}</ion-title>
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

    <!-- List selector (only in edit mode and when there are multiple lists) -->
    <ion-item v-if="isEdit && listNames.length > 1">
      <ion-label>List</ion-label>
      <ion-select v-model.number="selectedListIndex" interface="popover">
        <ion-select-option v-for="(name, idx) in listNames" :key="idx" :value="idx">{{ name }}</ion-select-option>
      </ion-select>
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
        <ion-select-option value="Quick">
          Quick
        </ion-select-option>
        <ion-select-option value="Deep">
          Deep
        </ion-select-option>
        <ion-select-option value="Reminders">
          Reminders
        </ion-select-option>
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

    <!-- Time Spent (only shown when editing) -->
    <ion-item v-if="isEdit">
      <ion-label position="stacked">Time Spent (minutes)</ion-label>
      <ion-input type="number" inputmode="numeric" v-model.number="timeSpentLocal" min="0" placeholder="e.g. 30"></ion-input>
    </ion-item>

    <div class="ion-padding-top">
      <ion-button expand="block" @click="save" :disabled="!text">{{ isEdit ? 'Save' : 'Add Task' }}</ion-button>
    </div>
  </ion-content>
</template>

<script setup lang="ts">
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonItem, IonLabel, IonInput, IonSelect, IonSelectOption, IonModal, IonDatetime, IonText, IonIcon, modalController } from '@ionic/vue';
import { calendarOutline } from 'ionicons/icons';
import { ref, computed } from 'vue';

type Mode = 'add' | 'edit';

const props = defineProps<{
  mode?: Mode;
  initialText?: string;
  initialPriority?: string;
  initialCategory?: string;
  initialDueDate?: string; // YYYY-MM-DD
  initialTimeSpent?: number; // minutes
  listNames?: string[];
  initialListIndex?: number;
}>();

const isEdit = computed(() => (props.mode || 'add') === 'edit');

const text = ref(props.initialText || '');
const priority = ref(props.initialPriority || '');
const category = ref(props.initialCategory || '');
const dueDate = ref(props.initialDueDate || '');
const timeSpentLocal = ref<number | undefined>(props.initialTimeSpent);
const listNames = computed(() => props.listNames ?? []);
const selectedListIndex = ref<number>(typeof props.initialListIndex === 'number' ? props.initialListIndex : 0);

const cancel = () => {
  modalController.dismiss(null, 'cancel');
};

const save = () => {
  if (!isEdit.value) {
    // Construct the todo string for adding
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
  } else {
    // Return structured updates for editing
    const updates: any = {
      text: text.value,
      priority: priority.value || '',
      category: category.value || '',
    };

    if (dueDate.value) {
      const datePart = dueDate.value.includes('T') ? dueDate.value.split('T')[0] : dueDate.value;
      updates.dueDate = datePart;
    } else {
      updates.dueDate = '';
    }

    if (typeof timeSpentLocal.value === 'number' && timeSpentLocal.value >= 0) {
      updates.timeSpent = timeSpentLocal.value;
    }

    // Always include destination list index so caller can decide whether to move
    updates.moveToListIndex = selectedListIndex.value;

    modalController.dismiss(updates, 'confirm');
  }
};

const onDateChange = () => {
    // Optional: handle date change if needed, but v-model handles it
};
</script>

<style scoped>
/* Removed category-option* styles since we no longer render a custom layout inside ion-select-option */
</style>
