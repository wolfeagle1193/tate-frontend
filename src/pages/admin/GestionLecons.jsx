// ============================================================
// GestionLecons.jsx — Admin : valider, gérer, masquer, supprimer
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Eye, Clock, BookOpen, X,
  AlertCircle, Trash2, EyeOff, RefreshCw,
  Globe, Lock, Layers, ChevronDown, ChevronUp, Edit2, Save,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutAdmin }  from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

// ── Styles des blocs structurés ───────────────────────────────
const STYLES_BLOCS = {
  resume:     { border: 'border-l-slate-300',   bg: 'bg-white',       label: null,                 labelColor: '' },
  definition: { border: 'border-l-blue-400',    bg: 'bg-blue-50',     label: '📘 Définition',      labelColor: 'text-blue-700' },
  important:  { border: 'border-l-orange-400',  bg: 'bg-orange-50',   label: '⚠️ Important',       labelColor: 'text-orange-700' },
  attention:  { border: 'border-l-red-400',     bg: 'bg-red-50',      label: '🚨 Attention !',     labelColor: 'text-red-700' },
  astuce:     { border: 'border-l-yellow-400',  bg: 'bg-yellow-50',   label: '💡 Astuce',          labelColor: 'text-yellow-700' },
  formule:    { border: 'border-l-purple-400',  bg: 'bg-purple-50',   label: '🔢 Formule / Règle', labelColor: 'text-purple-700' },
  exemple:    { border: 'border-l-green-400',   bg: 'bg-green-50',    label: '✏️ Exemple',         labelColor: 'text-green-700' },
};

function BlocApercu({ bloc }) {
  if (bloc.type === 'section') {
    return (
      <div className="mt-4 mb-1">
        <h3 className="font-bold text-base text-tate-terre border-b-2 border-tate-soleil pb-1">
          {bloc.titre || bloc.texte}
        </h3>
      </div>
    );
  }
  const style = STYLES_BLOCS[bloc.type] || STYLES_BLOCS.resume;
  return (
    <div className={`rounded-xl border-l-4 ${style.border} ${style.bg} px-4 py-3 mb-2`}>
      {style.label && (
        <p className={`text-xs font-bold uppercase tracking-wide mb-1 ${style.labelColor}`}>{style.label}</p>
      )}
      {bloc.titre && <p className="font-semibold text-sm text-tate-terre mb-1">{bloc.titre}</p>}
      <p className="text-sm text-tate-terre leading-relaxed whitespace-pre-line">{bloc.texte}</p>
    </div>
  );
}

