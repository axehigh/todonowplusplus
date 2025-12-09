import { ref } from 'vue';
import { DropboxService } from './DropboxService';
import type { GameTrackService } from './GameTrackService';

export type TaskCategory = 'Reminder' | 'Do' | 'Long Task' | '';

export interface TodoItem {
    raw: string;
    text: string;
    completed: boolean;
    completedDate?: string;
    priority?: string;
    dueDate?: string;
    projects: string[];
    contexts: string[];
    category?: TaskCategory;
    timeSpent?: number; // Time spent in minutes (for Long Task category)
}

export interface TodoList {
    name: string;
    items: TodoItem[];
}

export class TodoService {
    private dropbox: DropboxService;
    public lists = ref<TodoList[]>([]);
    private readonly FILE_PATH = '/todo.txt';
    private gameTracker: GameTrackService | null = null;

    constructor(dropbox: DropboxService) {
        this.dropbox = dropbox;
    }

    /** Optional: allow wiring the game tracker so we can reflect task renames */
    setGameTracker(tracker: GameTrackService) {
        this.gameTracker = tracker;
    }

    async loadTodos() {
        if (!this.dropbox.isAuthenticated()) {
            console.warn('Dropbox not authenticated');
            return;
        }
        try {
            const content = await this.dropbox.readFile(this.FILE_PATH);
            const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);

            const newLists: TodoList[] = [];
            let currentList: TodoList = { name: 'General', items: [] };

            for (const line of lines) {
                if (line.startsWith('#')) {
                    if (currentList.items.length > 0 || currentList.name !== 'General') {
                        newLists.push(currentList);
                    }
                    currentList = { name: line.substring(1).trim(), items: [] };
                } else {
                    currentList.items.push(this.parseTodoLine(line));
                }
            }

            if (currentList.items.length > 0 || currentList.name !== 'General' || newLists.length === 0) {
                newLists.push(currentList);
            }

            this.lists.value = newLists;
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }

    private parseTodoLine(line: string): TodoItem {
        const item: TodoItem = {
            raw: line,
            text: line,
            completed: false,
            projects: [],
            contexts: []
        };

        // 1. Completed (x YYYY-MM-DD )
        const completedRegex = /^x\s(\d{4}-\d{2}-\d{2}\s)?/;
        const completedMatch = line.match(completedRegex);
        if (completedMatch) {
            item.completed = true;
            item.completedDate = completedMatch[1]?.trim();
            item.text = item.text.replace(completedRegex, '');
        }

        // 2. Priority ((A) )
        const priorityRegex = /^\(([A-Z])\)\s/;
        const priorityMatch = item.text.match(priorityRegex);
        if (priorityMatch) {
            item.priority = priorityMatch[1];
            item.text = item.text.replace(priorityRegex, '');
        }

        // 3. Due Date (due:YYYY-MM-DD)
        const dueRegex = /\bdue:(\d{4}-\d{2}-\d{2})\b/;
        const dueMatch = item.text.match(dueRegex);
        if (dueMatch) {
            item.dueDate = dueMatch[1];
            item.text = item.text.replace(dueRegex, '').trim();
        }

        // 4. Category (cat:Reminder, cat:Do, cat:Long Task)
        const catRegex = /\bcat:(Reminder|Do|Long Task)\b/;
        const catMatch = item.text.match(catRegex);
        if (catMatch) {
            item.category = catMatch[1] as TaskCategory;
            item.text = item.text.replace(catRegex, '').trim();
        }

        // 5. Time Spent (spent:123) - in minutes, for Long Task category
        const spentRegex = /\bspent:(\d+)\b/;
        const spentMatch = item.text.match(spentRegex);
        if (spentMatch) {
            item.timeSpent = parseInt(spentMatch[1], 10);
            item.text = item.text.replace(spentRegex, '').trim();
        }

        return item;
    }

    async addTodo(listIndex: number, todoText: string) {
        if (!todoText.trim()) return;
        if (!this.lists.value[listIndex]) return;

        // We just append the raw text. The user can type "due:..." or "(A) ..." manually if they want,
        // or we can add UI helpers later.
        const newItem = this.parseTodoLine(todoText.trim());
        this.lists.value[listIndex].items.push(newItem);
        await this.saveTodos();
    }

