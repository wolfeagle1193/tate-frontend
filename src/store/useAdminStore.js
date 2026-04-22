import { create } from 'zustand';
import api from '../lib/api';

// Instance axios qui accepte multipart/form-data
const apiMultipart = (url, formData) =>
  api.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

export const useAdminStore = create((set) => ({
  stats:           null,
  users:           [],
  matieres:        [],
  chapitres:       [],
  leconsEnAttente: [],
  qcms:            [],
  loadingQCM:      false,
  loading:         false,
  error:           null,

  chargerStats: async () => {
    try {
      const { data } = await api.get('/stats/admin');
      set({ stats: data.data });
    } catch (e) {
      console.error('Erreur stats:', e.message);
    }
  },

  chargerUsers: async () => {
    try {
      const { data } = await api.get('/users');
      set({ users: data.data });
    } catch (e) {
      console.error('Erreur users:', e.message);
    }
  },

  creerUser: async (payload) => {
    const { data } = await api.post('/users', payload);
    set(s => ({ users: [data.data, ...s.users] }));
    return data.data;
  },

  toggleUserActif: async (id, actif) => {
    await api.put(`/users/${id}`, { actif });
    set(s => ({ users: s.users.map(u => u._id === id ? { ...u, actif } : u) }));
  },

  chargerMatieres: async () => {
    try {
      const { data } = await api.get('/matieres');
      set({ matieres: data.data });
    } catch (e) {
      console.error('Erreur matieres:', e.message);
    }
  },

  creerMatiere: async (payload) => {
    const { data } = await api.post('/matieres', payload);
    set(s => ({ matieres: [...s.matieres, data.data] }));
    return data.data;
  },

  chargerChapitres: async (filters = {}) => {
    try {
      const params = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/chapitres?${params}`);
      set({ chapitres: data.data });
    } catch (e) {
      console.error('Erreur chapitres:', e.message);
    }
  },

  creerChapitre: async (payload) => {
    const { data } = await api.post('/chapitres', payload);
    set(s => ({ chapitres: [...s.chapitres, data.data] }));
    return data.data;
  },

  modifierChapitre: async (id, payload) => {
    const { data } = await api.put(`/chapitres/${id}`, payload);
    set(s => ({ chapitres: s.chapitres.map(c => c._id === id ? data.data : c) }));
  },

  // Upload 1 ou plusieurs documents de référence IA pour un chapitre
  uploaderDocsChapitre: async (chapitreId, fichiers) => {
    const formData = new FormData();
    fichiers.forEach(f => formData.append('documents', f));
    const { data } = await apiMultipart(`/chapitres/${chapitreId}/upload-doc`, formData);
    // Mettre à jour le chapitre dans le store avec les docs frais
    set(s => ({
      chapitres: s.chapitres.map(c => c._id === chapitreId ? data.data.chapitre : c),
    }));
    return data.data;
  },

  // Supprimer un document de référence IA (par son index dans le tableau)
  supprimerDocChapitre: async (chapitreId, docIndex) => {
    const { data } = await api.delete(`/chapitres/${chapitreId}/documents/${docIndex}`);
    set(s => ({
      chapitres: s.chapitres.map(c => c._id === chapitreId ? data.data.chapitre : c),
    }));
    return data.data;
  },

  chargerLeconsEnAttente: async () => {
    try {
      const { data } = await api.get('/lecons?statut=en_preparation');
      set({ leconsEnAttente: data.data });
    } catch (e) {
      console.error('Erreur lecons:', e.message);
    }
  },

  validerLecon: async (id) => {
    await api.put(`/lecons/${id}/valider`);
    set(s => ({ leconsEnAttente: s.leconsEnAttente.filter(l => l._id !== id) }));
  },

  chargerQCMs: async (params = {}) => {
    set({ loadingQCM: true });
    try {
      const queryStr = new URLSearchParams(params).toString();
      const { data } = await api.get(`/qcm${queryStr ? '?' + queryStr : ''}`);
      set({ qcms: data.data, loadingQCM: false });
    } catch (e) {
      console.error('Erreur QCMs:', e.message);
      set({ loadingQCM: false });
    }
  },

  genererQCM: async (payload) => {
    const { data } = await api.post('/qcm/generer', payload);
    set(s => ({ qcms: [data.data, ...s.qcms] }));
    return data.data;
  },

  transformerExercicesQCM: async (payload) => {
    const { data } = await api.post('/qcm/transformer-exercices', payload);
    set(s => ({ qcms: [data.data, ...s.qcms] }));
    return data.data;
  },

  importerQCMdepuisHTML: async (payload) => {
    const { data } = await api.post('/qcm/depuis-html', payload);
    set(s => ({ qcms: [data.data, ...s.qcms] }));
    return data.data;
  },

  validerQCM: async (id) => {
    const { data } = await api.put(`/qcm/${id}/valider`, {});
    set(s => ({ qcms: s.qcms.map(q => q._id === id ? data.data : q) }));
  },

  supprimerQCM: async (id) => {
    await api.delete(`/qcm/${id}`);
    set(s => ({ qcms: s.qcms.filter(q => q._id !== id) }));
  },
}));