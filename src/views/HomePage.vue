<template>
  <ion-page>
    <SideMenu
      :lists="lists"
      :selected-list-index="selectedListIndex"
      :is-focus-mode="isFocusMode"
      :is-global-category-mode="isGlobalCategoryMode"
      :category-filter="categoryFilter"
      :is-authenticated="isAuthenticated"
      @add-list="presentAddListAlert"
      @select-focus-mode="selectFocusMode"
      @select-global-category="selectGlobalCategory"
      @select-list="selectList"
    />

    <div class="ion-page" id="main-content">
      <MainToolbar
        :page-title="pageTitle"
        :is-authenticated="isAuthenticated"
        :fun-mode="funMode"
        :streak="streak"
        :points="points"
        :show-completed="showCompleted"
        :sort-mode="sortMode"
        :has-current-list="!!currentList"
        :is-focus-mode="isFocusMode"
        :is-global-category-mode="isGlobalCategoryMode"
        :search-text="searchText"
        @update:searchText="val => (searchText = val)"
        @update:showCompleted="val => (showCompleted = val)"
        @toggle-sort-mode="toggleSortMode"
        @rename-list="presentRenameListAlert"
        @delete-list="presentDeleteListAlert"
      />

      <GamificationPopovers
        :is-authenticated="isAuthenticated"
        :fun-mode="funMode"
        :streak="streak"
        :points="points"
      />

      <ion-content :fullscreen="true" class="ion-padding-top">
        <!-- Global loading indicator for Dropbox sync (non-refresher) -->
        <ion-loading
          :is-open="isLoading"
          message="Syncing with Dropbox..."
          spinner="crescent"
        ></ion-loading>

        <ion-header collapse="condense">
          <ion-toolbar>
            <ion-title size="large">{{ pageTitle }}</ion-title>
          </ion-toolbar>
        </ion-header>

        <ion-refresher slot="fixed" @ionRefresh="handleRefresh($event)">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <!-- Inline sync indicator chip under toolbar -->
        <div v-if="isAuthenticated && syncingVisible" class="sync-banner">
          <ion-icon :icon="cloudUploadOutline" class="sync-icon" />
          <span>Syncing with Dropbox...</span>
        </div>

        <!-- Global search context banner -->
        <div v-if="isSearching" class="sync-banner" aria-live="polite">
          <span>Searching across all lists</span>
        </div>

        <WelcomeCard v-if="!isAuthenticated" />

        <EmptyListsState
          v-else-if="lists.length === 0"
          @create-list="presentAddListAlert"
        />

        <TodoListView
          v-else-if="currentList || isFocusMode || isGlobalCategoryMode || isSearching"
          :items="filteredItems"
          :lists-count="lists.length"
          :is-focus-mode="isFocusMode"
          :is-global-category-mode="isGlobalCategoryMode"
          :show-completed="showCompleted"
          :sort-mode="sortMode"
          :quick-add-enabled="!isFocusMode && !isGlobalCategoryMode && !isSearching"
          :quick-add-text="quickAddText"
          :has-list="!!currentList || isFocusMode || isGlobalCategoryMode"
          @update:quickAddText="val => (quickAddText = val)"
          @quick-add="handleQuickAdd"
          @toggle-todo="({ todo, index }) => toggleTodoItem(todo, index)"
          @edit-todo="({ todo, index }) => presentEditTodoAlert(todo, index)"
          @move-todo="({ todo, index }) => presentMoveTodoAlert(todo, index)"
          @delete-todo="({ todo, index }) => deleteTodoItem(todo, index)"
          @reorder="({ from, to }) => handleReorder({ detail: { from, to, complete: () => {} } } as any, filteredItems)"
        />

        <ion-fab
          vertical="bottom"
          horizontal="end"
          slot="fixed"
          v-if="isAuthenticated && lists.length > 0 && !isFocusMode && !isGlobalCategoryMode"
        >
          <ion-fab-button @click="presentAddTodoModal" class="gradient-fab">
            <ion-icon :icon="add"></ion-icon>
          </ion-fab-button>
        </ion-fab>
      </ion-content>
    </div>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonContent,
  IonFab,
  IonFabButton,
  IonHeader,
  IonIcon,
  IonLoading,
  IonPage,
  IonRefresher,
  IonRefresherContent,
  IonTitle,
  IonToolbar,
  onIonViewWillEnter
} from '@ionic/vue';
import {add, cloudUploadOutline} from 'ionicons/icons';
import {computed, ref, watch} from 'vue';
import {dropboxService, gamificationService, todoService} from '../services';
import {TodoItem} from '../services/TodoService';
import MainToolbar from '../components/MainToolbar.vue';
import SideMenu from '../components/SideMenu.vue';
import GamificationPopovers from '../components/GamificationPopovers.vue';
import WelcomeCard from '../components/WelcomeCard.vue';
import EmptyListsState from '../components/EmptyListsState.vue';
import TodoListView from '../components/TodoListView.vue';
import {useTodoSelectionMode} from '../composables/useTodoSelectionMode';
import {useTodoMutations} from '../composables/useTodoMutations';

