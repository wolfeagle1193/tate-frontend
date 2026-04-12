// ─────────────────────────────────────────────
// LanguesEleve.jsx — Apprendre les langues style Taté
// ─────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Flame, Star, Globe } from 'lucide-react';
import { useAuthStore }  from '../../store/useAuthStore';
import { useNavigate }   from 'react-router-dom';
import api from '../../lib/api';

const LANGUES_AFRICAINES = [
  { code: 'WO', nom: 'Wolof',     icone: '🇸🇳', couleur: '#2ED573', desc: 'La langue du Sénégal' },
  { code: 'PU', nom: 'Pulaar',    icone: '🌍',   couleur: '#FF6B6B', desc: 'Peul / Fulfulde' },
  { code: 'SE', nom: 'Sérère',    icone: '🌿',   couleur: '#DDA0DD', desc: 'Langue sérère du Sénégal' },
  { code: 'MN', nom: 'Mandingue', icone: '🥁',   couleur: '#A8E6CF', desc: 'Bambara / Dioula' },
  { code: 'DI', nom: 'Diola',     icone: '🎵',   couleur: '#FFA07A', desc: 'Langue diola (Casamance)' },
  { code: 'SO', nom: 'Soninké',   icone: '⭐',   couleur: '#98FB98', desc: 'Langue soninké' },
  { code: 'AR', nom: 'Arabe',     icone: '🕌',   couleur: '#FFD700', desc: 'Arabe classique et dialectal' },
];

const LANGUES_ETRANGERES = [
  { code: 'AN', nom: 'Anglais',   icone: '🇬🇧', couleur: '#1D9E75', desc: 'Business & international' },
  { code: 'RU', nom: 'Russe',     icone: '🇷🇺', couleur: '#4ECDC4', desc: 'Cyrillique et grammaire' },
];

const LANGUES = [...LANGUES_AFRICAINES, ...LANGUES_ETRANGERES];

function LayoutLangues({ children, onBack }) {
  const { user } = useAuthStore();
  return (
    <div className="min-h-screen bg-tate-creme">
      <header className="bg-white border-b border-tate-border px-4 py-3
                         flex items-center gap-3 sticky top-0 z-10 shadow-card">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-tate-doux">
          <ArrowLeft size={20} className="text-tate-terre" />
        </button>
        <div className="flex items-center gap-2">
          <Globe size={20} className="text-tate-soleil" />
          <span className="font-serif font-bold text-tate-terre">Langues — Taté</span>
        </div>
        {user?.streak > 0 && (
          <div className="ml-auto flex items-center gap-1 bg-tate-doux border border-tate-border rounded-full px-3 py-1">
            <Flame size={14} className="text-alerte" />
            <span className="text-xs font-semibold text-tate-terre">{user.streak}j</span>
          </div>
        )}
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// ── Carte langue ──────────────────────────────
function CarteLangue({ langue, progression, onClick }) {
  const pct = progression?.chapitresValides || 0;
  return (
    <motion.button whileHover={{ y: -3 }} whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full card text-left hover:border-tate-soleil hover:shadow-tate transition-all">
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
          style={{ background: langue.couleur + '22', border: `2px solid ${langue.couleur}33` }}>
          {langue.icone}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-tate-terre text-base">{langue.nom}</p>
          <p className="text-xs text-tate-terre/50 mb-2">{langue.desc}</p>
          <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width:`${Math.min(pct * 10, 100)}%`, background: langue.couleur }} />
          </div>
        </div>
        <span className="text-tate-soleil text-lg flex-shrink-0">→</span>
      </div>
    </motion.button>
  );
}

