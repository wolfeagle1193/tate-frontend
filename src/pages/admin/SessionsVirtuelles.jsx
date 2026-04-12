// ============================================================
// SessionsVirtuelles.jsx — Admin/Prof : organiser des classes Zoom
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, Plus, X, Calendar, Clock, Users, Link,
  Trash2, Globe, Lock, RefreshCw, ChevronRight,
  Copy, Edit3, CheckCircle, AlertCircle, BookOpen,
} from 'lucide-react';
import { LayoutAdmin } from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API  = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const hdrs = () => ({ Authorization: `Bearer ${localStorage.getItem('accessToken')}` });

const NIVEAUX = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];

const PLATEFORMES = [
  { code:'zoom',  label:'Zoom',         icone:'🎥', couleur:'bg-blue-50 border-blue-300 text-blue-700'   },
  { code:'meet',  label:'Google Meet',  icone:'📹', couleur:'bg-green-50 border-green-300 text-green-700' },
  { code:'teams', label:'Teams',        icone:'🟣', couleur:'bg-purple-50 border-purple-300 text-purple-700'},
  { code:'autre', label:'Autre lien',   icone:'🔗', couleur:'bg-gray-50 border-gray-300 text-gray-700'   },
];

const STATUTS = {
  planifiee:  { label:'Planifiée',   bg:'bg-blue-100 text-blue-700',   dot:'bg-blue-500'    },
  en_cours:   { label:'En cours',    bg:'bg-green-100 text-green-700', dot:'bg-green-500'   },
  terminee:   { label:'Terminée',    bg:'bg-gray-100 text-gray-500',   dot:'bg-gray-400'    },
  annulee:    { label:'Annulée',     bg:'bg-red-100 text-red-600',     dot:'bg-red-500'     },
};

