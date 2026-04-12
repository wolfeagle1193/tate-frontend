// ============================================================
// src/pages/prof/MesReservationsProf.jsx
// Prof : voir ses réservations de cours particuliers,
//        préparer les cours pour ses élèves
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Video, ChevronDown, ChevronUp,
  BookOpen, CheckCircle, Clock, X, Send, AlertCircle,
} from 'lucide-react';
import { LayoutProf }    from './LayoutProf';
import axios             from 'axios';
import toast             from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const hdrs     = () => ({ Authorization: `Bearer ${getToken()}` });

// Statuts
const STATUTS = {
  en_attente:             { label: 'En attente',             couleur: 'bg-amber-100   text-amber-700'   },
  consultation_planifiee: { label: 'À préparer',             couleur: 'bg-blue-100    text-blue-700'    },
  cours_prepare:          { label: 'Cours soumis',           couleur: 'bg-purple-100  text-purple-700'  },
  confirme:               { label: 'Planifié ✓',             couleur: 'bg-green-100   text-green-700'   },
  en_cours:               { label: 'En cours',               couleur: 'bg-tate-soleil/30 text-tate-terre' },
  termine:                { label: 'Terminé',                couleur: 'bg-gray-100    text-gray-500'    },
  annule:                 { label: 'Annulé',                 couleur: 'bg-red-100     text-red-600'     },
};

