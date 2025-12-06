import { DropboxService } from './DropboxService';
import { TodoService } from './TodoService';

// Use real Dropbox App Key; redirect is chosen automatically based on platform
export const dropboxService = new DropboxService('a318e6pi24hal9y');
export const todoService = new TodoService(dropboxService);