// ── Vue chapitres d'une langue ────────────────
function ChapitresLangue({ langue, chapitres, onChoisir, onBack }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-2 rounded-xl hover:bg-tate-doux">
          <ArrowLeft size={18} className="text-tate-terre" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{langue.icone}</span>
          <h1 className="text-xl font-serif font-bold text-tate-terre">{langue.nom}</h1>
        </div>
      </div>

      {chapitres.length === 0 ? (
        <div className="card text-center py-12">
          <div className="text-4xl mb-3">{langue.icone}</div>
          <p className="font-semibold text-tate-terre">Leçons bientôt disponibles</p>
          <p className="text-sm text-tate-terre/50 mt-1">Les cours de {langue.nom} arrivent bientôt…</p>
        </div>
      ) : (
        chapitres.map((chap, idx) => (
          <motion.button key={chap._id}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06 }}
            onClick={() => onChoisir(chap._id)}
            className="w-full card text-left hover:border-tate-soleil hover:shadow-tate transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg font-bold"
                style={{ background: langue.couleur + '22', color: langue.couleur }}>
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-tate-terre text-sm">{chap.titre}</p>
                <p className="text-xs text-tate-terre/50">{chap.objectif}</p>
              </div>
              <span style={{ color: langue.couleur }}>→</span>
            </div>
          </motion.button>
        ))
      )}
    </div>
  );
}

