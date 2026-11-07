const trimTrailingSlashes = (url = '') => url.replace(/\/+$/, '');

export const BACKEND_URL = trimTrailingSlashes(import.meta.env.VITE_API_URL || '');
export const FRONTEND_URL = trimTrailingSlashes(
  import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : '')
);
export const API_BASE_URL = import.meta.env.DEV ? '' : BACKEND_URL;
