<template>
  <ion-page>
    <ion-menu content-id="main-content">
      <ion-header>
        <ion-toolbar color="primary">
          <ion-title>Lists</ion-title>
          <ion-buttons slot="end">
             <ion-button @click="presentAddListAlert">
                <ion-icon :icon="addCircleOutline"></ion-icon>
             </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content>
        <ion-list lines="none">
           <ion-menu-toggle :auto-hide="false">
             <ion-item button @click="selectFocusMode" :color="isFocusMode ? 'secondary' : ''" :detail="false" class="list-item">
               <ion-icon slot="start" :icon="flashOutline"></ion-icon>
               <ion-label>Focus</ion-label>
             </ion-item>
           </ion-menu-toggle>

           <ion-item-divider>
             <ion-label>Filters</ion-label>
           </ion-item-divider>

           <!-- Global Category Filters -->
           <ion-menu-toggle :auto-hide="false">
             <ion-item button @click="selectGlobalCategory('All')"
                       :color="isGlobalCategoryMode && categoryFilter === 'All' ? 'secondary' : ''"
                       :detail="false" class="list-item">
               <ion-icon slot="start" :icon="listOutline"></ion-icon>
               <ion-label>All Tasks</ion-label>
             </ion-item>
           </ion-menu-toggle>
           <ion-menu-toggle :auto-hide="false">
             <ion-item button @click="selectGlobalCategory('Reminder')"
                       :color="isGlobalCategoryMode && categoryFilter === 'Reminder' ? 'secondary' : ''"
                       :detail="false" class="list-item">
               <ion-icon slot="start" :icon="alarmOutline"></ion-icon>
               <ion-label>Reminder</ion-label>
             </ion-item>
           </ion-menu-toggle>
           <ion-menu-toggle :auto-hide="false">
             <ion-item button @click="selectGlobalCategory('Do')"
                       :color="isGlobalCategoryMode && categoryFilter === 'Do' ? 'secondary' : ''"
                       :detail="false" class="list-item">
               <ion-icon slot="start" :icon="checkmarkDoneOutline"></ion-icon>
               <ion-label>Do</ion-label>
             </ion-item>
           </ion-menu-toggle>
           <ion-menu-toggle :auto-hide="false">
             <ion-item button @click="selectGlobalCategory('Long Task')"
                       :color="isGlobalCategoryMode && categoryFilter === 'Long Task' ? 'secondary' : ''"
                       :detail="false" class="list-item">
               <ion-icon slot="start" :icon="timeOutline"></ion-icon>
               <ion-label>Long Task</ion-label>
             </ion-item>
           </ion-menu-toggle>

           <ion-item-divider>
             <ion-label>Lists</ion-label>
           </ion-item-divider>

           <ion-menu-toggle :auto-hide="false" v-for="(list, index) in lists" :key="index">
            <ion-item button @click="selectList(index)" :color="!isFocusMode && !isGlobalCategoryMode && selectedListIndex === index ? 'secondary' : ''" :detail="false" class="list-item">
              <ion-icon slot="start" :icon="listOutline"></ion-icon>
              <ion-label>{{ list.name }}</ion-label>
              <ion-badge slot="end" color="tertiary" v-if="list.items.length > 0">{{ list.items.length }}</ion-badge>
            </ion-item>
           </ion-menu-toggle>
            <ion-item v-if="lists.length === 0">
             <ion-label color="medium" class="ion-text-center">No lists</ion-label>
           </ion-item>

           <ion-item-divider class="ion-margin-top">
             <ion-label>Archive</ion-label>
           </ion-item-divider>
           <ion-menu-toggle :auto-hide="true" v-if="isAuthenticated">
             <ion-item button router-link="/done" :detail="false" class="list-item">
               <ion-icon slot="start" :icon="checkmarkDoneOutline"></ion-icon>
               <ion-label>Done</ion-label>
             </ion-item>
           </ion-menu-toggle>
         </ion-list>
      </ion-content>
    </ion-menu>

    <div class="ion-page" id="main-content">
      <ion-header :translucent="true">
        <ion-toolbar class="gradient-toolbar">
          <ion-buttons slot="start">
              <ion-menu-button id="btnOpenMenu" color="light" aria-label="Open Menu"></ion-menu-button>
          </ion-buttons>
          <ion-title>{{ pageTitle }}</ion-title>
          <ion-buttons slot="end">
            <ion-badge v-if="isAuthenticated && funMode" color="tertiary" class="header-badge" aria-label="Streak">
              <ion-icon :icon="flameOutline" class="badge-icon"></ion-icon>
              {{ streak }}
            </ion-badge>
            <ion-badge v-if="isAuthenticated && funMode" color="secondary" class="header-badge" aria-label="Points">
              <ion-icon :icon="starOutline" class="badge-icon"></ion-icon>
              {{ points }}
            </ion-badge>
            <span class="ag-tooltip" :data-label="showCompleted ? 'Hide Completed' : 'Show Completed'">
              <ion-button id="btnToggleCompleted" @click="showCompleted = !showCompleted" :aria-label="showCompleted ? 'Hide Completed' : 'Show Completed'">
                  <ion-icon :icon="showCompleted ? eyeOutline : eyeOffOutline"></ion-icon>
              </ion-button>
            </span>

            <span class="ag-tooltip" v-if="isAuthenticated && (currentList || isFocusMode || isGlobalCategoryMode)" :data-label="sortMode === 'priority' ? 'Switch to Manual Sort' : 'Switch to Priority Sort'">
              <ion-button id="btnSort" @click="toggleSortMode" :color="sortMode === 'priority' ? 'light' : 'light'" :aria-label="sortMode === 'priority' ? 'Switch to Manual Sort' : 'Switch to Priority Sort'">
                  <ion-icon :icon="swapVerticalOutline"></ion-icon>
              </ion-button>
            </span>

            <span class="ag-tooltip" v-if="isAuthenticated && !isFocusMode && currentList" :data-label="'Rename List'">
              <ion-button id="btnRenameList" @click="presentRenameListAlert" color="light" aria-label="Rename List">
                  <ion-icon :icon="createOutline"></ion-icon>
              </ion-button>
            </span>

            <span class="ag-tooltip" v-if="isAuthenticated && !isFocusMode && currentList" :data-label="'Delete List'">
              <ion-button id="btnDeleteList" @click="presentDeleteListAlert" color="light" aria-label="Delete List">
                  <ion-icon :icon="trashOutline"></ion-icon>
              </ion-button>
            </span>

            <span class="ag-tooltip" v-if="isAuthenticated" :data-label="'Archive Completed'">
              <ion-button id="btnArchive" @click="presentArchiveAlert" color="light" aria-label="Archive Completed">
                  <ion-icon :icon="archiveOutline"></ion-icon>
              </ion-button>
            </span>

            <span class="ag-tooltip" :data-label="'Settings'">
              <ion-button id="btnSettings" router-link="/settings" color="light" aria-label="Settings">
                <ion-icon :icon="settingsOutline"></ion-icon>
              </ion-button>
            </span>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content :fullscreen="true" class="ion-padding-top">
        <!-- Global loading indicator for Dropbox sync (non-refresher) -->
        <ion-loading :is-open="isLoading" message="Syncing with Dropbox..." spinner="crescent"></ion-loading>

        <ion-header collapse="condense">
          <ion-toolbar>
            <ion-title size="large">{{ pageTitle }}</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <div class="ion-padding" v-if="!isAuthenticated">
          <ion-card class="welcome-card">
            <ion-card-header>
              <ion-card-title>Welcome to Todo App</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <p>Please connect to Dropbox in Settings to manage your todos.</p>
              <ion-button expand="block" router-link="/settings" class="ion-margin-top" color="secondary">Go to Settings</ion-button>
            </ion-card-content>
          </ion-card>
        </div>

        <div v-else-if="lists.length === 0" class="ion-padding ion-text-center empty-state">
           <ion-icon :icon="documentsOutline" size="large" color="medium"></ion-icon>
           <ion-text color="medium">
            <h3>No lists found</h3>
            <p>Open the menu to create one!</p>
          </ion-text>
          <ion-button @click="presentAddListAlert" color="tertiary">Create List</ion-button>
        </div>

        <ion-list v-else-if="currentList || isFocusMode || isGlobalCategoryMode" lines="full" class="todo-list">
          <!-- Inline Quick Add Input moved to the top of the list -->
          <ion-item v-if="!isFocusMode && !isGlobalCategoryMode" class="quick-add-item">
            <ion-input
              v-model="quickAddText"
              placeholder="Add a task..."
              @keyup.enter="quickAddTodo"
              :clear-input="true"
            ></ion-input>
            <ion-button slot="end" fill="clear" @click="quickAddTodo" :disabled="!quickAddText">
              <ion-icon :icon="addCircleOutline"></ion-icon>
            </ion-button>
          </ion-item>

          <ion-reorder-group :disabled="isFocusMode || isGlobalCategoryMode || !showCompleted || sortMode === 'priority'" @ionItemReorder="handleReorder($event)">
            <ion-item-sliding v-for="(todo, index) in filteredItems" :key="todo.raw">
                <ion-item>
                <ion-checkbox slot="start" :checked="todo.completed" @ionChange="toggleTodoItem(todo, index)" mode="ios"></ion-checkbox>
                <ion-label :class="{ 'completed-item': todo.completed }" @click="presentEditTodoAlert(todo, index)">
                    <h2>
                        <ion-badge v-if="todo.priority" :color="getPriorityColor(todo.priority)" class="priority-badge">{{ todo.priority }}</ion-badge>
                        <ion-badge v-if="todo.category" :color="getCategoryColor(todo.category)" class="category-badge">{{ todo.category }}</ion-badge>
                        <ion-icon v-if="todo.category" :icon="getCategoryIcon(todo.category)" :color="getCategoryColor(todo.category)" size="small" class="category-icon"></ion-icon>
                        {{ todo.text }}
                    </h2>
                    <p v-if="todo.dueDate || todo.timeSpent" class="due-date">
                        <span v-if="todo.dueDate">
                          <ion-icon :icon="calendarOutline" size="small"></ion-icon> {{ todo.dueDate }}
                          <ion-text color="danger" v-if="todoService.isOverdue(todo.dueDate)" class="ion-margin-start">(Overdue)</ion-text>
                          <ion-text color="warning" v-if="todoService.isDueToday(todo.dueDate)" class="ion-margin-start">(Today)</ion-text>
                        </span>
                        <span v-if="todo.timeSpent" class="time-spent">
                          <ion-icon :icon="timeOutline" size="small"></ion-icon> {{ formatTimeSpent(todo.timeSpent) }}
                        </span>
                    </p>
                </ion-label>
                <ion-reorder slot="end"></ion-reorder>
                </ion-item>
                <ion-item-options side="start">
                <ion-item-option color="success" @click="toggleTodoItem(todo, index)">
                    <ion-icon :icon="checkmarkDoneCircleOutline"></ion-icon>
                </ion-item-option>
                </ion-item-options>
                <ion-item-options side="end">
                <ion-item-option color="tertiary" :disabled="lists.length <= 1" @click="presentMoveTodoAlert(todo, index)">
                    <ion-icon :icon="swapVerticalOutline"></ion-icon>
                </ion-item-option>
                <ion-item-option color="danger" @click="deleteTodoItem(todo, index)">
                    <ion-icon :icon="trashOutline"></ion-icon>
                </ion-item-option>
                </ion-item-options>
            </ion-item-sliding>
          </ion-reorder-group>

          <div v-if="filteredItems.length === 0" class="ion-padding ion-text-center empty-state">
              <ion-icon :icon="checkmarkDoneCircleOutline" size="large" color="success"></ion-icon>
              <ion-text color="medium">
                <p v-if="isFocusMode">No urgent tasks!</p>
                <p v-else>All caught up!</p>
              </ion-text>
          </div>

        </ion-list>

        <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="isAuthenticated && lists.length > 0 && !isFocusMode && !isGlobalCategoryMode">
          <ion-fab-button @click="presentAlert" class="gradient-fab">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonCheckbox, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonText, IonMenu, IonMenuButton, IonMenuToggle, IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItemSliding, IonItemOptions, IonItemOption, alertController, onIonViewWillEnter, IonReorderGroup, IonReorder, modalController, IonItemDivider, IonInput, IonLoading } from '@ionic/vue';
