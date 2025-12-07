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
             <ion-label>Lists</ion-label>
           </ion-item-divider>

           <ion-menu-toggle :auto-hide="false" v-for="(list, index) in lists" :key="index">
             <ion-item button @click="selectList(index)" :color="!isFocusMode && selectedListIndex === index ? 'secondary' : ''" :detail="false" class="list-item">
               <ion-icon slot="start" :icon="listOutline"></ion-icon>
               <ion-label>{{ list.name }}</ion-label>
               <ion-badge slot="end" color="tertiary" v-if="list.items.length > 0">{{ list.items.length }}</ion-badge>
             </ion-item>
           </ion-menu-toggle>
            <ion-item v-if="lists.length === 0">
             <ion-label color="medium" class="ion-text-center">No lists</ion-label>
           </ion-item>
         </ion-list>
      </ion-content>
    </ion-menu>

    <div class="ion-page" id="main-content">
      <ion-header :translucent="true">
        <ion-toolbar class="gradient-toolbar">
          <ion-buttons slot="start">
            <ion-menu-button color="light"></ion-menu-button>
          </ion-buttons>
          <ion-title>{{ pageTitle }}</ion-title>
          <ion-buttons slot="end">
            <ion-button @click="showCompleted = !showCompleted">
                <ion-icon :icon="showCompleted ? eyeOutline : eyeOffOutline"></ion-icon>
            </ion-button>
            <ion-button @click="presentRenameListAlert" color="light" v-if="isAuthenticated && !isFocusMode && currentList">
                <ion-icon :icon="createOutline"></ion-icon>
            </ion-button>
            <ion-button @click="presentArchiveAlert" color="light" v-if="isAuthenticated">
                <ion-icon :icon="archiveOutline"></ion-icon>
            </ion-button>
            <ion-button router-link="/settings" color="light">
              <ion-icon :icon="settingsOutline"></ion-icon>
            </ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>

      <ion-content :fullscreen="true" class="ion-padding-top">
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

        <ion-list v-else-if="currentList || isFocusMode" lines="full" class="todo-list">
          <!-- Inline Quick Add Input moved to the top of the list -->
          <ion-item v-if="!isFocusMode" class="quick-add-item">
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

          <ion-reorder-group :disabled="isFocusMode || !showCompleted" @ionItemReorder="handleReorder($event)">
            <ion-item-sliding v-for="(todo, index) in filteredItems" :key="todo.raw">
                <ion-item>
                <ion-checkbox slot="start" :checked="todo.completed" @ionChange="toggleTodoItem(todo, index)" mode="ios"></ion-checkbox>
                <ion-label :class="{ 'completed-item': todo.completed }" @click="presentEditTodoAlert(todo, index)">
                    <h2>
                        <ion-badge v-if="todo.priority" :color="getPriorityColor(todo.priority)" class="priority-badge">{{ todo.priority }}</ion-badge>
                        <ion-badge v-if="todo.category" :color="getCategoryColor(todo.category)" class="category-badge">{{ todo.category }}</ion-badge>
                        {{ todo.text }}
                    </h2>
                    <p v-if="todo.dueDate || (todo.category === 'Long Task' && todo.timeSpent)" class="due-date">
                        <span v-if="todo.dueDate">
                          <ion-icon :icon="calendarOutline" size="small"></ion-icon> {{ todo.dueDate }}
                          <ion-text color="danger" v-if="todoService.isOverdue(todo.dueDate)" class="ion-margin-start">(Overdue)</ion-text>
                          <ion-text color="warning" v-if="todoService.isDueToday(todo.dueDate)" class="ion-margin-start">(Today)</ion-text>
                        </span>
                        <span v-if="todo.category === 'Long Task' && todo.timeSpent" class="time-spent">
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

        <ion-fab vertical="bottom" horizontal="end" slot="fixed" v-if="isAuthenticated && lists.length > 0 && !isFocusMode">
          <ion-fab-button @click="presentAlert" class="gradient-fab">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButtons, IonButton, IonIcon, IonList, IonItem, IonLabel, IonCheckbox, IonFab, IonFabButton, IonRefresher, IonRefresherContent, IonText, IonMenu, IonMenuButton, IonMenuToggle, IonBadge, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonItemSliding, IonItemOptions, IonItemOption, alertController, onIonViewWillEnter, IonReorderGroup, IonReorder, modalController, IonItemDivider, IonInput } from '@ionic/vue';
