import { ref } from 'vue';
import { DropboxService } from './DropboxService';

export class TodoService {
    private dropbox: DropboxService;
    public todos = ref<string[]>([]);
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
            this.todos.value = content.split('\n').filter(line => line.trim().length > 0);
        } catch (error) {
            console.error('Error loading todos:', error);
        }
    }

    async addTodo(todo: string) {
        if (!todo.trim()) return;
        this.todos.value.push(todo.trim());
        await this.saveTodos();
    }

    async removeTodo(index: number) {
        this.todos.value.splice(index, 1);
        await this.saveTodos();
    }

    private async saveTodos() {
        if (!this.dropbox.isAuthenticated()) return;
        const content = this.todos.value.join('\n');
        await this.dropbox.writeFile(this.FILE_PATH, content);
    }
}