// ─── Modal : préparer le cours ────────────────────────────
function ModalPreparerCours({ reservation, onClose, onSuccess }) {
  const [form, setForm] = useState({
    titre:      '',
    objectif:   '',
    contenu:    '',
    planSeance: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const soumettre = async () => {
    if (!form.titre.trim())   return toast.error('Le titre du cours est requis');
    if (!form.contenu.trim()) return toast.error('Le contenu du cours est requis');
    setLoading(true);
    try {
      await axios.patch(
        `${API}/reservations/${reservation._id}/preparer-cours`,
        form,
        { headers: hdrs() }
      );
      toast.success('Cours préparé et transmis à l\'administrateur !');
      onSuccess();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la soumission');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl my-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">Préparer le cours</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>

        {/* Info élève */}
        <div className="bg-tate-doux rounded-2xl p-3 mb-5 space-y-1">
          <p className="text-xs font-bold text-tate-terre/50 uppercase">Élève</p>
          <p className="text-sm font-semibold text-tate-terre">{reservation.eleveId?.nom}</p>
          <p className="text-sm text-tate-terre/60">Niveau : {reservation.eleveId?.niveau || reservation.niveau}</p>
          <p className="text-sm text-tate-terre/60">Matière : {reservation.matiere}</p>
          <div className="mt-2 p-2 bg-white rounded-xl border border-tate-border">
            <p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Besoin de l'élève</p>
            <p className="text-sm text-tate-terre">{reservation.sujet}</p>
          </div>
        </div>

        {/* Formulaire */}
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">
              Titre du cours <span className="text-alerte">*</span>
            </label>
            <input value={form.titre} onChange={e => set('titre', e.target.value)}
              placeholder="Ex : Les équations du 1er degré — Révision complète"
              className="input-tate" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Objectif pédagogique</label>
            <input value={form.objectif} onChange={e => set('objectif', e.target.value)}
              placeholder="Ex : L'élève sera capable de résoudre une équation simple en fin de séance"
              className="input-tate" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">
              Contenu du cours <span className="text-alerte">*</span>
            </label>
            <textarea value={form.contenu} onChange={e => set('contenu', e.target.value)}
              placeholder="Décris le contenu pédagogique que tu vas enseigner, les notions abordées, les points clés..."
              rows={5} className="input-tate resize-none" />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Plan de séance</label>
            <textarea value={form.planSeance} onChange={e => set('planSeance', e.target.value)}
              placeholder={"1. Introduction (5 min)\n2. Rappel de cours (10 min)\n3. Exercices guidés (25 min)\n4. Exercices autonomes (15 min)\n5. Correction et bilan (5 min)"}
              rows={4} className="input-tate resize-none" />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Annuler</button>
          <button onClick={soumettre} disabled={loading}
            className="btn-tate flex-1 py-3 flex items-center justify-center gap-2 text-sm">
            <Send size={15} />
            {loading ? 'Envoi…' : 'Soumettre à l\'admin'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Carte réservation prof ───────────────────────────────
function CarteReservation({ r, onPreparerCours }) {
  const [expanded, setExpanded] = useState(false);
  const statut  = STATUTS[r.statut] || { label: r.statut, couleur: 'bg-gray-100 text-gray-500' };
  const needsPrep = r.statut === 'consultation_planifiee';

  return (
    <motion.div whileHover={{ y: -1 }}
      className={`card transition-all ${needsPrep ? 'ring-2 ring-blue-200' : ''}`}>
      <button onClick={() => setExpanded(x => !x)} className="w-full text-left">
        <div className="flex items-start gap-3">
          {/* Avatar élève */}
          <div className="w-10 h-10 rounded-xl bg-tate-soleil/20 flex items-center justify-center flex-shrink-0 text-sm font-bold text-tate-terre">
            {r.eleveId?.nom?.[0] || '?'}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-tate-terre text-sm">{r.eleveId?.nom || '—'}</p>
              <span className="text-tate-terre/30">·</span>
              <p className="text-xs text-tate-terre/50">{r.matiere}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statut.couleur}`}>
                {statut.label}
              </span>
            </div>
            <p className="text-xs text-tate-terre/60 mt-0.5 truncate">{r.sujet}</p>
            <div className="flex items-center gap-3 mt-1 flex-wrap">
              <span className="text-xs text-tate-terre/40">{r.niveau}</span>
              {r.dateDebut && (
                <span className="text-xs text-tate-terre/50 flex items-center gap-1">
                  <Calendar size={11} />
                  {new Date(r.dateDebut).toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                </span>
              )}
            </div>
          </div>

          {expanded
            ? <ChevronUp size={16} className="text-tate-terre/30 flex-shrink-0 mt-1" />
            : <ChevronDown size={16} className="text-tate-terre/30 flex-shrink-0 mt-1" />}
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t border-tate-border space-y-3">

              {/* Besoin de l'élève */}
              <div className="bg-tate-doux rounded-xl p-3">
                <p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Besoin de l'élève</p>
                <p className="text-sm text-tate-terre">{r.sujet}</p>
              </div>

              {/* Cours préparé (si existant) */}
              {r.coursPrepare?.titre && (
                <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                  <p className="text-xs font-bold text-blue-500 uppercase">Cours soumis</p>
                  <p className="text-sm font-semibold text-tate-terre">{r.coursPrepare.titre}</p>
                  {r.coursPrepare.objectif && (
                    <p className="text-xs text-tate-terre/60 italic">{r.coursPrepare.objectif}</p>
                  )}
                  {r.coursPrepare.planSeance && (
                    <div className="mt-2 bg-white rounded-lg p-2">
                      <p className="text-xs font-semibold text-tate-terre/50 mb-1">Plan de séance</p>
                      <p className="text-xs text-tate-terre/70 whitespace-pre-line">{r.coursPrepare.planSeance}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Lien Jitsi (si confirmé) */}
              {r.lienVisio && (
                <a href={r.lienVisio} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 hover:bg-green-100 transition-all">
                  <Video size={18} className="text-green-600 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-green-700">Rejoindre la séance</p>
                    <p className="text-xs text-green-500 truncate">{r.lienVisio}</p>
                  </div>
                </a>
              )}

              {/* Date et heure */}
              {r.dateDebut && (
                <div className="flex items-center gap-2 bg-tate-doux rounded-xl p-3">
                  <Calendar size={16} className="text-tate-terre/50 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-tate-terre">
                      {new Date(r.dateDebut).toLocaleDateString('fr-FR', {
                        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
                      })}
                    </p>
                    <p className="text-xs text-tate-terre/50">
                      {new Date(r.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      {r.dateFin && ` — ${new Date(r.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
                      {r.dureeMin && <span className="ml-2 text-tate-terre/40">({r.dureeMin} min)</span>}
                    </p>
                  </div>
                </div>
              )}

              {/* Notes admin */}
              {r.notes && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-1">Note de l'admin</p>
                  <p className="text-sm text-tate-terre/70">{r.notes}</p>
                </div>
              )}

              {/* Action : préparer le cours */}
              {needsPrep && (
                <button onClick={() => onPreparerCours(r)}
                  className="w-full btn-tate py-3 flex items-center justify-center gap-2 text-sm">
                  <BookOpen size={16} />
                  Préparer le cours pour cet élève
                </button>
              )}

              {/* Action : terminer */}
              {r.statut === 'en_cours' && (
                <button onClick={async () => {
                  try {
                    await axios.patch(`${API}/reservations/${r._id}/terminer`, {}, { headers: hdrs() });
                    toast.success('Séance marquée comme terminée');
                    window.location.reload();
                  } catch { toast.error('Erreur'); }
                }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-succes text-white text-sm font-semibold hover:bg-succes/80 transition-all">
                  <CheckCircle size={15} />
                  Marquer comme terminé
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────
export function MesReservationsProf() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [modalResa,    setModalResa]    = useState(null);

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/reservations`, { headers: hdrs() });
      setReservations(data.data || []);
    } catch { toast.error('Erreur de chargement'); }
    finally   { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  // Filtrage
  const filtrees = reservations.filter(r =>
    filtreStatut === 'tous' || r.statut === filtreStatut
  );

  const aPrep    = reservations.filter(r => r.statut === 'consultation_planifiee').length;
  const confirme = reservations.filter(r => r.statut === 'confirme').length;
  const total    = reservations.filter(r => !['termine','annule'].includes(r.statut)).length;

  return (
    <LayoutProf titre="Mes cours particuliers">

      {/* Alerte : cours à préparer */}
      {aPrep > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-tate-terre flex-1">
            Tu as <strong>{aPrep} cours</strong> à préparer pour {aPrep > 1 ? 'tes élèves' : 'ton élève'}
          </p>
          <button onClick={() => setFiltreStatut('consultation_planifiee')}
            className="text-sm font-semibold text-blue-600 hover:underline">Voir →</button>
        </motion.div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Actifs',        value: total,    couleur: 'bg-tate-soleil' },
          { label: 'À préparer',   value: aPrep,    couleur: 'bg-blue-400'   },
          { label: 'Planifiés',    value: confirme, couleur: 'bg-succes'     },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3 py-3">
            <div className={`w-9 h-9 rounded-xl ${s.couleur} flex items-center justify-center flex-shrink-0`}>
              <Clock size={16} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-tate-terre leading-none">{s.value}</p>
              <p className="text-xs text-tate-terre/50">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap mb-5">
        {['tous', 'consultation_planifiee', 'cours_prepare', 'confirme', 'termine'].map(s => (
          <button key={s} onClick={() => setFiltreStatut(s)}
            className={`px-3 py-2 rounded-xl text-xs font-medium transition-all ${
              filtreStatut === s
                ? 'bg-tate-soleil text-tate-terre shadow-tate'
                : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
            }`}>
            {s === 'tous' ? 'Toutes' : (STATUTS[s]?.label || s)}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-tate-terre/40">Chargement…</div>
      ) : filtrees.length === 0 ? (
        <div className="card text-center py-16">
          <User size={36} className="text-tate-terre/20 mx-auto mb-3" />
          <p className="font-semibold text-tate-terre/40">
            {filtreStatut === 'tous' ? 'Aucun cours particulier assigné' : 'Aucune réservation dans cette catégorie'}
          </p>
          {filtreStatut !== 'tous' && (
            <button onClick={() => setFiltreStatut('tous')}
              className="text-sm text-tate-terre/50 hover:underline mt-2">Voir toutes</button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtrees.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}>
                <CarteReservation r={r} onPreparerCours={setModalResa} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal préparer cours */}
      {modalResa && (
        <ModalPreparerCours
          reservation={modalResa}
          onClose={() => setModalResa(null)}
          onSuccess={charger}
        />
      )}
    </LayoutProf>
  );
}
