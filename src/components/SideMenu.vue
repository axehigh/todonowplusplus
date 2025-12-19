<template>
  <ion-menu content-id="main-content">
    <ion-header>
      <ion-toolbar color="primary">
        <ion-title>Lists</ion-title>
        <ion-buttons slot="end">
          <ion-button @click="$emit('add-list')">
            <ion-icon :icon="addCircleOutline"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <!-- Mobile-only search field lives in the menu -->
      <div class="menu-search-container menu-search-container-mobile">
        <ion-searchbar
          class="menu-searchbar"
          v-model="searchTextProxy"
          placeholder="Search tasks..."
          inputmode="search"
          :debounce="150"
          show-clear-button="always"
          shape="round"
          animated
          aria-label="Search tasks"
        />
      </div>
      <ion-list lines="none">
        <ion-menu-toggle :auto-hide="false">
          <ion-item
            button
            @click="$emit('select-focus-mode')"
            :color="isFocusMode ? 'secondary' : ''"
            :detail="false"
            class="list-item"
          >
            <ion-icon slot="start" :icon="flashOutline"></ion-icon>
            <ion-label>Focus</ion-label>
          </ion-item>
        </ion-menu-toggle>

        <ion-item-divider>
          <ion-label>Lists</ion-label>
        </ion-item-divider>

        <!-- Static list display: no reordering here -->
        <ion-menu-toggle
          v-for="(list, index) in lists"
          :key="index"
          :auto-hide="false"
        >
          <ion-item
            button
            :detail="false"
            class="list-item"
            :color="!isFocusMode && !isGlobalCategoryMode && selectedListIndex === index ? 'secondary' : ''"
            @click="$emit('select-list', index)"
          >
            <ion-icon slot="start" :icon="listOutline"></ion-icon>
            <ion-label>{{ list.name }}</ion-label>

            <ion-badge
              slot="end"
              color="tertiary"
              v-if="list.items.length > 0"
            >
              {{ list.items.filter(value => !value.completed).length }}
            </ion-badge>
          </ion-item>
        </ion-menu-toggle>

        <ion-item v-if="lists.length === 0">
          <ion-label color="medium" class="ion-text-center">No lists</ion-label>
        </ion-item>

        <!-- Global Category Filters -->
        <ion-item-divider>
          <ion-label>Filters</ion-label>
        </ion-item-divider>

        <ion-menu-toggle :auto-hide="false">
          <ion-item
              button
              @click="$emit('select-global-category', 'All')"
              :color="isGlobalCategoryMode && categoryFilter === 'All' ? 'secondary' : ''"
              :detail="false"
              class="list-item"
          >
            <ion-icon slot="start" :icon="listOutline"></ion-icon>
            <ion-label>All Tasks</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle :auto-hide="false">
          <ion-item
              button
              @click="$emit('select-global-category', 'Reminder')"
              :color="isGlobalCategoryMode && categoryFilter === 'Reminder' ? 'secondary' : ''"
              :detail="false"
              class="list-item"
          >
            <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
            <ion-label>Reminder</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle :auto-hide="false">
          <ion-item
              button
              @click="$emit('select-global-category', 'Do')"
              :color="isGlobalCategoryMode && categoryFilter === 'Do' ? 'secondary' : ''"
              :detail="false"
              class="list-item"
          >
            <ion-icon slot="start" :icon="checkmarkDoneOutline"></ion-icon>
            <ion-label>Do</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle :auto-hide="false">
          <ion-item
              button
              @click="$emit('select-global-category', 'Long Task')"
              :color="isGlobalCategoryMode && categoryFilter === 'Long Task' ? 'secondary' : ''"
              :detail="false"
              class="list-item"
          >
            <ion-icon slot="start" :icon="timeOutline"></ion-icon>
            <ion-label>Long Task</ion-label>
          </ion-item>
        </ion-menu-toggle>

        <!--System-->
        <ion-item-divider class="ion-margin-top">
          <ion-label>System</ion-label>
        </ion-item-divider>
        <ion-menu-toggle :auto-hide="true" v-if="isAuthenticated">
          <ion-item button router-link="/done" :detail="false" class="list-item">
            <ion-icon slot="start" :icon="checkmarkDoneOutline"></ion-icon>
            <ion-label>Done</ion-label>
          </ion-item>
        </ion-menu-toggle>
        <ion-menu-toggle :auto-hide="true">
          <ion-item button router-link="/lists" :detail="false" class="list-item">
            <ion-icon slot="start" :icon="listOutline"></ion-icon>
            <ion-label>List Management</ion-label>
          </ion-item>
        </ion-menu-toggle>

        <!-- Settings-->
        <ion-item-divider class="ion-margin-top">
          <ion-label>Settings</ion-label>
        </ion-item-divider>
        <ion-menu-toggle :auto-hide="true">
          <ion-item button router-link="/settings" :detail="false" class="list-item">
            <ion-icon slot="start" :icon="settingsOutline"></ion-icon>
            <ion-label>Settings</ion-label>
          </ion-item>
        </ion-menu-toggle>
      </ion-list>
    </ion-content>
  </ion-menu>
</template>

<script setup lang="ts">
import {
  IonMenu,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonIcon,
  IonContent,
  IonList,
  IonMenuToggle,
  IonItem,
  IonLabel,
  IonBadge,
  IonItemDivider,
  IonSearchbar,
} from '@ionic/vue';
import {
  addCircleOutline,
  flashOutline,
  listOutline,
  alarmOutline,
  checkmarkDoneOutline,
  timeOutline,
  settingsOutline,
} from 'ionicons/icons';
import type { TodoList } from '../services/TodoService';
import { computed } from 'vue';

const props = defineProps<{
  lists: TodoList[];
  selectedListIndex: number;
  isFocusMode: boolean;
  isGlobalCategoryMode: boolean;
  categoryFilter: 'All' | 'Reminder' | 'Do' | 'Long Task';
  isAuthenticated: boolean;
  searchText?: string;
}>();

const emit = defineEmits<{
  (e: 'add-list'): void;
  (e: 'select-focus-mode'): void;
  (e: 'select-global-category', category: 'All' | 'Reminder' | 'Do' | 'Long Task'): void;
  (e: 'select-list', index: number): void;
  (e: 'update:searchText', value: string): void;
}>();

const searchTextProxy = computed({
  get: () => props.searchText ?? '',
  set: (val: string) => emit('update:searchText', val ?? ''),
});
</script>

<style scoped>
.menu-search-container {
  padding: 10px 12px 0 12px;
}
.menu-searchbar {
  --border-radius: 9999px;
}

/* Hide the side menu search on larger (desktop) viewports */
@media (min-width: 768px) {
  .menu-search-container-mobile {
    display: none;
  }
}
</style>
