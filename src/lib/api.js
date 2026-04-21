import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
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

api.interceptors.response.use(
  res => res,
  async err => {
    const original = err.config;

    // Seulement si TOKEN_EXPIRED côté serveur, pas pour d'autres 401
    const isTokenExpired = err.response?.status === 401 &&
      err.response?.data?.code === 'TOKEN_EXPIRED';

    if (isTokenExpired && !original._retry) {
      original._retry = true;

      // Éviter les rafraîchissements simultanés (multiples requêtes en parallèle)
      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshSubscribers.push((token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }

      isRefreshing = true;
      try {
        const refresh = localStorage.getItem('refreshToken');
        if (!refresh) throw new Error('Pas de refresh token');

        const { data } = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/refresh`,
          { refreshToken: refresh }
        );

        const newAccess  = data.data.accessToken;
        const newRefresh = data.data.refreshToken;

        localStorage.setItem('accessToken',  newAccess);
        localStorage.setItem('refreshToken', newRefresh);

        original.headers.Authorization = `Bearer ${newAccess}`;
        onRefreshed(newAccess);

        return api(original);
      } catch (refreshErr) {
        // Le refresh a VRAIMENT échoué (token invalide ou expiré depuis > 30j)
        refreshSubscribers = [];
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    // Pour les autres erreurs 401 (mauvais password, user inactif...), ne pas toucher au localStorage
    return Promise.reject(err);
  }
);

export default api;
