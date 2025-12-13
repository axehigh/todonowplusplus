<template>
  <ion-item>
    <ion-checkbox
      slot="start"
      :checked="todo.completed"
      @ionChange="onToggle"
      mode="ios"
    />
    <ion-label :class="{ 'completed-item': todo.completed }" @click="onEdit">
      <h2 class="todo-title">
        {{ todo.text }}
      </h2>
      <div class="todo-meta" v-if="todo.priority || todo.category || todo.dueDate || todo.timeSpent">
        <span class="meta-group">
          <ion-badge
            v-if="todo.priority"
            :color="getPriorityColor(todo.priority)"
            class="priority-badge"
          >{{ todo.priority }}</ion-badge>
          <ion-badge
            v-if="todo.category"
            :color="getCategoryColor(todo.category)"
            class="category-badge"
          >{{ todo.category }}</ion-badge>
          <ion-icon
            v-if="todo.category"
            :icon="getCategoryIcon(todo.category)"
            :color="getCategoryColor(todo.category)"
            size="small"
            class="category-icon"
          />
        </span>
        <span class="meta-group" v-if="todo.dueDate">
          <ion-icon :icon="calendarOutline" size="small" />
          <span class="meta-text">{{ todo.dueDate }}</span>
          <ion-text
            color="danger"
            v-if="isOverdue(todo.dueDate)"
            class="ion-margin-start meta-text"
          >(Overdue)</ion-text>
          <ion-text
            color="warning"
            v-if="isDueToday(todo.dueDate)"
            class="ion-margin-start meta-text"
          >(Today)</ion-text>
        </span>
        <span class="meta-group time-spent" v-if="todo.timeSpent">
          <ion-icon :icon="timeOutline" size="small" />
          <span class="meta-text">{{ formatTimeSpent(todo.timeSpent) }}</span>
        </span>
      </div>
    </ion-label>
    <ion-reorder slot="end" />
  </ion-item>
</template>

<script setup lang="ts">
import {
  IonItem,
  IonCheckbox,
  IonLabel,
  IonBadge,
  IonIcon,
  IonText,
  IonReorder,
} from '@ionic/vue';
import { calendarOutline, checkmarkDoneOutline, timeOutline } from 'ionicons/icons';
import type { TodoItem } from '../services/TodoService';
import { todoService } from '../services';

const props = defineProps<{
  todo: TodoItem;
}>();

const emit = defineEmits<{
  (e: 'toggle'): void;
  (e: 'edit'): void;
}>();

const onToggle = () => emit('toggle');
const onEdit = () => emit('edit');

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case 'A':
      return 'danger';
    case 'B':
      return 'warning';
    case 'C':
      return 'success';
    case 'D':
      return 'medium';
    default:
      return 'light';
  }
};

const getCategoryColor = (category?: string) => {
  switch (category) {
    case 'Reminder':
      return 'tertiary';
    case 'Do':
      return 'primary';
    case 'Long Task':
      return 'secondary';
    default:
      return 'medium';
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Reminder':
      return calendarOutline;
    case 'Do':
      return checkmarkDoneOutline;
    case 'Long Task':
      return timeOutline;
    default:
      return undefined as any;
  }
};

const formatTimeSpent = (minutes: number) => {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const isOverdue = (dateStr?: string) => todoService.isOverdue(dateStr);
const isDueToday = (dateStr?: string) => todoService.isDueToday(dateStr);
</script>

<style scoped>
.completed-item h2 {
  text-decoration: line-through;
  color: var(--ion-color-medium);
}

.todo-title {
  margin: 0;
  font-size: 1rem;
  line-height: 1.3;
}

.todo-meta {
  margin-top: 4px;
  display: flex;
  flex-wrap: wrap;
  gap: 6px 12px;
  align-items: center;
  font-size: 0.8rem;
}

.meta-group {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}

.meta-text {
  font-size: 0.8rem;
}

.priority-badge {
  margin-right: 4px;
}

.category-badge {
  margin-right: 4px;
}

.time-spent {
  margin-left: 0;
}

.category-icon {
  margin-right: 6px;
  vertical-align: middle;
}
</style>

