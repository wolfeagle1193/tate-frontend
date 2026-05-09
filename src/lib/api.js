import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── helpers localStorage sécurisés (Safari privé lève SecurityError) ──
const lsGet = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
const lsSet = (key, val) => { try { localStorage.setItem(key, val); } catch { /* silencieux */ } };
const lsRemove = (...keys) => { try { keys.forEach(k => localStorage.removeItem(k)); } catch { /* silencieux */ } };

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT à chaque requête
api.interceptors.request.use(cfg => {
  const token = lsGet('accessToken');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// Gérer l'expiration du token automatiquement
let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = (token) => {
  refreshSubscribers.forEach(cb => cb(token));
  refreshSubscribers = [];
};

const doRefresh = async () => {
  const refresh = lsGet('refreshToken');
  if (!refresh) throw new Error('Pas de refresh token');
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
  const newAccess  = data.data.accessToken;
  const newRefresh = data.data.refreshToken;
  lsSet('accessToken',  newAccess);
  lsSet('refreshToken', newRefresh);
  return newAccess;
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    const status = err.response?.status;
    const url    = original?.url || '';
    const isAuthRoute = url.includes('/auth/login') || url.includes('/auth/refresh');

    const shouldRefresh = status === 401 && !isAuthRoute && !original._retry;

    if (shouldRefresh) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshSubscribers.push((token) => {
            if (token) {
              original.headers.Authorization = `Bearer ${token}`;
              resolve(api(original));
            } else {
              reject(err);
            }
          });
        });
      }

      isRefreshing = true;
      try {
        const newToken = await doRefresh();
        original.headers.Authorization = `Bearer ${newToken}`;
        onRefreshed(newToken);
        return api(original);
      } catch (refreshErr) {
        refreshSubscribers = [];
        onRefreshed(null);

        const refreshStatus = refreshErr?.response?.status;
        const isHardLogout = refreshStatus === 401 || refreshStatus === 403;

        if (isHardLogout) {
          lsRemove('accessToken', 'refreshToken', 'user');
          if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
          }
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ── Vérification proactive au démarrage ──────────────────────
export const proactiveTokenRefresh = async () => {
  try {
    const token = lsGet('accessToken');
    if (!token) return;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now();
    if (expiresIn < 7 * 24 * 60 * 60 * 1000) {
      await doRefresh();
    }
  } catch {
    // Silencieux
  }
};

export default api;
