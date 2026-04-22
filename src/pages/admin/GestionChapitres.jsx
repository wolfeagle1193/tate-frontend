// ─────────────────────────────────────────────
// GestionChapitres.jsx — Admin : gérer les chapitres
// ─────────────────────────────────────────────
import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, BookOpen, Lock, Unlock, Globe, GraduationCap, Pencil, Trash2,
         UploadCloud, FileText, FileImage, File, Loader2, BookMarked, Sparkles } from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutAdmin }   from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

const BACKEND_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// Icône selon type de fichier
const IconeDoc = ({ type }) => {
  if (['jpg','jpeg','png'].includes(type)) return <FileImage size={14} className="text-blue-500" />;
  if (type === 'pdf')  return <FileText size={14} className="text-red-500" />;
  return <File size={14} className="text-gray-400" />;
};

const formatTaille = (octets) => {
  if (octets < 1024)       return `${octets} o`;
  if (octets < 1024*1024)  return `${(octets/1024).toFixed(0)} Ko`;
  return `${(octets/1024/1024).toFixed(1)} Mo`;
};

const NIVEAUX_SCOLAIRES = ['CM1', 'CM2', '6eme', '5eme', '4eme', '3eme', 'Seconde', 'Premiere', 'Terminale'];
const NIVEAUX = [...NIVEAUX_SCOLAIRES, 'Libre'];  // Libre = cours de langue

// Niveaux pour lesquels le Français a 4 sous-sections
const NIVEAUX_4_SECTIONS = ['CM1','CM2','6eme','5eme','4eme','3eme'];

const SECTIONS_FR = [
  { value: 'Grammaire',              label: 'Grammaire',              couleur: 'bg-blue-50   border-blue-200   text-blue-700'   },
  { value: 'Conjugaison',            label: 'Conjugaison',            couleur: 'bg-yellow-50 border-yellow-200 text-yellow-700' },
  { value: 'Orthographe grammaticale', label: 'Orthographe grammaticale', couleur: 'bg-orange-50 border-orange-200 text-orange-700' },
  { value: "Orthographe d'usage",    label: "Orthographe d'usage",    couleur: 'bg-green-50  border-green-200  text-green-700'  },
];

// ── Séparateur de section dans le formulaire ──
const SectionLabel = ({ icone, titre, sous }) => (
  <div className="flex items-center gap-2 pt-1">
    <span className="text-base">{icone}</span>
    <div>
      <p className="text-xs font-bold text-tate-terre uppercase tracking-wide">{titre}</p>
      {sous && <p className="text-xs text-tate-terre/40">{sous}</p>}
    </div>
    <div className="flex-1 h-px bg-tate-border ml-1" />
  </div>
);

