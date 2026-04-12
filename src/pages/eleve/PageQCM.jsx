import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Check, X, RotateCcw, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useEleveStore } from '../../store/useEleveStore';

export function PageQCM() {
  const { chapitreId } = useParams();
  const navigate = useNavigate();
  const { chargerQCMChapitre, soumettreQCM, regenererQCM } = useEleveStore();

  const [qcm, setQcm] = useState(null);
  const [reponses, setReponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [resultat, setResultat] = useState(null);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    const chargerQCM = async () => {
      try {
        const data = await chargerQCMChapitre(chapitreId);
        setQcm(data);
        setLoading(false);
      } catch (e) {
        toast.error(e.response?.data?.error || 'Erreur lors du chargement du QCM');
        setLoading(false);
      }
    };
    chargerQCM();
  }, [chapitreId]);

  const handleRepondre = (questionIndex, reponse) => {
    setReponses(prev => ({
      ...prev,
      [questionIndex]: reponse,
    }));
  };

  const handleSoumettre = async () => {
    // Vérifier que toutes les questions ont une réponse
    if (!qcm) return;
    const toutesRepondues = qcm.questions.every((_, idx) => reponses[idx]);
    if (!toutesRepondues) {
      toast.error('Veuillez répondre à toutes les questions');
      return;
    }

    setSubmitting(true);
    try {
      const reponsesList = qcm.questions.map((_, idx) => ({
        questionIndex: idx,
        reponse: reponses[idx],
      }));

      const data = await soumettreQCM(qcm._id, reponsesList);
      setResultat(data);
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReessayer = async () => {
    setRegenerating(true);
    try {
      const newQcm = await regenererQCM(qcm._id, chapitreId);
      setQcm(newQcm);
      setReponses({});
      setResultat(null);
      toast.success('Nouveau QCM généré!');
    } catch (e) {
      toast.error(e.response?.data?.error || e.message);
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-tate-creme flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-4 border-tate-soleil border-t-transparent animate-spin mx-auto mb-3" />
          <p className="text-tate-terre">Chargement du QCM...</p>
        </div>
      </div>
    );
  }

  if (!qcm) {
    return (
      <div className="min-h-screen bg-tate-creme p-4 flex items-center justify-center">
        <div className="card max-w-md text-center p-6">
          <AlertCircle size={40} className="mx-auto mb-3 text-orange-500" />
          <p className="text-tate-terre font-medium mb-4">Aucun QCM disponible</p>
          <button
            onClick={() => navigate('/eleve')}
            className="btn-tate"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // État résultats
  if (resultat) {
    const score = resultat.score;
    const nbCorrectes = resultat.nbCorrectes;
    const nbTotal = resultat.nbTotal;
    const pourcentage = Math.round((nbCorrectes / nbTotal) * 100);

    const couleurScore =
      pourcentage >= 80
        ? 'from-green-400 to-green-600'
        : pourcentage >= 60
          ? 'from-orange-400 to-orange-600'
          : 'from-red-400 to-red-600';

    const messageScore =
      pourcentage >= 80
        ? '⭐ Excellent travail!'
        : pourcentage >= 60
          ? 'Pas mal! Tu peux faire mieux.'
          : 'Réessaie avec un nouveau QCM!';

    return (
      <div className="min-h-screen bg-tate-creme p-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <motion.button
            whileHover={{ x: -4 }}
            onClick={() => navigate('/eleve')}
            className="flex items-center gap-2 text-tate-terre mb-6 hover:opacity-70 transition-opacity"
          >
            <ArrowLeft size={20} />
            Retour
          </motion.button>

          {/* Score */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`card p-8 text-center bg-gradient-to-r ${couleurScore} text-white rounded-2xl shadow-lg mb-6`}
          >
            <h2 className="text-4xl font-bold mb-2">{pourcentage}%</h2>
            <p className="text-white/80 mb-4">
              {nbCorrectes} sur {nbTotal} réponses correctes
            </p>
            <p className="text-xl font-medium">{messageScore}</p>
          </motion.div>

          {/* Barre de progression visuelle */}
          <div className="card p-4 mb-6">
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pourcentage}%` }}
                transition={{ duration: 1.5 }}
                className={`h-full bg-gradient-to-r ${couleurScore}`}
              />
            </div>
          </div>

          {/* Corrections détaillées */}
          <div className="space-y-3 mb-6">
            {resultat.corrections.map((correction, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card p-4 border-l-4"
                style={{
                  borderLeftColor: correction.estCorrecte ? '#1D9E75' : '#D85A30',
                }}
              >
                <div className="flex gap-3 mb-2">
                  {correction.estCorrecte ? (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center">
                      <Check size={16} className="text-green-600" />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center">
                      <X size={16} className="text-red-600" />
                    </div>
                  )}
                  <p className="font-medium text-tate-terre flex-1">
                    {idx + 1}. {correction.enonce}
                  </p>
                </div>

                <div className="ml-9 space-y-1 text-sm mb-2">
                  {correction.options.map((opt, i) => {
                    const isCorrect = opt.lettre === correction.reponseCorrecte;
                    const isSelected = opt.lettre === correction.reponseEleve;

                    return (
                      <div
                        key={i}
                        className={`p-2 rounded transition-colors ${
                          isCorrect
                            ? 'bg-green-100 text-green-800'
                            : isSelected && !isCorrect
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <strong>{opt.lettre}.</strong> {opt.texte}
                        {isCorrect && ' ✓'}
                        {isSelected && !isCorrect && ' ✗'}
                      </div>
                    );
                  })}
                </div>

                {correction.explication && (
                  <p className="ml-9 text-xs text-gray-600 italic p-2 bg-gray-50 rounded">
                    💡 {correction.explication}
                  </p>
                )}
              </motion.div>
            ))}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            {pourcentage < 80 && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleReessayer}
                disabled={regenerating}
                className="btn-tate w-full flex items-center justify-center gap-2"
              >
                {regenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-tate-terre border-t-transparent rounded-full animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <RotateCcw size={18} />
                    Réessayer avec un nouveau QCM
                  </>
                )}
              </motion.button>
            )}

            <button
              onClick={() => navigate('/eleve')}
              className="w-full px-4 py-3 rounded-xl bg-gray-200 text-tate-terre font-medium hover:bg-gray-300 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </div>
    );
  }

  // État questions
  const totalRepondues = Object.keys(reponses).length;
  const totalQuestions = qcm.questions.length;

  return (
    <div className="min-h-screen bg-tate-creme p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.button
          whileHover={{ x: -4 }}
          onClick={() => navigate('/eleve')}
          className="flex items-center gap-2 text-tate-terre mb-6 hover:opacity-70 transition-opacity"
        >
          <ArrowLeft size={20} />
          Retour
        </motion.button>

        {/* Titre et progression */}
        <div className="card p-4 mb-4">
          <h1 className="font-serif text-2xl font-bold text-tate-terre mb-3">
            {qcm.titre}
          </h1>

          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">
                {totalRepondues} sur {totalQuestions} répondues
              </span>
              <span className="font-medium text-tate-terre">
                {Math.round((totalRepondues / totalQuestions) * 100)}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 overflow-hidden">
              <motion.div
                animate={{ width: `${(totalRepondues / totalQuestions) * 100}%` }}
                transition={{ duration: 0.3 }}
                className="h-full bg-tate-soleil"
              />
            </div>
          </div>
        </div>

        {/* Questions */}
        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {qcm.questions.map((question, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="card p-4"
              >
                <p className="font-medium text-tate-terre mb-3">
                  {idx + 1}. {question.enonce}
                </p>

                <div className="space-y-2">
                  {question.options.map((option) => (
                    <label
                      key={option.lettre}
                      className="flex items-center gap-3 p-3 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-tate-soleil hover:bg-tate-creme transition-colors"
                    >
                      <input
                        type="radio"
                        name={`question-${idx}`}
                        value={option.lettre}
                        checked={reponses[idx] === option.lettre}
                        onChange={(e) => handleRepondre(idx, e.target.value)}
                        className="w-4 h-4 accent-tate-soleil cursor-pointer"
                      />
                      <span className="font-medium text-gray-800 w-6">
                        {option.lettre}.
                      </span>
                      <span className="text-sm text-gray-700">
                        {option.texte}
                      </span>
                    </label>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Bouton soumettre */}
        <motion.button
          whileHover={
            totalRepondues === totalQuestions
              ? { scale: 1.02 }
              : undefined
          }
          whileTap={
            totalRepondues === totalQuestions
              ? { scale: 0.98 }
              : undefined
          }
          onClick={handleSoumettre}
          disabled={submitting || totalRepondues !== totalQuestions}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
            totalRepondues === totalQuestions
              ? 'btn-tate'
              : 'bg-gray-300 text-gray-600 cursor-not-allowed'
          }`}
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-tate-terre border-t-transparent rounded-full animate-spin inline-block mr-2" />
              Vérification en cours...
            </>
          ) : (
            `Soumettre mes réponses (${totalRepondues}/${totalQuestions})`
          )}
        </motion.button>

        {totalRepondues !== totalQuestions && (
          <p className="text-center text-sm text-gray-600 mt-3">
            Répondez à toutes les questions pour continuer
          </p>
        )}
      </div>
    </div>
  );
}
