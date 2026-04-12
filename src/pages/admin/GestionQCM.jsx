import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Eye, Trash2, Check, AlertCircle, Code2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutAdmin } from './LayoutAdmin';

export function GestionQCM({ Layout = LayoutAdmin }) {
  const {
    qcms, loadingQCM, chapitres, chargerQCMs, chargerChapitres,
    genererQCM, transformerExercicesQCM, importerQCMdepuisHTML,
    validerQCM, supprimerQCM,
  } = useAdminStore();

  const [selectedChapitre, setSelectedChapitre] = useState(null);
  const [level, setLevel] = useState('');
  const [matiereId, setMatiereId] = useState('');
  const [mode, setMode] = useState('generer'); // 'generer' | 'transformer' | 'html'
  const [instructions, setInstructions] = useState('');
  const [nbQuestions, setNbQuestions] = useState(20);
  const [texteExercices, setTexteExercices] = useState('');
  const [htmlExercices, setHtmlExercices] = useState('');
  const [generationLoading, setGenerationLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(null);
  const [filtreStatut, setFiltreStatut] = useState(null);

  useEffect(() => {
    chargerChapitres();
    chargerQCMs();
  }, []);

  // Filtrer les chapitres selon niveau et matière
  const chapitresFiltres = chapitres.filter(c => {
    if (level && c.niveau !== level) return false;
    if (matiereId && c.matiereId?._id !== matiereId) return false;
    return true;
  });

  const resetForm = () => {
    setInstructions('');
    setNbQuestions(20);
    setTexteExercices('');
    setHtmlExercices('');
    setSelectedChapitre(null);
  };

  const handleGenererQCM = async () => {
    if (!selectedChapitre) return toast.error('Veuillez sélectionner un chapitre');
    setGenerationLoading(true);
    try {
      await genererQCM({ chapitreId: selectedChapitre._id, instructions, nbQuestions: parseInt(nbQuestions) });
      toast.success('QCM généré avec succès !');
      resetForm();
      chargerQCMs();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleTransformerExercices = async () => {
    if (!selectedChapitre) return toast.error('Veuillez sélectionner un chapitre');
    if (!texteExercices.trim()) return toast.error('Veuillez coller les exercices');
    setGenerationLoading(true);
    try {
      await transformerExercicesQCM({ chapitreId: selectedChapitre._id, texteExercices, nbQuestions: parseInt(nbQuestions) });
      toast.success('Exercices transformés en QCM !');
      resetForm();
      chargerQCMs();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleImporterDepuisHTML = async () => {
    if (!selectedChapitre) return toast.error('Veuillez sélectionner un chapitre');
    if (!htmlExercices.trim()) return toast.error('Veuillez coller le code HTML avec les exercices');
    setGenerationLoading(true);
    try {
      const qcm = await importerQCMdepuisHTML({ chapitreId: selectedChapitre._id, htmlExercices });
      toast.success(`${qcm.questions?.length || 0} question(s) extraite(s) avec succès !`);
      resetForm();
      chargerQCMs();
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleValider = async (id) => {
    try {
      await validerQCM(id);
      toast.success('QCM validé et publié !');
    } catch (e) {
      toast.error(e.message);
    }
  };

  const handleSupprimer = async (id) => {
    if (window.confirm('Supprimer ce QCM ?')) {
      try {
        await supprimerQCM(id);
        toast.success('QCM supprimé');
      } catch (e) {
        toast.error(e.message);
      }
    }
  };

  const qcmsFiltres = filtreStatut ? qcms.filter(q => q.statut === filtreStatut) : qcms;

  const handleSubmit = mode === 'generer'
    ? handleGenererQCM
    : mode === 'transformer'
    ? handleTransformerExercices
    : handleImporterDepuisHTML;

  const submitLabel = generationLoading
    ? '⏳ Traitement en cours…'
    : mode === 'html' ? '🔍 Détecter et extraire les QCM' : '✨ Créer le QCM';

  return (
    <Layout titre="Gestion des QCM">
      <div className="space-y-6">

        {/* ── Panneau de création ── */}
        <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="card p-6">
          <h2 className="text-lg font-bold text-tate-terre mb-4">Créer un nouveau QCM</h2>

          {/* Onglets de mode */}
          <div className="flex flex-wrap gap-2 mb-5">
            {[
              { key: 'generer',     label: '🤖 Générer par IA' },
              { key: 'transformer', label: '♻️ Transformer exercices' },
              { key: 'html',        label: '📋 Depuis HTML' },
            ].map(m => (
              <button key={m.key} onClick={() => setMode(m.key)}
                className={`px-4 py-2 rounded-xl font-medium text-sm transition-colors ${
                  mode === m.key ? 'bg-tate-soleil text-tate-terre shadow-sm' : 'bg-tate-doux text-tate-terre/60 hover:bg-tate-soleil/30'
                }`}>
                {m.label}
              </button>
            ))}
          </div>

          {/* Description du mode HTML */}
          {mode === 'html' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800 flex gap-2">
              <Code2 size={16} className="flex-shrink-0 mt-0.5" />
              <span>
                Collez le code HTML de votre fichier d'exercices. L'IA va détecter automatiquement
                les questions QCM, les options et les bonnes réponses pour créer un QCM à valider.
              </span>
            </div>
          )}

          {/* Filtres chapitre */}
          <div className="space-y-3 mb-4">
            <label className="block text-sm font-semibold text-tate-terre">Chapitre cible</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text" placeholder="Filtrer par niveau (ex: CM1)"
                value={level} onChange={e => setLevel(e.target.value)}
                className="input-tate text-sm"
              />
              <select value={matiereId} onChange={e => setMatiereId(e.target.value)} className="input-tate text-sm">
                <option value="">Toutes matières</option>
                {[...new Set(chapitres.map(c => c.matiereId?._id))].filter(Boolean).map(id => {
                  const m = chapitres.find(c => c.matiereId?._id === id)?.matiereId;
                  return <option key={id} value={id}>{m?.nom}</option>;
                })}
              </select>
            </div>
            <select
              value={selectedChapitre?._id || ''}
              onChange={e => setSelectedChapitre(chapitres.find(c => c._id === e.target.value) || null)}
              className="input-tate"
            >
              <option value="">Sélectionner un chapitre…</option>
              {chapitresFiltres.map(ch => (
                <option key={ch._id} value={ch._id}>{ch.titre} ({ch.niveau || 'Libre'})</option>
              ))}
            </select>
          </div>

          {/* Paramètres spécifiques au mode */}
          <div className="space-y-3 mb-5">

            {/* Nb questions (générer + transformer seulement) */}
            {mode !== 'html' && (
              <div>
                <label className="block text-sm font-medium text-tate-terre mb-1">Nombre de questions</label>
                <select value={nbQuestions} onChange={e => setNbQuestions(e.target.value)} className="input-tate">
                  <option value="15">15 questions</option>
                  <option value="20">20 questions</option>
                  <option value="25">25 questions</option>
                </select>
              </div>
            )}

            {mode === 'generer' && (
              <div>
                <label className="block text-sm font-medium text-tate-terre mb-1">Instructions pour l'IA (optionnel)</label>
                <textarea
                  placeholder="Ex : Focus sur les verbes du 2e groupe, inclure des exemples du contexte sénégalais…"
                  value={instructions} onChange={e => setInstructions(e.target.value)}
                  className="input-tate resize-none" rows={3}
                />
              </div>
            )}

            {mode === 'transformer' && (
              <div>
                <label className="block text-sm font-medium text-tate-terre mb-1">Coller les exercices à transformer</label>
                <textarea
                  placeholder="Collez ici le texte des exercices classiques (remplissage, vrai/faux, etc.)…"
                  value={texteExercices} onChange={e => setTexteExercices(e.target.value)}
                  className="input-tate resize-none font-mono text-xs" rows={6}
                />
              </div>
            )}

            {mode === 'html' && (
              <div>
                <label className="block text-sm font-medium text-tate-terre mb-1">
                  Code HTML avec les exercices QCM
                </label>
                <textarea
                  placeholder={`Collez ici le code HTML de votre fichier d'exercices…\n\nExemple :\n<h2>Question 1</h2>\n<p>Quel est l'accord du participe passé ?</p>\n<ul><li>A) Avec le sujet</li><li>B) Avec le COD antéposé ✓</li>…`}
                  value={htmlExercices} onChange={e => setHtmlExercices(e.target.value)}
                  className="input-tate resize-none font-mono text-xs" rows={8}
                />
                {htmlExercices.length > 0 && (
                  <p className="text-xs text-tate-terre/40 mt-1">{htmlExercices.length} caractères</p>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSubmit}
            disabled={generationLoading || !selectedChapitre}
            className="btn-tate w-full"
          >
            {submitLabel}
          </button>
        </motion.div>

        {/* ── Filtres ── */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: null,            label: 'Tous',           cls: 'bg-tate-soleil text-tate-terre', inactif: 'bg-gray-200 text-gray-600' },
            { key: 'en_preparation', label: '⏳ En préparation', cls: 'bg-orange-400 text-white',      inactif: 'bg-gray-200 text-gray-600' },
            { key: 'publie',         label: '✓ Publié',        cls: 'bg-green-500 text-white',        inactif: 'bg-gray-200 text-gray-600' },
          ].map(f => (
            <button key={String(f.key)} onClick={() => setFiltreStatut(f.key)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${filtreStatut === f.key ? f.cls : f.inactif}`}>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Liste des QCMs ── */}
        {loadingQCM ? (
          <div className="text-center py-8 text-gray-500">Chargement…</div>
        ) : qcmsFiltres.length === 0 ? (
          <div className="card p-8 text-center">
            <AlertCircle size={40} className="mx-auto mb-2 text-gray-400" />
            <p className="text-gray-600 font-medium">Aucun QCM trouvé</p>
            <p className="text-gray-400 text-sm mt-1">Créez votre premier QCM ci-dessus</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {qcmsFiltres.map(qcm => (
              <motion.div key={qcm._id} initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="card p-4 flex items-center justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-tate-terre truncate">{qcm.titre}</h3>
                  <p className="text-sm text-gray-600 mt-0.5">
                    {qcm.questions?.length} question{qcm.questions?.length !== 1 ? 's' : ''} •{' '}
                    <span className={`font-medium ${qcm.statut === 'publie' ? 'text-green-600' : 'text-orange-600'}`}>
                      {qcm.statut === 'publie' ? '✓ Publié' : '⏳ En préparation'}
                    </span>
                  </p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => setShowPreview(qcm)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500" title="Aperçu">
                    <Eye size={17} />
                  </button>
                  {qcm.statut === 'en_preparation' && (
                    <button onClick={() => handleValider(qcm._id)}
                      className="p-2 rounded-lg hover:bg-green-100 transition-colors text-green-600" title="Valider et publier">
                      <Check size={17} />
                    </button>
                  )}
                  <button onClick={() => handleSupprimer(qcm._id)}
                    className="p-2 rounded-lg hover:bg-red-100 transition-colors text-red-500" title="Supprimer">
                    <Trash2 size={17} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal Aperçu ── */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
             onClick={() => setShowPreview(null)}>
          <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }}
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl max-h-[85vh] overflow-y-auto w-full shadow-2xl">

            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-tate-terre">{showPreview.titre}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{showPreview.questions?.length} questions</p>
              </div>
              <button onClick={() => setShowPreview(null)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">✕</button>
            </div>

            <div className="p-6 space-y-6">
              {showPreview.questions.map((q, idx) => (
                <div key={idx} className="space-y-2">
                  <p className="font-semibold text-tate-terre">{idx + 1}. {q.enonce}</p>
                  <div className="space-y-1 ml-3">
                    {q.options.map((opt, i) => (
                      <p key={i} className={`text-sm px-3 py-2 rounded-lg ${
                        opt.lettre === q.reponseCorrecte
                          ? 'bg-green-100 text-green-800 font-medium border border-green-300'
                          : 'bg-gray-50 text-gray-700'
                      }`}>
                        <span className="font-bold">{opt.lettre}.</span> {opt.texte}
                        {opt.lettre === q.reponseCorrecte && ' ✓'}
                      </p>
                    ))}
                  </div>
                  {q.explication && (
                    <p className="text-xs text-blue-700 bg-blue-50 rounded-lg px-3 py-2 ml-3">
                      💡 {q.explication}
                    </p>
                  )}
                </div>
              ))}
            </div>

            <div className="bg-gray-50 p-4 border-t flex gap-2">
              {showPreview.statut === 'en_preparation' && (
                <button onClick={() => { handleValider(showPreview._id); setShowPreview(null); }}
                  className="flex-1 px-4 py-2 rounded-xl bg-green-500 text-white font-medium hover:bg-green-600 transition-colors">
                  ✓ Valider et publier
                </button>
              )}
              <button onClick={() => setShowPreview(null)}
                className="flex-1 px-4 py-2 rounded-xl bg-gray-200 text-gray-800 font-medium hover:bg-gray-300 transition-colors">
                Fermer
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Layout>
  );
}
