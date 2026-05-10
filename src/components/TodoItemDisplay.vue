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
      <p class="todo-note" v-if="todo.note">
        {{ todo.note }}
      </p>
      <div class="todo-meta" v-if="todo.priority || todo.category || todo.dueDate || todo.timeSpent">
        <div class="meta-row">
          <ion-badge
            v-if="todo.priority"
            :color="getPriorityColor(todo.priority)"
            class="priority-badge"
          >{{ todo.priority }}</ion-badge>
          
          <span class="meta-item" v-if="todo.category">
            <ion-icon
              :icon="getCategoryIcon(todo.category)"
              :color="getCategoryColor(todo.category)"
              size="small"
            />
            <span class="meta-text">{{ todo.category }}</span>
          </span>

          <span class="meta-item" v-if="todo.dueDate">
            <ion-icon :icon="calendarOutline" size="small" />
            <span class="meta-text" :class="{ 'overdue-text': isOverdue(todo.dueDate), 'today-text': isDueToday(todo.dueDate) }">
              {{ todo.dueDate }}
              <span v-if="isOverdue(todo.dueDate)">(Overdue)</span>
              <span v-else-if="isDueToday(todo.dueDate)">(Today)</span>
            </span>
          </span>

          <span class="meta-item" v-if="todo.timeSpent">
            <ion-icon :icon="timeOutline" size="small" />
            <span class="meta-text">{{ formatTimeSpent(todo.timeSpent) }}</span>
          </span>
        </div>
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
    case 'Reminders':
      return 'tertiary';
    case 'Quick':
      return 'primary';
    case 'Deep':
      return 'secondary';
    default:
      return 'medium';
  }
};

const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'Reminders':
      return calendarOutline;
    case 'Quick':
      return checkmarkDoneOutline;
    case 'Deep':
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

.todo-note {
  margin: 4px 0 0 0;
  font-size: 0.85rem;
  color: var(--ion-color-step-600, #666);
  white-space: pre-wrap;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.todo-meta {
  margin-top: 6px;
}

.meta-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 12px;
  align-items: center;
}

.meta-item {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: var(--ion-color-step-600);
  font-size: 0.75rem;
}

.meta-text {
  font-size: 0.75rem;
}

.overdue-text {
  color: var(--ion-color-danger);
  font-weight: 600;
}

.today-text {
  color: var(--ion-color-warning);
  font-weight: 600;
}

.priority-badge {
  font-size: 0.7rem;
  padding: 2px 6px;
  border-radius: 4px;
}
</style>