import { settingsOutline, add, listOutline, addCircleOutline, documentsOutline, checkmarkDoneCircleOutline, trashOutline, calendarOutline, eyeOutline, eyeOffOutline, archiveOutline, flashOutline, timeOutline, createOutline, alarmOutline, checkmarkDoneOutline, swapVerticalOutline, flameOutline, starOutline } from 'ionicons/icons';
import { ref, computed, nextTick } from 'vue';
import { todoService, dropboxService, gamificationService } from '../services';
import { TodoItem } from '../services/TodoService';
import AddTodoModal from '../components/AddTodoModal.vue';

const lists = todoService.lists;
const selectedListIndex = ref(0);
const isFocusMode = ref(false);
const isGlobalCategoryMode = ref(false);
const isAuthenticated = ref(false);
const showCompleted = ref(true);
const quickAddText = ref('');
const categoryFilter = ref<'All' | 'Reminder' | 'Do' | 'Long Task'>('All');
const sortMode = ref<'manual' | 'priority'>('manual');
const isLoading = ref(false);
const points = computed(() => gamificationService.points.value);
const streak = computed(() => gamificationService.streak.value);
const funMode = computed(() => gamificationService.funMode.value);
const reducedMotion = computed(() => gamificationService.reducedMotion.value);

const currentList = computed(() => {
    if (isFocusMode.value || isGlobalCategoryMode.value) return null;
    return lists.value[selectedListIndex.value];
});

