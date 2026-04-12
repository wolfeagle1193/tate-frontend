// ============================================================
// GestionMatieres.jsx — Admin : gérer les catégories (matières)
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Pencil, Trash2, BookOpen, Globe, RefreshCw, Check } from 'lucide-react';
import { LayoutAdmin } from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const hdrs     = () => ({ Authorization: `Bearer ${getToken()}` });

const NIVEAUX_TOUS = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];

const ICONES = ['📚','📖','📐','🔬','🌍','🏛️','🎨','🎵','💻','🌐','🗣️','✏️','🧮','⚗️','🌿','🎭'];

const COULEURS = [
  '#F97316','#F59E0B','#10B981','#3B82F6','#8B5CF6','#EC4899',
  '#14B8A6','#EF4444','#6366F1','#059669','#D97706','#7C3AED',
];

// ── Modal créer / éditer matière ─────────────────────────────
function ModalMatiere({ matiere, onClose, onSave }) {
  const [form, setForm] = useState({
    nom:       matiere?.nom       || '',
    code:      matiere?.code      || '',
    icone:     matiere?.icone     || '📚',
    couleur:   matiere?.couleur   || '#F97316',
    niveaux:   matiere?.niveaux   || [],
    ordre:     matiere?.ordre     || 0,
    estLangue: matiere?.estLangue || false,
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleNiveau = (n) => {
    setForm(f => ({
      ...f,
      niveaux: f.niveaux.includes(n) ? f.niveaux.filter(x => x !== n) : [...f.niveaux, n],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.nom.trim()) return toast.error('Le nom est obligatoire');
    if (!form.code.trim()) return toast.error('Le code est obligatoire');
    setLoading(true);
    try {
      await onSave(form);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        exit={{ scale:0.9, opacity:0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[92vh] overflow-y-auto">

        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">
            {matiere ? 'Modifier la matière' : 'Nouvelle matière'}
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-tate-doux flex items-center justify-center">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nom + Code */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Nom *</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                className="input-tate" placeholder="ex: Français" required />
            </div>
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Code * (2-3 lettres)</label>
              <input value={form.code} onChange={e => set('code', e.target.value.toUpperCase())}
                className="input-tate" placeholder="ex: FR" maxLength={5} required />
            </div>
          </div>

          {/* Icône */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-2">Icône</label>
            <div className="grid grid-cols-8 gap-2">
              {ICONES.map(ic => (
                <button key={ic} type="button" onClick={() => set('icone', ic)}
                  className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all ${
                    form.icone === ic ? 'bg-tate-soleil/30 ring-2 ring-tate-soleil scale-110' : 'bg-tate-doux hover:bg-tate-soleil/20'
                  }`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-2">Couleur</label>
            <div className="flex flex-wrap gap-2">
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => set('couleur', c)}
                  className={`w-8 h-8 rounded-full transition-all ${
                    form.couleur === c ? 'ring-3 ring-offset-2 scale-110' : 'hover:scale-105'
                  }`}
                  style={{ background: c, ringColor: c }}>
                  {form.couleur === c && <Check size={12} className="text-white mx-auto mt-0.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Aperçu */}
          <div className="rounded-2xl p-4 flex items-center gap-3"
               style={{ background: form.couleur + '18', borderColor: form.couleur + '40', border: '2px solid' }}>
            <span className="text-3xl">{form.icone}</span>
            <div>
              <p className="font-bold text-tate-terre">{form.nom || 'Nom de la matière'}</p>
              <p className="text-xs text-tate-terre/50">Code : {form.code || '??'}</p>
            </div>
          </div>

          {/* Niveaux */}
          <div>
            <label className="block text-xs font-bold text-tate-terre/60 mb-2">
              Niveaux scolaires concernés (laisser vide = tous)
            </label>
            <div className="flex flex-wrap gap-2">
              {NIVEAUX_TOUS.map(n => (
                <button key={n} type="button" onClick={() => toggleNiveau(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border-2 transition-all ${
                    form.niveaux.includes(n)
                      ? 'border-tate-soleil bg-tate-doux text-tate-terre'
                      : 'border-tate-border text-tate-terre/50 hover:border-tate-soleil/50'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Ordre + Langue */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1">Ordre d'affichage</label>
              <input type="number" value={form.ordre} onChange={e => set('ordre', parseInt(e.target.value)||0)}
                className="input-tate" />
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <div onClick={() => set('estLangue', !form.estLangue)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.estLangue ? 'bg-tate-soleil' : 'bg-gray-200'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.estLangue ? 'translate-x-4' : 'translate-x-0.5'}`} />
                </div>
                <span className="text-sm font-semibold text-tate-terre/70">Matière langue</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
            <button type="submit" disabled={loading} className="btn-tate flex-1 py-3">
              {loading ? '⏳ Enregistrement…' : matiere ? 'Modifier' : 'Créer la matière'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Carte matière ─────────────────────────────────────────────
function CarteMatiere({ mat, index, onEditer, onSupprimer }) {
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white rounded-2xl border-2 border-tate-border shadow-card overflow-hidden hover:shadow-card-lg transition-all">

      {/* Bande couleur */}
      <div className="h-1.5 w-full" style={{ background: mat.couleur }} />

      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
               style={{ background: mat.couleur + '20' }}>
            {mat.icone}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-tate-terre">{mat.nom}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono bg-tate-doux text-tate-terre/60 px-2 py-0.5 rounded-lg">{mat.code}</span>
              {mat.estLangue && <span className="text-xs text-violet-600 font-semibold">🗣️ Langue</span>}
            </div>
          </div>
          <span className="text-xs text-tate-terre/30 font-mono">#{mat.ordre}</span>
        </div>

        {/* Niveaux */}
        {mat.niveaux?.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {mat.niveaux.map(n => (
              <span key={n} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-tate-doux text-tate-terre/60">
                {n}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button onClick={() => onEditer(mat)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl
                       bg-tate-doux text-tate-terre text-xs font-semibold hover:bg-tate-soleil/20 transition-colors">
            <Pencil size={12} /> Modifier
          </button>
          <button onClick={() => onSupprimer(mat._id, mat.nom)}
            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-200
                       flex items-center justify-center hover:bg-red-100 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────
export function GestionMatieres() {
  const [matieres,  setMatieres]  = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [modal,     setModal]     = useState(null);  // null | 'create' | matiere-object

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/matieres`, { headers: hdrs() });
      setMatieres(data.data || []);
    } catch (e) { toast.error('Erreur chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const sauvegarder = async (form) => {
    if (modal && modal._id) {
      // Modifier
      await axios.put(`${API}/matieres/${modal._id}`, form, { headers: hdrs() });
      toast.success('✅ Matière modifiée !');
    } else {
      // Créer
      await axios.post(`${API}/matieres`, form, { headers: hdrs() });
      toast.success('✅ Nouvelle matière créée !');
    }
    charger();
  };

  const supprimer = async (id, nom) => {
    if (!window.confirm(`Désactiver la matière "${nom}" ? Elle ne sera plus visible pour les élèves.`)) return;
    try {
      await axios.delete(`${API}/matieres/${id}`, { headers: hdrs() });
      toast.success(`Matière "${nom}" désactivée`);
      charger();
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  return (
    <LayoutAdmin titre="Catégories & Matières"
      action={
        <button onClick={() => setModal('create')} className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nouvelle matière
        </button>
      }>

      {/* En-tête */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-sm text-tate-terre/60">
            {matieres.length} matière{matieres.length !== 1 ? 's' : ''} actives
          </p>
          <p className="text-xs text-tate-terre/40 mt-0.5">
            Crée ici de nouvelles catégories (Français, Maths, Wolof, Informatique…)
          </p>
        </div>
        <button onClick={charger} className="flex items-center gap-1.5 text-xs text-savoir hover:underline font-semibold">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Grille */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[1,2,3,4,5,6].map(i => <div key={i} className="h-36 skeleton rounded-2xl" />)}
        </div>
      ) : matieres.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="card text-center py-16">
          <BookOpen size={48} className="text-tate-terre/20 mx-auto mb-4" />
          <p className="font-serif font-bold text-tate-terre text-lg">Aucune matière</p>
          <p className="text-sm text-tate-terre/40 mt-2 mb-4">Crée ta première matière pour démarrer</p>
          <button onClick={() => setModal('create')} className="btn-tate px-6 py-3 mx-auto">
            + Créer une matière
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {matieres.map((mat, i) => (
            <CarteMatiere key={mat._id} mat={mat} index={i}
              onEditer={(m) => setModal(m)}
              onSupprimer={supprimer}
            />
          ))}
        </div>
      )}

      {/* Bloc info */}
      <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
        <p className="text-sm font-bold text-blue-700 mb-1">💡 Comment ça marche ?</p>
        <ul className="text-xs text-blue-600 space-y-0.5">
          <li>• Chaque matière a un <strong>code unique</strong> (ex: FR, MA, AN)</li>
          <li>• Les chapitres et cours sont rattachés à une matière</li>
          <li>• Désactiver une matière la masque pour les élèves</li>
          <li>• Le code ne peut pas être modifié après création (il lie les chapitres)</li>
        </ul>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {modal && (
          <ModalMatiere
            matiere={modal === 'create' ? null : modal}
            onClose={() => setModal(null)}
            onSave={sauvegarder}
          />
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
