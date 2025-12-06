import { Dropbox, DropboxAuth } from 'dropbox';
import { Capacitor } from '@capacitor/core';

const WEB_REDIRECT = typeof window !== 'undefined' ? (window.location.origin + '/auth') : 'http://localhost/auth';
const NATIVE_REDIRECT = 'db-a318e6pi24hal9y://oauth2redirect';

export class DropboxService {
  private dbx: Dropbox | null = null;
  private auth: DropboxAuth;
  private clientId: string;
  private redirectUri: string;

  constructor(clientId: string, redirectUri?: string) {
    this.clientId = clientId;
    // If caller provides explicit redirect, use it; otherwise choose based on platform
    this.redirectUri = redirectUri ?? (Capacitor.isNativePlatform() ? NATIVE_REDIRECT : WEB_REDIRECT);
    this.auth = new DropboxAuth({ clientId: this.clientId });

    const accessToken = localStorage.getItem('dropbox_access_token');
    if (accessToken) {
      this.dbx = new Dropbox({ accessToken });
    }
  }

  // Build the Dropbox OAuth URL (implicit token flow for client-side app)
  getAuthenticationUrl(): string {
    // @ts-expect-error - SDK signature accepts params; runtime is valid
    return this.auth.getAuthenticationUrl(this.redirectUri, undefined, 'token', 'code', undefined, undefined, true);
  }

  buildAuthUrlForBrowser(): string {
    const url = new URL('https://www.dropbox.com/oauth2/authorize');
    url.searchParams.set('response_type', 'token');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    return url.toString();
  }

  handleAuthCallbackFromUrl(fullUrl: string): boolean {
    try {
      const url = new URL(fullUrl);
      const fragment = url.hash?.startsWith('#') ? url.hash.substring(1) : '';
      const params = new URLSearchParams(fragment);
      const accessToken = params.get('access_token');
      const error = params.get('error');

      if (error) {
        console.error('Dropbox OAuth error:', error);
        return false;
      }

      if (accessToken) {
        localStorage.setItem('dropbox_access_token', accessToken);
        this.dbx = new Dropbox({ accessToken });
        return true;
      }

      const code = url.searchParams.get('code');
      if (code) {
        console.warn('Received authorization code, but no token exchange implemented. Use a backend to exchange the code.');
        return false;
      }

      console.error('Dropbox OAuth: no token or code found in callback');
      return false;
    } catch (e) {
      console.error('Invalid callback URL:', e);
      return false;
    }
  }

  // Backward-compatible: original handler that accepted hash only from web
  handleAuthCallback(hash: string): boolean {
    try {
      const params = new URLSearchParams(hash.startsWith('#') ? hash.substring(1) : hash);
      const accessToken = params.get('access_token');
      const error = params.get('error');
      if (error) {
        console.error('Dropbox OAuth error:', error);
        return false;
      }
      if (accessToken) {
        localStorage.setItem('dropbox_access_token', accessToken);
        this.dbx = new Dropbox({ accessToken });
        return true;
      }
      return false;
    } catch (e) {
      console.error('Invalid hash in handleAuthCallback:', e);
      return false;
    }
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
      const fileBlob = (response as any).result.fileBlob;
      return await fileBlob.text();
    } catch (error: any) {
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
