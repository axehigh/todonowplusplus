<template>
  <ion-modal
    :is-open="isOpen"
    @willDismiss="onWillDismiss"
    @didPresent="onDidPresent"
    :breakpoints="[0, 0.4, 0.6, 1]"
    :initial-breakpoint="initialBreakpoint"
    handle-behavior="cycle"
    class="search-sheet"
    aria-label="Search tasks dialog"
  >
    <div class="sheet-content">
      <ion-header class="sheet-header">
        <ion-toolbar>
          <ion-title>Search</ion-title>
          <ion-buttons slot="end">
            <ion-button fill="clear" size="small" @click="clearAndClose" aria-label="Clear search">
              Clear
            </ion-button>
            <ion-button aria-label="Close search" @click="close">
              Close
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content :fullscreen="false">
        <div class="searchbar-container">
          <ion-searchbar
            ref="searchRef"
            class="sheet-searchbar"
            v-model="searchTextProxy"
            placeholder="Search tasks..."
            inputmode="search"
            :debounce="120"
            show-clear-button="always"
            shape="round"
            animated
            aria-label="Search tasks"
          />
        </div>
      </ion-content>
    </div>
  </ion-modal>
</template>

<script setup lang="ts">
import {
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonButton,
  IonContent,
  IonSearchbar,
} from '@ionic/vue';
import { computed, nextTick, ref } from 'vue';

const props = defineProps<{
  isOpen: boolean;
  searchText: string;
  initialBreakpoint?: number;
}>();

const emit = defineEmits<{
  (e: 'update:isOpen', value: boolean): void;
  (e: 'update:searchText', value: string): void;
}>();

const searchTextProxy = computed({
  get: () => props.searchText,
  set: (val: string) => emit('update:searchText', val ?? ''),
});

const searchRef = ref<any>(null);

function focusInput() {
  try {
    const el = (searchRef.value as any)?.$el ?? searchRef.value;
    (el?.setFocus && el.setFocus()) || el?.querySelector?.('input')?.focus?.();
  } catch (e) {
    // eslint-disable-next-line no-console
    console.debug?.('Bottom sheet search focus failed (non-fatal):', e);
  }
}

function onDidPresent() {
  // Focus after the modal is fully presented
  nextTick(() => focusInput());
}

function onWillDismiss() {
  emit('update:isOpen', false);
}

function close() {
  emit('update:isOpen', false);
}

function clearAndClose() {
  emit('update:searchText', '');
  emit('update:isOpen', false);
}
</script>

<style scoped>
.search-sheet::part(content) {
  /* Rounded top corners for sheet */
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
  box-shadow: 0 -6px 24px rgba(0, 0, 0, 0.18);
  backdrop-filter: saturate(140%) blur(8px);
}

.sheet-content {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.searchbar-container {
  padding: 12px;
}

.sheet-searchbar {
  --border-radius: 9999px;
}
</style>
