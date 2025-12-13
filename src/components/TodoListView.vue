<template>
  <ion-list v-if="hasList" lines="full" class="todo-list">
    <!-- Quick Add Input -->
    <ion-item v-if="quickAddEnabled" class="quick-add-item">
      <ion-input
        v-model="quickAddTextProxy"
        placeholder="Add a task..."
        @keyup.enter.prevent="onQuickAdd"
        :clear-input="true"
      ></ion-input>
      <ion-button
        slot="end"
        fill="clear"
        @click="onQuickAdd"
        :disabled="!quickAddTextProxy"
      >
        <ion-icon :icon="addCircleOutline"></ion-icon>
      </ion-button>
    </ion-item>

    <ion-reorder-group
      :disabled="isFocusMode || isGlobalCategoryMode || !showCompleted || sortMode === 'priority'"
      @ionItemReorder="onReorder($event)"
    >
      <ion-item-sliding v-for="(todo, index) in items" :key="todo.raw">
        <TodoItemDisplay
          :todo="todo"
          @toggle="$emit('toggle-todo', { todo, index })"
          @edit="$emit('edit-todo', { todo, index })"
        />
        <ion-item-options side="start">
          <ion-item-option
            color="success"
            @click="$emit('toggle-todo', { todo, index })"
          >
            <ion-icon :icon="checkmarkDoneCircleOutline"></ion-icon>
          </ion-item-option>
        </ion-item-options>
        <ion-item-options side="end">
          <ion-item-option
            color="tertiary"
            :disabled="listsCount <= 1"
            @click="$emit('move-todo', { todo, index })"
          >
            <ion-icon :icon="swapVerticalOutline"></ion-icon>
          </ion-item-option>
          <ion-item-option
            color="danger"
            @click="$emit('delete-todo', { todo, index })"
          >
            <ion-icon :icon="trashOutline"></ion-icon>
          </ion-item-option>
        </ion-item-options>
      </ion-item-sliding>
    </ion-reorder-group>

    <div v-if="items.length === 0" class="ion-padding ion-text-center empty-state">
      <ion-icon :icon="checkmarkDoneCircleOutline" size="large" color="success"></ion-icon>
      <ion-text color="medium">
        <p v-if="isFocusMode">No urgent tasks!</p>
        <p v-else>All caught up!</p>
      </ion-text>
    </div>
  </ion-list>
</template>

<script setup lang="ts">
import {
  IonList,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonReorderGroup,
  IonItemSliding,
  IonItemOptions,
  IonItemOption,
  IonText,
} from '@ionic/vue';
import {
  addCircleOutline,
  checkmarkDoneCircleOutline,
  swapVerticalOutline,
  trashOutline,
} from 'ionicons/icons';
import TodoItemDisplay from './TodoItemDisplay.vue';
import type { TodoItem } from '../services/TodoService';
import { computed } from 'vue';

const props = defineProps<{
  items: TodoItem[];
  listsCount: number;
  isFocusMode: boolean;
  isGlobalCategoryMode: boolean;
  showCompleted: boolean;
  sortMode: 'manual' | 'priority';
  quickAddEnabled: boolean;
  quickAddText: string;
  hasList: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:quickAddText', value: string): void;
  (e: 'quick-add'): void;
  (e: 'toggle-todo', payload: { todo: TodoItem; index: number }): void;
  (e: 'edit-todo', payload: { todo: TodoItem; index: number }): void;
  (e: 'move-todo', payload: { todo: TodoItem; index: number }): void;
  (e: 'delete-todo', payload: { todo: TodoItem; index: number }): void;
  (e: 'reorder', payload: { from: number; to: number }): void;
}>();

const quickAddTextProxy = computed({
  get: () => props.quickAddText,
  set: (val: string) => emit('update:quickAddText', val ?? ''),
});

const onQuickAdd = () => {
  if (!quickAddTextProxy.value.trim()) return;
  emit('quick-add');
};

const onReorder = (event: CustomEvent) => {
  const { from, to } = event.detail;
  event.detail.complete();
  emit('reorder', { from, to });
};
</script>

