<template>
  <ion-header :translucent="true">
    <ion-toolbar class="gradient-toolbar">
      <ion-buttons slot="start">
        <ion-menu-button id="btnOpenMenu" color="light" aria-label="Open Menu"></ion-menu-button>
      </ion-buttons>
      <ion-title>{{ pageTitle }}</ion-title>
      <ion-buttons slot="end">
        <!-- Desktop/Tablet: full searchbar -->
        <ion-searchbar
          class="searchbar-modern toolbar-only-wide"
          v-model="searchTextProxy"
          placeholder="Search tasks..."
          inputmode="search"
          :debounce="150"
          show-clear-button="always"
          shape="round"
          animated
          aria-label="Search tasks"
        />

        <!-- Desktop: quick filters inline in toolbar -->
        <div
          v-if="isAuthenticated"
          class="toolbar-quick-filters toolbar-only-wide"
          aria-label="Quick filters"
        >
          <button
            class="quick-filter-chip"
            :class="{ 'quick-filter-chip--active': isGlobalCategoryMode && categoryFilter === 'Reminders' }"
            type="button"
            @click="() => onSelectCategory('Reminders')"
          >
            <ion-icon :icon="alarmOutline" class="quick-filter-icon" />
            <span>Reminders</span>
          </button>
          <button
            class="quick-filter-chip"
            :class="{ 'quick-filter-chip--active': isGlobalCategoryMode && categoryFilter === 'Quick' }"
            type="button"
            @click="() => onSelectCategory('Quick')"
          >
            <ion-icon :icon="checkmarkDoneOutline" class="quick-filter-icon" />
            <span>Quick</span>
          </button>
          <button
            class="quick-filter-chip"
            :class="{ 'quick-filter-chip--active': isGlobalCategoryMode && categoryFilter === 'Deep' }"
            type="button"
            @click="() => onSelectCategory('Deep')"
          >
            <ion-icon :icon="timeOutline" class="quick-filter-icon" />
            <span>Deep</span>
          </button>
        </div>

        <!-- Mobile: toolbar search button that opens the bottom sheet -->
        <span class="mobile-only ag-tooltip" data-label="Search">
          <ion-button id="btnOpenSearch" aria-label="Open search" @click="$emit('open-search')">
            <ion-icon :icon="searchOutline"></ion-icon>
          </ion-button>
        </span>
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
  searchOutline,
  alarmOutline,
  checkmarkDoneOutline,
  timeOutline,
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
  categoryFilter: 'All' | 'Reminders' | 'Quick' | 'Deep';
  searchText: string;
}>();

const emit = defineEmits<{
  (e: 'update:searchText', value: string): void;
  (e: 'update:showCompleted', value: boolean): void;
  (e: 'toggle-sort-mode'): void;
  (e: 'open-search'): void;
  (e: 'select-category', value: 'Reminders' | 'Quick' | 'Deep'): void;
}>();

const searchTextProxy = computed({
  get: () => props.searchText,
  set: (val: string) => emit('update:searchText', val ?? ''),
});

const onSelectCategory = (value: 'Reminders' | 'Quick' | 'Deep') => {
  emit('select-category', value);
};
</script>

<style scoped>
/* Modern, pill-shaped search bar that respects Ionic theming */
.searchbar-modern {
  /* Sizing within toolbar */
  margin-right: 12px;
  width: clamp(160px, 28vw, 320px);
  --border-radius: 9999px; /* keep pill shape for internal container */
  --padding-top: 0;
  --padding-bottom: 0;
  /* Default (light theme): keep subtle placeholder/icon */
  --icon-color: var(--ion-color-medium);
  --placeholder-color: var(--ion-color-medium);
  --color: var(--ion-text-color, inherit);
  /* IMPORTANT: make the host background transparent to avoid square block */
  --background: transparent;
}

.toolbar-quick-filters {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-right: 8px;
}

/* Quick filter chips for desktop toolbar */
.quick-filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 999px;
  border: 1px solid color-mix(in oklab, var(--ion-background-color, #ffffff) 55%, var(--ion-text-color, #000000) 45%);
  background: color-mix(in oklab, var(--ion-background-color, #ffffff) 80%, var(--ion-text-color, #000000) 20%);
  color: var(--ion-text-color, inherit);
  font-size: 0.75rem;
  cursor: pointer;
}

.quick-filter-chip--active {
  border-color: var(--ion-color-primary);
  background: color-mix(in oklab, var(--ion-color-primary) 85%, transparent);
  color: var(--ion-color-primary-contrast, #ffffff);
}

.quick-filter-icon {
  font-size: 0.9rem;
}

@media (max-width: 480px) {
  .toolbar-only-wide { display: none; }
}

/* Tighten the inner input height and style the actual pill container */
.searchbar-modern .searchbar-input-container {
  height: 36px;
  border-radius: 9999px;
  overflow: hidden; /* ensure any inner effects are clipped to the pill */
  /* Theme-aware subtle surface with good contrast in both themes */
  background: color-mix(in oklab, var(--ion-background-color, #fff) 82%, var(--ion-text-color, #000) 18%);
  border: 1px solid color-mix(in oklab, var(--ion-background-color, #fff) 62%, var(--ion-text-color, #000) 38%);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
}

/* Focus ring for accessibility and modern feel */
.searchbar-modern:focus-within .searchbar-input-container {
  box-shadow: 0 0 0 2px color-mix(in oklab, var(--ion-color-primary, #3880ff) 30%, transparent), 0 3px 10px rgba(0, 0, 0, 0.08);
  border-color: color-mix(in oklab, var(--ion-color-primary, #3880ff) 40%, var(--ion-text-color, #000) 60%);
}

/* Dark theme: increase contrast for text and icons inside the searchbar */
html.dark .searchbar-modern,
body.dark .searchbar-modern,
:root.dark .searchbar-modern,
.dark .searchbar-modern {
  /* Bright text for input value */
  --color: rgba(255, 255, 255, 0.98);
  /* Make the magnifier icon clearly visible */
  --icon-color: rgba(255, 255, 255, 0.92);
  /* Placeholder still slightly dimmer than text, but readable */
  --placeholder-color: rgba(255, 255, 255, 0.78);
  /* Ensure the clear (×) button is visible too */
  --clear-button-color: rgba(255, 255, 255, 0.92);
}

.mobile-only { display: none; }
@media (max-width: 480px) {
  .mobile-only { display: inline-flex; align-items: center; }
}
</style>