const pageTitle = computed(() => {
    if (isFocusMode.value) return 'Focus';
    if (isGlobalCategoryMode.value) return categoryFilter.value === 'All' ? 'All Tasks' : categoryFilter.value;
    return currentList.value ? currentList.value.name : 'My Todos';
});

const filteredItems = computed(() => {
    let items: TodoItem[] = [];

    if (isFocusMode.value || isGlobalCategoryMode.value) {
        // Aggregate items from all lists
        for (const list of lists.value) {
            items = items.concat(list.items);
        }
        if (isFocusMode.value) {
          // Filter for Focus: Overdue, Today, or Priority A
          items = items.filter(item => {
              if (item.completed && !showCompleted.value) return false;
              const overdue = todoService.isOverdue(item.dueDate);
              const dueToday = todoService.isDueToday(item.dueDate);
              const highPriority = item.priority === 'A';
              return overdue || dueToday || highPriority;
          });
        }
    } else {
        if (!currentList.value) return [];
        items = currentList.value.items;
    }

    // Apply category filter ONLY in Global Category mode
    if (isGlobalCategoryMode.value && categoryFilter.value !== 'All') {
        if (categoryFilter.value === 'Reminder') {
            // In Reminder view, show all tasks that have a due date (i.e., an actual reminder).
            // Keep compatibility with any items explicitly tagged as cat:Reminder.
            items = items.filter(item => !!item.dueDate || item.category === 'Reminder');
        } else {
            items = items.filter(item => item.category === categoryFilter.value);
        }
    }

    if (!showCompleted.value) {
        items = items.filter(item => !item.completed);
    }

    // Apply sorting by priority if enabled (stable sort)
    if (sortMode.value === 'priority') {
        const rank = (p?: string) => {
            if (!p) return 100; // no priority goes last
            const code = p.charCodeAt(0) - 64; // 'A' => 1
            if (code < 1 || code > 26) return 99;
            return code;
        };
        const decorated = items.map((item, idx) => ({ item, idx }));
        decorated.sort((a, b) => {
            // Incomplete before completed
            if (a.item.completed !== b.item.completed) return a.item.completed ? 1 : -1;
            // Priority A (1) first, Z (26), then no priority (100)
            const ra = rank(a.item.priority);
            const rb = rank(b.item.priority);
            if (ra !== rb) return ra - rb;
            // Stable fallback to original index
            return a.idx - b.idx;
        });
        return decorated.map(d => d.item);
    }

    return items;
});

