<template>
  <ion-header :translucent="true">
    <ion-toolbar class="gradient-toolbar">
      <ion-buttons slot="start">
        <ion-menu-button id="btnOpenMenu" color="light" aria-label="Open Menu"></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ pageTitle }}</ion-title>
      <ion-buttons slot="end">
        <!-- Simple search input -->
        <ion-item class="search-item" lines="none">
          <ion-input
            v-model="searchTextProxy"
            placeholder="Search tasks..."
            clear-input
          ></ion-input>
        </ion-item>
        <span v-if="isAuthenticated && funMode" class="ag-tooltip" data-label="Daily streak">
          <ion-badge
            id="btnStreakInfo"
            color="tertiary"
            class="header-badge"
            aria-label="Streak, tap for info"
          >
            <ion-icon :icon="flameOutline" class="badge-icon"></ion-icon>
            {{ streak }}
          </ion-badge>
        </span>
        <span v-if="isAuthenticated && funMode" class="ag-tooltip" data-label="Points">
          <ion-badge
            id="btnPointsInfo"
            color="secondary"
            class="header-badge"
            aria-label="Points, tap for info"
          >
            <ion-icon :icon="starOutline" class="badge-icon"></ion-icon>
            {{ points }}
          </ion-badge>
        </span>
        <span class="ag-tooltip" :data-label="showCompleted ? 'Hide Completed' : 'Show Completed'">
          <ion-button id="btnToggleCompleted" @click="$emit('update:showCompleted', !showCompleted)" :aria-label="showCompleted ? 'Hide Completed' : 'Show Completed'">
            <ion-icon :icon="showCompleted ? eyeOutline : eyeOffOutline"></ion-icon>
          </ion-button>
        </span>

        <span
          class="ag-tooltip"
          v-if="isAuthenticated && (hasCurrentList || isFocusMode || isGlobalCategoryMode)"
          :data-label="sortMode === 'priority' ? 'Switch to Manual Sort' : 'Switch to Priority Sort'"
        >
          <ion-button
            id="btnSort"
            @click="$emit('toggle-sort-mode')"
            :color="'light'"
            :aria-label="sortMode === 'priority' ? 'Switch to Manual Sort' : 'Switch to Priority Sort'"
          >
            <ion-icon :icon="swapVerticalOutline"></ion-icon>
          </ion-button>
        </span>

        <span
          class="ag-tooltip"
          v-if="isAuthenticated && !isFocusMode && hasCurrentList"
          :data-label="'Rename List'"
        >
          <ion-button id="btnRenameList" @click="$emit('rename-list')" color="light" aria-label="Rename List">
            <ion-icon :icon="createOutline"></ion-icon>
          </ion-button>
        </span>

        <span
          class="ag-tooltip"
          v-if="isAuthenticated && !isFocusMode && hasCurrentList"
          :data-label="'Delete List'"
        >
          <ion-button id="btnDeleteList" @click="$emit('delete-list')" color="light" aria-label="Delete List">
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-button>
        </span>
      </ion-buttons>
    </ion-toolbar>
  </ion-header>
</template>

<script setup lang="ts">
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonButton,
  IonMenuButton,
  IonTitle,
  IonItem,
  IonInput,
  IonBadge,
  IonIcon,
} from '@ionic/vue';
import {
  flameOutline,
  starOutline,
  eyeOutline,
  eyeOffOutline,
  swapVerticalOutline,
  createOutline,
  trashOutline,
} from 'ionicons/icons';
import { computed } from 'vue';

const props = defineProps<{
  pageTitle: string;
  isAuthenticated: boolean;
  funMode: boolean;
  streak: number;
  points: number;
  showCompleted: boolean;
  sortMode: 'manual' | 'priority';
  hasCurrentList: boolean;
  isFocusMode: boolean;
  isGlobalCategoryMode: boolean;
  searchText: string;
}>();

const emit = defineEmits<{
  (e: 'update:searchText', value: string): void;
  (e: 'update:showCompleted', value: boolean): void;
  (e: 'toggle-sort-mode'): void;
  (e: 'rename-list'): void;
  (e: 'delete-list'): void;
}>();

const searchTextProxy = computed({
  get: () => props.searchText,
  set: (val: string) => emit('update:searchText', val ?? ''),
});
</script>

