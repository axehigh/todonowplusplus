import { DropboxService } from './DropboxService';
import { TodoService } from './TodoService';

// Default to empty client ID, user must provide it
export const dropboxService = new DropboxService('');
export const todoService = new TodoService(dropboxService);