const selectList = (index: number) => {
    selectedListIndex.value = index;
    isFocusMode.value = false;
    isGlobalCategoryMode.value = false;
    // Reset category filter so future Global mode starts clean
    categoryFilter.value = 'All';
};

const selectFocusMode = () => {
    isFocusMode.value = true;
    isGlobalCategoryMode.value = false;
};

const selectGlobalCategory = (category: 'All' | 'Reminder' | 'Do' | 'Long Task') => {
    categoryFilter.value = category;
    isGlobalCategoryMode.value = true;
    isFocusMode.value = false;
};

const toggleSortMode = () => {
    sortMode.value = sortMode.value === 'manual' ? 'priority' : 'manual';
};

const quickAddTodo = async () => {
    // Clear the field immediately for better UX, then add asynchronously
    const text = quickAddText.value.trim();
    if (!text) return;
    quickAddText.value = '';
    await todoService.addTodo(selectedListIndex.value, text);
};

const checkAuth = async () => {
  isAuthenticated.value = dropboxService.isAuthenticated();
  if (isAuthenticated.value) {
    // Show a loading indicator when we fetch from Dropbox outside of pull-to-refresh
    isLoading.value = true;
    try {
      await todoService.loadTodos();
    } finally {
      isLoading.value = false;
    }
  }
};

