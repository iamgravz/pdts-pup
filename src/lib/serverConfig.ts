// Manages the user-configurable backend server address for the standalone APK build.
// Stored in localStorage so it survives app restarts without needing a rebuild.

const STORAGE_KEY = 'pdts_server_base_url';

export function getSavedServerUrl(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setSavedServerUrl(url: string): void {
  try {
    const cleaned = url.trim().replace(/\/$/, '');
    localStorage.setItem(STORAGE_KEY, cleaned);
  } catch {
    // no-op if storage is unavailable
  }
}

export function clearSavedServerUrl(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // no-op
  }
}