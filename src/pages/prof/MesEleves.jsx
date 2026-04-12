// ============================================================
// src/pages/prof/MesEleves.jsx
// Prof : voir ses élèves (issus des réservations de cours
// particuliers) + consulter leur progression
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, TrendingUp, X,
  User, Calendar, BookOpen,
} from 'lucide-react';
import { LayoutProf } from './LayoutProf';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const hdrs     = () => ({ Authorization: `Bearer ${getToken()}` });

const STATUTS = {
  en_attente:             'En attente',
  consultation_planifiee: 'Consultation planifiée',
  cours_prepare:          'Cours soumis',
  confirme:               'Planifié',
  en_cours:               'En cours',
  termine:                'Terminé',
  annule:                 'Annulé',
};

// ─── Modal détail élève ───────────────────────────────────
function ModalEleve({ eleve, reservations, onClose }) {
  const total    = reservations.length;
  const termines = reservations.filter(r => r.statut === 'termine').length;
  const actives  = reservations.filter(r => !['termine','annule'].includes(r.statut)).length;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-tate-border">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-tate-soleil flex items-center justify-center font-bold text-tate-terre text-lg">
              {eleve?.nom?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <p className="font-serif font-bold text-tate-terre">{eleve?.nom}</p>
              <p className="text-xs text-tate-terre/50">{eleve?.niveau} · {eleve?.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux">
            <X size={18} className="text-tate-terre/50" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Total séances',  value: total,    color: 'text-tate-soleil' },
              { label: 'Terminées',      value: termines, color: 'text-succes'      },
              { label: 'En cours',       value: actives,  color: 'text-alerte'      },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center p-3 bg-tate-creme rounded-xl">
                <p className={`text-xl font-bold ${color}`}>{value}</p>
                <p className="text-xs text-tate-terre/50 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Historique réservations */}
          <div>
            <p className="text-xs font-semibold text-tate-terre/60 uppercase tracking-wide mb-2">
              Historique des séances
            </p>
            {reservations.length === 0 ? (
              <p className="text-sm text-tate-terre/40 text-center py-4">Aucune séance</p>
            ) : (
              <div className="space-y-2">
                {reservations.map(r => (
                  <div key={r._id} className="flex items-start justify-between py-2.5 px-3 bg-tate-creme rounded-xl gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tate-terre truncate">{r.sujet}</p>
                      <p className="text-xs text-tate-terre/50">{r.matiere}</p>
                      {r.coursPrepare?.titre && (
                        <p className="text-xs text-tate-terre/60 mt-0.5 italic truncate">
                          Cours : {r.coursPrepare.titre}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        r.statut === 'termine'  ? 'bg-gray-100 text-gray-500' :
                        r.statut === 'confirme' ? 'bg-green-100 text-green-700' :
                        r.statut === 'annule'   ? 'bg-red-100 text-red-500' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {STATUTS[r.statut] || r.statut}
                      </span>
                      {r.dateDebut && (
                        <p className="text-xs text-tate-terre/40 mt-1">
                          {new Date(r.dateDebut).toLocaleDateString('fr-FR', { day:'numeric', month:'short' })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Besoins exprimés */}
          {reservations.filter(r => r.statut !== 'annule').length > 0 && (
            <div>
              <p className="text-xs font-semibold text-tate-terre/60 uppercase tracking-wide mb-2">
                Besoins exprimés par l'élève
              </p>
              <div className="space-y-2">
                {reservations
                  .filter(r => r.statut !== 'annule')
                  .map(r => (
                    <div key={r._id} className="flex gap-2 p-2 bg-blue-50 rounded-xl">
                      <BookOpen size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-tate-terre/70 leading-relaxed">{r.sujet}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Carte élève ──────────────────────────────────────────
function CarteEleve({ eleve, reservations, onClick }) {
  const termines = reservations.filter(r => r.statut === 'termine').length;
  const actives  = reservations.filter(r => !['termine','annule'].includes(r.statut)).length;
  const aPrep    = reservations.filter(r => r.statut === 'consultation_planifiee').length;

  return (
    <motion.button
      whileHover={{ y: -2 }}
      onClick={onClick}
      className={`card w-full text-left hover:border-tate-soleil hover:shadow-tate transition-all ${
        aPrep > 0 ? 'ring-2 ring-blue-200' : ''
      }`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-tate-soleil flex items-center justify-center font-bold text-tate-terre flex-shrink-0">
          {eleve?.nom?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-tate-terre text-sm truncate">{eleve?.nom}</p>
            {aPrep > 0 && (
              <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0">
                À préparer
              </span>
            )}
          </div>
          <p className="text-xs text-tate-terre/50">{eleve?.niveau || 'Niveau non précisé'}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-tate-terre/50">
            {actives > 0 && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {actives} active{actives > 1 ? 's' : ''}
              </span>
            )}
            {termines > 0 && (
              <span className="text-succes">✓ {termines} terminée{termines > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>
        <span className="text-tate-terre/20 flex-shrink-0">→</span>
      </div>
    </motion.button>
  );
}

// ─── PAGE PRINCIPALE ──────────────────────────────────────
export function MesEleves() {
  const [reservations, setReservations] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [eleveModal,   setEleveModal]   = useState(null);

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/reservations`, { headers: hdrs() });
      setReservations(data.data || []);
    } catch {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  // Grouper les réservations par élève
  const elevesMap = {};
  reservations.forEach(r => {
    if (!r.eleveId) return;
    const id = r.eleveId._id || r.eleveId;
    if (!elevesMap[id]) {
      elevesMap[id] = { eleve: r.eleveId, reservations: [] };
    }
    elevesMap[id].reservations.push(r);
  });

  const elevesGroups = Object.values(elevesMap);

  const filtres = elevesGroups.filter(g =>
    !search || g.eleve?.nom?.toLowerCase().includes(search.toLowerCase())
  );

  const total         = elevesGroups.length;
  const avecCoursPrep = elevesGroups.filter(g =>
    g.reservations.some(r => r.statut === 'consultation_planifiee')
  ).length;
  const seancesActives = reservations.filter(r =>
    ['consultation_planifiee','cours_prepare','confirme','en_cours'].includes(r.statut)
  ).length;

  return (
    <LayoutProf titre="Mes élèves">

      {/* Alerte : cours à préparer */}
      {avecCoursPrep > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mb-5 bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-center gap-3">
          <BookOpen size={18} className="text-blue-600 flex-shrink-0" />
          <p className="text-sm text-tate-terre flex-1">
            <strong>{avecCoursPrep} élève{avecCoursPrep > 1 ? 's' : ''}</strong>{' '}
            avec un cours à préparer
          </p>
        </motion.div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="card flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-tate-soleil flex items-center justify-center flex-shrink-0">
            <User size={16} className="text-tate-terre" />
          </div>
          <div>
            <p className="text-xl font-bold text-tate-terre leading-none">{total}</p>
            <p className="text-xs text-tate-terre/50">Élève{total > 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="card flex items-center gap-3 py-3">
          <div className="w-9 h-9 rounded-xl bg-blue-400 flex items-center justify-center flex-shrink-0">
            <Calendar size={16} className="text-white" />
          </div>
          <div>
            <p className="text-xl font-bold text-tate-terre leading-none">{seancesActives}</p>
            <p className="text-xs text-tate-terre/50">Séances actives</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-16 text-tate-terre/40">Chargement…</div>
      ) : elevesGroups.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp size={36} className="text-tate-terre/20 mx-auto mb-3" />
          <p className="font-semibold text-tate-terre/40">Aucun élève assigné pour l'instant</p>
          <p className="text-sm text-tate-terre/30 mt-2 max-w-xs mx-auto">
            Tes élèves apparaîtront ici dès qu'une réservation te sera assignée par l'administrateur
          </p>
        </div>
      ) : (
        <>
          {/* Recherche */}
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutre" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un élève…" className="input-tate pl-9" />
          </div>

          <p className="text-sm text-tate-terre/50 mb-4">
            {filtres.length} élève{filtres.length > 1 ? 's' : ''}
          </p>

          {/* Grille élèves */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AnimatePresence>
              {filtres.map((g, i) => (
                <motion.div key={g.eleve?._id || i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}>
                  <CarteEleve
                    eleve={g.eleve}
                    reservations={g.reservations}
                    onClick={() => setEleveModal(g)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* Modal détail */}
      {eleveModal && (
        <ModalEleve
          eleve={eleveModal.eleve}
          reservations={eleveModal.reservations}
          onClose={() => setEleveModal(null)}
        />
      )}
    </LayoutProf>
  );
}
