import { Dropbox, DropboxAuth } from 'dropbox';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

const WEB_REDIRECT = typeof window !== 'undefined' ? (window.location.origin + '/auth') : 'http://localhost/auth';
// NOTE: This must match the app's registered intent scheme on Android (db-<APP_KEY>://oauth2redirect)
const NATIVE_REDIRECT = 'db-a318e6pi24hal9y://oauth2redirect';

const ACCESS_TOKEN_KEY = 'dropbox_access_token';
const REFRESH_TOKEN_KEY = 'dropbox_refresh_token';
const EXPIRES_AT_KEY = 'dropbox_expires_at';

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
  }

  /**
   * Initialize the SDK client by restoring a previously saved token from
   * platform-appropriate storage. Must be called on app start.
   */
  async init(): Promise<void> {
    try {
      // Load persisted tokens
      const accessToken = await this.getPersisted(ACCESS_TOKEN_KEY);
      const refreshToken = await this.getPersisted(REFRESH_TOKEN_KEY);
      const expiresAtStr = await this.getPersisted(EXPIRES_AT_KEY);
      const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;

      if (refreshToken) {
        // Configure auth with refresh support so the SDK can auto-refresh
        this.auth.setRefreshToken(refreshToken);
      }
      if (accessToken) {
        this.auth.setAccessToken(accessToken);
      }
      if (expiresAt) {
        // @ts-ignore - method exists at runtime in SDK
        this.auth.setAccessTokenExpiresAt?.(expiresAt);
      }

      if (accessToken || refreshToken) {
        // Ensure we have a valid access token; refresh if needed
        await this.ensureValidAccessToken();
        this.dbx = new Dropbox({ auth: this.auth });
      }
    } catch (e) {
      // If storage is unavailable, fail gracefully.
      console.warn('DropboxService init failed to restore token:', e);
    }
  }

  // Build the Dropbox OAuth URL using OAuth 2.0 Code Flow with PKCE and offline access (refresh token)
  // We generate PKCE values manually to ensure the verifier persists across the full-page redirect.
  async getAuthenticationUrl(): Promise<string> {
    const verifier = await this.generateCodeVerifier();
    const challenge = await this.computeCodeChallenge(verifier);
    const state = await this.generateState();

    try {
      sessionStorage.setItem('dbx_pkce_code_verifier', verifier);
      sessionStorage.setItem('dbx_oauth_state', state);
    } catch (_) {
      // Fallback to localStorage if sessionStorage unavailable
      try {
        localStorage.setItem('dbx_pkce_code_verifier', verifier);
        localStorage.setItem('dbx_oauth_state', state);
      } catch (_) {}
    }

    const url = new URL('https://www.dropbox.com/oauth2/authorize');
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('client_id', this.clientId);
    url.searchParams.set('redirect_uri', this.redirectUri);
    url.searchParams.set('code_challenge_method', 'S256');
    url.searchParams.set('code_challenge', challenge);
    url.searchParams.set('token_access_type', 'offline');
    url.searchParams.set('state', state);
    // Scopes as used by the app
    url.searchParams.set('scope', 'account_info.read files.content.read files.content.write files.metadata.read');
    return url.toString();
  }

  async buildAuthUrlForBrowser(): Promise<string> {
    // Prefer SDK method which also manages PKCE state
    return await this.getAuthenticationUrl();
  }

  async handleAuthCallbackFromUrl(fullUrl: string): Promise<boolean> {
    try {
      console.debug('[Dropbox] handleAuthCallbackFromUrl: start', fullUrl);
      const url = new URL(fullUrl);
      // Support both implicit (hash) and code (query) for migration compatibility
      const fragment = url.hash?.startsWith('#') ? url.hash.substring(1) : '';
      const hashParams = new URLSearchParams(fragment);
      const qp = url.searchParams;

      const accessToken = hashParams.get('access_token');
      const error = hashParams.get('error') || qp.get('error');

      if (error) {
        console.error('Dropbox OAuth error:', error);
        return false;
      }

      // Legacy implicit token flow support
      if (accessToken) {
        console.debug('[Dropbox] OAuth callback contains access_token (implicit flow)');
        await this.persist(ACCESS_TOKEN_KEY, accessToken);
        // Implicit tokens are short-lived and have no refresh token. We'll still use it for now.
        this.auth.setAccessToken(accessToken);
        this.dbx = new Dropbox({ auth: this.auth });
        return true;
      }

      // PKCE code flow: exchange code for tokens
      const code = qp.get('code');
      if (code) {
        console.debug('[Dropbox] OAuth callback contains code. Beginning token exchange.');
        try {
          // Retrieve the PKCE code_verifier we saved before redirect
          let verifier: string | null = sessionStorage.getItem('dbx_pkce_code_verifier') || localStorage.getItem('dbx_pkce_code_verifier');

          // Fallback: check other common keys just in case
          if (!verifier) {
            const possibleKeys = ['code_verifier', 'dropbox-auth-csrf-token', 'pkce_code_verifier', 'dbx_code_verifier'];
            for (const k of possibleKeys) {
              verifier = sessionStorage.getItem(k) || localStorage.getItem(k);
              if (verifier) break;
            }
          }

          if (!verifier) {
            console.error('[Dropbox] No code_verifier found in storage. Cannot complete PKCE exchange.');
            return false;
          }

          // Optional: validate state if present
          const retState = qp.get('state');
          if (retState) {
            const saved = sessionStorage.getItem('dbx_oauth_state') || localStorage.getItem('dbx_oauth_state');
            if (saved && saved !== retState) {
              console.warn('[Dropbox] OAuth state mismatch');
            }
          }

          // Perform manual token exchange to avoid SDK internal state issues on reload
          console.debug('[Dropbox] Exchanging code for token via fetch...');
          const body = new URLSearchParams();
          body.append('code', code);
          body.append('grant_type', 'authorization_code');
          body.append('client_id', this.clientId);
          body.append('redirect_uri', this.redirectUri);
          body.append('code_verifier', verifier);

          const response = await fetch('https://api.dropboxapi.com/oauth2/token', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error('[Dropbox] Token exchange failed:', response.status, errorText);
            return false;
          }

          const data = await response.json();
          const { access_token, refresh_token, expires_in } = data;

          console.debug('[Dropbox] Token exchange successful:', {
            has_access_token: !!access_token,
            has_refresh_token: !!refresh_token,
            expires_in
          });

          if (access_token) {
            await this.persist(ACCESS_TOKEN_KEY, access_token);
            this.auth.setAccessToken(access_token);
          }
          if (refresh_token) {
            await this.persist(REFRESH_TOKEN_KEY, refresh_token);
            this.auth.setRefreshToken(refresh_token);
          }
          if (expires_in) {
            const expiresAt = new Date(Date.now() + (expires_in * 1000));
            await this.persist(EXPIRES_AT_KEY, expiresAt.toISOString());
            // @ts-ignore
            this.auth.setAccessTokenExpiresAt?.(expiresAt);
          }

          // Clean up transient PKCE items
          try {
            sessionStorage.removeItem('dbx_pkce_code_verifier');
            sessionStorage.removeItem('dbx_oauth_state');
            localStorage.removeItem('dbx_pkce_code_verifier');
            localStorage.removeItem('dbx_oauth_state');
          } catch (_) {}

          this.dbx = new Dropbox({ auth: this.auth });
          return true;
        } catch (ex) {
          console.error('Failed to exchange code for tokens:', ex);
          return false;
        }
      }

      console.error('Dropbox OAuth: no token or code found in callback');
      return false;
    } catch (e) {
      console.error('Invalid callback URL:', e);
      return false;
    }
  }

  // ----- PKCE helpers -----
  private async generateCodeVerifier(): Promise<string> {
    const bytes = new Uint8Array(32);
    (window.crypto || (window as any).msCrypto).getRandomValues(bytes);
    return this.base64UrlEncode(bytes);
  }

  private async computeCodeChallenge(verifier: string): Promise<string> {
    const enc = new TextEncoder();
    const data = enc.encode(verifier);
    const digest = await crypto.subtle.digest('SHA-256', data);
    return this.base64UrlEncode(new Uint8Array(digest));
  }

  private async generateState(): Promise<string> {
    const bytes = new Uint8Array(16);
    (window.crypto || (window as any).msCrypto).getRandomValues(bytes);
    return this.base64UrlEncode(bytes);
  }

  private base64UrlEncode(bytes: Uint8Array): string {
    let str = '';
    for (let i = 0; i < bytes.length; i++) str += String.fromCharCode(bytes[i]);
    const base64 = btoa(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
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
        if (Capacitor.isNativePlatform()) {
          Preferences.set({ key: 'dropbox_access_token', value: accessToken }).catch(() => {});
        }
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
    // Clear all stored tokens
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(EXPIRES_AT_KEY);
    if (Capacitor.isNativePlatform()) {
      Preferences.remove({ key: ACCESS_TOKEN_KEY }).catch(() => {});
      Preferences.remove({ key: REFRESH_TOKEN_KEY }).catch(() => {});
      Preferences.remove({ key: EXPIRES_AT_KEY }).catch(() => {});
    }
    this.dbx = null;
  }

  async listFiles(path: string = '') {
    if (!this.dbx) throw new Error('Not authenticated');
    return this.dbx.filesListFolder({ path });
  }

  async readFile(path: string): Promise<string> {
    await this.ensureClientReady();
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
    await this.ensureClientReady();
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

  // Ensure SDK client is ready; refresh token if needed
  private async ensureClientReady() {
    await this.ensureValidAccessToken();
    if (!this.dbx) {
      this.dbx = new Dropbox({ auth: this.auth });
    }
  }

  private async ensureValidAccessToken() {
    try {
      // @ts-ignore - method available in SDK for refreshing when expired
      if (typeof this.auth.checkAndRefreshAccessToken === 'function') {
        // Will refresh only if expired
        await this.auth.checkAndRefreshAccessToken();
      } else if (typeof (this.auth as any).refreshAccessToken === 'function') {
        const expiresAtStr = await this.getPersisted(EXPIRES_AT_KEY);
        const expiresAt = expiresAtStr ? new Date(expiresAtStr) : null;
        if (expiresAt && Date.now() > expiresAt.getTime() - 30_000) {
          await (this.auth as any).refreshAccessToken();
          const token = await (this.auth as any).getAccessToken();
          if (token) await this.persist(ACCESS_TOKEN_KEY, token);
          const newExpiry = (this.auth as any).getAccessTokenExpiresAt?.();
          if (newExpiry) await this.persist(EXPIRES_AT_KEY, newExpiry.toISOString());
        }
      }
    } catch (e) {
      // Refresh failed: consider user logged out
      console.warn('Failed to refresh Dropbox access token:', e);
    }
  }

  private async getPersisted(key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key });
      if (value != null) return value;
    }
    const ls = localStorage.getItem(key);
    return ls ?? null;
  }

  private async persist(key: string, value: string): Promise<void> {
    localStorage.setItem(key, value);
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value }).catch(() => {});
    }
  }
}