onIonViewWillEnter(() => {
  // Fire and forget; internal method handles its own loading state
  checkAuth();
});

const handleRefresh = async (event: any) => {
  await todoService.loadTodos();
  event.target.complete();
};

const toggleTodoItem = async (todo: TodoItem, index: number) => {
    // If in focus mode, we need to find the real list and index
    const wasCompleted = todo.completed;
    const taskId = todo.text; // use task text as ID for gamification tracking
    if (isFocusMode.value || isGlobalCategoryMode.value) {
        // Find the list containing this todo
        for (let lIndex = 0; lIndex < lists.value.length; lIndex++) {
            const list = lists.value[lIndex];
            const tIndex = list.items.indexOf(todo);
            if (tIndex !== -1) {
                await todoService.toggleTodo(lIndex, tIndex);
                if (!wasCompleted && todo.completed) {
                  await handleTaskCompletedEffect(taskId);
                }
                break;
            }
        }
    } else {
        await todoService.toggleTodo(selectedListIndex.value, index);
        if (!wasCompleted && todo.completed) {
          await handleTaskCompletedEffect(taskId);
        }
    }
};

async function handleTaskCompletedEffect(taskId: string) {
  // Award points only once per unique task ID stored in Dropbox game_track.txt
  const awarded = await gamificationService.onTaskCompletedIfEligible(taskId);
  if (!awarded) return; // already counted before
  if (!funMode.value) return;
  if (reducedMotion.value) return;
  // Trigger a quick confetti burst from the header area
  nextTick(() => spawnConfetti());
}

function spawnConfetti() {
  const container = document.querySelector('#main-content') as HTMLElement | null;
  if (!container) return;
  const burst = document.createElement('div');
  burst.className = 'confetti-burst';
  const count = 14;
  for (let i = 0; i < count; i++) {
    const piece = document.createElement('span');
    piece.className = 'confetti-piece';
    piece.style.setProperty('--rx', (Math.random() * 360).toFixed(0));
    piece.style.setProperty('--dx', (Math.random() * 200 - 100).toFixed(0));
    piece.style.setProperty('--dy', (-Math.random() * 200 - 80).toFixed(0));
    piece.style.setProperty('--delay', (Math.random() * 0.1).toFixed(2) + 's');
    piece.style.background = randomConfettiColor();
    burst.appendChild(piece);
  }
  container.appendChild(burst);
  setTimeout(() => burst.remove(), 1200);
}

