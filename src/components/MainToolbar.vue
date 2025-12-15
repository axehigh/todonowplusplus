<template>
  <ion-header :translucent="true">
    <ion-toolbar class="gradient-toolbar">
      <ion-buttons slot="start">
        <ion-menu-button id="btnOpenMenu" color="light" aria-label="Open Menu"></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ pageTitle }}</ion-title>
      <ion-buttons slot="end">
        <!-- Modern search bar -->
        <ion-searchbar
          class="searchbar-modern"
          v-model="searchTextProxy"
          placeholder="Search tasks..."
          inputmode="search"
          :debounce="150"
          show-clear-button="always"
          shape="round"
          animated
          aria-label="Search tasks"
        />
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


  IonSearchbar,
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

<style scoped>
/* Modern, pill-shaped search bar that respects Ionic theming */
.searchbar-modern {
  /* Sizing within toolbar */
  margin-right: 12px;
  width: clamp(160px, 28vw, 320px);
  --border-radius: 9999px;
  --padding-top: 0;
  --padding-bottom: 0;
  --box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  --icon-color: var(--ion-color-medium);
  --placeholder-color: var(--ion-color-medium);
  --color: var(--ion-text-color, inherit);
  /* Subtle glassy background using theme-aware colors */
  --background: color-mix(in oklab, var(--ion-color-light) 70%, transparent);
  backdrop-filter: saturate(180%) blur(8px);
}

@media (max-width: 480px) {
  .searchbar-modern { width: 46vw; }
}

/* Tighten the inner input height a bit for header */
.searchbar-modern .searchbar-input-container {
  height: 36px;
}
</style>