    async toggleTodo(listIndex: number, todoIndex: number) {
        const list = this.lists.value[listIndex];
        if (!list || !list.items[todoIndex]) return;

        const item = list.items[todoIndex];
        item.completed = !item.completed;

        if (item.completed) {
            const today = new Date().toISOString().split('T')[0];
            item.completedDate = today;
        } else {
            item.completedDate = undefined;
        }

        await this.saveTodos();
    }

    async addList(name: string) {
        if (!name.trim()) return;
        this.lists.value.push({ name: name.trim(), items: [] });
        await this.saveTodos();
    }

    async removeTodo(listIndex: number, todoIndex: number) {
        if (!this.lists.value[listIndex]) return;
        this.lists.value[listIndex].items.splice(todoIndex, 1);
        await this.saveTodos();
    }

    async reorderTodos(listIndex: number, from: number, to: number) {
        if (!this.lists.value[listIndex]) return;
        const list = this.lists.value[listIndex];
        const itemToMove = list.items.splice(from, 1)[0];
        list.items.splice(to, 0, itemToMove);
        await this.saveTodos();
    }

    /**
     * Move a single todo from one list to another.
     * The item will be appended to the end of the destination list.
     */
    async moveTodo(fromListIndex: number, todoIndex: number, toListIndex: number) {
        if (fromListIndex === toListIndex) return; // nothing to do
        const fromList = this.lists.value[fromListIndex];
        const toList = this.lists.value[toListIndex];
        if (!fromList || !toList) return;
        if (todoIndex < 0 || todoIndex >= fromList.items.length) return;

        const [item] = fromList.items.splice(todoIndex, 1);
        toList.items.push(item);
        await this.saveTodos();
    }

    async updateTodo(listIndex: number, todoIndex: number, updates: Partial<Pick<TodoItem, 'text' | 'priority' | 'dueDate' | 'category' | 'timeSpent'>>) {
        const list = this.lists.value[listIndex];
        if (!list || !list.items[todoIndex]) return;

        const item = list.items[todoIndex];
        const oldText = item.text;

        if (updates.text !== undefined) item.text = updates.text;
        if (updates.priority !== undefined) item.priority = updates.priority || undefined;
        if (updates.dueDate !== undefined) item.dueDate = updates.dueDate || undefined;
        if (updates.category !== undefined) item.category = updates.category || undefined;
        if (updates.timeSpent !== undefined) item.timeSpent = updates.timeSpent;

        // If the text changed, update the game tracking file to keep IDs in sync
        if (this.gameTracker && updates.text !== undefined && oldText !== updates.text) {
            try {
                await this.gameTracker.rename(oldText, updates.text);
            } catch (e) {
                console.warn('TodoService: failed to update game tracker on rename', e);
            }
        }

        await this.saveTodos();
    }

    async renameList(listIndex: number, newName: string) {
        if (!newName.trim()) return;
        if (!this.lists.value[listIndex]) return;

        this.lists.value[listIndex].name = newName.trim();
        await this.saveTodos();
    }

    /**
     * Returns true if the list can be deleted directly:
     *  - when it has no items
     *  - or when all items are completed
     */
    canDeleteList(listIndex: number): boolean {
        const list = this.lists.value[listIndex];
        if (!list) return false;
        if (list.items.length === 0) return true;
        return list.items.every(i => i.completed);
    }

    /**
     * Remove the list at the given index (no checks). Caller should validate conditions.
     */
    async removeList(listIndex: number) {
        if (!this.lists.value[listIndex]) return;
        this.lists.value.splice(listIndex, 1);
        await this.saveTodos();
    }

    /**
     * Move all incomplete (active) todos from one list to another.
     */
    async moveIncompleteTodos(fromIndex: number, toIndex: number) {
        const from = this.lists.value[fromIndex];
        const to = this.lists.value[toIndex];
        if (!from || !to) return;

        const remaining: TodoItem[] = [];
        for (const item of from.items) {
            if (item.completed) {
                remaining.push(item);
            } else {
                to.items.push(item);
            }
        }
        from.items = remaining;
        await this.saveTodos();
    }

    /**
     * Helper: move incomplete todos to target list, then remove the source list.
     */
    async removeListWithMove(listIndex: number, targetIndex: number) {
        if (listIndex === targetIndex) return;
        await this.moveIncompleteTodos(listIndex, targetIndex);
        // After moving, delete the (now possibly empty or completed-only) list
        await this.removeList(listIndex);
    }

