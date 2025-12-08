import { DropboxService } from './DropboxService';

/**
 * Tracks which task IDs (we use the task text as ID) have already awarded points.
 * Data is stored in Dropbox at /game_track.txt with one ID per line.
 */
export class GameTrackService {
  private dropbox: DropboxService;
  private readonly FILE_PATH = '/game_track.txt';
  private loaded = false;
  private ids = new Set<string>();

  constructor(dropbox: DropboxService) {
    this.dropbox = dropbox;
  }

  private async ensureLoaded() {
    if (this.loaded) return;
    this.loaded = true;
    if (!this.dropbox.isAuthenticated()) return;
    try {
      const content = await this.dropbox.readFile(this.FILE_PATH);
      content
        .split('\n')
        .map(l => l.trim())
        .filter(l => l.length > 0)
        .forEach(l => this.ids.add(l));
    } catch (e) {
      // Missing file is fine; treat as empty
    }
  }

  private async save() {
    if (!this.dropbox.isAuthenticated()) return;
    try {
      const lines = Array.from(this.ids.values()).sort((a, b) => a.localeCompare(b));
      const content = lines.join('\n');
      await this.dropbox.writeFile(this.FILE_PATH, content);
    } catch (e) {
      console.warn('GameTrackService: failed to save tracking file', e);
    }
  }

  /** Returns true if the ID exists in the tracking set */
  async has(id: string): Promise<boolean> {
    await this.ensureLoaded();
    return this.ids.has(id);
  }

  /** Adds the ID if absent. Returns true if it was newly added. */
  async add(id: string): Promise<boolean> {
    await this.ensureLoaded();
    if (this.ids.has(id)) return false;
    this.ids.add(id);
    await this.save();
    return true;
  }

  /** If the oldId exists, replace it with newId. No-op otherwise. */
  async rename(oldId: string, newId: string): Promise<void> {
    if (oldId === newId) return;
    await this.ensureLoaded();
    if (!this.ids.has(oldId)) return;
    this.ids.delete(oldId);
    this.ids.add(newId);
    await this.save();
  }
}
