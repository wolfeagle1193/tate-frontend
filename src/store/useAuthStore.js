import { create } from 'zustand';
import api from '../lib/api';

export const useAuthStore = create((set) => ({
  user:    JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error:   null,

  // Utilisé après inscription directe (Register pages)
  setUser: (user) => {
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },

  login: async (identifiant, password, mode = 'email') => {
    set({ loading: true, error: null });
    try {
      // mode peut être 'email' ou 'telephone'
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
    localStorage.clear();
    set({ user: null });
  },
}));