// ── Modal aperçu complet ──────────────────────────────────────
function ModalApercu({ lecon, onClose, onValider, onMasquer, onSupprimer, onEditer, estPubliee }) {
  const [confirmeSupp, setConfirmeSupp] = useState(false);
  const aHTML   = !!lecon.contenuHTML;
  const aBlocs  = lecon.contenuStructure?.length > 0;
  const aClaude = !aHTML && !aBlocs && lecon.contenuFormate?.resume;
  const exercices = lecon.contenuFormate?.correctionsTypes || [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tate-border flex-shrink-0
                        bg-gradient-to-r from-tate-creme to-white">
          <div className="flex-1 min-w-0 mr-4">
            <h2 className="font-serif font-bold text-tate-terre text-lg truncate">{lecon.titre}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                aHTML   ? 'bg-purple-100 text-purple-700' :
                aBlocs  ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
              }`}>
                {aHTML ? '🌐 HTML' : aBlocs ? '🧩 Blocs' : '🤖 Claude'}
              </span>
              {lecon.masque && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                  🙈 Masqué
                </span>
              )}
              {lecon.chapitreId?.titre && (
                <span className="text-xs text-tate-terre/50">{lecon.chapitreId.titre}</span>
              )}
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl hover:bg-tate-doux flex items-center justify-center text-tate-terre/50 flex-shrink-0">
            <X size={18} />
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {aHTML && (
            <div className="rounded-2xl overflow-hidden border border-tate-border">
              <div className="bg-tate-terre/5 px-4 py-2 flex items-center gap-2 border-b border-tate-border">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <p className="text-xs text-tate-terre/40 flex-1 text-center">Aperçu du cours HTML</p>
              </div>
              <iframe srcDoc={lecon.contenuHTML} title="Aperçu"
                style={{ width:'100%', height:'50vh', border:'none', display:'block' }}
                sandbox="allow-scripts" />
            </div>
          )}

          {aBlocs && (
            <div className="space-y-1">
              <p className="text-xs font-bold text-tate-terre/40 uppercase tracking-wide mb-3">Contenu du cours</p>
              {lecon.contenuStructure.map((bloc, i) => <BlocApercu key={i} bloc={bloc} />)}
            </div>
          )}

          {aClaude && (
            <div className="space-y-4">
              <div className="card">
                <p className="text-xs font-bold text-tate-terre/50 uppercase mb-2">📋 Résumé</p>
                <p className="text-sm text-tate-terre leading-relaxed">{lecon.contenuFormate.resume}</p>
              </div>
              {lecon.contenuFormate.regle && (
                <div className="bg-tate-doux border-2 border-tate-border rounded-2xl p-4">
                  <p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">📌 Règle</p>
                  <p className="font-semibold text-tate-terre">{lecon.contenuFormate.regle}</p>
                </div>
              )}
            </div>
          )}

          {exercices.length > 0 && (
            <div>
              <p className="text-xs font-bold text-tate-terre/40 uppercase tracking-wide mb-3">
                📝 {exercices.length} exercice{exercices.length > 1 ? 's' : ''}
              </p>
              <div className="space-y-2">
                {exercices.map((ex, i) => (
                  <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                    <p className="text-xs font-semibold text-tate-terre/60 mb-0.5">Q{i + 1}</p>
                    <p className="text-sm font-medium text-tate-terre">{ex.question}</p>
                    <p className="text-sm text-green-700 font-semibold mt-1">→ {ex.reponse}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!aHTML && !aBlocs && !aClaude && (
            <div className="text-center py-8 text-tate-terre/40">
              <AlertCircle size={36} className="mx-auto mb-2" />
              <p className="text-sm">Aucun contenu disponible</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-tate-border bg-gray-50 flex-shrink-0 space-y-3">
          {/* Ligne principale */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Fermer</button>

            {/* Bouton Éditer (toujours visible) */}
            <button onClick={() => onEditer?.(lecon)}
              className="flex-1 py-3 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all
                         bg-violet-100 text-violet-700 border-2 border-violet-200 hover:bg-violet-200">
              <Edit2 size={15} /> Modifier
            </button>

            {!estPubliee && onValider && (
              <button onClick={() => { onValider(lecon._id); onClose(); toast.success('✅ Leçon publiée !'); }}
                className="btn-succes flex-1 py-3 text-sm flex items-center justify-center gap-2">
                <Globe size={15} /> Valider et publier
              </button>
            )}

            {estPubliee && (
              <button
                onClick={() => { onMasquer(lecon._id); onClose(); }}
                className={`flex-1 py-3 text-sm font-bold rounded-2xl flex items-center justify-center gap-2 transition-all ${
                  lecon.masque
                    ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-200 hover:bg-emerald-200'
                    : 'bg-orange-100 text-orange-700 border-2 border-orange-200 hover:bg-orange-200'
                }`}>
                {lecon.masque ? <><Eye size={15} /> Rendre visible</> : <><EyeOff size={15} /> Masquer</>}
              </button>
            )}
          </div>

          {/* Suppression */}
          {!confirmeSupp ? (
            <button onClick={() => setConfirmeSupp(true)}
              className="w-full py-2.5 text-sm text-alerte font-semibold rounded-2xl border-2 border-alerte/20
                         hover:bg-red-50 hover:border-alerte/40 transition-all flex items-center justify-center gap-2">
              <Trash2 size={14} /> Supprimer définitivement
            </button>
          ) : (
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
              <p className="text-sm font-bold text-red-700 mb-3 text-center">
                ⚠️ Supprimer "{lecon.titre}" ? Cette action est irréversible.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmeSupp(false)}
                  className="flex-1 py-2 text-sm font-semibold rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-100 transition-all">
                  Annuler
                </button>
                <button onClick={() => { onSupprimer(lecon._id, lecon.titre); onClose(); }}
                  className="flex-1 py-2 text-sm font-bold rounded-xl bg-red-600 text-white hover:bg-red-700 transition-all">
                  Oui, supprimer
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ── Modal édition contenu ─────────────────────────────────────
function ModalEditer({ lecon, onClose, onSaved }) {
  const aHTML  = !!lecon.contenuHTML;
  const [titre,       setTitre]       = useState(lecon.titre || '');
  const [contenuHTML, setContenuHTML] = useState(lecon.contenuHTML || '');
  const [saving,      setSaving]      = useState(false);
  const [onglet,      setOnglet]      = useState(aHTML ? 'html' : 'apercu');

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { titre };
      if (aHTML) payload.contenuHTML = contenuHTML;
      await axios.patch(`${API}/lecons/${lecon._id}/contenu`, payload, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success('✅ Contenu mis à jour !');
      onSaved?.();
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur de sauvegarde');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
         onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">

        {/* En-tête */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-tate-border flex-shrink-0 bg-gradient-to-r from-violet-50 to-white">
          <div>
            <h2 className="font-serif font-bold text-tate-terre text-lg">Modifier la leçon</h2>
            <p className="text-xs text-tate-terre/50 mt-0.5">Les modifications seront visibles par les élèves immédiatement</p>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl hover:bg-tate-doux flex items-center justify-center text-tate-terre/50">
            <X size={18} />
          </button>
        </div>

        {/* Corps */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {/* Titre */}
          <div>
            <label className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide block mb-1.5">Titre de la leçon</label>
            <input
              value={titre}
              onChange={e => setTitre(e.target.value)}
              className="w-full h-11 rounded-xl border-2 border-tate-border px-3 text-sm text-tate-terre bg-white focus:border-violet-400 focus:outline-none transition-all"
              placeholder="Titre de la leçon…"
            />
          </div>

          {/* Contenu HTML uniquement */}
          {aHTML && (
            <div>
              <div className="flex gap-2 mb-3">
                {[
                  { id: 'html',   label: '✏️ Éditer HTML' },
                  { id: 'apercu', label: '👁️ Aperçu'     },
                ].map(tab => (
                  <button key={tab.id} onClick={() => setOnglet(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                      onglet === tab.id
                        ? 'border-violet-300 bg-violet-50 text-violet-700'
                        : 'border-tate-border bg-white text-tate-terre/50 hover:border-violet-200'
                    }`}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {onglet === 'html' ? (
                <div>
                  <label className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide block mb-1.5">
                    Contenu HTML du cours
                  </label>
                  <textarea
                    value={contenuHTML}
                    onChange={e => setContenuHTML(e.target.value)}
                    rows={18}
                    className="w-full rounded-xl border-2 border-tate-border px-3 py-2.5 text-xs text-tate-terre bg-gray-50 focus:border-violet-400 focus:outline-none resize-y font-mono leading-relaxed transition-all"
                    placeholder="Colle le HTML du cours ici…"
                    style={{ minHeight: '320px' }}
                  />
                  <p className="text-xs text-tate-terre/40 mt-1.5">
                    {contenuHTML.length.toLocaleString('fr-FR')} caractères
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden border border-tate-border">
                  <div className="bg-tate-terre/5 px-4 py-2 flex items-center gap-2 border-b border-tate-border">
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-red-400" />
                      <div className="w-3 h-3 rounded-full bg-yellow-400" />
                      <div className="w-3 h-3 rounded-full bg-green-400" />
                    </div>
                    <p className="text-xs text-tate-terre/40 flex-1 text-center">Aperçu du cours</p>
                  </div>
                  <iframe srcDoc={contenuHTML} title="Aperçu"
                    style={{ width: '100%', height: '50vh', border: 'none', display: 'block' }}
                    sandbox="allow-scripts" />
                </div>
              )}
            </div>
          )}

          {!aHTML && (
            <div className="text-center py-8 bg-tate-creme rounded-2xl">
              <p className="text-2xl mb-2">🧩</p>
              <p className="text-sm font-semibold text-tate-terre/60 mb-1">Cours généré par IA ou par blocs</p>
              <p className="text-xs text-tate-terre/40">Pour modifier ce type de cours, génère-en un nouveau depuis "Préparer un cours".</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-tate-border bg-gray-50 flex-shrink-0 flex gap-3">
          <button onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Annuler</button>
          <button
            onClick={handleSave}
            disabled={saving || !titre.trim() || (aHTML && !contenuHTML.trim())}
            className="flex-1 py-3 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6D28D9)' }}>
            {saving ? '⏳ Sauvegarde…' : <><Save size={15} /> Enregistrer les modifications</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ── Carte leçon ───────────────────────────────────────────────
function CarteLecon({ lecon, index, onVoir, onValider, onMasquer, onSupprimer, onEditer, estPubliee }) {
  const [actionsOuvertes, setActionsOuvertes] = useState(false);

  const typeCours = () => {
    if (lecon.contenuHTML)               return { label:'HTML',   color:'bg-purple-100 text-purple-700' };
    if (lecon.contenuStructure?.length)  return { label:'Blocs',  color:'bg-blue-100 text-blue-700'    };
    return                                      { label:'Claude', color:'bg-green-100 text-green-700'  };
  };
  const type = typeCours();
  const nbExos = lecon.contenuFormate?.correctionsTypes?.length || 0;

  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.04 }}
      className={`bg-white rounded-2xl border-2 shadow-card overflow-hidden transition-all
        ${lecon.masque ? 'border-orange-200 opacity-75' : 'border-tate-border hover:border-tate-soleil/50 hover:shadow-tate'}`}>

      {/* Bande statut */}
      <div className={`h-1 w-full ${lecon.masque ? 'bg-orange-300' : estPubliee ? 'bg-gradient-to-r from-tate-soleil to-tate-or' : 'bg-gradient-to-r from-blue-400 to-violet-400'}`} />

      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Icône */}
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
            ${lecon.masque ? 'bg-orange-50' : estPubliee ? 'bg-tate-doux' : 'bg-blue-50'}`}>
            {lecon.masque
              ? <EyeOff size={18} className="text-orange-500" />
              : estPubliee
                ? <Globe size={18} className="text-tate-soleil" />
                : <Clock size={18} className="text-blue-500" />
            }
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap mb-1">
              <p className="font-bold text-tate-terre text-sm leading-snug">{lecon.titre}</p>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 mb-2">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${type.color}`}>{type.label}</span>
              {lecon.masque && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">🙈 Masqué</span>
              )}
              {nbExos > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                  📝 {nbExos} exo{nbExos > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-tate-terre/40">
              <span>{new Date(lecon.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', year:'numeric' })}</span>
              {lecon.chapitreId?.titre && <span>· {lecon.chapitreId.titre}</span>}
              {lecon.chapitreId?.niveau && <span>· {lecon.chapitreId.niveau}</span>}
            </div>
          </div>
        </div>

        {/* Actions rapides */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-tate-border/50">
          <button onClick={() => onVoir(lecon)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                       bg-tate-doux text-tate-terre text-xs font-semibold hover:bg-tate-soleil/20 transition-colors">
            <Eye size={13} /> Voir
          </button>

          <button onClick={() => onEditer?.(lecon)}
            className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                       bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200
                       hover:bg-violet-100 transition-colors">
            <Edit2 size={13} /> Modifier
          </button>

          {!estPubliee && (
            <button onClick={() => onValider(lecon._id)}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                         bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200
                         hover:bg-emerald-100 transition-colors">
              <Globe size={13} /> Publier
            </button>
          )}

          {estPubliee && (
            <button onClick={() => onMasquer(lecon._id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl
                         text-xs font-semibold border transition-colors ${
                lecon.masque
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100'
              }`}>
              {lecon.masque ? <><Eye size={13} /> Afficher</> : <><EyeOff size={13} /> Masquer</>}
            </button>
          )}

          <button onClick={() => onSupprimer(lecon._id, lecon.titre)}
            className="w-9 h-9 rounded-xl bg-red-50 text-red-500 border border-red-200
                       flex items-center justify-center hover:bg-red-100 transition-colors flex-shrink-0"
            title="Supprimer définitivement">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Page principale ───────────────────────────────────────────
export function GestionLecons() {
  const { leconsEnAttente, chargerLeconsEnAttente, validerLecon } = useAdminStore();
  const [onglet,        setOnglet]        = useState('attente');   // 'attente' | 'publiees'
  const [leconsPubliees,setLeconsPubliees]= useState([]);
  const [chargement,    setChargement]    = useState(false);
  const [apercu,        setApercu]        = useState(null);
  const [leconEdition,  setLeconEdition]  = useState(null); // leçon en cours d'édition
  const [confirmSupp,   setConfirmSupp]   = useState(null); // {id, titre} en attente de confirmation

  // ── Charger les leçons publiées ──────────────────────────────
  const chargerPubliees = useCallback(async () => {
    setChargement(true);
    try {
      const { data } = await axios.get(`${API}/lecons/admin/tous`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setLeconsPubliees(data.data || []);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur chargement');
    } finally {
      setChargement(false);
    }
  }, []);

  useEffect(() => {
    chargerLeconsEnAttente();
    chargerPubliees();
  }, []);

  // ── Valider (publier) ────────────────────────────────────────
  const handleValider = async (id) => {
    try {
      await validerLecon(id);
      toast.success('✅ Leçon publiée aux élèves !');
      chargerLeconsEnAttente();
      chargerPubliees();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  // ── Masquer / démasquer ──────────────────────────────────────
  const handleMasquer = async (id) => {
    try {
      const { data } = await axios.patch(`${API}/lecons/${id}/masquer`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success(data.data.message);
      chargerPubliees();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    }
  };

  // ── Supprimer définitivement ─────────────────────────────────
  const handleSupprimer = (id, titre) => {
    // Ouvre la modale de confirmation (titre optionnel si appelé depuis la carte)
    setConfirmSupp({ id, titre: titre || 'cette leçon' });
  };

  const confirmerSuppression = async () => {
    if (!confirmSupp) return;
    try {
      await axios.delete(`${API}/lecons/${confirmSupp.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success('🗑️ Leçon supprimée définitivement');
      setConfirmSupp(null);
      setApercu(null);
      chargerLeconsEnAttente();
      chargerPubliees();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur suppression');
    }
  };

  const leconsActuelles = onglet === 'attente' ? leconsEnAttente : leconsPubliees;
  const masquees = leconsPubliees.filter(l => l.masque).length;

  return (
    <LayoutAdmin titre="Gestion des cours">

      {/* Onglets */}
      <div className="flex gap-3 mb-6">
        {[
          { id:'attente',  label:'En attente',  count: leconsEnAttente.length,
            icon: <Clock size={14} />,  color: 'from-blue-500 to-violet-500' },
          { id:'publiees', label:'Publiées',    count: leconsPubliees.length,
            icon: <Globe size={14} />,  color: 'from-tate-soleil to-tate-or' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`flex-1 relative flex flex-col items-center gap-1.5 py-3.5 px-4 rounded-2xl border-2 font-semibold text-sm transition-all ${
              onglet === tab.id
                ? 'border-transparent text-white shadow-card-lg'
                : 'border-tate-border bg-white text-tate-terre/60 hover:border-tate-soleil/50'
            }`}
            style={onglet === tab.id ? { background:`linear-gradient(135deg, ${tab.color.replace('from-','').replace('to-','').split(' ')[0]}, ${tab.color.split(' ')[1]})` } : {}}>
            {/* hack pour gradient dans style */}
            <div className={`flex items-center gap-2 ${onglet === tab.id ? 'text-white' : ''}`}>
              {tab.icon}
              <span>{tab.label}</span>
            </div>
            {tab.count > 0 && (
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                onglet === tab.id ? 'bg-white/25 text-white' : 'bg-tate-doux text-tate-terre'
              }`}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* Info masquées */}
      {onglet === 'publiees' && masquees > 0 && (
        <div className="mb-4 bg-orange-50 border-2 border-orange-200 rounded-2xl px-4 py-3 flex items-center gap-3">
          <EyeOff size={16} className="text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700 font-semibold">
            {masquees} cours masqué{masquees > 1 ? 's' : ''} — invisibles pour les élèves
          </p>
        </div>
      )}

      {/* En-tête avec actualiser */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-tate-terre/60">
          {leconsActuelles.length} leçon{leconsActuelles.length !== 1 ? 's' : ''}
          {onglet === 'attente' ? ' en attente de validation' : ' publiées au total'}
        </p>
        <button
          onClick={() => { chargerLeconsEnAttente(); chargerPubliees(); }}
          className="flex items-center gap-1.5 text-xs text-savoir hover:underline font-semibold">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {/* Liste */}
      {chargement ? (
        <div className="space-y-3">
          {[1,2,3].map(i => <div key={i} className="h-28 skeleton rounded-2xl" />)}
        </div>
      ) : leconsActuelles.length === 0 ? (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }}
          className="card text-center py-16">
          <CheckCircle size={48} className="text-succes mx-auto mb-4" />
          <p className="font-serif font-bold text-tate-terre text-lg">
            {onglet === 'attente' ? 'Tout est validé !' : 'Aucun cours publié'}
          </p>
          <p className="text-sm text-tate-terre/40 mt-2">
            {onglet === 'attente'
              ? 'Aucune leçon en attente — utilise "Préparer un cours" pour en créer une.'
              : 'Les cours publiés apparaîtront ici pour gestion.'}
          </p>
        </motion.div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {leconsActuelles.map((lecon, i) => (
            <CarteLecon
              key={lecon._id}
              lecon={lecon}
              index={i}
              estPubliee={onglet === 'publiees'}
              onVoir={(l) => setApercu(l)}
              onValider={handleValider}
              onMasquer={handleMasquer}
              onSupprimer={handleSupprimer}
              onEditer={(l) => setLeconEdition(l)}
            />
          ))}
        </div>
      )}

      {/* Modal aperçu */}
      <AnimatePresence>
        {apercu && (
          <ModalApercu
            lecon={apercu}
            estPubliee={onglet === 'publiees'}
            onClose={() => setApercu(null)}
            onValider={handleValider}
            onMasquer={handleMasquer}
            onSupprimer={handleSupprimer}
            onEditer={(l) => { setApercu(null); setLeconEdition(l); }}
          />
        )}
      </AnimatePresence>

      {/* Modal édition contenu */}
      <AnimatePresence>
        {leconEdition && (
          <ModalEditer
            lecon={leconEdition}
            onClose={() => setLeconEdition(null)}
            onSaved={() => { chargerLeconsEnAttente(); chargerPubliees(); }}
          />
        )}
      </AnimatePresence>

      {/* Modal confirmation suppression */}
      <AnimatePresence>
        {confirmSupp && (
          <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
               onClick={() => setConfirmSupp(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-alerte" />
              </div>
              <h3 className="text-lg font-serif font-bold text-tate-terre text-center mb-2">
                Supprimer cette leçon ?
              </h3>
              <p className="text-sm text-center text-tate-terre/60 mb-1">
                « <strong className="text-tate-terre">{confirmSupp.titre}</strong> »
              </p>
              <p className="text-xs text-center text-alerte font-semibold mb-5">
                ⚠️ Cette action est irréversible
              </p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmSupp(null)}
                  className="btn-outline flex-1 py-3">
                  Annuler
                </button>
                <button onClick={confirmerSuppression}
                  className="flex-1 py-3 rounded-2xl bg-alerte text-white font-bold hover:bg-red-600 transition-colors">
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
