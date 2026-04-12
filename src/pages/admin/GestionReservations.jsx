// ============================================================
// src/pages/admin/GestionReservations.jsx — Cours particuliers
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, User, Clock, DollarSign, CheckCircle,
  Search, UserCheck, X, ChevronDown, Video, AlertCircle, CalendarClock,
} from 'lucide-react';
import { LayoutAdmin } from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const headers  = () => ({ Authorization: `Bearer ${getToken()}` });

// ─── Statuts ─────────────────────────────────────────────────
const STATUTS = {
  en_attente:             { label: 'En attente',           color: 'bg-amber-100   text-amber-700'  },
  consultation_planifiee: { label: 'Consultation planif.', color: 'bg-blue-100    text-blue-700'   },
  cours_prepare:          { label: 'Cours préparé',        color: 'bg-purple-100  text-purple-700' },
  confirme:               { label: 'Confirmé',             color: 'bg-succes/20   text-succes'     },
  en_cours:               { label: 'En cours',             color: 'bg-tate-soleil/30 text-tate-terre' },
  termine:                { label: 'Terminé',              color: 'bg-gray-100    text-gray-600'   },
  annule:                 { label: 'Annulé',               color: 'bg-red-100     text-red-600'    },
};

const FORFAIT_LABEL = {
  consultation: 'Consultation gratuite',
  '1h':  '1 heure',
  '3h':  '3 heures',
  '5h':  '5 heures',
  '10h': '10 heures',
  '20h': '20 heures',
};