// ── Modal créer / éditer session ──────────────────────────────
function ModalSession({ session, eleves, onClose, onSave }) {
  const demain = new Date();
  demain.setDate(demain.getDate() + 1);
  demain.setHours(9, 0, 0, 0);

  const [form, setForm] = useState({
    titre:        session?.titre       || '',
    description:  session?.description || '',
    matiere:      session?.matiere     || '',
    niveau:       session?.niveau      || '',
    dateHeure:    session?.dateHeure
      ? new Date(session.dateHeure).toISOString().slice(0,16)
      : demain.toISOString().slice(0,16),
    dureeMin:     session?.dureeMin    || 60,
    plateforme:   session?.plateforme  || 'zoom',
    lienSession:  session?.lienSession || '',
    motDePasse:   session?.motDePasse  || '',
    idReunion:    session?.idReunion   || '',
    ouvertATous:  session?.ouvertATous ?? false,
    niveauxCibles: session?.niveauxCibles || [],
    elevesIds:    session?.eleves?.map(e => e._id || e) || [],
  });
  const [loading, setLoading] = useState(false);
  const [rechercheEleve, setRechercheEleve] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleNiveau = (n) => setForm(f => ({
    ...f,
    niveauxCibles: f.niveauxCibles.includes(n)
      ? f.niveauxCibles.filter(x => x !== n)
      : [...f.niveauxCibles, n],
  }));

  const toggleEleve = (id) => setForm(f => ({
    ...f,
    elevesIds: f.elevesIds.includes(id)
      ? f.elevesIds.filter(x => x !== id)
      : [...f.elevesIds, id],
  }));

  const elevesFiltered = eleves.filter(e =>
    e.nom?.toLowerCase().includes(rechercheEleve.toLowerCase()) ||
    e.niveau?.toLowerCase().includes(rechercheEleve.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim())       return toast.error('Le titre est obligatoire');
    if (!form.lienSession.trim()) return toast.error('Le lien de session est obligatoire');
    if (!form.dateHeure)          return toast.error('La date et l\'heure sont obligatoires');
    setLoading(true);
    try {
      await onSave({ ...form, dateHeure: new Date(form.dateHeure).toISOString() });
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.9, opacity:0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl max-h-[94vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tate-border
                        bg-gradient-to-r from-blue-50 to-white flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 flex items-center justify-center">
              <Video size={18} className="text-blue-600" />
            </div>
            <h2 className="font-serif font-bold text-tate-terre text-lg">
              {session ? 'Modifier la session' : 'Nouvelle session de classe'}
            </h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-tate-doux flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Corps scrollable */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1 p-6 space-y-5">

          {/* Titre + matière */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Titre de la session *</label>
              <input value={form.titre} onChange={e => set('titre', e.target.value)}
                className="input-tate" placeholder="ex: Révision Conjugaison – 6ème" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Matière</label>
              <input value={form.matiere} onChange={e => set('matiere', e.target.value)}
                className="input-tate" placeholder="Français, Maths…" />
            </div>
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Niveau ciblé</label>
              <input value={form.niveau} onChange={e => set('niveau', e.target.value)}
                className="input-tate" placeholder="6ème, 5ème…" />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-1">Description / Objectif</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={2} className="input-tate resize-none"
              placeholder="Ce que les élèves vont apprendre lors de cette session…" />
          </div>

          {/* Date + durée */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">📅 Date et heure *</label>
              <input type="datetime-local" value={form.dateHeure}
                onChange={e => set('dateHeure', e.target.value)}
                className="input-tate" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">⏱ Durée (minutes)</label>
              <input type="number" value={form.dureeMin} min={15} max={480} step={15}
                onChange={e => set('dureeMin', parseInt(e.target.value))}
                className="input-tate" />
            </div>
          </div>

          {/* Plateforme */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-2">Plateforme</label>
            <div className="grid grid-cols-4 gap-2">
              {PLATEFORMES.map(p => (
                <button key={p.code} type="button" onClick={() => set('plateforme', p.code)}
                  className={`flex flex-col items-center gap-1 py-2.5 px-2 rounded-2xl border-2 text-xs font-semibold transition-all ${
                    form.plateforme === p.code ? p.couleur + ' shadow-sm' : 'border-tate-border bg-white text-tate-terre/50 hover:border-tate-soleil/50'
                  }`}>
                  <span className="text-lg">{p.icone}</span>
                  <span>{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Lien + identifiants */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">🔗 Lien de la session *</label>
              <input value={form.lienSession} onChange={e => set('lienSession', e.target.value)}
                className="input-tate" placeholder="https://zoom.us/j/123456789 ou https://meet.google.com/xxx" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-tate-terre/60 mb-1">ID de réunion (optionnel)</label>
                <input value={form.idReunion} onChange={e => set('idReunion', e.target.value)}
                  className="input-tate" placeholder="123 456 7890" />
              </div>
              <div>
                <label className="block text-xs font-bold text-tate-terre/60 mb-1">Mot de passe (optionnel)</label>
                <input value={form.motDePasse} onChange={e => set('motDePasse', e.target.value)}
                  className="input-tate" placeholder="••••••" />
              </div>
            </div>
          </div>

          {/* Accès */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-2">👥 Qui peut rejoindre ?</label>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button type="button" onClick={() => set('ouvertATous', true)}
                className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  form.ouvertATous ? 'border-tate-soleil bg-tate-doux text-tate-terre' : 'border-tate-border bg-white text-tate-terre/50'
                }`}>
                <Globe size={16} /> Tous les élèves
              </button>
              <button type="button" onClick={() => set('ouvertATous', false)}
                className={`flex items-center gap-2 p-3 rounded-2xl border-2 text-sm font-semibold transition-all ${
                  !form.ouvertATous ? 'border-tate-soleil bg-tate-doux text-tate-terre' : 'border-tate-border bg-white text-tate-terre/50'
                }`}>
                <Lock size={16} /> Élèves sélectionnés
              </button>
            </div>

            {/* Niveaux cibles (si ouvert à tous) */}
            {form.ouvertATous && (
              <div>
                <p className="text-xs text-tate-terre/50 mb-2">Filtrer par niveau (laisser vide = tous) :</p>
                <div className="flex flex-wrap gap-1.5">
                  {NIVEAUX.map(n => (
                    <button key={n} type="button" onClick={() => toggleNiveau(n)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold border-2 transition-all ${
                        form.niveauxCibles.includes(n)
                          ? 'border-tate-soleil bg-tate-doux text-tate-terre'
                          : 'border-tate-border text-tate-terre/40 hover:border-tate-soleil/50'
                      }`}>{n}</button>
                  ))}
                </div>
              </div>
            )}

            {/* Sélection élèves spécifiques */}
            {!form.ouvertATous && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-tate-terre/50">
                    {form.elevesIds.length} élève{form.elevesIds.length !== 1 ? 's' : ''} sélectionné{form.elevesIds.length !== 1 ? 's' : ''}
                  </p>
                  <input value={rechercheEleve} onChange={e => setRechercheEleve(e.target.value)}
                    className="text-xs border border-tate-border rounded-xl px-2.5 py-1 text-tate-terre placeholder-neutre focus:outline-none focus:border-tate-soleil"
                    placeholder="Rechercher…" />
                </div>
                <div className="max-h-44 overflow-y-auto space-y-1 border border-tate-border rounded-2xl p-2">
                  {elevesFiltered.length === 0 ? (
                    <p className="text-xs text-tate-terre/30 text-center py-4">Aucun élève trouvé</p>
                  ) : elevesFiltered.map(e => {
                    const selectionne = form.elevesIds.includes(e._id);
                    return (
                      <button key={e._id} type="button" onClick={() => toggleEleve(e._id)}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left transition-all ${
                          selectionne ? 'bg-tate-doux border-2 border-tate-soleil' : 'hover:bg-tate-doux border-2 border-transparent'
                        }`}>
                        <div className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center flex-shrink-0 ${
                          selectionne ? 'bg-tate-soleil text-tate-terre' : 'bg-tate-doux text-tate-terre/50'
                        }`}>
                          {selectionne ? <CheckCircle size={13} /> : e.nom?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-tate-terre truncate">{e.nom}</p>
                          <p className="text-[10px] text-tate-terre/40">{e.niveau}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </form>

        {/* Actions */}
        <div className="flex gap-3 px-6 py-4 border-t border-tate-border bg-gray-50 flex-shrink-0">
          <button type="button" onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Annuler</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-tate flex-1 py-3 text-sm flex items-center justify-center gap-2">
            {loading
              ? '⏳ Enregistrement…'
              : session ? <><Edit3 size={15}/> Modifier</> : <><Video size={15}/> Créer la session</>
            }
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Carte session ─────────────────────────────────────────────
function CarteSession({ session, index, onEditer, onAnnuler, onCopierLien }) {
  const statut = STATUTS[session.statut] || STATUTS.planifiee;
  const dateObj = new Date(session.dateHeure);
  const maintenant = new Date();
  const estPassee = dateObj < maintenant;
  const estAujourdhui = dateObj.toDateString() === maintenant.toDateString();
  const platef = PLATEFORMES.find(p => p.code === session.plateforme) || PLATEFORMES[0];

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl border-2 shadow-card overflow-hidden transition-all hover:shadow-card-lg ${
        estPassee && session.statut !== 'annulee' ? 'border-gray-200 opacity-80' :
        session.statut === 'annulee' ? 'border-red-200 opacity-70' :
        estAujourdhui ? 'border-tate-soleil' : 'border-tate-border'
      }`}>

      {/* Bande plateforme */}
      <div className={`h-1.5 w-full ${
        session.plateforme === 'zoom' ? 'bg-blue-400' :
        session.plateforme === 'meet' ? 'bg-green-400' :
        session.plateforme === 'teams' ? 'bg-purple-400' : 'bg-gray-300'
      }`} />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">
            {platef.icone}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-bold text-tate-terre text-sm truncate">{session.titre}</p>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${statut.bg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statut.dot}`} />
                {statut.label}
              </span>
            </div>
            {(session.matiere || session.niveau) && (
              <p className="text-xs text-tate-terre/50">
                {[session.matiere, session.niveau].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>
        </div>

        {/* Date et heure */}
        <div className="flex items-center gap-4 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-tate-terre/70">
            <Calendar size={13} className="text-tate-soleil" />
            {estAujourdhui ? "Aujourd'hui" : dateObj.toLocaleDateString('fr-FR', { weekday:'short', day:'2-digit', month:'short' })}
          </div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-tate-terre/70">
            <Clock size={13} className="text-tate-soleil" />
            {dateObj.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' })}
            <span className="text-tate-terre/40">· {session.dureeMin} min</span>
          </div>
        </div>

        {/* Participants */}
        <div className="flex items-center gap-2 mb-3">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl ${
            session.ouvertATous ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-tate-doux text-tate-terre/70'
          }`}>
            <Users size={11} />
            {session.ouvertATous
              ? `Tous${session.niveauxCibles?.length ? ` (${session.niveauxCibles.join(', ')})` : ''}`
              : `${session.eleves?.length || 0} élève${(session.eleves?.length||0) !== 1 ? 's' : ''} invité${(session.eleves?.length||0) !== 1 ? 's' : ''}`
            }
          </div>
          {session.animateur && (
            <div className="text-xs text-tate-terre/40">
              par {session.animateur.nom?.split(' ')[0]}
            </div>
          )}
        </div>

        {/* Actions */}
        {session.statut !== 'annulee' && session.statut !== 'terminee' && (
          <div className="flex gap-2">
            <button onClick={() => onCopierLien(session.lienSession)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                         bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200
                         hover:bg-blue-100 transition-colors">
              <Copy size={12} /> Copier le lien
            </button>
            <button onClick={() => onEditer(session)}
              className="w-9 h-9 rounded-xl bg-tate-doux text-tate-terre
                         flex items-center justify-center hover:bg-tate-soleil/20 transition-colors flex-shrink-0">
              <Edit3 size={13} />
            </button>
            <button onClick={() => onAnnuler(session._id)}
              className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-200
                         flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0">
              <Trash2 size={13} />
            </button>
          </div>
        )}

        {/* Lien direct si en cours */}
        {session.statut === 'en_cours' && (
          <a href={session.lienSession} target="_blank" rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                       text-white text-sm font-bold transition-all"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#6366F1)' }}>
            <Video size={15} /> Rejoindre maintenant
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────
export function SessionsVirtuelles() {
  const [sessions,   setSessions]   = useState([]);
  const [eleves,     setEleves]     = useState([]);
  const [loading,    setLoading]    = useState(false);
  const [modal,      setModal]      = useState(null); // null | 'create' | session-object
  const [onglet,     setOnglet]     = useState('avenir'); // 'avenir' | 'passes'

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const [sesRes, usersRes] = await Promise.all([
        axios.get(`${API}/sessions-virtuelles/toutes`, { headers: hdrs() }),
        axios.get(`${API}/users?role=eleve`, { headers: hdrs() }),
      ]);
      setSessions(sesRes.data.data || []);
      setEleves((usersRes.data.data || []).filter(u => u.role === 'eleve'));
    } catch (e) {
      toast.error('Erreur chargement');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  const sauvegarder = async (form) => {
    if (modal && modal._id) {
      await axios.patch(`${API}/sessions-virtuelles/${modal._id}`, form, { headers: hdrs() });
      toast.success('✅ Session modifiée !');
    } else {
      await axios.post(`${API}/sessions-virtuelles`, form, { headers: hdrs() });
      toast.success('✅ Session créée ! Les élèves peuvent la voir.');
    }
    charger();
  };

  const annuler = async (id) => {
    if (!window.confirm('Annuler cette session ?')) return;
    try {
      await axios.delete(`${API}/sessions-virtuelles/${id}`, { headers: hdrs() });
      toast.success('Session annulée');
      charger();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const copierLien = (lien) => {
    navigator.clipboard.writeText(lien).then(() => toast.success('🔗 Lien copié !'));
  };

  const maintenant = new Date();
  const sessionsAvenir = sessions.filter(s =>
    new Date(s.dateHeure) >= maintenant && s.statut !== 'annulee' && s.statut !== 'terminee'
  );
  const sessionsPassees = sessions.filter(s =>
    new Date(s.dateHeure) < maintenant || s.statut === 'annulee' || s.statut === 'terminee'
  );

  const liste = onglet === 'avenir' ? sessionsAvenir : sessionsPassees;

  return (
    <LayoutAdmin titre="Sessions de classe en ligne"
      action={
        <button onClick={() => setModal('create')} className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nouvelle session
        </button>
      }>

      {/* Onglets */}
      <div className="flex gap-3 mb-6">
        {[
          { id:'avenir',  label:'À venir',   count: sessionsAvenir.length,  color:'from-blue-500 to-indigo-600'  },
          { id:'passes',  label:'Historique', count: sessionsPassees.length, color:'from-gray-400 to-gray-600'   },
        ].map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 font-semibold text-sm transition-all ${
              onglet === tab.id
                ? 'border-transparent text-white shadow-card'
                : 'border-tate-border bg-white text-tate-terre/60 hover:border-tate-soleil/50'
            }`}
            style={onglet === tab.id ? { background:`linear-gradient(135deg, var(--tw-gradient-from), var(--tw-gradient-to))` } : {}}>
            <span className={onglet === tab.id ? 'text-white' : ''}>
              {tab.label}
            </span>
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
              onglet === tab.id ? 'bg-white/25 text-white' : 'bg-tate-doux text-tate-terre'
            }`}>{tab.count}</span>
          </button>
        ))}
        <button onClick={charger} className="ml-auto flex items-center gap-1.5 text-xs text-savoir font-semibold hover:underline">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1,2,3].map(i => <div key={i} className="h-48 skeleton rounded-2xl" />)}
        </div>
      ) : liste.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="card text-center py-16">
          <Video size={48} className="text-tate-terre/20 mx-auto mb-4" />
          <p className="font-serif font-bold text-tate-terre text-lg">
            {onglet === 'avenir' ? 'Aucune session planifiée' : 'Aucun historique'}
          </p>
          <p className="text-sm text-tate-terre/40 mt-2 mb-5">
            {onglet === 'avenir' ? 'Crée une session pour inviter tes élèves à un cours Zoom / Meet.' : 'Les sessions passées apparaîtront ici.'}
          </p>
          {onglet === 'avenir' && (
            <button onClick={() => setModal('create')} className="btn-tate px-6 py-3 mx-auto">
              + Créer une session
            </button>
          )}
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {liste.map((s, i) => (
            <CarteSession key={s._id} session={s} index={i}
              onEditer={(s) => setModal(s)}
              onAnnuler={annuler}
              onCopierLien={copierLien}
            />
          ))}
        </div>
      )}

      {/* Info box */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-700 mb-1">📡 Comment ça marche ?</p>
        <ul className="text-xs text-blue-600 space-y-1">
          <li>• Crée une session avec le lien Zoom / Google Meet de ton choix</li>
          <li>• Invite des élèves spécifiques <strong>ou</strong> ouvre la session à tous</li>
          <li>• Les élèves voient la session dans leur espace et peuvent <strong>Rejoindre la classe</strong></li>
          <li>• Le prof et l'admin reçoivent le même lien pour animer</li>
        </ul>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ModalSession
            session={modal === 'create' ? null : modal}
            eleves={eleves}
            onClose={() => setModal(null)}
            onSave={sauvegarder}
          />
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
