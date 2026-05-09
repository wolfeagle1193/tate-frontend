import { create } from 'zustand';
import api from '../lib/api';

// ── Helpers localStorage sécurisés (Safari privé lève SecurityError) ──
const lsGet = (key, fallback = null) => {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
};
const lsSet = (key, value) => {
  try { localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)); }
  catch { /* quota dépassé ou privé — silencieux */ }
};
const lsRemove = (...keys) => {
  try { keys.forEach(k => localStorage.removeItem(k)); }
  catch { /* silencieux */ }
};
const lsGetRaw = (key) => {
  try { return localStorage.getItem(key); }
  catch { return null; }
};

export const useAuthStore = create((set, get) => ({
  user:    lsGet('user'),
  loading: false,
  error:   null,

  // ── Mettre à jour l'utilisateur localement (après validation QCM, etc.)
  setUser: (user) => {
    lsSet('user', user);
    set({ user });
  },

  // ── Rafraîchir le profil utilisateur depuis l'API (chapitresValides à jour)
  rafraichirUser: async () => {
    try {
      const token = lsGetRaw('accessToken');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      const user = data.data;
      lsSet('user', user);
      set({ user });
      return user;
    } catch {
      // Silencieux — ne pas déconnecter si simple erreur réseau
    }
  },

  // ── Mettre à jour uniquement les chapitresValides dans le state local
  ajouterChapitreValide: (chapitreValide) => {
    const current = get().user;
    if (!current) return;
    const chapitresValides = current.chapitresValides || [];
    const exists = chapitresValides.some(
      c => String(c.chapitreId) === String(chapitreValide.chapitreId)
    );
    const updated = exists
      ? chapitresValides.map(c =>
          String(c.chapitreId) === String(chapitreValide.chapitreId) ? chapitreValide : c
        )
      : [...chapitresValides, chapitreValide];

    const updatedUser = { ...current, chapitresValides: updated };
    lsSet('user', updatedUser);
    set({ user: updatedUser });
  },

  login: async (identifiant, password, mode = 'email') => {
    set({ loading: true, error: null });
    try {
      const payload = mode === 'telephone'
        ? { telephone: identifiant, password }
        : { email: identifiant, password };
      const { data } = await api.post('/auth/login', payload);
      lsSet('accessToken',  data.data.accessToken);
      lsSet('refreshToken', data.data.refreshToken);
      lsSet('user',         data.data.user);
      set({ user: data.data.user, loading: false });
      return data.data.user;
    } catch (e) {
      set({ error: e.response?.data?.error || 'Erreur de connexion', loading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (_e) {
      // Déconnexion locale même si l'API échoue
    }
    lsRemove('accessToken', 'refreshToken', 'user');
    set({ user: null });
  },
}));
