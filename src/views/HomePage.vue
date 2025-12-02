<template>
  <ion-page>
    <ion-header :translucent="true">
      <ion-toolbar>
        <ion-title>My Todos</ion-title>
        <ion-buttons slot="end">
          <ion-button router-link="/settings">
            <ion-icon :icon="settingsOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content :fullscreen="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">My Todos</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="ion-padding" v-if="!isAuthenticated">
        <ion-text color="medium" class="ion-text-center">
          <p>Please connect to Dropbox in Settings to manage your todos.</p>
        </ion-text>
        <ion-button expand="block" router-link="/settings">Go to Settings</ion-button>
      </div>

      <ion-list v-else>
        <ion-item v-for="(todo, index) in todos" :key="index">
          <ion-label>{{ todo }}</ion-label>
          <ion-checkbox slot="start" @update:modelValue="completeTodo(index)"></ion-checkbox>
        </ion-item>
        <ion-item v-if="todos.length === 0">
            <ion-label class="ion-text-center" color="medium">No todos yet. Add one!</ion-label>
        </ion-item>
      </ion-list>

      <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="isAuthenticated">
        <ion-fab-button @click="presentAlert">
          <ion-icon :icon="add"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonCheckbox, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonText, alertController, onIonViewWillEnter } from '@ionic/vue';
import { settingsOutline, add } from 'ionicons/icons';
import { ref } from 'vue';
import { todoService, dropboxService } from '../services';

const todos = todoService.todos;
const isAuthenticated = ref(false);

const checkAuth = () => {
  isAuthenticated.value = dropboxService.isAuthenticated();
  if (isAuthenticated.value) {
    todoService.loadTodos();
  }
};

onIonViewWillEnter(() => {
  checkAuth();
});

const handleRefresh = async (event: any) => {
  await todoService.loadTodos();
  event.target.complete();
};

const completeTodo = async (index: number) => {
  // Add a small delay to show the animation before removing
  setTimeout(async () => {
      await todoService.removeTodo(index);
  }, 200);
};

const presentAlert = async () => {
  const alert = await alertController.create({
    header: 'New Todo',
    inputs: [
      {
        name: 'todo',
        type: 'text',
        placeholder: 'What needs to be done?'
      }
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Add',
        handler: (data) => {
          if (data.todo) {
            todoService.addTodo(data.todo);
          }
        }
      }
    ]
  });

  await alert.present();
};
</script>
