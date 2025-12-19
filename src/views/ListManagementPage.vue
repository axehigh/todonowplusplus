<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button default-href="/home" />
        </ion-buttons>
        <ion-title>List Management</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-list>
        <ion-item-divider>
          <ion-label>Reorder & Rename Lists</ion-label>
        </ion-item-divider>

        <ion-reorder-group :disabled="lists.length <= 1" @ionItemReorder="handleReorder">
          <ion-item v-for="(list, index) in lists" :key="index">
            <ion-label>
              <div class="list-row">
                <span class="list-position">{{ index + 1 }}.</span>
                <ion-input
                  class="list-name-input"
                  v-model="list.name"
                  @ionBlur="() => handleRename(index, list.name)"
                />
              </div>
            </ion-label>
            <ion-badge slot="end" color="tertiary" v-if="list.items.length > 0">
              {{ list.items.filter(t => !t.completed).length }}
            </ion-badge>
            <ion-reorder slot="end" />
          </ion-item>
        </ion-reorder-group>

        <ion-item v-if="lists.length === 0">
          <ion-label color="medium" class="ion-text-center">No lists available</ion-label>
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonPage,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonList,
  IonItem,
  IonLabel,
  IonReorder,
  IonReorderGroup,
  IonItemDivider,
  IonBadge,
  IonInput,
} from '@ionic/vue';
import { todoService } from '../services';
import type { TodoList } from '../services/TodoService';

const lists = todoService.lists;

const handleReorder = (event: CustomEvent) => {
  const detail: any = event.detail;
  const from = detail.from as number;
  const to = detail.to as number;

  const arr = lists.value as TodoList[];
  if (from < 0 || from >= arr.length || to < 0 || to >= arr.length) {
    detail.complete();
    return;
  }

  const [moved] = arr.splice(from, 1);
  arr.splice(to, 0, moved);
  detail.complete();

  // Persist the new order in todo.txt via existing save logic
  (todoService as any).saveTodos?.();
};

const handleRename = async (index: number, newName: string) => {
  await todoService.renameList(index, newName ?? '');
};
</script>

<style scoped>
.list-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.list-position {
  min-width: 1.5em;
  text-align: right;
  font-variant-numeric: tabular-nums;
  color: var(--ion-color-medium);
}

.list-name-input {
  flex: 1;
}
</style>