// ─── Modal assigner professeur ────────────────────────────────
function ModalAssignerProf({ reservation, profs, onClose, onAssigner }) {
  const [profId, setProfId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAssigner = async () => {
    if (!profId) return toast.error('Sélectionne un professeur');
    setLoading(true);
    try {
      await onAssigner(reservation._id, profId);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">Assigner un professeur</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>

        <div className="bg-tate-doux rounded-2xl p-3 mb-4">
          <p className="text-sm text-tate-terre/70"><strong>Élève :</strong> {reservation.eleveId?.nom}</p>
          <p className="text-sm text-tate-terre/70"><strong>Matière :</strong> {reservation.matiere}</p>
          <p className="text-sm text-tate-terre/70"><strong>Sujet :</strong> {reservation.sujet}</p>
          <p className="text-sm text-tate-terre/70"><strong>Forfait :</strong> {FORFAIT_LABEL[reservation.forfait] || reservation.forfait}</p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-semibold text-tate-terre mb-2">Choisir un professeur</label>
          <div className="relative">
            <select value={profId} onChange={e => setProfId(e.target.value)}
              className="input-tate appearance-none pr-8">
              <option value="">— Sélectionner —</option>
              {profs.map(p => (
                <option key={p._id} value={p._id}>
                  {p.nom} — {p.matieresCodes?.join(', ')}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-tate-terre/40 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
          <button onClick={handleAssigner} disabled={loading || !profId}
            className="btn-tate flex-1 py-3 flex items-center justify-center gap-2">
            <UserCheck size={16} />
            {loading ? 'Assignation…' : 'Assigner'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal planifier dates ────────────────────────────────────
function ModalPlanifier({ reservation, onClose, onPlanifier }) {
  const [dateDebut, setDateDebut] = useState('');
  const [notes,     setNotes]     = useState('');
  const [loading,   setLoading]   = useState(false);

  const handlePlanifier = async () => {
    if (!dateDebut) return toast.error('Date et heure requises');
    setLoading(true);
    try {
      await onPlanifier(reservation._id, dateDebut, notes);
      onClose();
    } finally { setLoading(false); }
  };

  // Pré-remplir avec l'heure actuelle + 1 jour
  const minDate = new Date(Date.now() + 86400000).toISOString().slice(0,16);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg flex items-center gap-2">
            <CalendarClock size={20} className="text-tate-soleil" />
            Planifier la séance
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>

        {/* Résumé */}
        <div className="bg-tate-doux rounded-2xl p-3 mb-5 space-y-1">
          <p className="text-sm text-tate-terre/70">
            <strong>Élève :</strong> {reservation.eleveId?.nom}
          </p>
          <p className="text-sm text-tate-terre/70">
            <strong>Prof :</strong> {reservation.profId?.nom || '—'}
          </p>
          {reservation.coursPrepare?.titre && (
            <p className="text-sm text-tate-terre/70">
              <strong>Cours :</strong> {reservation.coursPrepare.titre}
            </p>
          )}
          <p className="text-sm text-tate-terre/70">
            <strong>Durée :</strong> {reservation.dureeMin} min
          </p>
        </div>

        {/* Lien Jitsi généré automatiquement */}
        {reservation.lienVisio && (
          <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3 mb-4">
            <Video size={16} className="text-blue-500 flex-shrink-0" />
            <p className="text-xs text-blue-600 truncate">{reservation.lienVisio}</p>
          </div>
        )}

        {/* Date/heure */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">
            Date et heure de la séance <span className="text-alerte">*</span>
          </label>
          <input
            type="datetime-local"
            value={dateDebut}
            min={minDate}
            onChange={e => setDateDebut(e.target.value)}
            className="input-tate"
          />
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">
            Message pour l'élève et le prof (optionnel)
          </label>
          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Ex : Rendez-vous confirmé. N'oubliez pas de préparer vos exercices !"
            rows={3}
            className="input-tate resize-none"
          />
        </div>

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Annuler</button>
          <button onClick={handlePlanifier} disabled={loading || !dateDebut}
            className="btn-tate flex-1 py-3 flex items-center justify-center gap-2 text-sm">
            <CalendarClock size={15} />
            {loading ? 'Planification…' : 'Valider et planifier'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Carte réservation ────────────────────────────────────────
function CarteReservation({ res, profs, onAssigner, onConfirmerPaiement, onPlanifier }) {
  const [expanded, setExpanded] = useState(false);
  const [showAssigner, setShowAssigner] = useState(false);
  const [showPlanifier, setShowPlanifier] = useState(false);
  const statut = STATUTS[res.statut] || { label: res.statut, color: 'bg-gray-100 text-gray-600' };

  const prixLabel = res.prix === 0 ? 'Gratuit' : `${res.prix.toLocaleString()} FCFA`;

  return (
    <>
      <motion.div whileHover={{ y:-1 }} className="card cursor-pointer"
        onClick={() => setExpanded(x => !x)}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-tate-soleil/20 flex items-center justify-center flex-shrink-0">
            <User size={20} className="text-tate-terre" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-tate-terre">{res.eleveId?.nom || '—'}</p>
              <span className="text-tate-terre/40">•</span>
              <p className="text-sm text-tate-terre/60">{res.matiere}</p>
              {res.premiereConsultation && (
                <span className="badge bg-succes/20 text-succes text-xs">1ère consultation</span>
              )}
            </div>
            <p className="text-xs text-tate-terre/50 mt-0.5 truncate">{res.sujet}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className={`badge text-xs ${statut.color}`}>{statut.label}</span>
              <span className="text-xs text-tate-terre/50">{FORFAIT_LABEL[res.forfait] || res.forfait}</span>
              <span className="text-xs font-semibold text-tate-terre">{prixLabel}</span>
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <p className="text-xs text-tate-terre/40">
              {new Date(res.createdAt).toLocaleDateString('fr-FR')}
            </p>
            {res.profId && (
              <p className="text-xs text-tate-terre/60 mt-1">Prof : {res.profId.nom}</p>
            )}
          </div>
        </div>

        {/* Détails expandés */}
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }}
              exit={{ opacity:0, height:0 }} className="overflow-hidden">
              <div className="mt-4 pt-4 border-t border-tate-border space-y-3">

                {/* Parent lié */}
                {res.parentId && (
                  <p className="text-sm text-tate-terre/70">
                    <strong>Parent :</strong> {res.parentId.nom} ({res.parentId.email})
                  </p>
                )}

                {/* Niveau élève */}
                {res.eleveId?.niveau && (
                  <p className="text-sm text-tate-terre/70">
                    <strong>Niveau :</strong> {res.eleveId.niveau}
                  </p>
                )}

                {/* Cours préparé */}
                {res.coursPrepare?.titre && (
                  <div className="bg-tate-doux rounded-xl p-3">
                    <p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Cours préparé</p>
                    <p className="text-sm font-semibold text-tate-terre">{res.coursPrepare.titre}</p>
                    {res.coursPrepare.objectif && (
                      <p className="text-xs text-tate-terre/60 mt-0.5">{res.coursPrepare.objectif}</p>
                    )}
                  </div>
                )}

                {/* Lien Jitsi */}
                {res.lienVisio && (
                  <div className="flex items-center gap-2 bg-blue-50 rounded-xl p-3">
                    <Video size={16} className="text-blue-600 flex-shrink-0" />
                    <a href={res.lienVisio} target="_blank" rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:underline truncate flex-1"
                      onClick={e => e.stopPropagation()}>
                      {res.lienVisio}
                    </a>
                  </div>
                )}

                {/* Date séance */}
                {res.dateDebut && (
                  <p className="text-sm text-tate-terre/70 flex items-center gap-2">
                    <Calendar size={14} />
                    {new Date(res.dateDebut).toLocaleString('fr-FR')}
                    {res.dureeMin && <span className="text-tate-terre/40">({res.dureeMin} min)</span>}
                  </p>
                )}

                {/* Paiement */}
                {res.paiement?.reference && (
                  <div className="bg-tate-doux rounded-xl p-3">
                    <p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Paiement</p>
                    <p className="text-sm text-tate-terre">
                      Réf : <span className="font-mono font-semibold">{res.paiement.reference}</span>
                    </p>
                    <p className="text-xs text-tate-terre/60 mt-0.5 capitalize">
                      Méthode : {res.paiement.methode?.replace('_',' ')} •{' '}
                      <span className={res.paiement.statut === 'valide' ? 'text-succes font-semibold' : 'text-amber-600'}>
                        {res.paiement.statut}
                      </span>
                    </p>
                  </div>
                )}

                {/* Actions admin */}
                <div className="flex gap-2 pt-1 flex-wrap" onClick={e => e.stopPropagation()}>
                  {/* Assigner un prof (si aucun prof et en attente) */}
                  {!res.profId && res.statut === 'en_attente' && (
                    <button onClick={() => setShowAssigner(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-savoir text-white text-xs font-semibold hover:bg-savoir/80 transition-all">
                      <UserCheck size={14} /> Assigner un prof
                    </button>
                  )}
                  {/* Confirmer paiement */}
                  {res.paiement?.statut === 'en_attente' && res.paiement?.reference && (
                    <button onClick={() => onConfirmerPaiement(res._id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-succes text-white text-xs font-semibold hover:bg-succes/80 transition-all">
                      <CheckCircle size={14} /> Confirmer paiement
                    </button>
                  )}
                  {/* Planifier séance : disponible quand le cours est préparé ou consultation planifiée */}
                  {(res.statut === 'cours_prepare' || (res.statut === 'consultation_planifiee' && res.prix === 0)) && (
                    <button onClick={() => setShowPlanifier(true)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-tate-terre text-tate-creme text-xs font-semibold hover:bg-tate-terre/80 transition-all">
                      <CalendarClock size={14} /> Planifier la séance
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {showAssigner && (
        <ModalAssignerProf
          reservation={res}
          profs={profs}
          onClose={() => setShowAssigner(false)}
          onAssigner={onAssigner}
        />
      )}
      {showPlanifier && (
        <ModalPlanifier
          reservation={res}
          onClose={() => setShowPlanifier(false)}
          onPlanifier={onPlanifier}
        />
      )}
    </>
  );
}

// ─── Page principale ──────────────────────────────────────────
export function GestionReservations() {
  const [reservations, setReservations] = useState([]);
  const [profs,        setProfs]        = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');

  const charger = async () => {
    setLoading(true);
    try {
      const [resRes, usersRes] = await Promise.all([
        axios.get(`${API}/reservations`,   { headers: headers() }),
        axios.get(`${API}/users`,          { headers: headers() }),
      ]);
      setReservations(resRes.data.data || []);
      setProfs((usersRes.data.data || []).filter(u => u.role === 'prof' && u.actif));
    } catch (e) {
      toast.error('Erreur de chargement');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { charger(); }, []);

  const assigner = async (resId, profId) => {
    await axios.patch(`${API}/reservations/${resId}/assigner-prof`,
      { profId }, { headers: headers() });
    toast.success('Professeur assigné !');
    charger();
  };

  const confirmerPaiement = async (resId) => {
    await axios.post(`${API}/reservations/${resId}/confirmer-paiement`,
      {}, { headers: headers() });
    toast.success('Paiement confirmé !');
    charger();
  };

  const planifier = async (resId, dateDebut, notes) => {
    const { data } = await axios.patch(
      `${API}/reservations/${resId}/planifier-admin`,
      { dateDebut, notes },
      { headers: headers() }
    );
    toast.success(data.data?.message || 'Séance planifiée ! Élève et prof notifiés.');
    charger();
  };

  // Filtrage
  const filtrees = reservations.filter(r => {
    const matchStatut = filtreStatut === 'tous' || r.statut === filtreStatut;
    const termSearch  = search.toLowerCase();
    const matchSearch = !search || (
      r.eleveId?.nom?.toLowerCase().includes(termSearch)  ||
      r.matiere?.toLowerCase().includes(termSearch)        ||
      r.sujet?.toLowerCase().includes(termSearch)          ||
      r.profId?.nom?.toLowerCase().includes(termSearch)
    );
    return matchStatut && matchSearch;
  });

  // Stats rapides
  const enAttente    = reservations.filter(r => r.statut === 'en_attente').length;
  const sansProfil   = reservations.filter(r => r.statut === 'en_attente' && !r.profId).length;
  const paiementsAtt = reservations.filter(r => r.paiement?.statut === 'en_attente').length;
  const terminees    = reservations.filter(r => r.statut === 'termine').length;

  return (
    <LayoutAdmin titre="Cours particuliers">

      {/* Alertes */}
      {sansProfil > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={20} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-tate-terre flex-1">
            <strong>{sansProfil} demande{sansProfil > 1 ? 's' : ''}</strong> sans professeur assigné
          </p>
          <button onClick={() => setFiltreStatut('en_attente')}
            className="text-sm font-semibold text-amber-600 hover:underline">
            Voir →
          </button>
        </motion.div>
      )}

      {paiementsAtt > 0 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="mb-4 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <DollarSign size={20} className="text-alerte flex-shrink-0" />
          <p className="text-sm text-tate-terre flex-1">
            <strong>{paiementsAtt} paiement{paiementsAtt > 1 ? 's' : ''}</strong> en attente de confirmation
          </p>
        </motion.div>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total demandes',     value: reservations.length, color: 'bg-tate-soleil'  },
          { label: 'En attente',         value: enAttente,           color: 'bg-amber-400'    },
          { label: 'Paiements à valider',value: paiementsAtt,        color: 'bg-alerte'       },
          { label: 'Séances terminées',  value: terminees,           color: 'bg-succes'       },
        ].map(s => (
          <div key={s.label} className="card flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center flex-shrink-0`}>
              <Clock size={18} className="text-white" />
            </div>
            <div>
              <p className="text-xl font-bold text-tate-terre">{s.value}</p>
              <p className="text-xs text-tate-terre/50">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutre" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher élève, matière, prof…" className="input-tate pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {['tous','en_attente','confirme','cours_prepare','termine','annule'].map(s => (
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
      </div>

      <p className="text-sm text-tate-terre/50 mb-4">
        {filtrees.length} réservation{filtrees.length > 1 ? 's' : ''}
      </p>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-16 text-tate-terre/40">Chargement…</div>
      ) : filtrees.length === 0 ? (
        <div className="card text-center py-16">
          <Calendar size={36} className="text-tate-terre/20 mx-auto mb-3" />
          <p className="font-semibold text-tate-terre/40">Aucune réservation trouvée</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtrees.map((r, i) => (
              <motion.div key={r._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                transition={{ delay: i * 0.03 }}>
                <CarteReservation
                  res={r}
                  profs={profs}
                  onAssigner={assigner}
                  onConfirmerPaiement={confirmerPaiement}
                  onPlanifier={planifier}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </LayoutAdmin>
  );
}