function randomConfettiColor() {
  const colors = ['#ff0080', '#00e5ff', '#6200ea', '#ffd400', '#34c759'];
  return colors[Math.floor(Math.random() * colors.length)];
}

const deleteTodoItem = async (todo: TodoItem, index: number) => {
    if (isFocusMode.value || isGlobalCategoryMode.value) {
        for (let lIndex = 0; lIndex < lists.value.length; lIndex++) {
            const list = lists.value[lIndex];
            const tIndex = list.items.indexOf(todo);
            if (tIndex !== -1) {
                await todoService.removeTodo(lIndex, tIndex);
                break;
            }
        }
    } else {
        await todoService.removeTodo(selectedListIndex.value, index);
    }
};

const getPriorityColor = (priority: string) => {
    switch (priority) {
        case 'A': return 'danger';
        case 'B': return 'warning';
        case 'C': return 'success';
        case 'D': return 'medium';
        default: return 'light';
    }
};

const getCategoryColor = (category: string) => {
    switch (category) {
        case 'Reminder': return 'tertiary';
        case 'Do': return 'primary';
        case 'Long Task': return 'secondary';
        default: return 'medium';
    }
};

const getCategoryIcon = (category: string) => {
    switch (category) {
        case 'Reminder': return alarmOutline;
        case 'Do': return checkmarkDoneOutline;
        case 'Long Task': return timeOutline;
        default: return undefined as any;
    }
};

const formatTimeSpent = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
};

const handleReorder = async (event: CustomEvent) => {
  // The `from` and `to` properties contain the index of the item
  // when the drag started and ended, respectively
  const { from, to } = event.detail;

  if (!currentList.value) {
      event.detail.complete();
      return;
  }

  // Finish the reorder and position the item in the DOM based on
  // where the gesture ended. This method can also be called directly
  // by the reorder group
  event.detail.complete();

  // If we are filtering (e.g. hiding completed), reordering might be confusing or buggy
  // because the indices won't match the full list.
  // For now, let's only allow reordering when showing all items or handle it carefully.
  // Actually, if we reorder in the filtered view, we need to map back to original indices.
  // BUT, IonReorderGroup works on the rendered list.

  // Simplification: Only allow reordering if NOT filtering?
  // Or just map the indices.

  if (!showCompleted.value) {
      // If we are hiding completed items, the indices 'from' and 'to' correspond to the filtered list.
      // We need to find the actual indices in the main list.
      const visibleItems = filteredItems.value;
      const itemMoved = visibleItems[from];
      const targetItem = visibleItems[to];

      // Find original indices
      const originalFrom = currentList.value.items.indexOf(itemMoved);
      // For target, it's a bit tricky because we are inserting.
      // Let's just say we move it before the target item.
      const originalTo = currentList.value.items.indexOf(targetItem);

      // If moving down, we might need to adjust
      if (from < to) {
          // If we move from 0 to 1, we want to be after the item at 1.
          // originalTo is the index of the item we dropped ON/Before.
          // Wait, ionic reorder is "insert at".
      }

      // To avoid complexity for this iteration, let's just disable reordering when filtered?
      // Or just apply it to the main list using the item references.

      // Let's use the simple approach: Update the service with mapped indices.
      // Actually, TodoService.reorderTodos takes indices.

      await todoService.reorderTodos(selectedListIndex.value, originalFrom, originalTo);
  } else {
      await todoService.reorderTodos(selectedListIndex.value, from, to);
  }
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

// Present a picker to move a todo to another list
const presentMoveTodoAlert = async (todo: TodoItem, index: number) => {
  // Determine actual source list/index depending on mode
  let sourceListIndex = selectedListIndex.value;
  let sourceTodoIndex = index;
  if (isFocusMode.value || isGlobalCategoryMode.value) {
    sourceListIndex = -1;
    sourceTodoIndex = -1;
    for (let lIndex = 0; lIndex < lists.value.length; lIndex++) {
      const tIndex = lists.value[lIndex].items.indexOf(todo);
      if (tIndex !== -1) {
        sourceListIndex = lIndex;
        sourceTodoIndex = tIndex;
        break;
      }
    }
    if (sourceListIndex === -1) return; // not found; nothing to do
  }

  // Build destination options excluding the current list
  const options = lists.value
    .map((l, idx) => ({ label: l.name, value: String(idx), idx }))
    .filter(o => o.idx !== sourceListIndex);

  if (options.length === 0) {
    const info = await alertController.create({
      header: 'Move Task',
      message: 'No other lists available to move this task to.',
      buttons: ['OK']
    });
    await info.present();
    return;
  }

  const alert = await alertController.create({
    header: 'Move to list',
    inputs: options.map(o => ({
      label: o.label,
      type: 'radio',
      value: o.value
    })),
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Move',
        handler: async (toValue: string) => {
          const toIdx = parseInt(toValue, 10);
          if (!Number.isFinite(toIdx)) return false;
          await todoService.moveTodo(sourceListIndex, sourceTodoIndex, toIdx);
          return true;
        }
      }
    ]
  });
  await alert.present();
};

