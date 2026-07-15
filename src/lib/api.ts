import { getSavedServerUrl } from './serverConfig';

const fallbackBaseUrl = '';

function getApiBaseUrl(): string {
  const saved = getSavedServerUrl();
  if (saved) return saved;
  return (import.meta.env.VITE_API_BASE_URL || fallbackBaseUrl).replace(/\/$/, '');
}

export function apiUrl(path: string): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${getApiBaseUrl()}${normalizedPath}`;
}

export function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  return fetch(apiUrl(path), options);
}