// ── Session de langue (comme PagesEleve mais stylisé) ──
function SessionLangue({ chapitre, langue, onFinir }) {
  const [phase, setPhase]         = useState('chargement');
  const [resume, setResume]       = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIdx, setQIdx]           = useState(0);
  const [input, setInput]         = useState('');
  const [correction, setCorrection] = useState(null);
  const [sessionId, setSessionId]   = useState(null);
  const [score, setScore]           = useState({ correct: 0, total: 0 });
  const [message, setMessage]       = useState('');

  const couleur = langue.couleur;

  useEffect(() => { demarrer(); }, []);

  const demarrer = async () => {
    try {
      const { data } = await api.post('/exercices/demarrer', { chapitreId: chapitre._id });
      setSessionId(data.data.session.id);
      setResume(data.data.resume);
      setPhase('resume');
    } catch (e) {
      setMessage('Erreur de chargement. Réessaie.');
      setPhase('erreur');
    }
  };

  const commencer = async () => {
    setPhase('chargement');
    const { data } = await api.post('/exercices/questions', { sessionId, nombreQuestions: 5 });
    setQuestions(data.data.questions);
    setQIdx(0);
    setInput('');
    setPhase('questions');
  };

  const corriger = async () => {
    if (!input.trim()) return;
    setPhase('chargement');
    const q = questions[qIdx];
    const { data } = await api.post('/exercices/corriger', {
      sessionId, question: q.question, reponseEleve: input.trim(),
      reponseAttendue: q.reponseAttendue, questionNum: qIdx + 1,
    });
    setScore(s => ({ correct: s.correct + (data.data.correct ? 1 : 0), total: s.total + 1 }));
    setCorrection(data.data);
    setPhase('correction');
  };

  const suivante = async () => {
    if (qIdx + 1 >= questions.length) {
      // Évaluation IA
      const { data } = await api.post('/exercices/evaluer', { sessionId });
      setMessage(data.data.message);
      setPhase('resultat');
    } else {
      setQIdx(q => q + 1);
      setInput('');
      setCorrection(null);
      setPhase('questions');
    }
  };

  const q = questions[qIdx];
  const pct = questions.length > 0 ? Math.round(((qIdx) / questions.length) * 100) : 0;

  if (phase === 'chargement') return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl animate-bounce" style={{ background: couleur + '22' }}>{langue.icone}</div>
      <p className="text-tate-terre/50 text-sm animate-pulse">Taté prépare ta leçon…</p>
    </div>
  );

  if (phase === 'erreur') return (
    <div className="card text-center py-10">
      <p className="text-alerte font-semibold">{message || 'Erreur'}</p>
      <button onClick={demarrer} className="btn-tate mt-4">Réessayer</button>
    </div>
  );

  if (phase === 'resume' && resume) return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-4">
      <div className="text-center py-4">
        <div className="text-4xl mb-3">{langue.icone}</div>
        <h2 className="text-xl font-serif font-bold text-tate-terre">{resume.titre}</h2>
        <p className="text-sm text-tate-terre/60 mt-1">{resume.objectif}</p>
      </div>
      <div className="card">
        <p className="text-xs font-bold text-tate-terre/50 uppercase mb-2">La leçon</p>
        <p className="text-sm text-tate-terre leading-relaxed">{resume.resume}</p>
      </div>
      <div className="rounded-2xl p-4 border-2" style={{ background: couleur + '11', borderColor: couleur + '44' }}>
        <p className="text-xs font-bold uppercase mb-1" style={{ color: couleur }}>📌 Règle</p>
        <p className="font-semibold text-tate-terre">{resume.regle}</p>
      </div>
      {resume.exemples?.length > 0 && (
        <div className="card">
          <p className="text-xs font-bold text-tate-terre/50 uppercase mb-2">Exemples</p>
          {resume.exemples.map((ex, i) => (
            <div key={i} className="flex gap-2 mb-1">
              <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 text-white"
                style={{ background: couleur }}>{i+1}</span>
              <p className="text-sm text-tate-terre">{ex}</p>
            </div>
          ))}
        </div>
      )}
      <button onClick={commencer} className="w-full py-4 text-base font-semibold rounded-2xl text-white transition-all hover:brightness-110 active:scale-95"
        style={{ background: couleur }}>
        Je commence les exercices ! 🚀
      </button>
    </motion.div>
  );

  if (phase === 'questions' && q) return (
    <motion.div key={qIdx} initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} className="space-y-5">
      <div>
        <div className="flex justify-between text-xs text-tate-terre/50 mb-2">
          <span>Question {qIdx+1}/{questions.length}</span>
          <span className="font-semibold" style={{ color: couleur }}>{pct}%</span>
        </div>
        <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width:`${pct}%`, background: couleur }} />
        </div>
      </div>
      <div className="text-center">
        <span className="badge bg-tate-doux text-tate-terre border border-tate-border text-xs">{q.consigne}</span>
      </div>
      <div className="card text-center py-6">
        <p className="text-lg font-semibold text-tate-terre">{q.question}</p>
        {q.indice && <p className="text-xs text-tate-terre/40 mt-2 italic">💡 {q.indice}</p>}
      </div>
      <input value={input} onChange={e => setInput(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && corriger()}
        placeholder="Écris ta réponse…" className="input-tate text-center text-lg" autoFocus />
      <button onClick={corriger} disabled={!input.trim()}
        className="w-full py-4 text-base font-semibold rounded-2xl text-white disabled:opacity-50 active:scale-95 transition-all"
        style={{ background: couleur }}>
        Valider
      </button>
    </motion.div>
  );

  if (phase === 'correction' && correction) return (
    <motion.div initial={{ scale:0.95, opacity:0 }} animate={{ scale:1, opacity:1 }} className="space-y-4">
      <div className="text-center py-4">
        <motion.div initial={{ scale:0 }} animate={{ scale:1 }} transition={{ type:'spring', bounce:0.5 }}
          className="text-6xl mb-3">{correction.correct ? '✅' : '💪'}</motion.div>
        <p className="text-lg font-bold text-tate-terre">{correction.message}</p>
      </div>
      {!correction.correct && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <XCircle size={14} className="text-alerte" />
            <span className="text-sm text-tate-terre">Ta réponse : <strong>{correction.reponseEleve || ''}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={14} className="text-succes" />
            <span className="text-sm text-tate-terre">Correct : <strong>{correction.reponseCorrigee || correction.reponseAttendue}</strong></span>
          </div>
        </div>
      )}
      <div className="flex gap-3 p-4 rounded-2xl border-2 border-tate-border bg-tate-doux">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: couleur }}>{langue.icone}</div>
        <p className="text-sm text-tate-terre">{correction.explication}</p>
      </div>
      <p className="text-center text-sm text-tate-terre/60 italic">{correction.encouragement}</p>
      <button onClick={suivante} className="w-full py-4 font-semibold rounded-2xl text-white active:scale-95 transition-all"
        style={{ background: couleur }}>
        {qIdx + 1 >= questions.length ? "Voir mon résultat 🏆" : "Question suivante →"}
      </button>
    </motion.div>
  );

  if (phase === 'resultat') return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="space-y-5 text-center">
      <div className="py-6">
        <div className="text-6xl mb-4">{score.correct >= score.total * 0.8 ? '🏆' : score.correct >= score.total * 0.5 ? '⭐' : '💪'}</div>
        <h1 className="text-2xl font-serif font-bold text-tate-terre">
          {score.correct}/{score.total} bonnes réponses
        </h1>
        <p className="text-tate-terre/60 text-sm mt-2">{message}</p>
      </div>
      <div className="card">
        <p className="text-5xl font-bold mb-2" style={{ color: couleur }}>
          {Math.round((score.correct / Math.max(score.total,1)) * 100)}%
        </p>
        <div className="h-2.5 bg-tate-doux rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width:`${Math.round((score.correct / Math.max(score.total,1)) * 100)}%`, background: couleur }} />
        </div>
      </div>
      <button onClick={onFinir} className="w-full py-4 font-semibold rounded-2xl text-white"
        style={{ background: couleur }}>
        Continuer mon apprentissage 🚀
      </button>
    </motion.div>
  );

  return null;
}

