import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set, get) => ({
  user:    JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error:   null,

  // ── Mettre à jour l'utilisateur localement (après validation QCM, etc.)
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  // ── Rafraîchir le profil utilisateur depuis l'API (chapitresValides à jour)
  rafraichirUser: async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;
      const { data } = await api.get('/auth/me');
      const user = data.data;
      localStorage.setItem('user', JSON.stringify(user));
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
    // Éviter les doublons
    const exists = chapitresValides.some(
      c => String(c.chapitreId) === String(chapitreValide.chapitreId)
    );
    const updated = exists
      ? chapitresValides.map(c =>
          String(c.chapitreId) === String(chapitreValide.chapitreId) ? chapitreValide : c
        )
      : [...chapitresValides, chapitreValide];

    const updatedUser = { ...current, chapitresValides: updated };
    localStorage.setItem('user', JSON.stringify(updatedUser));
    set({ user: updatedUser });
  },

  login: async (identifiant, password, mode = 'email') => {
    set({ loading: true, error: null });
    try {
      const payload = mode === 'telephone'
        ? { telephone: identifiant, password }
        : { email: identifiant, password };
      const { data } = await api.post('/auth/login', payload);
      localStorage.setItem('accessToken',  data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      localStorage.setItem('user',         JSON.stringify(data.data.user));
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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null });
  },
}));
