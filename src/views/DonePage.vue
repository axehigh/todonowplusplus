<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar class="gradient-toolbar">
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" color="light"></ion-back-button>
        </ion-buttons>
        <ion-title>Done</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true" id="done-content">
      <ion-refresher slot="fixed" @ionRefresh="handleRefresh">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-padding" v-if="!isAuthenticated">
        <ion-card class="welcome-card">
          <ion-card-header>
            <ion-card-title>Connect Dropbox</ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <p>Please connect to Dropbox in Settings to view your archived tasks.</p>
            <ion-button expand="block" router-link="/settings" class="ion-margin-top" color="secondary">Go to Settings</ion-button>
          </ion-card-content>
        </ion-card>
      </div>

      <ion-list v-else lines="full">
        <ion-item v-for="(todo, idx) in sortedDone" :key="idx">
          <ion-label>
            <h2>
              <ion-badge v-if="todo.priority" :color="getPriorityColor(todo.priority)" class="priority-badge">{{ todo.priority }}</ion-badge>
              <ion-badge v-if="todo.category" :color="getCategoryColor(todo.category)" class="category-badge">{{ todo.category }}</ion-badge>
              {{ todo.text }}
            </h2>
            <p class="meta" v-if="todo.completedDate || todo.dueDate || todo.timeSpent">
              <span v-if="todo.completedDate">
                <ion-icon :icon="checkmarkDoneCircleOutline" size="small"></ion-icon>
                Completed: {{ todo.completedDate }}
              </span>
              <span v-if="todo.dueDate" class="ion-margin-start">
                <ion-icon :icon="calendarOutline" size="small"></ion-icon> Due: {{ todo.dueDate }}
              </span>
              <span v-if="todo.timeSpent" class="ion-margin-start">
                <ion-icon :icon="timeOutline" size="small"></ion-icon> {{ formatTimeSpent(todo.timeSpent) }}
              </span>
            </p>
          </ion-label>
        </ion-item>

        <div v-if="sortedDone.length === 0" class="ion-padding ion-text-center empty-state">
          <ion-icon :icon="checkmarkDoneCircleOutline" size="large" color="success"></ion-icon>
          <ion-text color="medium">
            <p>No archived tasks yet.</p>
          </ion-text>
        </div>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonLabel, IonButtons, IonBackButton, IonBadge, IonIcon, IonRefresher, IonRefresherContent, IonText, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, onIonViewWillEnter } from '@ionic/vue';
import { checkmarkDoneCircleOutline, calendarOutline, timeOutline } from 'ionicons/icons';
import { ref, computed } from 'vue';
import { todoService, dropboxService } from '../services';
import type { TodoItem } from '../services/TodoService';

const done = ref<TodoItem[]>([]);
const isAuthenticated = ref(false);

const load = async () => {
  isAuthenticated.value = dropboxService.isAuthenticated();
  if (!isAuthenticated.value) {
    done.value = [];
    return;
  }
  done.value = await todoService.loadDoneItems();
};

const sortedDone = computed(() => {
  // Sort by completedDate desc (newest first); items without date go last
  return [...done.value].sort((a, b) => {
    const da = a.completedDate || '';
    const db = b.completedDate || '';
    if (da && db) return db.localeCompare(da);
    if (da) return -1;
    if (db) return 1;
    return 0;
  });
});

function getPriorityColor(p?: string) {
  switch (p) {
    case 'A': return 'danger';
    case 'B': return 'warning';
    case 'C': return 'medium';
    case 'D': return 'tertiary';
    default: return 'medium';
  }
}

function getCategoryColor(cat?: string) {
  switch (cat) {
    case 'Reminder': return 'secondary';
    case 'Do': return 'success';
    case 'Long Task': return 'warning';
    default: return 'medium';
  }
}

function formatTimeSpent(minutes?: number) {
  if (!minutes || minutes <= 0) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

const handleRefresh = async (event: any) => {
  await load();
  event.target.complete();
};

// Load when page becomes active
onIonViewWillEnter(() => {
  load();
});
</script>

<style scoped>
.priority-badge {
  margin-right: 8px;
  vertical-align: middle;
}
.category-badge {
  margin-right: 8px;
  vertical-align: middle;
  font-size: 0.7em;
}
.meta {
  display: flex;
  align-items: center;
  gap: 8px;
}
</style>
