import { computed, ref, type Ref } from 'vue';
import type { TodoList } from '../services/TodoService';

export type CategoryFilter = 'All' | 'Reminder' | 'Do' | 'Long Task';

/**
 * Encapsulates selection state for lists, focus mode, and global category mode
 * and derives the current list and page title.
 */
export function useTodoSelectionMode(lists: Ref<TodoList[]>) {
  const selectedListIndex = ref(0);
  const isFocusMode = ref(false);
  const isGlobalCategoryMode = ref(false);
  const categoryFilter = ref<CategoryFilter>('All');

  const currentList = computed(() => {
    if (isFocusMode.value || isGlobalCategoryMode.value) return null;
    if (!lists.value || lists.value.length === 0) return null;
    if (
      selectedListIndex.value < 0 ||
      selectedListIndex.value >= lists.value.length
    ) {
      return null;
    }
    return lists.value[selectedListIndex.value];
  });

  const pageTitle = computed(() => {
    if (isFocusMode.value) return 'Focus';
    if (isGlobalCategoryMode.value) {
      return categoryFilter.value === 'All' ? 'All Tasks' : categoryFilter.value;
    }
    return currentList.value ? currentList.value.name : 'My Todos';
  });

  function selectList(index: number) {
    if (index < 0 || index >= lists.value.length) return;
    selectedListIndex.value = index;
    isFocusMode.value = false;
    isGlobalCategoryMode.value = false;
    categoryFilter.value = 'All';
  }

  function selectFocusMode() {
    isFocusMode.value = true;
    isGlobalCategoryMode.value = false;
  }

  function selectGlobalCategory(category: CategoryFilter) {
    categoryFilter.value = category;
    isGlobalCategoryMode.value = true;
    isFocusMode.value = false;
  }

  return {
    // state
    selectedListIndex,
    isFocusMode,
    isGlobalCategoryMode,
    categoryFilter,
    currentList,
    pageTitle,
    // actions
    selectList,
    selectFocusMode,
    selectGlobalCategory,
  };
}

