import { ref } from 'vue';
import { DropboxService } from './DropboxService';

export interface TodoList {
    name: string;
    items: string[];
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
                    currentList.items.push(line);
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

    async addTodo(listIndex: number, todo: string) {
        if (!todo.trim()) return;
        if (!this.lists.value[listIndex]) return;

        this.lists.value[listIndex].items.push(todo.trim());
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

    private async saveTodos() {
        if (!this.dropbox.isAuthenticated()) return;

        let content = '';

        for (const list of this.lists.value) {
            content += `# ${list.name}\n`;
            content += list.items.join('\n');
            content += '\n';
        }

        await this.dropbox.writeFile(this.FILE_PATH, content.trim());
    }
}
