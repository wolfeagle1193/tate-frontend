// ─────────────────────────────────────────────
// src/store/useEleveStore.js
// Flux simplifié : accueil → cours HTML plein écran → score
// ─────────────────────────────────────────────
import { create } from 'zustand';
import api from '../lib/api';

export const useEleveStore = create((set, get) => ({
  chapitres:    [],
  chapitreActif: null,
  leconActive:  null,
  chargement:   false,
  // ── Code matière à restaurer quand on revient d'un chapitre ──
  matiereRetour: null,

  // ── Persistance de l'état exercice (réponses cochées) ────────
  exerciceState: {}, // { [chapitreId]: { phase: 'cours'|'exercices', answers: {[name]: value} } }

  sauvegarderEtatExercice: (chapitreId, phase, answers) =>
    set(s => ({
      exerciceState: {
        ...s.exerciceState,
        [chapitreId]: { phase, answers: answers || {} },
      },
    })),

  effacerEtatExercice: (chapitreId) =>
    set(s => {
      const next = { ...s.exerciceState };
      delete next[chapitreId];
      return { exerciceState: next };
    }),

  // ── Charger les chapitres ─────────────────────────────────
  chargerChapitres: async (niveau, matiereCode) => {
    try {
      set({ chargement: true });
      const params = new URLSearchParams({ niveau });
      if (matiereCode) params.append('matiereCode', matiereCode);
      const { data } = await api.get(`/chapitres?${params}`);
      set({ chapitres: data.data });
    } catch {
      set({ chapitres: [] });
    } finally {
      set({ chargement: false });
    }
  },

  // ── Ouvrir un chapitre : charger le cours HTML publié ────
  ouvrirChapitre: async (chapitre) => {
    set({ chargement: true, chapitreActif: chapitre, leconActive: null });
    try {
      const { data } = await api.get(`/lecons/${chapitre._id}`);
      set({ leconActive: data.data });
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      set({ leconActive: null });
      throw new Error(msg);
    } finally {
      set({ chargement: false });
    }
  },

  // ── Soumettre le score calculé depuis le HTML ─────────────
  soumettreScore: async ({ chapitreId, leconId, score, nbCorrectes, nbTotal }) => {
    const { data } = await api.post('/resultats/soumettre', {
      chapitreId, leconId, score, nbCorrectes, nbTotal,
    });

    // Mettre à jour localement le chapitreActif si maîtrisé
    if (data.data.maitrise) {
      set(s => ({
        chapitres: s.chapitres.map(c =>
          c._id === chapitreId ? { ...c, _valide: true } : c
        ),
      }));

      // Mettre à jour le user dans authStore sans rechargement réseau
      try {
        const { useAuthStore } = await import('./useAuthStore');
        useAuthStore.getState().ajouterChapitreValide({
          chapitreId,
          scoreFinal: score,
          valideAt:   new Date().toISOString(),
        });
      } catch {
        // Silencieux si authStore indisponible
      }
    }

    return data.data;
  },

  // ── Sauvegarder la matière active pour le retour ─────────
  setMatiereRetour: (code) => set({ matiereRetour: code }),
  clearMatiereRetour: () => set({ matiereRetour: null }),

  // ── Retourner à la liste ──────────────────────────────────
  retourAccueil: () => {
    const { chapitreActif, exerciceState } = get();
    if (chapitreActif) {
      const next = { ...exerciceState };
      delete next[chapitreActif._id];
      set({ leconActive: null, chapitreActif: null, exerciceState: next });
    } else {
      set({ leconActive: null, chapitreActif: null });
    }
  },

  // ── Charger le QCM actif d'un chapitre ───────────────────
  chargerQCMChapitre: async (chapitreId) => {
    const { data } = await api.get(`/qcm/chapitre/${chapitreId}/actif`);
    return data.data;
  },

  // ── Soumettre les réponses du QCM ─────────────────────────
  soumettreQCM: async (qcmId, reponses) => {
    const { data } = await api.post(`/qcm/${qcmId}/soumettre`, { reponses });
    return data.data;
  },

  // ── Régénérer un QCM avec variation ──────────────────────
  regenererQCM: async (qcmId, chapitreId) => {
    const { data } = await api.post(`/qcm/${qcmId}/regenerer`, { chapitreId });
    return data.data;
  },
}));