const lists = todoService.lists;

const {
  selectedListIndex,
  isFocusMode,
  isGlobalCategoryMode,
  categoryFilter,
  currentList,
  pageTitle,
  selectList,
  selectFocusMode,
  selectGlobalCategory,
} = useTodoSelectionMode(lists);

const isAuthenticated = ref(false);
const showCompleted = ref(true);
const quickAddText = ref('');
const searchText = ref('');
const isSearching = computed(() => searchText.value.trim().length > 0);
const sortMode = ref<'manual' | 'priority'>('manual');
const isLoading = ref(false);
// Local, debounced visibility for the inline syncing banner
const syncingVisible = ref(false);
const points = computed(() => gamificationService.points.value);
const streak = computed(() => gamificationService.streak.value);
const funMode = computed(() => gamificationService.funMode.value);

const {
  quickAddTodo,
  toggleTodoItem,
  deleteTodoItem,
  handleReorder,
  presentAddListAlert,
  presentMoveTodoAlert,
  presentRenameListAlert,
  presentDeleteListAlert,
  presentAddTodoModal,
  presentEditTodoAlert,
} = useTodoMutations({
  lists,
  selectedListIndex,
  isFocusMode,
  isGlobalCategoryMode,
  currentList,
  showCompleted,
});


const handleQuickAdd = () => quickAddTodo(quickAddText);


const filteredItems = computed(() => {
    let items: TodoItem[] = [];

    if (isSearching.value) {
        // Global search: collect all items across lists
        for (const list of lists.value) {
            items = items.concat(list.items);
        }
    } else if (isFocusMode.value || isGlobalCategoryMode.value) {
        // Aggregate items from all lists for special modes
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

    // Apply category filter ONLY in Global Category mode (not during global search)
    if (!isSearching.value && isGlobalCategoryMode.value && categoryFilter.value !== 'All') {
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

    // Simple text search by task text
    if (searchText.value.trim()) {
        const q = searchText.value.trim().toLowerCase();
        items = items.filter(item => item.text.toLowerCase().includes(q));
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

const toggleSortMode = () => {
    sortMode.value = sortMode.value === 'manual' ? 'priority' : 'manual';
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
  try {
    // Ensure auth status is up-to-date
    if (!dropboxService.isAuthenticated()) {
      try {
        await dropboxService.init();
      } catch (_) {
        // ignore init errors during refresher
      }
    }

    if (dropboxService.isAuthenticated()) {
      await todoService.loadTodos(); // pulls latest from Dropbox
      isAuthenticated.value = true;
    } else {
      // Not authenticated, nothing to sync
      isAuthenticated.value = false;
    }
  } catch (e) {
    console.error('Pull-to-refresh sync failed:', e);
  } finally {
    // Always complete the refresher so UI doesn't hang
    event?.target?.complete?.();
  }
};

// Debounce the inline syncing indicator to avoid flicker on very fast ops
let showTimer: any = null;
let hideTimer: any = null;
watch(
  () => todoService.isSyncing.value,
  (isSyncing) => {
    if (isSyncing) {
      if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
      if (!syncingVisible.value) {
        showTimer = setTimeout(() => {
          syncingVisible.value = true;
        }, 180); // small delay before showing
      }
    } else {
      if (showTimer) { clearTimeout(showTimer); showTimer = null; }
      hideTimer = setTimeout(() => {
        syncingVisible.value = false;
      }, 150); // small delay before hiding
    }
  },
  { immediate: true }
);

</script>

<style scoped>

.sync-banner {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  margin: 4px 12px 0 12px;
  border-radius: 12px;
  background: var(--ion-color-light);
  color: var(--ion-color-medium-contrast, var(--ion-color-medium));
  font-size: 14px;
}

.sync-icon {
  font-size: 18px;
  color: var(--ion-color-primary);
}

</style>
