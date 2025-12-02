import { Dropbox, DropboxAuth } from 'dropbox';

const CLIENT_ID = 'YOUR_DROPBOX_APP_KEY'; // This will be set by the user
const REDIRECT_URI = window.location.origin + '/auth';

export class DropboxService {
  private dbx: Dropbox | null = null;
  private auth: DropboxAuth;
  private clientId: string;

  constructor(clientId: string) {
    this.clientId = clientId;
    this.auth = new DropboxAuth({
      clientId: this.clientId,
    });

    const accessToken = localStorage.getItem('dropbox_access_token');
    if (accessToken) {
      this.dbx = new Dropbox({ accessToken });
    }
  }

  async getAuthenticationUrl(): Promise<string> {
    // @ts-ignore
    return this.auth.getAuthenticationUrl(REDIRECT_URI, undefined, 'token', 'code', undefined, undefined, true);
  }

  handleAuthCallback(hash: string) {
    const params = new URLSearchParams(hash.substring(1));
    const accessToken = params.get('access_token');
    if (accessToken) {
      localStorage.setItem('dropbox_access_token', accessToken);
      this.dbx = new Dropbox({ accessToken });
      return true;
    }
    return false;
  }

  isAuthenticated(): boolean {
    return !!this.dbx;
  }

  logout() {
    localStorage.removeItem('dropbox_access_token');
    this.dbx = null;
  }

  async listFiles(path: string = '') {
    if (!this.dbx) throw new Error('Not authenticated');
    return this.dbx.filesListFolder({ path });
  }

  async readFile(path: string): Promise<string> {
    if (!this.dbx) throw new Error('Not authenticated');
    try {
      const response = await this.dbx.filesDownload({ path });
      // @ts-ignore
      const fileBlob = response.result.fileBlob;
      return await fileBlob.text();
    } catch (error: any) {
      // If file not found, return empty string
      if (error.status === 409) {
        return '';
      }
      throw error;
    }
  }

  async writeFile(path: string, content: string) {
    if (!this.dbx) throw new Error('Not authenticated');
    try {
      const blob = new Blob([content], { type: 'text/plain' });
      return await this.dbx.filesUpload({
        path,
        contents: blob,
        mode: { '.tag': 'overwrite' }
      });
    } catch (error: any) {
      console.error('Dropbox upload error:', error);
      if (error.error) {
        console.error('Dropbox error details:', JSON.stringify(error.error));
      }
      throw error;
    }
  }
}
