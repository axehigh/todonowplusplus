import { DropboxService } from './DropboxService';
import { TodoService } from './TodoService';
import { gamificationService } from './GamificationService';
import { GameTrackService } from './GameTrackService';

// Use real Dropbox App Key; redirect is chosen automatically based on platform
export const dropboxService = new DropboxService('a318e6pi24hal9y');
export const todoService = new TodoService(dropboxService);
export const gameTrackService = new GameTrackService(dropboxService);
gamificationService.setTracker(gameTrackService);
// Allow TodoService to propagate renames to the tracker
todoService.setGameTracker(gameTrackService);
export { gamificationService };