const presentRenameListAlert = async () => {
  if (!currentList.value) return;

  const alert = await alertController.create({
    header: 'Rename List',
    inputs: [
      {
        name: 'name',
        type: 'text',
        placeholder: 'List Name',
        value: currentList.value.name
      }
    ],
    buttons: [
      {
        text: 'Cancel',
        role: 'cancel'
      },
      {
        text: 'Rename',
        handler: async (data) => {
          if (data.name && data.name !== currentList.value?.name) {
            await todoService.renameList(selectedListIndex.value, data.name);
          }
        }
      }
    ]
  });

  await alert.present();
};

const presentDeleteListAlert = async () => {
  const idx = selectedListIndex.value;
  const list = currentList.value;
  if (idx == null || !list) return;

  const deletable = todoService.canDeleteList(idx);

  if (deletable) {
    const alert = await alertController.create({
      header: 'Delete List',
      message: `Delete "${list.name}"? This cannot be undone.`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Delete',
          role: 'destructive',
          handler: async () => {
            await todoService.removeList(idx);
            if (lists.value.length === 0) {
              selectedListIndex.value = 0;
            } else {
              selectedListIndex.value = Math.min(idx, lists.value.length - 1);
            }
          }
        }
      ]
    });
    await alert.present();
    return;
  }

  // Mixed items: ask to move remaining (incomplete) to another list
  const options = lists.value
    .map((l, i) => ({ name: l.name, index: i }))
    .filter(o => o.index !== idx);

  if (options.length === 0) {
    const info = await alertController.create({
      header: 'Cannot Delete',
      message: 'This list has active tasks and there is no other list to move them to. Please create another list first.',
      buttons: [{ text: 'OK', role: 'cancel' }]
    });
    await info.present();
    return;
  }

  const moveAlert = await alertController.create({
    header: 'Move remaining tasks',
    message: 'Select a list to move the remaining tasks to, then the current list will be deleted.',
    inputs: options.map(o => ({
      type: 'radio',
      label: o.name,
      value: o.index
    })),
    buttons: [
      { text: 'Cancel', role: 'cancel' },
      {
        text: 'Move & Delete',
        handler: async (targetIdx: number) => {
          if (typeof targetIdx !== 'number') return;
          const adjustedSelection = targetIdx > idx ? targetIdx - 1 : targetIdx;
          await todoService.removeListWithMove(idx, targetIdx);
          if (lists.value.length === 0) {
            selectedListIndex.value = 0;
          } else {
            selectedListIndex.value = Math.max(0, Math.min(adjustedSelection, lists.value.length - 1));
          }
        }
      }
    ]
  });

  await moveAlert.present();
};

