<template>
  <ion-page>
    <ion-menu content-id="main-content">
      <ion-header>
        <ion-toolbar>
          <ion-title>Lists</ion-title>
          <ion-buttons slot="end">
             <ion-button @click="presentAddListAlert">
                <ion-icon :icon="add"></ion-icon>
             </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list>
          <ion-menu-toggle :auto-hide="false" v-for="(list, index) in lists" :key="index">
            <ion-item button @click="selectedListIndex = index" :color="selectedListIndex === index ? 'light' : ''">
              <ion-label>{{ list.name }}</ion-label>
            </ion-item>
          </ion-menu-toggle>
           <ion-item v-if="lists.length === 0">
            <ion-label color="medium" class="ion-text-center">No lists</ion-label>
          </ion-item>
        </ion-list>
      </ion-content>
    </ion-menu>

    <div class="ion-page" id="main-content">
      <ion-header :translucent="true">
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-menu-button></ion-menu-button>
          </ion-buttons>
          <ion-title>{{ currentList ? currentList.name : 'My Todos' }}</ion-title>
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
            <ion-title size="large">{{ currentList ? currentList.name : 'My Todos' }}</ion-title>
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

        <div v-else-if="lists.length === 0" class="ion-padding ion-text-center">
           <ion-text color="medium">
            <p>No lists found. Open the menu to create one!</p>
          </ion-text>
          <ion-button @click="presentAddListAlert">Create List</ion-button>
        </div>

        <ion-list v-else-if="currentList">
          <ion-item v-for="(todo, index) in currentList.items" :key="index">
            <ion-label>{{ todo }}</ion-label>
            <ion-checkbox slot="start" @update:modelValue="completeTodo(index)"></ion-checkbox>
          </ion-item>
          <ion-item v-if="currentList.items.length === 0">
              <ion-label class="ion-text-center" color="medium">No todos in this list. Add one!</ion-label>
          </ion-item>
        </ion-list>

        <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="isAuthenticated && lists.length > 0">
          <ion-fab-button @click="presentAlert">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonCheckbox, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonText, IonMenu, IonMenuButton, IonMenuToggle, alertController, onIonViewWillEnter } from '@ionic/vue';
import { settingsOutline, add } from 'ionicons/icons';
import { ref, computed } from 'vue';
import { todoService, dropboxService } from '../services';

const lists = todoService.lists;
const selectedListIndex = ref(0);
const isAuthenticated = ref(false);

const currentList = computed(() => lists.value[selectedListIndex.value]);

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
      await todoService.removeTodo(selectedListIndex.value, index);
  }, 200);
};

const presentAddListAlert = async () => {
  const alert = await alertController.create({
    header: 'New List',
    inputs: [
      {
        name: 'name',
        type: 'text',
        placeholder: 'List Name (e.g. Work)'
      }
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Create',
        handler: (data) => {
          if (data.name) {
            todoService.addList(data.name);
            // Switch to the new list (it will be at the end)
            setTimeout(() => {
                selectedListIndex.value = lists.value.length - 1;
            }, 100);
          }
        }
      }
    ]
  });

  await alert.present();
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
            todoService.addTodo(selectedListIndex.value, data.todo);
          }
        }
      }
    ]
  });

  await alert.present();
};
</script>
