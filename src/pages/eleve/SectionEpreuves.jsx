// ============================================================
// src/pages/eleve/SectionEpreuves.jsx
// Section BFEM (3ème) et BAC (Terminale) avec corrections masquées
// ============================================================
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap, ChevronDown, ChevronUp, Eye, EyeOff,
  BookOpen, ArrowLeft, Filter, Lock, Star, FileText,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API       = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken  = () => localStorage.getItem('accessToken');

// ─── Layout élève (réutilisé) ────────────────
function LayoutEleve({ children, onBack }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-tate-creme">
      <header className="bg-white border-b border-tate-border px-4 py-3
                         flex items-center justify-between sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-3">
          <button onClick={onBack || (() => navigate('/eleve'))}
            className="p-2 rounded-xl hover:bg-tate-doux transition-colors">
            <ArrowLeft size={18} className="text-tate-terre" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-tate-soleil flex items-center justify-center
                            font-serif font-bold text-tate-terre text-sm">T</div>
            <span className="font-serif font-bold text-tate-terre">Épreuves officielles</span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-tate-soleil flex items-center justify-center
                        text-sm font-bold text-tate-terre">
          {user?.nom?.[0]?.toUpperCase()}
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// ─── Badge type d'épreuve ────────────────────
function BadgeType({ type }) {
  const styles = {
    BFEM: 'bg-blue-100 text-blue-800',
    BAC:  'bg-purple-100 text-purple-800',
  };
  return (
    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${styles[type] || 'bg-gray-100 text-gray-600'}`}>
      {type}
    </span>
  );
}

// ─── Question avec correction masquée ────────
function QuestionEpreuve({ q, index, estPremium }) {
  const [correctionVisible, setCorrectionVisible] = useState(false);
  const hasSousQ = q.sousQuestions?.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-white rounded-2xl border border-tate-border overflow-hidden"
    >
      {/* En-tête question */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-tate-soleil flex items-center justify-center
                             text-xs font-bold text-tate-terre flex-shrink-0">
              {q.numero}
            </span>
            {q.points > 0 && (
              <span className="text-xs bg-tate-doux text-tate-terre/70 px-2 py-0.5 rounded-lg font-medium">
                {q.points} pt{q.points > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        <p className="text-sm text-tate-terre leading-relaxed font-medium">{q.intitule}</p>

        {/* Sous-questions */}
        {hasSousQ && (
          <div className="mt-3 space-y-2 pl-4 border-l-2 border-tate-border/50">
            {q.sousQuestions.map((sq, si) => (
              <div key={si} className="text-sm text-tate-terre/80">
                <span className="font-semibold text-tate-terre/60 mr-1.5">{sq.lettre || si + 1})</span>
                {sq.intitule}
                {sq.points > 0 && (
                  <span className="ml-2 text-xs text-tate-terre/40">({sq.points} pt{sq.points > 1 ? 's' : ''})</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Bouton voir correction */}
      <div className="border-t border-tate-border/50 bg-tate-creme px-4 py-3">
        {!estPremium && !q.correction ? (
          <div className="flex items-center gap-2 text-xs text-tate-terre/40">
            <Lock size={12} />
            <span>Correction disponible avec Premium</span>
          </div>
        ) : (
          <button
            onClick={() => setCorrectionVisible(v => !v)}
            className="flex items-center gap-2 text-xs font-semibold text-tate-terre/60
                       hover:text-tate-terre transition-colors w-full"
          >
            {correctionVisible
              ? <><EyeOff size={13} /> Masquer la correction</>
              : <><Eye size={13} /> Voir la correction détaillée</>
            }
          </button>
        )}
      </div>

      {/* Correction révélée */}
      <AnimatePresence>
        {correctionVisible && (q.correction) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-green-50 border-t border-succes/20 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Star size={13} className="text-succes fill-succes" />
                <p className="text-xs font-bold text-succes uppercase tracking-wide">Correction</p>
              </div>
              <p className="text-sm text-tate-terre leading-relaxed whitespace-pre-line">
                {q.correction}
              </p>
              {/* Corrections sous-questions */}
              {hasSousQ && q.sousQuestions.some(sq => sq.correction) && (
                <div className="mt-3 space-y-2 pl-3 border-l-2 border-succes/30">
                  {q.sousQuestions.filter(sq => sq.correction).map((sq, si) => (
                    <div key={si} className="text-sm">
                      <span className="font-semibold text-succes/80 mr-1">{sq.lettre || si + 1})</span>
                      <span className="text-tate-terre/70">{sq.correction}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Détail d'une épreuve ────────────────────
function DetailEpreuve({ epreuve, estPremium, onBack }) {
  const [epreuveComplete, setEpreuveComplete] = useState(null);
  const [loading, setLoading] = useState(false);
  const [corrActive, setCorrActive] = useState(false);

  const chargerCorrections = async () => {
    if (!estPremium) { toast.error('Les corrections sont réservées aux abonnés Premium'); return; }
    setLoading(true);
    try {
      const { data } = await axios.get(
        `${API}/epreuves/${epreuve._id}?corrections=true`,
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      setEpreuveComplete(data.data);
      setCorrActive(true);
    } catch (e) {
      toast.error('Erreur lors du chargement des corrections');
    } finally { setLoading(false); }
  };

  const src = epreuveComplete || epreuve;
  const aContenuHTML    = !!(src.contenuHTML    && src.contenuHTML.trim());
  const aCorrectionHTML = !!(src.correctionHTML && src.correctionHTML.trim());

  return (
    <div className="space-y-4">
      {/* En-tête épreuve */}
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-tate-terre/50 hover:text-tate-terre transition-colors">
        <ArrowLeft size={14} /> Retour aux épreuves
      </button>

      <div className="card">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <BadgeType type={src.type} />
            <h2 className="font-serif font-bold text-tate-terre text-lg mt-1">{src.titre}</h2>
            <p className="text-xs text-tate-terre/50 mt-0.5">
              {src.matiere} • Session {src.session} • {src.duree && `${src.duree} •`} Coeff. {src.coefficient}
            </p>
          </div>
          <span className="text-2xl font-serif font-bold text-tate-soleil">{src.annee}</span>
        </div>

        {/* Énoncé texte si pas de HTML */}
        {src.enonce && !aContenuHTML && (
          <div className="bg-tate-doux rounded-xl p-3 text-sm text-tate-terre/80 leading-relaxed mb-3">
            {src.enonce}
          </div>
        )}

        {/* Bouton corrections */}
        {!corrActive ? (
          <button
            onClick={chargerCorrections}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              estPremium
                ? 'bg-tate-soleil/20 hover:bg-tate-soleil/40 text-tate-terre'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {loading
              ? 'Chargement des corrections…'
              : estPremium
              ? <><Eye size={14} /> Afficher la correction</>
              : <><Lock size={14} /> Correction disponible avec Premium</>
            }
          </button>
        ) : (
          <button
            onClick={() => { setEpreuveComplete(null); setCorrActive(false); }}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm
                       font-semibold bg-green-50 text-succes hover:bg-green-100 transition-all"
          >
            <EyeOff size={14} /> Masquer la correction
          </button>
        )}
      </div>

      {/* ── Rendu HTML de l'épreuve ── */}
      {aContenuHTML && (
        <div className="rounded-2xl overflow-hidden border border-tate-border shadow-card">
          <div className="bg-tate-doux px-4 py-2 flex items-center gap-2">
            <BookOpen size={14} className="text-tate-terre/60" />
            <span className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide">Sujet</span>
          </div>
          <iframe
            srcDoc={src.contenuHTML}
            title={`Sujet — ${src.titre}`}
            className="w-full border-none"
            style={{ height: '70vh', minHeight: 400 }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {/* ── Rendu HTML de la correction (Premium) ── */}
      {corrActive && aCorrectionHTML && (
        <div className="rounded-2xl overflow-hidden border-2 border-succes/30 shadow-card">
          <div className="bg-green-50 px-4 py-2 flex items-center gap-2">
            <Star size={14} className="text-succes fill-succes" />
            <span className="text-xs font-bold text-succes uppercase tracking-wide">Correction officielle</span>
          </div>
          <iframe
            srcDoc={src.correctionHTML}
            title={`Correction — ${src.titre}`}
            className="w-full border-none"
            style={{ height: '70vh', minHeight: 400 }}
            sandbox="allow-scripts allow-same-origin"
          />
        </div>
      )}

      {/* ── Questions (ancien format, si pas de HTML) ── */}
      {!aContenuHTML && (src.questions || []).length > 0 && (
        <div className="space-y-3">
          {(src.questions || []).map((q, i) => (
            <QuestionEpreuve
              key={q._id || i}
              q={q}
              index={i}
              estPremium={estPremium}
            />
          ))}
        </div>
      )}

      {/* ── Correction questions (ancien format, si pas de HTML) ── */}
      {corrActive && !aCorrectionHTML && (src.questions || []).length > 0 && (
        <div className="space-y-3">
          {(src.questions || []).map((q, i) => (
            <QuestionEpreuve
              key={q._id || i}
              q={q}
              index={i}
              estPremium={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Page principale ─────────────────────────
export function SectionEpreuves() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [epreuves,       setEpreuves]       = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [filtreType,     setFiltreType]     = useState('tous');
  const [filtreMatiere,  setFiltreMatiere]  = useState('toutes');
  const [epreuveActive,  setEpreuveActive]  = useState(null);

  const estPremium = user?.abonnement === 'premium'
    && (!user?.abonnementExpiry || new Date(user.abonnementExpiry) > new Date());

  // Seuls 3ème (BFEM) et Terminale (BAC) ont des épreuves officielles
  const niveauSupporte = user?.niveau === '3eme' || user?.niveau === 'Terminale';
  const typeExamen     = user?.niveau === 'Terminale' ? 'BAC' : 'BFEM';

  useEffect(() => {
    if (!niveauSupporte) { setLoading(false); return; }
    const charger = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.set('type', typeExamen); // BFEM pour 3ème, BAC pour Terminale
        const { data } = await axios.get(`${API}/epreuves?${params}`,
          { headers: { Authorization: `Bearer ${getToken()}` } });
        setEpreuves(data.data || []);
      } catch (e) {
        toast.error('Erreur lors du chargement des épreuves');
      } finally { setLoading(false); }
    };
    charger();
  }, [user?.niveau]);

  const matieres = [...new Set(epreuves.map(e => e.matiere))].sort();

  const filtrees = epreuves.filter(ep => {
    if (filtreType !== 'tous' && ep.type !== filtreType)          return false;
    if (filtreMatiere !== 'toutes' && ep.matiere !== filtreMatiere) return false;
    return true;
  });

  if (epreuveActive) {
    return (
      <LayoutEleve onBack={() => setEpreuveActive(null)}>
        <DetailEpreuve
          epreuve={epreuveActive}
          estPremium={estPremium}
          onBack={() => setEpreuveActive(null)}
        />
      </LayoutEleve>
    );
  }

  return (
    <LayoutEleve onBack={() => navigate('/eleve')}>
      {/* Hero */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-tate-soleil flex items-center justify-center">
            <GraduationCap size={24} className="text-tate-terre" />
          </div>
          <div>
            <h1 className="font-serif font-bold text-tate-terre text-xl">
              Épreuves {typeExamen}
            </h1>
            <p className="text-xs text-tate-terre/50">
              Sujets officiels • Corrections détaillées
            </p>
          </div>
        </div>

        {estPremium ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 mt-3 flex items-center gap-3">
            <span className="text-base flex-shrink-0">⭐</span>
            <p className="text-xs text-emerald-800 font-medium">
              <strong>Accès Premium actif</strong> — sujets et corrections détaillées disponibles.
            </p>
          </div>
        ) : (
          <div className="bg-amber-50 border border-tate-soleil/50 rounded-2xl p-3 mt-3 flex items-center gap-3">
            <Lock size={16} className="text-tate-soleil flex-shrink-0" />
            <p className="text-xs text-tate-terre/70">
              Les sujets sont accessibles gratuitement. Les <strong>corrections détaillées</strong> sont réservées aux abonnés Premium.
            </p>
          </div>
        )}
      </div>

      {/* Message si niveau sans épreuves officielles */}
      {!niveauSupporte ? (
        <div className="card text-center py-12">
          <GraduationCap size={36} className="text-tate-terre/20 mx-auto mb-3" />
          <p className="font-semibold text-tate-terre">Pas d'épreuves officielles pour votre niveau</p>
          <p className="text-sm text-tate-terre/50 mt-1">
            Les épreuves BFEM sont pour les élèves de 3ème,<br />les épreuves BAC pour les Terminales.
          </p>
        </div>
      ) : (
        <>
          {/* Filtres — matière uniquement (type déjà fixé par niveau) */}
          <div className="flex gap-2 mb-4 flex-wrap items-center">
            <span className="text-xs font-bold text-tate-terre/40 uppercase tracking-wide">
              {typeExamen}
            </span>
            <select
              value={filtreMatiere}
              onChange={e => setFiltreMatiere(e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-tate-border bg-white text-tate-terre/70"
            >
              <option value="toutes">Toutes matières</option>
              {matieres.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          {/* Liste épreuves */}
          {loading ? (
            <div className="text-center py-16 text-tate-terre/40 text-sm animate-pulse">
              Chargement des épreuves…
            </div>
          ) : filtrees.length === 0 ? (
            <div className="card text-center py-12">
              <GraduationCap size={36} className="text-tate-terre/20 mx-auto mb-3" />
              <p className="font-semibold text-tate-terre">Aucune épreuve disponible</p>
              <p className="text-sm text-tate-terre/50 mt-1">Les épreuves seront ajoutées prochainement</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtrees.map(ep => (
                <motion.button
                  key={ep._id}
                  whileHover={{ y: -1 }}
                  onClick={() => setEpreuveActive(ep)}
                  className="w-full card text-left hover:border-tate-soleil transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <BadgeType type={ep.type} />
                        <span className="text-xs text-tate-terre/50">{ep.matiere}</span>
                        {ep.session !== 'Normale' && (
                          <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
                            {ep.session}
                          </span>
                        )}
                        {ep.contenuHTML && (
                          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <FileText size={10} /> Sujet complet
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-tate-terre">{ep.titre}</p>
                      <div className="flex items-center gap-3 mt-1.5">
                        {!ep.contenuHTML && (
                          <span className="text-xs text-tate-terre/40">
                            {ep.questions?.length || 0} question{ep.questions?.length !== 1 ? 's' : ''}
                          </span>
                        )}
                        {ep.duree && (
                          <span className="text-xs text-tate-terre/40">⏱ {ep.duree}</span>
                        )}
                        {ep.coefficient > 1 && (
                          <span className="text-xs text-tate-terre/40">Coeff. {ep.coefficient}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xl font-serif font-bold text-tate-soleil">{ep.annee}</p>
                      {estPremium
                        ? <Star size={12} className="text-succes fill-succes ml-auto mt-1" />
                        : <Lock size={12} className="text-tate-terre/30 ml-auto mt-1" />
                      }
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </>
      )}
    </LayoutEleve>
  );
}
