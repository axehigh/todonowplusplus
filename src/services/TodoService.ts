import { ref } from 'vue';
import { DropboxService } from './DropboxService';

export interface TodoItem {
    raw: string;
    text: string;
    completed: boolean;
    completedDate?: string;
    priority?: string;
    dueDate?: string;
    projects: string[];
    contexts: string[];
}

export interface TodoList {
    name: string;
    items: TodoItem[];
}

export class TodoService {
    private dropbox: DropboxService;
    public lists = ref<TodoList[]>([]);
    private readonly FILE_PATH = '/todo.txt';

    constructor(dropbox: DropboxService) {
        this.dropbox = dropbox;
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
            // We keep metadata in text for now to preserve it on save, 
            // or we can strip it for display. Let's strip for cleaner display but keep in raw.
            item.text = item.text.replace(dueRegex, '').trim();
            // Note: Stripping might make editing harder if we don't reconstruct perfectly.
            // For this version, let's KEEP it in the text for simplicity of editing, 
            // but UI can choose to hide it.
            // Actually, let's strip it from 'text' for the UI, but reconstruction needs care.
            // Let's stick to: 'text' is the display text.
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

        return line.trim();
    }
}