const presentAlert = async () => {
  const modal = await modalController.create({
    component: AddTodoModal,
  });

  modal.onWillDismiss().then((ev) => {
    if (ev.role === 'confirm') {
      const todoText = ev.data;
      if (todoText) {
          todoService.addTodo(selectedListIndex.value, todoText);
      }
    }
  });

  await modal.present();
};

const presentArchiveAlert = async () => {
    const alert = await alertController.create({
        header: 'Archive Completed?',
        message: 'This will move all completed todos to done.txt. This action cannot be undone from the app.',
        buttons: [
            {
                text: 'Cancel',
                role: 'cancel'
            },
            {
                text: 'Archive',
                handler: async () => {
                    await todoService.archiveCompletedTodos();
                }
            }
        ]
    });
    await alert.present();
};

const presentEditTodoAlert = async (todo: TodoItem, index: number) => {
    // Find actual list index and todo index for focus mode
    let listIdx = selectedListIndex.value;
    let todoIdx = index;

    if (isFocusMode.value || isGlobalCategoryMode.value) {
        for (let lIndex = 0; lIndex < lists.value.length; lIndex++) {
            const list = lists.value[lIndex];
            const tIndex = list.items.indexOf(todo);
            if (tIndex !== -1) {
                listIdx = lIndex;
                todoIdx = tIndex;
                break;
            }
        }
    }

    const modal = await modalController.create({
      component: AddTodoModal,
      componentProps: {
        mode: 'edit',
        initialText: todo.text,
        initialPriority: todo.priority || '',
        initialCategory: todo.category || '',
        initialDueDate: todo.dueDate || '',
        initialTimeSpent: typeof todo.timeSpent === 'number' ? todo.timeSpent : undefined,
        listNames: lists.value.map(l => l.name),
        initialListIndex: listIdx,
      }
    });

    modal.onWillDismiss().then(async (ev) => {
      if (ev.role === 'confirm' && ev.data) {
        const updates = ev.data as any;
        // Save field updates on current item first
        await todoService.updateTodo(listIdx, todoIdx, {
          text: updates.text,
          priority: updates.priority,
          dueDate: updates.dueDate,
          category: updates.category,
          timeSpent: updates.timeSpent,
        });

        // Move if destination list changed
        const toListIdx: number | undefined = updates.moveToListIndex;
        if (typeof toListIdx === 'number' && toListIdx !== listIdx) {
          await todoService.moveTodo(listIdx, todoIdx, toListIdx);
        }
      }
    });

    await modal.present();
};
</script>

<style scoped>
.completed-item h2 {
    text-decoration: line-through;
    color: var(--ion-color-medium);
}

.priority-badge {
    margin-right: 8px;
    vertical-align: middle;
}

.category-badge {
    margin-right: 8px;
    vertical-align: middle;
    font-size: 0.7em;
}

.due-date {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 0.8em;
    color: var(--ion-color-medium);
    margin-top: 4px;
    flex-wrap: wrap;
}

.time-spent {
    margin-left: 12px;
    display: inline-flex;
    align-items: center;
    gap: 4px;
}

.quick-add-item {
    --background: var(--ion-color-light);
    margin-top: 8px;
}

.category-icon {
    margin-right: 6px;
    vertical-align: middle;
}

.category-filter {
    --inner-padding-end: 0;
}

.header-badge {
  margin-right: 6px;
  display: inline-flex;
  align-items: center;
}
.badge-icon { margin-right: 4px; }

/* Confetti */
.confetti-burst {
  position: absolute;
  top: 64px;
  right: 16px;
  pointer-events: none;
}
.confetti-piece {
  position: absolute;
  width: 8px;
  height: 12px;
  border-radius: 2px;
  animation: confetti-pop 1s ease-out forwards;
  transform: translate3d(0,0,0) rotate(calc(var(--rx) * 1deg));
  animation-delay: var(--delay, 0s);
}
@keyframes confetti-pop {
  0% { opacity: 1; transform: translate(0,0) rotate(0deg); }
  100% { opacity: 0; transform: translate(var(--dx, 0px), var(--dy, -120px)) rotate(360deg); }
}
</style>
