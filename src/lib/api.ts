// src/lib/api.ts

export const API_BASE = import.meta.env.VITE_API_URL || '';

export function apiUrl(path: string) {
  if (!path.startsWith('/')) path = '/' + path;
  // Use full URL in production, relative in dev
  return API_BASE ? `${API_BASE}${path}` : path;
}
