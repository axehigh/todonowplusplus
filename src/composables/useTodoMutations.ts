import { nextTick, type Ref } from 'vue';
import { alertController, modalController } from '@ionic/vue';
import { todoService, gamificationService } from '../services';
import type { TodoItem, TodoList } from '../services/TodoService';

interface UseTodoMutationsOptions {
  lists: Ref<TodoList[]>;
  selectedListIndex: Ref<number>;
  isFocusMode: Ref<boolean>;
  isGlobalCategoryMode: Ref<boolean>;
  currentList: Ref<TodoList | null>;
  showCompleted: Ref<boolean>;
}

export function useTodoMutations(options: UseTodoMutationsOptions) {
  const {
    lists,
    selectedListIndex,
    isFocusMode,
    isGlobalCategoryMode,
    currentList,
    showCompleted,
  } = options;

  const quickAddTodo = async (quickAddText: Ref<string>) => {
    const text = quickAddText.value.trim();
    if (!text) return;
    quickAddText.value = '';
    await todoService.addTodo(selectedListIndex.value, text);
  };

  const toggleTodoItem = async (todo: TodoItem, index: number) => {
    const wasCompleted = todo.completed;
    const taskId = todo.text;

    if (isFocusMode.value || isGlobalCategoryMode.value) {
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
      const list = currentList.value;
      if (!list) return;
      const tIndex = list.items.indexOf(todo);
      if (tIndex !== -1) {
        await todoService.toggleTodo(selectedListIndex.value, tIndex);
        if (!wasCompleted && todo.completed) {
          await handleTaskCompletedEffect(taskId);
        }
      }
    }
  };

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
      const list = currentList.value;
      if (!list) return;
      const tIndex = list.items.indexOf(todo);
      if (tIndex !== -1) {
        await todoService.removeTodo(selectedListIndex.value, tIndex);
      }
    }
  };

  const handleReorder = async (
    event: CustomEvent,
    filteredItems: TodoItem[],
  ) => {
    const { from, to } = event.detail;

    if (!currentList.value) {
      event.detail.complete();
      return;
    }

    event.detail.complete();

    if (!showCompleted.value) {
      const visibleItems = filteredItems;
      const itemMoved = visibleItems[from];
      const targetItem = visibleItems[to];

      const originalFrom = currentList.value.items.indexOf(itemMoved);
      const originalTo = currentList.value.items.indexOf(targetItem);

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
          placeholder: 'List Name (e.g. Work)',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Create', role: 'confirm' },
      ],
    });

    await alert.present();

    const inputEl = alert.querySelector('input') as HTMLInputElement | null;
    inputEl?.focus();

    const { role, data } = await alert.onWillDismiss();

    const rawName = (data && (data.values?.name ?? data.name)) as
      | string
      | undefined;
    const name = (rawName || '').trim();
    console.log('Confirm adding list', name, 'role:', role, 'data:', data);

    if (!name || role !== 'confirm') return;

    await todoService.addList(name);
    selectedListIndex.value = lists.value.length - 1;
  };

  const presentMoveTodoAlert = async (todo: TodoItem, index: number) => {
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
      if (sourceListIndex === -1) return;
    } else {
      const list = currentList.value;
      if (!list) return;
      const tIndex = list.items.indexOf(todo);
      if (tIndex === -1) return;
      sourceTodoIndex = tIndex;
    }

    const options = lists.value
      .map((l, idx) => ({ label: l.name, value: String(idx), idx }))
      .filter((o) => o.idx !== sourceListIndex);

    if (options.length === 0) {
      const info = await alertController.create({
        header: 'Move Task',
        message: 'No other lists available to move this task to.',
        buttons: ['OK'],
      });
      await info.present();
      return;
    }

    const alert = await alertController.create({
      header: 'Move to list',
      inputs: options.map((o) => ({
        label: o.label,
        type: 'radio',
        value: o.value,
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
          },
        },
      ],
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
          value: currentList.value.name,
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Rename', role: 'confirm' },
      ],
    });

    await alert.present();

    const inputEl = alert.querySelector('input') as HTMLInputElement | null;
    inputEl?.focus();

    const { role, data } = await alert.onWillDismiss();

    const rawName = (data && (data.values?.name ?? data.name)) as
      | string
      | undefined;
    const name = (rawName || '').trim();
    console.log('Confirm renaming list', name, 'role:', role, 'data:', data);

    if (!name || role !== 'confirm' || name === currentList.value?.name) return;

    await todoService.renameList(selectedListIndex.value, name);
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
                selectedListIndex.value = Math.min(
                  idx,
                  lists.value.length - 1,
                );
              }
            },
          },
        ],
      });
      await alert.present();
      return;
    }

    const options = lists.value
      .map((l, i) => ({ name: l.name, index: i }))
      .filter((o) => o.index !== idx);

    if (options.length === 0) {
      const info = await alertController.create({
        header: 'Cannot Delete',
        message:
          'This list has active tasks and there is no other list to move them to. Please create another list first.',
        buttons: [{ text: 'OK', role: 'cancel' }],
      });
      await info.present();
      return;
    }

    const moveAlert = await alertController.create({
      header: 'Move remaining tasks',
      message:
        'Select a list to move the remaining tasks to, then the current list will be deleted.',
      inputs: options.map((o) => ({
        type: 'radio',
        label: o.name,
        value: o.index,
      })),
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Move & Delete',
          handler: async (targetIdx: number) => {
            const adjustedSelection =
              targetIdx > idx ? targetIdx - 1 : targetIdx;
            await todoService.removeListWithMove(idx, targetIdx);
            if (lists.value.length === 0) {
              selectedListIndex.value = 0;
            } else {
              selectedListIndex.value = Math.max(
                0,
                Math.min(adjustedSelection, lists.value.length - 1),
              );
            }
          },
        },
      ],
    });

    await moveAlert.present();
  };

  const presentAddTodoModal = async () => {
    const modal = await modalController.create({
      component: (await import('../components/AddTodoModal.vue')).default,
    });

    modal.onWillDismiss().then((ev) => {
      if (ev.role === 'confirm') {
        const todoText = ev.data as string | undefined;
        if (todoText) {
          todoService.addTodo(selectedListIndex.value, todoText);
        }
      }
    });

    await modal.present();
  };

  const presentEditTodoAlert = async (todo: TodoItem, index: number) => {
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
    } else {
      const list = currentList.value;
      if (!list) return;
      const tIndex = list.items.indexOf(todo);
      if (tIndex === -1) return;
      todoIdx = tIndex;
    }

    const AddTodoModal = (await import('../components/AddTodoModal.vue')).default;

    const modal = await modalController.create({
      component: AddTodoModal,
      componentProps: {
        mode: 'edit',
        initialText: todo.text,
        initialPriority: todo.priority || '',
        initialCategory: todo.category || '',
        initialDueDate: todo.dueDate || '',
        initialTimeSpent:
          typeof todo.timeSpent === 'number' ? todo.timeSpent : undefined,
        listNames: lists.value.map((l) => l.name),
        initialListIndex: listIdx,
      },
    });

    modal.onWillDismiss().then(async (ev) => {
      if (ev.role === 'confirm' && ev.data) {
        const updates = ev.data as any;
        await todoService.updateTodo(listIdx, todoIdx, {
          text: updates.text,
          priority: updates.priority,
          dueDate: updates.dueDate,
          category: updates.category,
          timeSpent: updates.timeSpent,
        });

        const toListIdx: number | undefined = updates.moveToListIndex;
        if (typeof toListIdx === 'number' && toListIdx !== listIdx) {
          await todoService.moveTodo(listIdx, todoIdx, toListIdx);
        }
      }
    });

    await modal.present();
  };

  const handleTaskCompletedEffect = async (taskId: string) => {
    const awarded = await gamificationService.onTaskCompletedIfEligible(taskId);
    if (!awarded) return;
    if (gamificationService.funMode.value === false) return;
    if (gamificationService.reducedMotion.value === true) return;
    await nextTick();
  };

  return {
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
  };
}