    async updateTimeSpent(listIndex: number, todoIndex: number, minutes: number) {
        const list = this.lists.value[listIndex];
        if (!list || !list.items[todoIndex]) return;

        const item = list.items[todoIndex];
        item.timeSpent = (item.timeSpent || 0) + minutes;
        await this.saveTodos();
    }

    private async saveTodos() {
        if (!this.dropbox.isAuthenticated()) return;

        let content = '';

        for (const list of this.lists.value) {
            content += `# ${list.name}\n`;
            for (const item of list.items) {
                content += this.reconstructTodoLine(item) + '\n';
            }
            content += '\n';
        }

        await this.dropbox.writeFile(this.FILE_PATH, content.trim());
    }

    private reconstructTodoLine(item: TodoItem): string {
        // Reconstructs the raw line from properties
        let line = '';

        if (item.completed) {
            line += 'x ';
            if (item.completedDate) {
                line += `${item.completedDate} `;
            }
        }

        if (item.priority) {
            line += `(${item.priority}) `;
        }

        // The 'text' field currently might still contain 'due:...' if we didn't strip it effectively
        // or if we want to preserve other tags.
        // If we stripped 'due:' from item.text in parse, we must add it back here.
        // In parseTodoLine I decided to strip it. So I must add it back.

        line += item.text;

        if (item.dueDate) {
            // Check if it's already in text to avoid duplication (simple check)
            if (!item.text.includes(`due:${item.dueDate}`)) {
                line += ` due:${item.dueDate}`;
            }
        }

        if (item.category) {
            line += ` cat:${item.category}`;
        }

        if (item.timeSpent !== undefined && item.timeSpent > 0) {
            line += ` spent:${item.timeSpent}`;
        }

        return line.trim();
    }

    isOverdue(dateStr?: string): boolean {
        if (!dateStr) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateStr < today;
    }

    isDueToday(dateStr?: string): boolean {
        if (!dateStr) return false;
        const today = new Date().toISOString().split('T')[0];
        return dateStr === today;
    }

    async archiveCompletedTodos() {
        if (!this.dropbox.isAuthenticated()) return;

        const completedItems: string[] = [];
        let hasChanges = false;

        // 1. Collect completed items and remove them from lists
        for (const list of this.lists.value) {
            const activeItems: TodoItem[] = [];
            for (const item of list.items) {
                if (item.completed) {
                    completedItems.push(this.reconstructTodoLine(item));
                    hasChanges = true;
                } else {
                    activeItems.push(item);
                }
            }
            list.items = activeItems;
        }

        if (!hasChanges) return;

        // 2. Append to done.txt
        if (completedItems.length > 0) {
            const doneContent = completedItems.join('\n') + '\n';
            // We need to append. Dropbox doesn't natively support append easily in one go without reading first?
            // Actually, for simplicity and correctness with the current service structure:
            // We should probably read done.txt, append, and write back.
            // OR check if the DropboxService has an append method.
            // Looking at the file list, I don't see the content of DropboxService, but usually it's read/write.
            // Let's assume we need to read-modify-write for now to be safe, or just write if it doesn't exist.

            try {
                let currentDone = '';
                try {
                    currentDone = await this.dropbox.readFile('/done.txt');
                } catch (e) {
                    // File might not exist, that's fine
                }

                const newDoneContent = currentDone + (currentDone && !currentDone.endsWith('\n') ? '\n' : '') + doneContent;
                await this.dropbox.writeFile('/done.txt', newDoneContent);
            } catch (error) {
                console.error('Error archiving to done.txt:', error);
                // If we fail to archive, we probably shouldn't save the deletion from todo.txt?
                // But for now, let's proceed or throw.
                throw error;
            }
        }

        // 3. Save updated todo.txt
        await this.saveTodos();
    }

    /**
     * Loads completed tasks from /done.txt in Dropbox and returns them as TodoItem[]
     * This is read-only; it does not modify in-memory lists.
     * If the file does not exist or the user is not authenticated, returns an empty array.
     */
    async loadDoneItems(): Promise<TodoItem[]> {
        const donePath = '/done.txt';
        const items: TodoItem[] = [];
        if (!this.dropbox.isAuthenticated()) return items;
        let content = '';
        try {
            content = await this.dropbox.readFile(donePath);
        } catch (e) {
            // File may not exist yet; treat as empty
            return items;
        }
        const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0 && !l.startsWith('#'));
        for (const line of lines) {
            items.push(this.parseTodoLine(line));
        }
        return items;
    }
}
