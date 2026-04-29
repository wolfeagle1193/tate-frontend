// ============================================================
// src/pages/admin/GestionEpreuves.jsx
// Gestion des épreuves BFEM & BAC — Admin
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, X, CheckCircle, XCircle, Eye, EyeOff, Trash2,
  Edit3, GraduationCap, ChevronDown, ChevronUp, Globe, Lock,
  FileText, Upload, AlertCircle,
} from 'lucide-react';
import { LayoutAdmin } from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const authH    = () => ({ headers: { Authorization: `Bearer ${getToken()}` } });

const MATIERES  = ['Français','Mathématiques','Anglais','Histoire-Géographie','Sciences','Philosophie','SVT','Physique-Chimie'];
const NIVEAUX   = ['3eme','Terminale'];
const TYPES     = ['BFEM','BAC'];
const SESSIONS  = ['Normale','Remplacement','Rattrapage'];

// ─── Modal création / édition ────────────────
function ModalEpreuve({ epreuve, onClose, onSave }) {
  const isEdit = !!epreuve?._id;
  const [form, setForm] = useState({
    type:           epreuve?.type           || 'BFEM',
    niveau:         epreuve?.niveau         || '3eme',
    matiere:        epreuve?.matiere        || 'Français',
    annee:          epreuve?.annee          || new Date().getFullYear(),
    session:        epreuve?.session        || 'Normale',
    titre:          epreuve?.titre          || '',
    duree:          epreuve?.duree          || '',
    coefficient:    epreuve?.coefficient    || 1,
    enonce:         epreuve?.enonce         || '',
    questions:      epreuve?.questions      || [],
    contenuHTML:    epreuve?.contenuHTML    || '',
    correctionHTML: epreuve?.correctionHTML || '',
  });
  const [onglet, setOnglet] = useState(
    (epreuve?.contenuHTML) ? 'html' : 'questions'
  );
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Sync type/niveau automatiquement
  const handleType = (t) => {
    set('type', t);
    if (t === 'BFEM')      set('niveau', '3eme');
    if (t === 'BAC')       set('niveau', 'Terminale');
  };

  // ── Questions helpers ──────────────────────
  // ── Lecture d'un fichier HTML ──────────────
  const lireFichierHTML = (e, champ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => set(champ, ev.target.result);
    reader.readAsText(file, 'utf-8');
  };

  const ajouterQuestion = () => {
    set('questions', [...form.questions, {
      numero:       form.questions.length + 1,
      intitule:     '',
      points:       0,
      correction:   '',
      sousQuestions: [],
    }]);
  };

  const majQuestion = (idx, field, val) => {
    const qs = [...form.questions];
    qs[idx] = { ...qs[idx], [field]: val };
    set('questions', qs);
  };

  const supprimerQuestion = (idx) => {
    const qs = form.questions.filter((_, i) => i !== idx)
      .map((q, i) => ({ ...q, numero: i + 1 }));
    set('questions', qs);
  };

  const ajouterSousQ = (qIdx) => {
    const qs = [...form.questions];
    const sqs = [...(qs[qIdx].sousQuestions || [])];
    sqs.push({ lettre: String.fromCharCode(97 + sqs.length), intitule: '', points: 0, correction: '' });
    qs[qIdx] = { ...qs[qIdx], sousQuestions: sqs };
    set('questions', qs);
  };

  const majSousQ = (qIdx, sIdx, field, val) => {
    const qs = [...form.questions];
    const sqs = [...(qs[qIdx].sousQuestions || [])];
    sqs[sIdx] = { ...sqs[sIdx], [field]: val };
    qs[qIdx] = { ...qs[qIdx], sousQuestions: sqs };
    set('questions', qs);
  };

  const supprimerSousQ = (qIdx, sIdx) => {
    const qs = [...form.questions];
    qs[qIdx] = { ...qs[qIdx], sousQuestions: qs[qIdx].sousQuestions.filter((_, i) => i !== sIdx) };
    set('questions', qs);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.matiere || !form.annee) return toast.error('Matière et année obligatoires');
    setSaving(true);
    try {
      await onSave(form, epreuve?._id);
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 overflow-y-auto">
      <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl my-4">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-tate-border">
          <h2 className="font-serif font-bold text-tate-terre text-lg">
            {isEdit ? 'Modifier l\'épreuve' : 'Nouvelle épreuve'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Type + Niveau */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Type d'examen</label>
              <select value={form.type} onChange={e => handleType(e.target.value)} className="input-tate">
                {TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Niveau</label>
              <select value={form.niveau} onChange={e => set('niveau', e.target.value)} className="input-tate">
                {NIVEAUX.map(n => <option key={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Matière + Année */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Matière</label>
              <select value={form.matiere} onChange={e => set('matiere', e.target.value)} className="input-tate">
                {MATIERES.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Année</label>
              <input type="number" value={form.annee} onChange={e => set('annee', parseInt(e.target.value))}
                min="1990" max="2030" className="input-tate" required />
            </div>
          </div>

          {/* Session + Durée + Coeff */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Session</label>
              <select value={form.session} onChange={e => set('session', e.target.value)} className="input-tate">
                {SESSIONS.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Durée</label>
              <input value={form.duree} onChange={e => set('duree', e.target.value)}
                placeholder="ex: 4h" className="input-tate" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Coefficient</label>
              <input type="number" value={form.coefficient} onChange={e => set('coefficient', parseInt(e.target.value))}
                min="1" max="10" className="input-tate" />
            </div>
          </div>

          {/* Titre personnalisé */}
          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1">
              Titre (optionnel, auto-généré si vide)
            </label>
            <input value={form.titre} onChange={e => set('titre', e.target.value)}
              placeholder={`${form.type} ${form.annee} — ${form.matiere}`} className="input-tate" />
          </div>

          {/* Énoncé / Texte introductif */}
          <div>
            <label className="block text-xs font-semibold text-tate-terre/60 mb-1">
              Énoncé / Texte introductif
            </label>
            <textarea value={form.enonce} onChange={e => set('enonce', e.target.value)}
              rows={4} placeholder="Texte général de l'épreuve, document d'appui, consignes générales…"
              className="input-tate resize-none" />
          </div>

          {/* ── Onglets : HTML (recommandé) ou Questions manuelles ── */}
          <div>
            <div className="flex gap-1 bg-tate-doux rounded-2xl p-1 mb-4">
              <button type="button"
                onClick={() => setOnglet('html')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  onglet === 'html'
                    ? 'bg-white text-tate-terre shadow-sm'
                    : 'text-tate-terre/50 hover:text-tate-terre'
                }`}>
                <FileText size={12} /> Format HTML <span className="bg-tate-soleil/60 text-tate-terre px-1.5 py-0.5 rounded-md text-[10px]">Recommandé</span>
              </button>
              <button type="button"
                onClick={() => setOnglet('questions')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  onglet === 'questions'
                    ? 'bg-white text-tate-terre shadow-sm'
                    : 'text-tate-terre/50 hover:text-tate-terre'
                }`}>
                <Plus size={12} /> Questions manuelles
              </button>
            </div>

            {onglet === 'html' && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 flex items-start gap-2">
                  <AlertCircle size={14} className="text-blue-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-700">
                    Importez des fichiers HTML pour le sujet et la correction. Le contenu HTML prend le dessus sur le format questions manuelles.
                  </p>
                </div>

                {/* Sujet HTML */}
                <div>
                  <label className="block text-xs font-semibold text-tate-terre/60 mb-2">
                    📄 Sujet — fichier HTML
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed
                                      border-tate-border bg-white hover:border-tate-soleil cursor-pointer
                                      transition-colors text-xs font-semibold text-tate-terre/60">
                      <Upload size={14} />
                      {form.contenuHTML ? '✅ Fichier chargé — remplacer' : 'Choisir un fichier HTML'}
                      <input type="file" accept=".html,.htm" className="hidden"
                        onChange={e => lireFichierHTML(e, 'contenuHTML')} />
                    </label>
                    {form.contenuHTML && (
                      <button type="button" onClick={() => set('contenuHTML', '')}
                        className="p-2.5 rounded-xl bg-red-50 text-alerte hover:bg-red-100 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {form.contenuHTML && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-tate-border">
                      <div className="bg-tate-doux px-3 py-1.5 text-xs text-tate-terre/60 font-semibold">
                        Aperçu sujet
                      </div>
                      <iframe srcDoc={form.contenuHTML} className="w-full border-none"
                        style={{ height: 200 }} sandbox="allow-scripts allow-same-origin" />
                    </div>
                  )}
                  {/* Ou coller directement le HTML */}
                  <div className="mt-3">
                    <label className="block text-xs text-tate-terre/40 mb-1">ou coller le code HTML directement</label>
                    <textarea value={form.contenuHTML}
                      onChange={e => set('contenuHTML', e.target.value)}
                      rows={4} placeholder="<html>…</html>"
                      className="input-tate resize-none text-xs font-mono bg-gray-50" />
                  </div>
                </div>

                {/* Correction HTML */}
                <div>
                  <label className="block text-xs font-semibold text-succes/70 mb-2">
                    ✅ Correction officielle — fichier HTML (Premium)
                  </label>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed
                                      border-succes/30 bg-green-50 hover:border-succes cursor-pointer
                                      transition-colors text-xs font-semibold text-succes/70">
                      <Upload size={14} />
                      {form.correctionHTML ? '✅ Fichier chargé — remplacer' : 'Choisir un fichier HTML'}
                      <input type="file" accept=".html,.htm" className="hidden"
                        onChange={e => lireFichierHTML(e, 'correctionHTML')} />
                    </label>
                    {form.correctionHTML && (
                      <button type="button" onClick={() => set('correctionHTML', '')}
                        className="p-2.5 rounded-xl bg-red-50 text-alerte hover:bg-red-100 transition-colors">
                        <X size={14} />
                      </button>
                    )}
                  </div>
                  {form.correctionHTML && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-succes/30">
                      <div className="bg-green-50 px-3 py-1.5 text-xs text-succes font-semibold">
                        Aperçu correction
                      </div>
                      <iframe srcDoc={form.correctionHTML} className="w-full border-none"
                        style={{ height: 200 }} sandbox="allow-scripts allow-same-origin" />
                    </div>
                  )}
                  <div className="mt-3">
                    <label className="block text-xs text-tate-terre/40 mb-1">ou coller le code HTML directement</label>
                    <textarea value={form.correctionHTML}
                      onChange={e => set('correctionHTML', e.target.value)}
                      rows={4} placeholder="<html>…</html>"
                      className="input-tate resize-none text-xs font-mono bg-green-50 border-succes/30" />
                  </div>
                </div>
              </div>
            )}

            {onglet === 'questions' && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-xs font-semibold text-tate-terre/60 uppercase tracking-wide">
                    Questions ({form.questions.length})
                  </label>
                  <button type="button" onClick={ajouterQuestion}
                    className="flex items-center gap-1.5 text-xs font-semibold text-tate-terre
                               bg-tate-soleil/20 hover:bg-tate-soleil/40 px-3 py-1.5 rounded-xl transition-all">
                    <Plus size={12} /> Ajouter une question
                  </button>
                </div>

                <div className="space-y-4">
                  {form.questions.map((q, qIdx) => (
                    <div key={qIdx}
                      className="border-2 border-tate-border rounded-2xl p-4 space-y-3 bg-tate-creme/50">
                      {/* En-tête question */}
                      <div className="flex items-center gap-2">
                        <span className="w-7 h-7 rounded-full bg-tate-soleil flex items-center justify-center
                                         text-xs font-bold text-tate-terre flex-shrink-0">
                          {q.numero}
                        </span>
                        <input
                          value={q.intitule}
                          onChange={e => majQuestion(qIdx, 'intitule', e.target.value)}
                          placeholder="Intitulé de la question…"
                          className="input-tate flex-1 text-sm"
                        />
                        <input type="number" value={q.points}
                          onChange={e => majQuestion(qIdx, 'points', parseFloat(e.target.value) || 0)}
                          placeholder="pts" min="0" step="0.5"
                          className="input-tate w-20 text-sm text-center"
                        />
                        <button type="button" onClick={() => supprimerQuestion(qIdx)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-alerte transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>

                      {/* Correction question */}
                      <div>
                        <label className="block text-xs font-semibold text-succes/70 mb-1">
                          ✅ Correction détaillée
                        </label>
                        <textarea
                          value={q.correction}
                          onChange={e => majQuestion(qIdx, 'correction', e.target.value)}
                          rows={3} placeholder="Correction détaillée de cette question…"
                          className="input-tate resize-none text-sm bg-green-50 border-succes/30"
                        />
                      </div>

                      {/* Sous-questions */}
                      {q.sousQuestions?.map((sq, sIdx) => (
                        <div key={sIdx} className="pl-4 border-l-2 border-tate-soleil/40 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-tate-terre/60 w-5">{sq.lettre})</span>
                            <input value={sq.intitule}
                              onChange={e => majSousQ(qIdx, sIdx, 'intitule', e.target.value)}
                              placeholder="Sous-question…" className="input-tate flex-1 text-sm" />
                            <input type="number" value={sq.points}
                              onChange={e => majSousQ(qIdx, sIdx, 'points', parseFloat(e.target.value) || 0)}
                              placeholder="pts" min="0" step="0.5"
                              className="input-tate w-16 text-sm text-center" />
                            <button type="button" onClick={() => supprimerSousQ(qIdx, sIdx)}
                              className="p-1 rounded-lg hover:bg-red-50 text-alerte/70">
                              <X size={12} />
                            </button>
                          </div>
                          <textarea value={sq.correction}
                            onChange={e => majSousQ(qIdx, sIdx, 'correction', e.target.value)}
                            rows={2} placeholder="Correction de cette sous-question…"
                            className="input-tate resize-none text-xs bg-green-50 border-succes/30 w-full" />
                        </div>
                      ))}
                      <button type="button" onClick={() => ajouterSousQ(qIdx)}
                        className="text-xs text-tate-terre/40 hover:text-tate-terre transition-colors pl-4">
                        + Ajouter une sous-question
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Boutons */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1 py-3">Annuler</button>
            <button type="submit" disabled={saving} className="btn-tate flex-1 py-3">
              {saving ? 'Enregistrement…' : isEdit ? 'Modifier' : 'Créer l\'épreuve'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// ─── Page principale ─────────────────────────
export function GestionEpreuves() {
  const [epreuves,    setEpreuves]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showModal,   setShowModal]   = useState(false);
  const [editEpreuve, setEditEpreuve] = useState(null);
  const [filtreType,  setFiltreType]  = useState('tous');

  const charger = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/epreuves`, authH());
      setEpreuves(data.data || []);
    } catch (e) { toast.error('Erreur de chargement'); }
    finally { setLoading(false); }
  };

  useEffect(() => { charger(); }, []);

  const sauvegarder = async (form, id) => {
    if (id) {
      await axios.put(`${API}/epreuves/${id}`, form, authH());
      toast.success('Épreuve modifiée !');
    } else {
      await axios.post(`${API}/epreuves`, form, authH());
      toast.success('Épreuve créée !');
    }
    charger();
  };

  const togglePublier = async (ep) => {
    await axios.patch(`${API}/epreuves/${ep._id}/publier`, {}, authH());
    toast.success(ep.publie ? 'Épreuve dépubliée' : 'Épreuve publiée !');
    charger();
  };

  const supprimer = async (id) => {
    if (!confirm('Supprimer cette épreuve définitivement ?')) return;
    await axios.delete(`${API}/epreuves/${id}`, authH());
    toast.success('Épreuve supprimée');
    charger();
  };

  const genererFicheMemo = async (chapId) => {
    try {
      await axios.post(`${API}/chapitres/${chapId}/generer-fiche`, {}, authH());
      toast.success('Fiche mémo générée !');
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
  };

  const filtrees = epreuves.filter(e => filtreType === 'tous' || e.type === filtreType);

  const stats = {
    total:   epreuves.length,
    publie:  epreuves.filter(e => e.publie).length,
    BFEM:    epreuves.filter(e => e.type === 'BFEM').length,
    BAC:     epreuves.filter(e => e.type === 'BAC').length,
  };

  return (
    <LayoutAdmin titre="Épreuves BFEM & BAC"
      action={
        <button onClick={() => { setEditEpreuve(null); setShowModal(true); }}
          className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nouvelle épreuve
        </button>
      }>

      {/* Stats rapides */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', val: stats.total,  color: 'bg-tate-doux' },
          { label: 'Publiées', val: stats.publie, color: 'bg-green-50' },
          { label: 'BFEM',  val: stats.BFEM,  color: 'bg-blue-50' },
          { label: 'BAC',   val: stats.BAC,   color: 'bg-purple-50' },
        ].map(s => (
          <div key={s.label} className={`${s.color} rounded-2xl p-3 text-center`}>
            <p className="text-xl font-bold font-serif text-tate-terre">{s.val}</p>
            <p className="text-xs text-tate-terre/60">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-5">
        {['tous','BFEM','BAC'].map(t => (
          <button key={t} onClick={() => setFiltreType(t)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
              filtreType === t ? 'bg-tate-soleil text-tate-terre shadow-tate' : 'bg-white border border-tate-border text-tate-terre/60'
            }`}>
            {t === 'tous' ? 'Toutes' : t}
          </button>
        ))}
      </div>

      {/* Liste */}
      {loading ? (
        <p className="text-center text-tate-terre/40 py-12 animate-pulse">Chargement…</p>
      ) : filtrees.length === 0 ? (
        <div className="card text-center py-12">
          <GraduationCap size={36} className="text-tate-terre/20 mx-auto mb-3" />
          <p className="text-tate-terre/50">Aucune épreuve — créez la première !</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrees.map(ep => (
            <motion.div key={ep._id} whileHover={{ y: -1 }}
              className="card flex items-start gap-4">
              {/* Badge type */}
              <div className={`w-12 h-12 rounded-2xl flex flex-col items-center justify-center
                               flex-shrink-0 ${ep.type === 'BFEM' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                <span className={`text-xs font-bold ${ep.type === 'BFEM' ? 'text-blue-700' : 'text-purple-700'}`}>
                  {ep.type}
                </span>
                <span className="text-xs font-bold text-tate-terre/50">{String(ep.annee).slice(-2)}</span>
              </div>

              {/* Infos */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-tate-terre text-sm">{ep.titre}</p>
                  {ep.publie
                    ? <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Publiée</span>
                    : <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">Brouillon</span>
                  }
                  {ep.contenuHTML && (
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <FileText size={10} /> HTML
                    </span>
                  )}
                </div>
                <p className="text-xs text-tate-terre/50 mt-0.5">
                  {ep.niveau} • {ep.contenuHTML ? 'Sujet HTML' : `${ep.questions?.length || 0} question${ep.questions?.length !== 1 ? 's' : ''}`}
                  {ep.duree && ` • ${ep.duree}`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => togglePublier(ep)} title={ep.publie ? 'Dépublier' : 'Publier'}
                  className={`p-2 rounded-xl transition-colors ${
                    ep.publie ? 'text-succes hover:bg-green-50' : 'text-tate-terre/40 hover:bg-tate-doux'
                  }`}>
                  {ep.publie ? <Globe size={16} /> : <Lock size={16} />}
                </button>
                <button onClick={() => { setEditEpreuve(ep); setShowModal(true); }}
                  className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/50 transition-colors">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => supprimer(ep._id)}
                  className="p-2 rounded-xl hover:bg-red-50 text-alerte/60 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <ModalEpreuve
            epreuve={editEpreuve}
            onClose={() => { setShowModal(false); setEditEpreuve(null); }}
            onSave={sauvegarder}
          />
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
