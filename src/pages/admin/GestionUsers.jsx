import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UserPlus, Search, ToggleLeft, ToggleRight, X, Check, FileText,
         CheckCircle, XCircle, Eye, CreditCard, Clock, Home, Star, Crown, Trash2, UserCheck, Link2 } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutAdmin }   from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

const ROLES   = ['prof', 'eleve', 'parent'];
const NIVEAUX = ['CM1', 'CM2', '6eme', '5eme', '4eme', '3eme', 'Seconde', 'Premiere', 'Terminale'];

const ROLE_STYLE = {
  admin:  'bg-purple-100 text-purple-700',
  prof:   'bg-blue-100   text-blue-700',
  eleve:  'bg-tate-doux  text-tate-terre',
  parent: 'bg-green-100  text-green-700',
};

function ModalUser({ onClose, onSave }) {
  const [form, setForm] = useState({ nom:'', email:'', password:'', role:'eleve', niveau:'CM1', parentEmail:'' });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    try { await onSave(form); onClose(); toast.success('Utilisateur créé !'); }
    catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">Nouvel utilisateur</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Nom complet</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} className="input-tate" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} className="input-tate" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Mot de passe</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)} className="input-tate" required />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Rôle</label>
              <select value={form.role} onChange={e => set('role', e.target.value)} className="input-tate">
                {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
              </select>
            </div>
          </div>
          {form.role === 'eleve' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Niveau</label>
                <select value={form.niveau} onChange={e => set('niveau', e.target.value)} className="input-tate">
                  {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Email parent</label>
                <input type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)} placeholder="optionnel" className="input-tate" />
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
            <button type="submit" className="btn-tate flex-1 py-3">Créer</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Modal dossier prof ───────────────────────
function ModalDossierProf({ prof, onClose, onValider, onRejeter }) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const BACKEND = import.meta.env.VITE_API_URL?.replace('/api','') || 'http://localhost:5000';

  const action = async (acte) => {
    setLoading(true);
    try {
      await acte(prof._id, note);
      onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">Dossier — {prof.nom}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>

        {/* Infos */}
        <div className="space-y-2 mb-4">
          <p className="text-sm text-tate-terre/70"><strong>Email :</strong> {prof.email}</p>
          {prof.bioPro && <div className="bg-tate-doux rounded-xl p-3 text-sm text-tate-terre">{prof.bioPro}</div>}
          {prof.matieresCodes?.length > 0 && (
            <p className="text-sm text-tate-terre/70">
              <strong>Matières :</strong> {prof.matieresCodes.join(', ')}
            </p>
          )}
          {prof.niveauxEnseignes?.length > 0 && (
            <p className="text-sm text-tate-terre/70">
              <strong>Niveaux :</strong> {prof.niveauxEnseignes.join(', ')}
            </p>
          )}
        </div>

        {/* Documents */}
        {prof.documents?.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-bold text-tate-terre/50 uppercase mb-2">Documents fournis</p>
            <div className="space-y-2">
              {prof.documents.map((d, i) => (
                <a key={i} href={`${BACKEND}/uploads/docs/${d.chemin}`} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-tate-doux rounded-xl p-3 hover:bg-tate-soleil/10 transition-all">
                  <FileText size={16} className="text-tate-terre/60 flex-shrink-0" />
                  <span className="text-sm text-tate-terre flex-1 truncate">{d.nom}</span>
                  <Eye size={14} className="text-tate-terre/40" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Note admin */}
        <div className="mb-5">
          <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Note (optionnel)</label>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={2}
            placeholder="Commentaire pour le prof (visible lors de la notification)…"
            className="input-tate resize-none" />
        </div>

        <div className="flex gap-3">
          <button onClick={() => action(onRejeter)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-alerte text-alerte hover:bg-red-50 transition-all text-sm font-semibold">
            <XCircle size={16} /> Refuser
          </button>
          <button onClick={() => action(onValider)} disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-succes text-white hover:bg-succes/80 transition-all text-sm font-semibold">
            <CheckCircle size={16} /> Valider
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal : lier un parent à un élève ───────────────────────
function ModalLierParent({ eleve, onClose, onLier }) {
  const [mode,      setMode]      = useState('existant'); // 'existant' | 'nouveau'
  const [parentId,  setParentId]  = useState('');
  const [nomParent, setNomParent] = useState('');
  const [emailParent, setEmailParent] = useState('');
  const [telParent, setTelParent] = useState('');
  const [loading,   setLoading]   = useState(false);
  const [parents,   setParents]   = useState([]);

  useEffect(() => {
    // Charger les parents existants
    axios.get(`${API}/users`, { headers: { Authorization: `Bearer ${getToken()}` } })
      .then(({ data }) => setParents((data.data || []).filter(u => u.role === 'parent')))
      .catch(() => {});
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = mode === 'existant'
        ? { parentId }
        : { nomParent, emailParent, telephoneParent: telParent };
      await onLier(eleve._id, payload);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du lien');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl">

        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-serif font-bold text-tate-terre text-lg">Lier un parent</h2>
            <p className="text-sm text-tate-terre/60 mt-0.5">
              <span className="font-semibold text-tate-terre">{eleve.nom}</span>
              {eleve.niveau && ` · ${eleve.niveau}`}
            </p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-tate-doux flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        {/* Si déjà un parent */}
        {eleve.parentId && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <UserCheck size={16} className="text-succes flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              Parent actuel : <strong>{eleve.parentEmail || eleve.parentId}</strong>
            </p>
          </div>
        )}

        {/* Toggle mode */}
        <div className="flex bg-tate-doux rounded-2xl p-1 mb-5">
          {[
            { key: 'existant', label: 'Parent existant' },
            { key: 'nouveau',  label: 'Créer un parent' },
          ].map(m => (
            <button key={m.key} type="button"
              onClick={() => setMode(m.key)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${
                mode === m.key ? 'bg-white shadow-card text-tate-terre' : 'text-tate-terre/50'
              }`}>
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'existant' ? (
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">
                Choisir un parent ({parents.length} disponible{parents.length !== 1 ? 's' : ''})
              </label>
              <select value={parentId} onChange={e => setParentId(e.target.value)}
                className="input-tate" required>
                <option value="">— Sélectionner un parent —</option>
                {parents.map(p => (
                  <option key={p._id} value={p._id}>{p.nom} · {p.email}</option>
                ))}
              </select>
              {parents.length === 0 && (
                <p className="text-xs text-tate-terre/40 mt-1">
                  Aucun parent enregistré. Utilise "Créer un parent" pour en créer un.
                </p>
              )}
            </div>
          ) : (
            <>
              <div>
                <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Nom complet du parent</label>
                <input value={nomParent} onChange={e => setNomParent(e.target.value)}
                  placeholder="Ex: Mamadou Diallo" className="input-tate" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Email du parent</label>
                <input type="email" value={emailParent} onChange={e => setEmailParent(e.target.value)}
                  placeholder="parent@email.com" className="input-tate" required />
              </div>
              <div>
                <label className="block text-xs font-semibold text-tate-terre/60 mb-1.5">Téléphone (optionnel)</label>
                <input value={telParent} onChange={e => setTelParent(e.target.value)}
                  placeholder="+221 77 000 00 00" className="input-tate" />
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs text-amber-800">
                  ℹ️ Un compte parent sera créé avec un mot de passe temporaire. Communiquez-le manuellement au parent.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
            <button type="submit" disabled={loading}
              className="btn-tate flex-1 py-3 flex items-center justify-center gap-2">
              {loading
                ? <><span className="animate-spin">⏳</span> Liaison…</>
                : <><Link2 size={15} /> Lier le parent</>
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

export function GestionUsers() {
  const { users, chargerUsers, creerUser, toggleUserActif, loading } = useAdminStore();
  const [search,     setSearch]     = useState('');
  const [filtreRole, setFiltreRole] = useState('tous');
  const [onglet,     setOnglet]     = useState('utilisateurs');
  const [showModal,  setShowModal]  = useState(false);
  const [profModal,  setProfModal]  = useState(null);
  const [loadingBadge, setLoadingBadge] = useState({});

  // ── Abonnements en attente ─────────────────────────────────
  const [abonnementsEnAttente, setAbonnementsEnAttente] = useState([]);
  const [loadingAbo,           setLoadingAbo]           = useState(false);

  // ── Modal gestion badge Premium ───────────────────────────
  const [modalPremium, setModalPremium] = useState(null); // user sélectionné

  // ── Modal lier parent à élève ─────────────────────────────
  const [modalParent, setModalParent] = useState(null); // élève sélectionné

  const lierParent = async (eleveId, payload) => {
    const { data } = await axios.post(`${API}/users/${eleveId}/lier-parent`, payload,
      { headers: { Authorization: `Bearer ${getToken()}` } }
    );
    toast.success(data.data.message);
    chargerUsers();
  };

  const donnerPremium = async (userId, nom, type) => {
    // type: 'domicile' | '1mois' | '3mois' | '6mois' | '12mois' | 'retirer'
    setLoadingBadge(prev => ({ ...prev, [userId]: true }));
    try {
      let payload = {};
      if (type === 'retirer') {
        payload = { abonnement: 'gratuit', abonnementExpiry: null };
      } else if (type === 'domicile') {
        payload = { abonnement: 'premium', abonnementExpiry: null };
      } else {
        const mois = parseInt(type);
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + mois);
        payload = { abonnement: 'premium', abonnementExpiry: expiry.toISOString() };
      }
      await axios.patch(`${API}/users/${userId}`, payload,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const labels = {
        domicile: '🏠 Badge domicile (accès gratuit illimité)',
        '1': '⭐ Premium 1 mois activé',
        '3': '⭐ Premium 3 mois activé',
        '6': '⭐ Premium 6 mois activé',
        '12': '⭐ Premium 1 an activé',
        retirer: '❌ Badge Premium retiré',
      };
      toast.success(`${labels[type] || 'Mis à jour'} pour ${nom}`);
      chargerUsers();
      setModalPremium(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally {
      setLoadingBadge(prev => ({ ...prev, [userId]: false }));
    }
  };

  const chargerAbonnements = async () => {
    setLoadingAbo(true);
    try {
      const { data } = await axios.get(`${API}/users/abonnements-en-attente`,
        { headers: { Authorization: `Bearer ${getToken()}` } });
      setAbonnementsEnAttente(data.data || []);
    } catch (e) {
      toast.error('Erreur lors du chargement des abonnements');
    } finally { setLoadingAbo(false); }
  };

  const validerAbonnement = async (userId, nom) => {
    try {
      await axios.post(`${API}/users/${userId}/valider-abonnement`, {},
        { headers: { Authorization: `Bearer ${getToken()}` } });
      toast.success(`✅ Abonnement premium activé pour ${nom} !`);
      chargerAbonnements();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la validation');
    }
  };

  useEffect(() => { chargerUsers(); }, []);
  useEffect(() => {
    if (onglet === 'abonnements') chargerAbonnements();
  }, [onglet]);

  // Candidatures profs en attente
  const candidatures = users.filter(u => u.role === 'prof' && u.statutCompte === 'en_attente');

  const validerProf = async (profId, note) => {
    try {
      await axios.patch(`${API}/users/${profId}`,
        { statutCompte: 'actif', actif: true, noteAdmin: note },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success('Professeur validé ! Il peut maintenant se connecter.');
      chargerUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); throw e; }
  };

  const rejeterProf = async (profId, note) => {
    try {
      await axios.patch(`${API}/users/${profId}`,
        { statutCompte: 'rejete', actif: false, noteAdmin: note },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      toast.success('Candidature refusée.');
      chargerUsers();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); throw e; }
  };

  const filtres = users.filter(u => {
    const matchRole   = filtreRole === 'tous' || u.role === filtreRole;
    const matchSearch = u.nom.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch && u.statutCompte !== 'en_attente';
  });

  return (
    <LayoutAdmin titre="Utilisateurs"
      action={
        <button onClick={() => setShowModal(true)} className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <UserPlus size={16} /> Nouvel utilisateur
        </button>
      }>

      {/* Onglets */}
      <div className="flex gap-1 bg-tate-doux rounded-2xl p-1 mb-6 w-fit flex-wrap">
        <button onClick={() => setOnglet('utilisateurs')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            onglet === 'utilisateurs' ? 'bg-white shadow-card text-tate-terre' : 'text-tate-terre/50'
          }`}>
          Tous les utilisateurs
        </button>
        <button onClick={() => setOnglet('candidatures')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
            onglet === 'candidatures' ? 'bg-white shadow-card text-tate-terre' : 'text-tate-terre/50'
          }`}>
          Candidatures profs
          {candidatures.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-alerte rounded-full text-white text-xs flex items-center justify-center font-bold">
              {candidatures.length}
            </span>
          )}
        </button>
        <button onClick={() => setOnglet('abonnements')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all relative ${
            onglet === 'abonnements' ? 'bg-white shadow-card text-tate-terre' : 'text-tate-terre/50'
          }`}>
          Abonnements en attente
          {abonnementsEnAttente.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-tate-soleil rounded-full text-tate-terre text-xs flex items-center justify-center font-bold">
              {abonnementsEnAttente.length}
            </span>
          )}
        </button>
      </div>

      {onglet === 'abonnements' ? (
        /* ── Onglet abonnements en attente ── */
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-tate-terre/60">
              {loadingAbo ? 'Chargement…' : `${abonnementsEnAttente.length} paiement${abonnementsEnAttente.length !== 1 ? 's' : ''} en attente de validation`}
            </p>
            <button onClick={chargerAbonnements}
              className="text-xs text-tate-terre/40 hover:text-tate-terre transition-colors px-3 py-1.5 rounded-xl hover:bg-tate-doux">
              Actualiser
            </button>
          </div>

          {abonnementsEnAttente.length === 0 && !loadingAbo ? (
            <div className="card text-center py-12">
              <CreditCard size={36} className="text-tate-terre/20 mx-auto mb-3" />
              <p className="font-semibold text-tate-terre">Aucun paiement en attente</p>
              <p className="text-sm text-tate-terre/50 mt-1">Les élèves ayant initié un paiement apparaîtront ici</p>
            </div>
          ) : (
            abonnementsEnAttente.map(u => {
              const abo = u.abonnementPending || {};
              const dateInitie = abo.initieAt ? new Date(abo.initieAt) : null;
              return (
                <motion.div key={u._id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
                  className="card border border-tate-border hover:border-tate-soleil transition-all">
                  <div className="flex items-start gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 rounded-2xl bg-tate-soleil/30 flex items-center justify-center
                                    font-bold text-tate-terre text-lg flex-shrink-0">
                      {u.nom?.[0]?.toUpperCase()}
                    </div>

                    {/* Infos élève */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-tate-terre">{u.nom}</p>
                        {u.niveau && (
                          <span className="badge bg-tate-doux text-tate-terre/70 text-xs">{u.niveau}</span>
                        )}
                      </div>
                      <p className="text-sm text-tate-terre/60">{u.email}</p>

                      {/* Détails paiement */}
                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-2">
                        <div className="bg-tate-doux rounded-xl px-3 py-2">
                          <p className="text-xs text-tate-terre/50 font-medium">Méthode</p>
                          <p className="text-sm font-semibold text-tate-terre capitalize">
                            {abo.methode === 'wave' ? '📱 Wave' : abo.methode === 'orange_money' ? '🟠 Orange Money' : '—'}
                          </p>
                        </div>
                        <div className="bg-tate-doux rounded-xl px-3 py-2">
                          <p className="text-xs text-tate-terre/50 font-medium">Montant</p>
                          <p className="text-sm font-semibold text-tate-terre">{abo.montant?.toLocaleString() || 1500} FCFA</p>
                        </div>
                        {dateInitie && (
                          <div className="bg-tate-doux rounded-xl px-3 py-2">
                            <p className="text-xs text-tate-terre/50 font-medium">Initié le</p>
                            <p className="text-sm font-semibold text-tate-terre">
                              {dateInitie.toLocaleDateString('fr-FR', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Référence */}
                      {abo.reference && (
                        <div className="mt-2 flex items-center gap-2">
                          <Clock size={13} className="text-tate-terre/40 flex-shrink-0" />
                          <code className="text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-lg font-mono">
                            {abo.reference}
                          </code>
                        </div>
                      )}
                    </div>

                    {/* Bouton activer */}
                    <div className="flex-shrink-0">
                      <button
                        onClick={() => validerAbonnement(u._id, u.nom)}
                        className="flex items-center gap-2 bg-succes text-white px-4 py-2.5 rounded-xl
                                   text-sm font-semibold hover:bg-succes/80 transition-all shadow-sm">
                        <Check size={16} />
                        Activer
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : onglet === 'candidatures' ? (
        <div className="space-y-4">
          {candidatures.length === 0 ? (
            <div className="card text-center py-12">
              <CheckCircle size={36} className="text-succes mx-auto mb-3" />
              <p className="font-semibold text-tate-terre">Aucune candidature en attente</p>
            </div>
          ) : (
            candidatures.map(prof => (
              <motion.div key={prof._id} whileHover={{ y:-1 }}
                className="card flex items-center gap-4 cursor-pointer hover:border-tate-soleil"
                onClick={() => setProfModal(prof)}>
                <div className="w-12 h-12 rounded-2xl bg-tate-soleil flex items-center justify-center
                                font-bold text-tate-terre text-lg flex-shrink-0">
                  {prof.nom?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-tate-terre">{prof.nom}</p>
                  <p className="text-sm text-tate-terre/60">{prof.email}</p>
                  {prof.matieresCodes?.length > 0 && (
                    <p className="text-xs text-tate-terre/40">{prof.matieresCodes.join(' · ')}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="badge bg-amber-100 text-amber-700 text-xs">En attente</span>
                  {prof.documents?.length > 0 && (
                    <span className="text-xs text-tate-terre/40">{prof.documents.length} doc{prof.documents.length > 1 ? 's' : ''}</span>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      ) : (
        <div>
          {/* Filtres */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutre" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un utilisateur…" className="input-tate pl-9" />
        </div>
        <div className="flex gap-2">
          {['tous', 'prof', 'eleve', 'parent'].map(r => (
            <button key={r} onClick={() => setFiltreRole(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filtreRole === r ? 'bg-tate-soleil text-tate-terre shadow-tate' : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
              }`}>{r.charAt(0).toUpperCase() + r.slice(1)}</button>
          ))}
        </div>
      </div>

      {/* Compteur */}
      <p className="text-sm text-tate-terre/50 mb-4">{filtres.length} utilisateur{filtres.length > 1 ? 's' : ''}</p>

      {/* Table */}
      <div className="card overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-tate-doux border-b border-tate-border">
              <tr>
                {['Nom', 'Email', 'Rôle', 'Niveau', 'Accès', '⭐ Badge Premium', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-tate-terre/60 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtres.map((u, i) => {
                  const estDomicile = u.abonnement === 'premium' && !u.abonnementExpiry;
                  const estAbonne   = u.abonnement === 'premium' && u.abonnementExpiry && new Date(u.abonnementExpiry) > new Date();
                  const aAcces      = estDomicile || estAbonne;
                  return (
                    <motion.tr key={u._id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay: i * 0.03 }}
                      className="border-b border-tate-border/50 hover:bg-tate-creme transition-colors last:border-0">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-tate-terre flex-shrink-0 ${
                            estDomicile ? 'bg-savoir/20' : aAcces ? 'bg-succes/20' : 'bg-tate-soleil'
                          }`}>
                            {u.nom?.[0]?.toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <span className="font-medium text-tate-terre block truncate">{u.nom}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-tate-terre/60 text-xs truncate max-w-32">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`badge text-xs ${ROLE_STYLE[u.role]}`}>{u.role}</span>
                      </td>
                      <td className="px-4 py-3 text-tate-terre/60">{u.niveau || '—'}</td>
                      <td className="px-4 py-3">
                        {u.role !== 'eleve' ? (
                          <span className="text-xs text-tate-terre/30">—</span>
                        ) : estDomicile ? (
                          <span className="badge text-xs bg-savoir/10 text-savoir">🏠 Domicile</span>
                        ) : estAbonne ? (
                          <span className="badge text-xs bg-succes/10 text-succes">✓ Abonné</span>
                        ) : (
                          <span className="badge text-xs bg-gray-100 text-gray-500">Non abonné</span>
                        )}
                      </td>
                      {/* Badge Premium — élèves seulement */}
                      <td className="px-4 py-3">
                        {u.role === 'eleve' ? (
                          <button
                            onClick={() => setModalPremium(u)}
                            disabled={loadingBadge[u._id]}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50 ${
                              estDomicile
                                ? 'bg-violet-100 text-violet-700 hover:bg-violet-200'
                                : estAbonne
                                  ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                                  : 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100'
                            }`}>
                            <Crown size={12} />
                            {loadingBadge[u._id] ? '…' : estDomicile ? '🏠 Domicile' : estAbonne ? '⭐ Gérer' : '+ Premium'}
                          </button>
                        ) : (
                          <span className="text-xs text-tate-terre/30">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          {u.role === 'eleve' && (
                            <button onClick={() => setModalParent(u)}
                              className={`p-1.5 rounded-lg transition-colors ${u.parentId ? 'text-succes hover:bg-green-50' : 'text-tate-terre/30 hover:bg-tate-doux hover:text-tate-terre'}`}
                              title={u.parentId ? 'Modifier le parent' : 'Lier un parent'}>
                              <UserCheck size={17} />
                            </button>
                          )}
                          <button onClick={() => toggleUserActif(u._id, !u.actif)}
                            className={`p-1.5 rounded-lg transition-colors ${u.actif ? 'hover:bg-orange-50 text-alerte' : 'hover:bg-green-50 text-succes'}`}
                            title={u.actif ? 'Désactiver' : 'Activer'}>
                            {u.actif ? <ToggleRight size={20} /> : <ToggleLeft size={20} />}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
            </tbody>
          </table>
          {filtres.length === 0 && (
            <p className="text-center text-tate-terre/40 py-12 text-sm">Aucun utilisateur trouvé</p>
          )}
        </div>
      </div>

        </div>
      )}

      {showModal && <ModalUser onClose={() => setShowModal(false)} onSave={creerUser} />}
      {profModal && (
        <ModalDossierProf
          prof={profModal}
          onClose={() => setProfModal(null)}
          onValider={validerProf}
          onRejeter={rejeterProf}
        />
      )}

      {/* Modal Badge Premium */}
      <AnimatePresence>
        {modalPremium && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
               onClick={() => setModalPremium(null)}>
            <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
              exit={{ scale:0.9, opacity:0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-serif font-bold text-tate-terre text-lg">Badge Premium</h2>
                  <p className="text-sm text-tate-terre/60">{modalPremium.nom}</p>
                </div>
                <button onClick={() => setModalPremium(null)}
                  className="w-8 h-8 rounded-xl hover:bg-tate-doux flex items-center justify-center">
                  <X size={16} />
                </button>
              </div>

              {/* Statut actuel */}
              <div className={`rounded-2xl px-4 py-3 mb-5 flex items-center gap-3 ${
                (modalPremium.abonnement === 'premium' && !modalPremium.abonnementExpiry)
                  ? 'bg-violet-50 border border-violet-200'
                  : (modalPremium.abonnement === 'premium' && modalPremium.abonnementExpiry)
                    ? 'bg-emerald-50 border border-emerald-200'
                    : 'bg-tate-doux border border-tate-border'
              }`}>
                <Crown size={20} className={
                  modalPremium.abonnement === 'premium' && !modalPremium.abonnementExpiry ? 'text-violet-600' :
                  modalPremium.abonnement === 'premium' ? 'text-emerald-600' : 'text-tate-terre/40'
                } />
                <div>
                  <p className="text-sm font-bold text-tate-terre">Statut actuel</p>
                  <p className="text-xs text-tate-terre/60">
                    {modalPremium.abonnement === 'premium' && !modalPremium.abonnementExpiry
                      ? '🏠 Suivi à domicile (accès illimité)'
                      : modalPremium.abonnement === 'premium' && modalPremium.abonnementExpiry
                        ? `⭐ Premium jusqu'au ${new Date(modalPremium.abonnementExpiry).toLocaleDateString('fr-FR')}`
                        : '❌ Pas de badge premium'}
                  </p>
                </div>
              </div>

              {/* Options */}
              <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wide mb-3">Attribuer un accès</p>
              <div className="space-y-2 mb-5">
                {[
                  { key:'domicile', label:'🏠 Suivi à domicile', desc:'Accès illimité sans date d\'expiry', color:'border-violet-200 bg-violet-50 text-violet-700' },
                  { key:'1',       label:'⭐ Premium 1 mois',   desc:'Expire dans 1 mois',                  color:'border-amber-200 bg-amber-50 text-amber-700' },
                  { key:'3',       label:'⭐ Premium 3 mois',   desc:'Expire dans 3 mois',                  color:'border-amber-200 bg-amber-50 text-amber-700' },
                  { key:'6',       label:'⭐ Premium 6 mois',   desc:'Expire dans 6 mois',                  color:'border-tate-soleil/50 bg-tate-doux text-tate-terre' },
                  { key:'12',      label:'⭐ Premium 1 an',     desc:'Expire dans 12 mois',                 color:'border-emerald-200 bg-emerald-50 text-emerald-700' },
                ].map(opt => (
                  <button key={opt.key}
                    onClick={() => donnerPremium(modalPremium._id, modalPremium.nom, opt.key)}
                    disabled={loadingBadge[modalPremium._id]}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl border-2 text-left transition-all
                      hover:shadow-sm disabled:opacity-50 ${opt.color}`}>
                    <div className="flex-1">
                      <p className="text-sm font-bold">{opt.label}</p>
                      <p className="text-xs opacity-70">{opt.desc}</p>
                    </div>
                    <Check size={14} className="flex-shrink-0 opacity-60" />
                  </button>
                ))}
              </div>

              {/* Retirer */}
              {modalPremium.abonnement === 'premium' && (
                <button
                  onClick={() => donnerPremium(modalPremium._id, modalPremium.nom, 'retirer')}
                  disabled={loadingBadge[modalPremium._id]}
                  className="w-full py-2.5 text-sm font-semibold text-alerte border-2 border-alerte/20
                             rounded-2xl hover:bg-red-50 hover:border-alerte/40 transition-all disabled:opacity-50
                             flex items-center justify-center gap-2">
                  <Trash2 size={14} /> Retirer le badge Premium
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal lier parent */}
      <AnimatePresence>
        {modalParent && (
          <ModalLierParent
            eleve={modalParent}
            onClose={() => setModalParent(null)}
            onLier={lierParent}
          />
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}