import { settingsOutline, add, listOutline, addCircleOutline, documentsOutline, checkmarkDoneCircleOutline, trashOutline, calendarOutline, eyeOutline, eyeOffOutline, archiveOutline, flashOutline, timeOutline, createOutline } from 'ionicons/icons';
import { ref, computed } from 'vue';
import { todoService, dropboxService } from '../services';
import { TodoItem } from '../services/TodoService';
import AddTodoModal from '../components/AddTodoModal.vue';

const lists = todoService.lists;
const selectedListIndex = ref(0);
const isFocusMode = ref(false);
const isAuthenticated = ref(false);
const showCompleted = ref(true);
const quickAddText = ref('');

const currentList = computed(() => {
    if (isFocusMode.value) return null;
    return lists.value[selectedListIndex.value];
});

const pageTitle = computed(() => {
    if (isFocusMode.value) return 'Focus';
    return currentList.value ? currentList.value.name : 'My Todos';
});

const filteredItems = computed(() => {
    let items: TodoItem[] = [];

    if (isFocusMode.value) {
        // Aggregate items from all lists
        for (const list of lists.value) {
            items = items.concat(list.items);
        }

        // Filter for Focus: Overdue, Today, or Priority A
        items = items.filter(item => {
            if (item.completed && !showCompleted.value) return false;
            // If completed, maybe we don't show in Focus unless it was just completed?
            // Usually Focus is for active tasks. Let's hide completed in Focus by default unless showCompleted is true.

            const isOverdue = todoService.isOverdue(item.dueDate);
            const isDueToday = todoService.isDueToday(item.dueDate);
            const isHighPriority = item.priority === 'A';

            return isOverdue || isDueToday || isHighPriority;
        });
    } else {
        if (!currentList.value) return [];
        items = currentList.value.items;
    }

    if (!showCompleted.value) {
        return items.filter(item => !item.completed);
    }
    return items;
});

const selectList = (index: number) => {
    selectedListIndex.value = index;
    isFocusMode.value = false;
};

const selectFocusMode = () => {
    isFocusMode.value = true;
};

const quickAddTodo = async () => {
    if (!quickAddText.value.trim()) return;
    await todoService.addTodo(selectedListIndex.value, quickAddText.value.trim());
    quickAddText.value = '';
};

const checkAuth = () => {
  isAuthenticated.value = dropboxService.isAuthenticated();
  if (isAuthenticated.value) {
    todoService.loadTodos();
  }
};

onIonViewWillEnter(() => {
  checkAuth();
});

const handleRefresh = async (event: any) => {
  await todoService.loadTodos();
  event.target.complete();
};

const toggleTodoItem = async (todo: TodoItem, index: number) => {
    // If in focus mode, we need to find the real list and index
    if (isFocusMode.value) {
        // Find the list containing this todo
        for (let lIndex = 0; lIndex < lists.value.length; lIndex++) {
            const list = lists.value[lIndex];
            const tIndex = list.items.indexOf(todo);
            if (tIndex !== -1) {
                await todoService.toggleTodo(lIndex, tIndex);
                break;
            }
        }
    } else {
        await todoService.toggleTodo(selectedListIndex.value, index);
    }
};

const deleteTodoItem = async (todo: TodoItem, index: number) => {
    if (isFocusMode.value) {
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

    if (isFocusMode.value) {
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
      }
    });

    modal.onWillDismiss().then(async (ev) => {
      if (ev.role === 'confirm' && ev.data) {
        const updates = ev.data as Partial<Pick<TodoItem, 'text' | 'priority' | 'dueDate' | 'category' | 'timeSpent'>>;
        await todoService.updateTodo(listIdx, todoIdx, updates);
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
</style>
