import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Injecter le token JWT à chaque requête
api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken');
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
  const refresh = localStorage.getItem('refreshToken');
  if (!refresh) throw new Error('Pas de refresh token');
  const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken: refresh });
  const newAccess  = data.data.accessToken;
  const newRefresh = data.data.refreshToken;
  localStorage.setItem('accessToken',  newAccess);
  localStorage.setItem('refreshToken', newRefresh);
  return newAccess;
};

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // Déclencher le refresh sur TOKEN_EXPIRED OU tout 401 sauf la route login/refresh elle-même
    const status = err.response?.status;
    const code   = err.response?.data?.code;
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
        // Le refresh a échoué — déconnecter proprement
        refreshSubscribers = [];
        onRefreshed(null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        // Rediriger vers login uniquement si on n'y est pas déjà
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

// ── Vérification proactive au démarrage de l'app ──────────────
// Décode le JWT localement pour voir s'il expire dans les 3 prochains jours
// Si oui, on rafraîchit silencieusement sans attendre une erreur 401
export const proactiveTokenRefresh = async () => {
  try {
    const token = localStorage.getItem('accessToken');
    if (!token) return;
    // Décoder le payload (sans vérification de signature, juste pour lire exp)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const expiresIn = payload.exp * 1000 - Date.now(); // ms restantes
    // Rafraîchir si moins de 3 jours restants
    if (expiresIn < 3 * 24 * 60 * 60 * 1000) {
      await doRefresh();
    }
  } catch {
    // Silencieux — le rafraîchissement proactif n'est pas critique
  }
};

export default api;