// ── Composant principal ───────────────────────
export function LanguesEleve() {
  const [vue, setVue]             = useState('accueil');   // accueil | chapitres | session
  const [langueActive, setLangue] = useState(null);
  const [chapitres, setChapitres] = useState([]);
  const [chapitreActif, setChapitre] = useState(null);
  const [loading, setLoading]     = useState(false);
  const { user }                  = useAuthStore();
  const navigate                  = useNavigate();

  const choisirLangue = async (langue) => {
    setLangue(langue);
    setLoading(true);
    try {
      const { data } = await api.get(`/chapitres?matiereCode=${langue.code}&estLangue=true`);
      setChapitres(data.data || []);
    } catch {
      setChapitres([]);
    }
    setLoading(false);
    setVue('chapitres');
  };

  const choisirChapitre = async (chapitreId) => {
    const chap = chapitres.find(c => c._id === chapitreId);
    if (chap) {
      setChapitre(chap);
      setVue('session');
    }
  };

  if (vue === 'session' && chapitreActif && langueActive) return (
    <LayoutLangues onBack={() => setVue('chapitres')}>
      <SessionLangue chapitre={chapitreActif} langue={langueActive}
        onFinir={() => { setVue('accueil'); setChapitre(null); }} />
    </LayoutLangues>
  );

  if (vue === 'chapitres' && langueActive) return (
    <LayoutLangues onBack={() => setVue('accueil')}>
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin w-8 h-8 border-4 border-tate-soleil border-t-transparent rounded-full" />
        </div>
      ) : (
        <ChapitresLangue
          langue={langueActive}
          chapitres={chapitres}
          onChoisir={choisirChapitre}
          onBack={() => setVue('accueil')}
        />
      )}
    </LayoutLangues>
  );

  return (
    <LayoutLangues onBack={() => navigate('/eleve')}>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Globe size={28} className="text-tate-soleil" />
          <h1 className="text-2xl font-serif font-bold text-tate-terre">Les Langues</h1>
        </div>
        <p className="text-tate-terre/60 text-sm">
          Apprends les langues africaines et internationales avec Taté
        </p>
      </div>

      <div className="bg-tate-soleil/10 border border-tate-soleil/30 rounded-2xl p-4 mb-6">
        <p className="text-sm text-tate-terre">
          🌍 <strong>Taté parle Afrique</strong> — Wolof, Pulaar, Arabe, Sérère, Mandingue et bien plus. 
          Chaque leçon est adaptée à ton niveau et à ta culture.
        </p>
      </div>

      {/* Langues africaines */}
      <div className="mb-2">
        <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>🌍</span> Langues africaines
        </p>
        <div className="space-y-2">
          {LANGUES_AFRICAINES.map((langue, i) => (
            <motion.div key={langue.code}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}>
              <CarteLangue langue={langue} onClick={() => choisirLangue(langue)} />
            </motion.div>
          ))}
        </div>
      </div>

      {/* Langues étrangères */}
      <div className="mt-6">
        <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wide mb-3 flex items-center gap-2">
          <span>🌐</span> Langues étrangères
        </p>
        <div className="space-y-2">
          {LANGUES_ETRANGERES.map((langue, i) => (
            <motion.div key={langue.code}
              initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}
              transition={{ delay: i * 0.05 }}>
              <CarteLangue langue={langue} onClick={() => choisirLangue(langue)} />
            </motion.div>
          ))}
        </div>
      </div>
    </LayoutLangues>
  );
}

export default LanguesEleve;
