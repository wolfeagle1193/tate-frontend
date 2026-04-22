import { create } from 'zustand';
import api from '../lib/api';

export const useProfStore = create((set, get) => ({
  classes:       [],
  eleves:        [],
  chapitres:     [],
  mesLecons:     [],
  leconEnCours:  null,   // leçon en cours de préparation
  preparation:   null,   // résultat retourné par Claude
  loading:       false,
  loadingIA:     false,

  // ── Mes classes ─────────────────────────────
  chargerClasses: async () => {
    const { data } = await api.get('/classes/mes-classes');
    set({ classes: data.data });
  },

  // ── Élèves d'une classe ──────────────────────
  chargerEleves: async (classeId) => {
    const { data } = await api.get(`/users?classeId=${classeId}`);
    set({ eleves: data.data });
  },

  // ── Chapitres disponibles ────────────────────
  chargerChapitres: async (niveau, matiereId) => {
    const params = new URLSearchParams({ niveau, ...(matiereId && { matiereId }) }).toString();
    const { data } = await api.get(`/chapitres?${params}`);
    set({ chapitres: data.data });
  },

  // ── Mes leçons ──────────────────────────────
  chargerMesLecons: async () => {
    const { data } = await api.get('/lecons/mes-lecons');
    set({ mesLecons: data.data });
  },

  // ── Préparer un cours avec Claude ───────────
  // payload peut contenir : { chapitreId, contenuBrut, formStructure, promptProf, fichiers[] }
  preparerCours: async (payload) => {
    set({ loadingIA: true, preparation: null });
    try {
      const { fichiers = [], promptProf = '', contenuBrut, formStructure, chapitreId } = payload;

      let response;

      if (fichiers.length > 0) {
        // Envoi multipart/form-data — multer côté serveur gère les fichiers + les champs texte
        const formData = new FormData();
        formData.append('chapitreId', chapitreId);
        if (contenuBrut)   formData.append('contenuBrut', contenuBrut);
        if (promptProf)    formData.append('promptProf', promptProf);
        if (formStructure) formData.append('formStructure', JSON.stringify(formStructure));
        fichiers.forEach(f => formData.append('documents', f));
        const { data } = await api.post('/lecons/preparer', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        response = data;
      } else {
        // Envoi JSON classique (pas de fichiers)
        const { data } = await api.post('/lecons/preparer', {
          chapitreId, contenuBrut, formStructure, promptProf,
        });
        response = data;
      }

      set({ preparation: response.data, loadingIA: false });
      return response.data;
    } catch (e) {
      set({ loadingIA: false });
      throw e;
    }
  },

  // ── Créer un cours depuis un fichier HTML (rendu tel quel, avec IA optionnelle) ─
  preparerCoursHTML: async ({
    chapitreId, contenuHTML, exercices,
    instructionsHTML = '', instructionsExos = '', genererExos = false,
  }) => {
    set({ loadingIA: true, preparation: null });
    try {
      const { data } = await api.post('/lecons/creer-html', {
        chapitreId, contenuHTML, exercices,
        instructionsHTML, instructionsExos, genererExos,
      });
      set({ preparation: { ...data.data, source: 'html' }, loadingIA: false });
      return data.data;
    } catch (e) {
      set({ loadingIA: false });
      throw e;
    }
  },

  // ── Créer un cours manuellement (blocs structurés, sans Claude) ─
  preparerCoursManuel: async ({ chapitreId, contenuStructure }) => {
    set({ loadingIA: true, preparation: null });
    try {
      const { data } = await api.post('/lecons/creer-manuel', { chapitreId, contenuStructure });
      set({ preparation: { ...data.data, source: 'manuel' }, loadingIA: false });
      return data.data;
    } catch (e) {
      set({ loadingIA: false });
      throw e;
    }
  },

  // ── Valider et publier une leçon ─────────────
  validerLecon: async (leconId) => {
    await api.put(`/lecons/${leconId}/valider`);
    set(s => ({
      mesLecons: s.mesLecons.map(l =>
        l._id === leconId ? { ...l, statut: 'publie' } : l
      ),
      preparation: null,
    }));
  },

  // ── Progression d'un élève ───────────────────
  chargerProgressionEleve: async (eleveId) => {
    const { data } = await api.get(`/stats/eleve/${eleveId}`);
    return data.data;
  },

  resetPreparation: () => set({ preparation: null }),
}));