// ── Modal création/édition chapitre ──────────
function ModalChapitre({ matieres, chapitres, initial, onClose, onSave,
                         onUploadDocs, onSupprimerDoc }) {
  const isEdit = !!initial;
  // Normaliser matiereId → toujours un string (l'ID), même si le store renvoie l'objet peuplé
  const normalizeMatiereId = (v) => (v && typeof v === 'object' ? v._id?.toString() || v.toString() : v || matieres[0]?._id || '');
  const [form, setForm] = useState(initial ? {
    ...initial,
    matiereId:  normalizeMatiereId(initial.matiereId),
    sectionFr:  initial.sectionFr || '',
  } : {
    matiereId: matieres[0]?._id || '',
    titre: '', niveau: 'CM1', objectif: '',
    ordre: 1, promptSupplement: '', formatExercices: '', prerequis: '',
    sectionFr: '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Docs déjà enregistrés (mode édition)
  const [docs, setDocs] = useState(initial?.documentsRef || []);
  // Fichiers en attente d'upload (mode création — uploadés après création du chapitre)
  const [fichiersPending, setFichiersPending] = useState([]);
  // Upload en cours (mode édition uniquement — immédiat)
  const [uploadEnCours, setUploadEnCours] = useState(false);
  const [enregistrement, setEnregistrement] = useState(false);
  const inputFileRef = useRef(null);

  const matSelected  = matieres.find(m => m._id === form.matiereId);
  const isLangue     = matSelected?.estLangue;
  const isFrancais   = matSelected?.code === 'FR';
  const showSections = isFrancais && NIVEAUX_4_SECTIONS.includes(form.niveau);

  const totalDocs = isEdit ? docs.length : fichiersPending.length;
  const maxDocs   = 5;

  useEffect(() => {
    if (isLangue) set('niveau', 'Libre');
  }, [form.matiereId]);

  const chapsPrereq = chapitres.filter(c =>
    c.matiereId?._id === form.matiereId && (c.niveau === form.niveau || (isLangue && !c.niveau))
  );

  // ── Sélection de fichiers (mode création = pending, mode édition = upload immédiat)
  const handleSelectFichiers = async (e) => {
    const fichiers = Array.from(e.target.files || []);
    if (!fichiers.length) return;
    e.target.value = '';

    if (!isEdit) {
      // Mode création : on met en file d'attente
      const reste = maxDocs - fichiersPending.length;
      setFichiersPending(prev => [...prev, ...fichiers.slice(0, reste)]);
      return;
    }

    // Mode édition : upload immédiat
    setUploadEnCours(true);
    try {
      const res = await onUploadDocs(initial._id, fichiers);
      setDocs(res.chapitre.documentsRef || []);
      toast.success(`${fichiers.length} document(s) ajouté(s) ✓`);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur upload');
    } finally {
      setUploadEnCours(false);
    }
  };

  const retirerPending = (idx) =>
    setFichiersPending(prev => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.titre.trim())   { toast.error('Titre obligatoire');   return; }
    if (!form.objectif.trim()){ toast.error('Objectif obligatoire'); return; }
    setEnregistrement(true);
    try {
      const payload = {
        ...form,
        // S'assurer que matiereId est toujours un string (ObjectId), pas un objet peuplé
        matiereId:       normalizeMatiereId(form.matiereId),
        niveau:          isLangue ? null : form.niveau,
        prerequis:       form.prerequis || undefined,
        formatExercices: form.formatExercices || '',
        sectionFr:       showSections ? (form.sectionFr || null) : null,
      };

      const chapSauve = await onSave(payload); // renvoie le chapitre créé/modifié

      // Si création avec des fichiers en attente → upload maintenant
      if (!isEdit && fichiersPending.length > 0 && chapSauve?._id) {
        try {
          await onUploadDocs(chapSauve._id, fichiersPending);
        } catch {
          toast.error('Chapitre créé mais erreur lors de l\'upload des documents');
        }
      }

      onClose();
      toast.success(isEdit
        ? 'Chapitre modifié !'
        : `Chapitre créé !${fichiersPending.length > 0 ? ` (${fichiersPending.length} doc(s) uploadé(s))` : ''}`
      );
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally {
      setEnregistrement(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-xl max-h-[92vh] overflow-y-auto">

        {/* En-tête */}
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-serif font-bold text-tate-terre text-lg">
            {isEdit ? '✏️ Modifier le chapitre' : '✨ Nouveau chapitre'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux"><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* ── SECTION 1 : Identification ─────────────── */}
          <SectionLabel icone="📋" titre="Identification" />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Matière</label>
              <select value={form.matiereId} onChange={e => set('matiereId', e.target.value)} className="input-tate">
                <optgroup label="Matières scolaires">
                  {matieres.filter(m => !m.estLangue).map(m =>
                    <option key={m._id} value={m._id}>{m.icone} {m.nom}</option>
                  )}
                </optgroup>
                <optgroup label="Langues (cours libres)">
                  {matieres.filter(m => m.estLangue).map(m =>
                    <option key={m._id} value={m._id}>{m.icone} {m.nom}</option>
                  )}
                </optgroup>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">
                Niveau {isLangue && <span className="text-tate-soleil text-xs">(auto)</span>}
              </label>
              <select value={form.niveau} onChange={e => set('niveau', e.target.value)}
                className="input-tate" disabled={isLangue}>
                {NIVEAUX_SCOLAIRES.map(n => <option key={n} value={n}>{n}</option>)}
                <option value="Libre">🌍 Libre (langues)</option>
              </select>
            </div>
          </div>

          {/* Section Français */}
          {showSections && (
            <div className="border-2 border-blue-200 rounded-2xl p-3 bg-blue-50/40">
              <label className="block text-xs font-bold text-tate-terre mb-2">
                📚 Sous-section Français
                <span className="font-normal text-tate-terre/50 ml-1">(obligatoire)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {SECTIONS_FR.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => set('sectionFr', s.value)}
                    className={`p-2.5 rounded-xl border-2 text-xs font-semibold text-left transition-all ${
                      form.sectionFr === s.value
                        ? `${s.couleur} shadow-sm`
                        : 'border-tate-border bg-white text-tate-terre/60 hover:border-tate-soleil/50'
                    }`}>
                    {s.label}
                  </button>
                ))}
              </div>
              {!form.sectionFr && <p className="text-xs text-alerte mt-2">Sélectionne une sous-section</p>}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Titre du chapitre</label>
            <input value={form.titre} onChange={e => set('titre', e.target.value)}
              placeholder={showSections ? `Ex : Le pluriel des noms${form.sectionFr ? ` — ${form.sectionFr}` : ''}` : "Ex : Le pluriel des noms"}
              className="input-tate" required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Objectif pédagogique</label>
            <input value={form.objectif} onChange={e => set('objectif', e.target.value)}
              placeholder="Ce que l'élève saura faire après cette leçon"
              className="input-tate" required />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Ordre</label>
              <input type="number" min="1" value={form.ordre}
                onChange={e => set('ordre', +e.target.value)} className="input-tate" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Prérequis</label>
              <select value={form.prerequis} onChange={e => set('prerequis', e.target.value)} className="input-tate">
                <option value="">Aucun</option>
                {chapsPrereq.map(c => <option key={c._id} value={c._id}>{c.titre}</option>)}
              </select>
            </div>
          </div>

          {/* ── SECTION 2 : Consignes pour l'IA ───────── */}
          <SectionLabel icone="🤖" titre="Consignes pour l'IA"
            sous="Indique précisément comment l'IA doit générer les cours et exercices" />

          {/* Style et contexte */}
          <div>
            <label className="block text-xs font-semibold text-tate-terre/70 mb-1">
              Consigne générale — ton, style, exemples à utiliser
            </label>
            <textarea value={form.promptSupplement} onChange={e => set('promptSupplement', e.target.value)}
              placeholder={`Ex : Utilise uniquement des exemples tirés de la vie quotidienne africaine.\nCite des prénoms africains (Kofi, Amina, Moussa…).\nSois chaleureux, encourage l'élève à chaque étape.`}
              className="input-tate resize-none" rows={3} />
          </div>

          {/* Format strict des exercices */}
          <div className="border-2 border-tate-soleil/50 rounded-2xl p-4 bg-tate-soleil/5">
            <label className="block text-xs font-bold text-tate-terre mb-1.5 flex items-center gap-1.5">
              🔒 Format strict des exercices
              <span className="font-normal text-tate-terre/50">(l'IA ne peut PAS s'en écarter)</span>
            </label>
            <textarea value={form.formatExercices} onChange={e => set('formatExercices', e.target.value)}
              placeholder={
                `Décris précisément le type d'exercice que l'IA DOIT produire :\n• Ex : Toujours des phrases à trous (jamais de QCM)\n• Chaque phrase doit mentionner un lieu ou un prénom africain\n• La réponse attendue est toujours un seul mot\n• 2 phrases de contexte avant chaque question`
              }
              className="input-tate resize-none bg-white" rows={5} />
            <p className="text-xs text-tate-terre/40 mt-2">
              💡 Plus c'est précis, plus l'IA respectera ton modèle d'exercice.
            </p>
          </div>

          {/* ── SECTION 3 : Documents de référence ────── */}
          <SectionLabel icone="📎" titre="Documents de référence"
            sous="L'IA s'en inspirera pour le cours et les exercices" />

          <div className="border-2 border-savoir/30 rounded-2xl p-4 bg-savoir/5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-tate-terre/60">
                Manuels, modèles d'exercices, fiches pédagogiques — <strong>PDF, TXT, DOCX, images</strong>
              </p>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                totalDocs >= maxDocs ? 'bg-alerte/10 text-alerte' : 'bg-savoir/10 text-savoir'
              }`}>{totalDocs}/{maxDocs}</span>
            </div>

            {/* Liste des docs enregistrés (édition) */}
            {isEdit && docs.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {docs.map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-tate-border">
                    <IconeDoc type={doc.type} />
                    <span className="text-xs text-tate-terre flex-1 truncate font-medium" title={doc.nom}>{doc.nom}</span>
                    <span className="text-xs text-tate-terre/40 flex-shrink-0">{formatTaille(doc.taille)}</span>
                    <button type="button"
                      onClick={async () => {
                        try {
                          const res = await onSupprimerDoc(initial._id, i);
                          setDocs(res.chapitre.documentsRef || []);
                          toast.success('Document supprimé');
                        } catch { toast.error('Erreur suppression'); }
                      }}
                      className="p-1 rounded-lg hover:bg-red-50 text-neutre hover:text-alerte transition-colors flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Fichiers en attente (création) */}
            {!isEdit && fichiersPending.length > 0 && (
              <div className="space-y-1.5 mb-3">
                {fichiersPending.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2.5 border border-savoir/30">
                    <IconeDoc type={f.name.split('.').pop().toLowerCase()} />
                    <span className="text-xs text-tate-terre flex-1 truncate font-medium">{f.name}</span>
                    <span className="text-xs text-tate-terre/40 flex-shrink-0">{formatTaille(f.size)}</span>
                    <span className="text-xs bg-tate-soleil/20 text-tate-terre px-1.5 py-0.5 rounded-full flex-shrink-0">en attente</span>
                    <button type="button" onClick={() => retirerPending(i)}
                      className="p-1 rounded-lg hover:bg-red-50 text-neutre hover:text-alerte transition-colors flex-shrink-0">
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Zone d'ajout */}
            {totalDocs < maxDocs && (
              <>
                <input
                  ref={inputFileRef}
                  type="file"
                  multiple
                  accept=".pdf,.txt,.docx,.doc,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleSelectFichiers}
                />
                <button
                  type="button"
                  disabled={uploadEnCours}
                  onClick={() => inputFileRef.current?.click()}
                  className="w-full border-2 border-dashed border-savoir/30 rounded-xl py-3 text-xs text-savoir/70 hover:border-savoir hover:bg-savoir/5 transition-all flex items-center justify-center gap-2 font-medium">
                  {uploadEnCours
                    ? <><Loader2 size={14} className="animate-spin" /> Upload en cours…</>
                    : <><UploadCloud size={14} /> {isEdit ? 'Ajouter un document' : 'Sélectionner des documents'}</>
                  }
                </button>
              </>
            )}

            {!isEdit && fichiersPending.length > 0 && (
              <p className="text-xs text-savoir/70 mt-2 text-center">
                ✅ Ces documents seront uploadés automatiquement à la création du chapitre
              </p>
            )}
            {isEdit && (
              <p className="text-xs text-tate-terre/40 mt-2">
                L'IA lira ces documents pour générer le cours et les exercices.
              </p>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
            <button type="submit" disabled={enregistrement} className="btn-tate flex-1 py-3 flex items-center justify-center gap-2">
              {enregistrement
                ? <><Loader2 size={15} className="animate-spin" /> {isEdit ? 'Enregistrement…' : 'Création…'}</>
                : isEdit ? 'Enregistrer les modifications' : `Créer le chapitre${fichiersPending.length > 0 ? ` + ${fichiersPending.length} doc(s)` : ''}`
              }
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ── Page principale ───────────────────────────
export function GestionChapitres() {
  const {
    chapitres, matieres,
    chargerChapitres, chargerMatieres,
    creerChapitre, modifierChapitre,
    uploaderDocsChapitre, supprimerDocChapitre,
  } = useAdminStore();
  const [showModal,     setShowModal]     = useState(false);
  const [chapEdit,      setChapEdit]      = useState(null);
  const [onglet,        setOnglet]        = useState('scolaire'); // 'scolaire' | 'langues'
  const [filtreNiveau,  setFiltreNiveau]  = useState('CM1');
  const [filtreMatiere, setFiltreMatiere] = useState('tous');
  const [supprConfirm,  setSupprConfirm] = useState(null); // {id, titre} | null

  useEffect(() => { chargerMatieres(); }, []);

  useEffect(() => {
    if (onglet === 'scolaire') {
      chargerChapitres({ niveau: filtreNiveau });
    } else {
      chargerChapitres({ estLangue: 'true' });
    }
  }, [filtreNiveau, onglet]);

  const matieresScolaires = matieres.filter(m => !m.estLangue);
  const matieresLangues   = matieres.filter(m => m.estLangue);

  const chapsFiltres = chapitres.filter(c => {
    if (onglet === 'langues') return true;
    return filtreMatiere === 'tous' || c.matiereId?._id === filtreMatiere;
  });

  const openEdit = (chap) => {
    setChapEdit({
      matiereId:        chap.matiereId?._id || '',
      titre:            chap.titre,
      niveau:           chap.niveau || 'Libre',
      objectif:         chap.objectif,
      ordre:            chap.ordre,
      promptSupplement: chap.promptSupplement || '',
      formatExercices:  chap.formatExercices  || '',
      prerequis:        chap.prerequis || '',
      sectionFr:        chap.sectionFr        || '',
      documentsRef:     chap.documentsRef     || [],
      _id:              chap._id,
    });
    setShowModal(true);
  };

  const supprimerDefinitivement = async (id) => {
    try {
      await axios.delete(`${API}/chapitres/${id}?permanent=true`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      toast.success('Chapitre et toutes ses leçons supprimés définitivement');
      setSupprConfirm(null);
      if (onglet === 'scolaire') chargerChapitres({ niveau: filtreNiveau });
      else chargerChapitres({ estLangue: 'true' });
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur suppression');
    }
  };

  const handleSave = async (payload) => {
    // Supprimer _id et documentsRef du payload pour éviter l'erreur MongoDB "Mod on _id not allowed"
    const { _id, documentsRef, ...cleanPayload } = payload;
    if (chapEdit?._id) {
      await modifierChapitre(chapEdit._id, cleanPayload);
      return chapEdit; // en édition, on renvoie l'objet existant (pas besoin de l'ID pour l'upload)
    } else {
      const chap = await creerChapitre(cleanPayload);
      return chap; // renvoie le nouveau chapitre avec son _id pour l'upload des docs
    }
  };

  return (
    <LayoutAdmin titre="Chapitres"
      action={
        <button onClick={() => { setChapEdit(null); setShowModal(true); }}
          className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nouveau chapitre
        </button>
      }>

      {/* Onglets Scolaire / Langues */}
      <div className="flex gap-2 mb-5">
        <button onClick={() => setOnglet('scolaire')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            onglet === 'scolaire' ? 'bg-tate-soleil text-tate-terre shadow-tate' : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
          }`}>
          <GraduationCap size={16} /> Matières scolaires
        </button>
        <button onClick={() => setOnglet('langues')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
            onglet === 'langues' ? 'bg-tate-soleil text-tate-terre shadow-tate' : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
          }`}>
          <Globe size={16} /> Cours de langues libres
        </button>
      </div>

      {/* Filtres niveau (scolaire uniquement) */}
      {onglet === 'scolaire' && (
        <>
          <div className="flex gap-2 mb-3 flex-wrap">
            {NIVEAUX_SCOLAIRES.map(n => (
              <button key={n} onClick={() => setFiltreNiveau(n)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  filtreNiveau === n ? 'bg-tate-terre text-white' : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
                }`}>{n}</button>
            ))}
          </div>
          <div className="flex gap-2 mb-5 flex-wrap">
            <button onClick={() => setFiltreMatiere('tous')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtreMatiere === 'tous' ? 'bg-tate-soleil/20 text-tate-terre font-semibold' : 'bg-white border border-tate-border text-tate-terre/50'}`}>
              Toutes
            </button>
            {matieresScolaires.map(m => (
              <button key={m._id} onClick={() => setFiltreMatiere(m._id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${filtreMatiere === m._id ? 'bg-tate-soleil/20 text-tate-terre font-semibold' : 'bg-white border border-tate-border text-tate-terre/50'}`}>
                {m.icone} {m.nom}
              </button>
            ))}
          </div>
        </>
      )}

      {/* Bandeau info langues */}
      {onglet === 'langues' && (
        <div className="mb-5 bg-tate-doux border border-tate-border rounded-2xl p-4 flex items-center gap-3">
          <Globe size={18} className="text-tate-soleil flex-shrink-0" />
          <p className="text-sm text-tate-terre">
            Les cours de langues sont <strong>libres</strong> — pas liés à un niveau scolaire. 
            Accessibles à tous les élèves depuis la section Langues.
          </p>
        </div>
      )}

      {/* Compteur */}
      <p className="text-xs text-tate-terre/40 mb-3">
        {chapsFiltres.length} chapitre{chapsFiltres.length > 1 ? 's' : ''}{onglet === 'scolaire' ? ` en ${filtreNiveau}` : ' de langue'}
      </p>

      {/* Liste chapitres */}
      <div className="space-y-2">
        {chapsFiltres.length === 0 && (
          <div className="card text-center py-12">
            <BookOpen size={32} className="text-neutre mx-auto mb-3" />
            <p className="text-tate-terre/40 text-sm mb-4">
              {onglet === 'langues' ? 'Aucun cours de langue' : `Aucun chapitre pour ${filtreNiveau}`}
            </p>
            <button onClick={() => { setChapEdit(null); setShowModal(true); }}
              className="btn-tate py-2 px-5 text-sm">
              Créer le premier chapitre
            </button>
          </div>
        )}

        <AnimatePresence>
          {chapsFiltres
            .sort((a, b) => (a.ordre || 0) - (b.ordre || 0))
            .map((chap, i) => (
            <motion.div key={chap._id}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              exit={{ opacity:0, y:-4 }}
              transition={{ delay: i * 0.03 }}
              className={`card hover:border-tate-soleil transition-all ${!chap.actif ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  {/* Numéro */}
                  <div className="w-9 h-9 rounded-xl bg-tate-doux flex items-center justify-center text-sm font-bold text-tate-terre flex-shrink-0">
                    {chap.ordre || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="font-semibold text-tate-terre text-sm">{chap.titre}</p>
                      <span className="badge text-xs px-2 py-0.5"
                        style={{ background: (chap.matiereId?.couleur || '#F4A847') + '25', color: chap.matiereId?.couleur || '#F4A847' }}>
                        {chap.matiereId?.icone} {chap.matiereId?.nom}
                      </span>
                      {chap.niveau && chap.niveau !== 'Libre' && (
                        <span className="badge text-xs bg-gray-100 text-gray-500">{chap.niveau}</span>
                      )}
                      {chap.matiereId?.estLangue && (
                        <span className="badge text-xs bg-green-100 text-succes">🌍 Libre</span>
                      )}
                      {chap.sectionFr && (
                        <span className="badge text-xs bg-blue-50 text-blue-700 border border-blue-200">
                          📚 {chap.sectionFr}
                        </span>
                      )}
                      {chap.prerequis && (
                        <span className="badge text-xs bg-purple-50 text-savoir">
                          <Lock size={9} className="inline mr-1" />Prérequis
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-tate-terre/50">{chap.objectif}</p>
                    {chap.promptSupplement && (
                      <p className="text-xs text-savoir/60 mt-1 italic truncate">💬 {chap.promptSupplement}</p>
                    )}
                    {chap.documentsRef?.length > 0 && (
                      <p className="text-xs text-savoir/70 mt-1 flex items-center gap-1">
                        <UploadCloud size={11} />
                        {chap.documentsRef.length} document{chap.documentsRef.length > 1 ? 's' : ''} de référence IA
                      </p>
                    )}
                    {chap.ficheMemo?.pointsACretenir?.length > 0 && (
                      <p className="text-xs text-amber-600/70 mt-1 flex items-center gap-1">
                        <BookMarked size={11} />
                        Fiche mémo : {chap.ficheMemo.pointsACretenir.length} points · {chap.ficheMemo.questionsReponses?.length || 0} Q&R
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={async () => {
                      const tid = toast.loading('Génération de la fiche mémo…');
                      try {
                        await axios.post(`${API}/chapitres/${chap._id}/generer-fiche`, {},
                          { headers: { Authorization: `Bearer ${getToken()}` } });
                        toast.success('Fiche mémo générée !', { id: tid });
                        chargerChapitres();
                      } catch (e) {
                        toast.error(e.response?.data?.error || 'Erreur IA', { id: tid });
                      }
                    }}
                    className="p-2 rounded-xl hover:bg-amber-50 text-tate-soleil/60 hover:text-tate-terre transition-colors"
                    title="Générer la fiche mémo (IA)">
                    <Sparkles size={15} />
                  </button>
                  <button onClick={() => openEdit(chap)}
                    className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/40 hover:text-tate-terre transition-colors"
                    title="Modifier">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => modifierChapitre(chap._id, { actif: !chap.actif })}
                    className={`p-2 rounded-xl transition-colors ${chap.actif ? 'text-succes hover:bg-green-50' : 'text-neutre hover:bg-gray-100'}`}
                    title={chap.actif ? 'Désactiver (masquer)' : 'Activer'}>
                    {chap.actif ? <Unlock size={15} /> : <Lock size={15} />}
                  </button>
                  <button onClick={() => setSupprConfirm({ id: chap._id, titre: chap.titre })}
                    className="p-2 rounded-xl hover:bg-red-50 text-red-300 hover:text-alerte transition-colors"
                    title="Supprimer définitivement">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Modal création/édition */}
      {showModal && (
        <ModalChapitre
          matieres={matieres}
          chapitres={chapitres}
          initial={chapEdit}
          onClose={() => { setShowModal(false); setChapEdit(null); }}
          onSave={handleSave}
          onUploadDocs={uploaderDocsChapitre}
          onSupprimerDoc={supprimerDocChapitre}
        />
      )}

      {/* Modal confirmation suppression définitive */}
      <AnimatePresence>
        {supprConfirm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
               onClick={() => setSupprConfirm(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
              <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
                <Trash2 size={28} className="text-alerte" />
              </div>
              <h3 className="text-lg font-serif font-bold text-tate-terre text-center mb-2">
                Supprimer définitivement ?
              </h3>
              <p className="text-sm text-tate-terre/60 text-center mb-1">
                Chapitre : <strong className="text-tate-terre">« {supprConfirm.titre} »</strong>
              </p>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-5 mt-3">
                <p className="text-xs text-red-700 font-semibold">⚠️ Cette action est irréversible</p>
                <p className="text-xs text-red-600 mt-1">
                  Le chapitre ET toutes ses leçons seront supprimés définitivement de la base de données.
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setSupprConfirm(null)}
                  className="btn-outline flex-1 py-3">
                  Annuler
                </button>
                <button onClick={() => supprimerDefinitivement(supprConfirm.id)}
                  className="flex-1 py-3 rounded-2xl bg-alerte text-white font-bold hover:bg-red-600 transition-colors">
                  Supprimer tout
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
