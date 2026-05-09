import axios from 'axios';

// API base URL resolution:
//   1. VITE_API_URL env var (set at build time) — overrides everything
//   2. In dev (npm run dev) → '/api' — Vite dev server proxies to backend
//   3. In production build → derive from current page hostname + backend port (8088)
//
// In Docker the backend is exposed on port 8088 directly (no nginx proxy), so the
// browser calls e.g. http://192.168.1.10:8088/api/... cross-origin. CORS is enabled
// on the backend (cors() middleware) so this works out-of-the-box.
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '8088';
const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV
    ? '/api'
    : `${window.location.protocol}//${window.location.hostname}:${BACKEND_PORT}/api`);

const api = axios.create({
  baseURL: API_BASE,
});

// Backend origin (no /api suffix) — for building absolute URLs to /uploads/* assets.
const BACKEND_ORIGIN = API_BASE.replace(/\/api\/?$/, '');

// Convert a backend-served path like "/uploads/products/xxx.jpg" into an absolute URL
// that the browser can fetch directly from the backend container.
export function assetUrl(path) {
  if (!path) return path;
  if (/^https?:\/\//i.test(path)) return path; // already absolute
  if (!path.startsWith('/')) path = '/' + path;
  return BACKEND_ORIGIN + path;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;

export const formatBDT = (n) => {
  if (n == null || isNaN(n)) return '৳0';
  return '৳' + Number(n).toLocaleString('en-IN', { maximumFractionDigits: 2 });
};

export const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr.replace(' ', 'T') + (dateStr.includes('Z') ? '' : 'Z'));
  return d.toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatDateOnly = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
