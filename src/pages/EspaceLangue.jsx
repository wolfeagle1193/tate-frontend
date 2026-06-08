import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, LogOut, Globe, Clock, ArrowRight,
  Headphones, GraduationCap, Library, CheckCircle2,
  ChevronDown, ChevronUp, PlayCircle, Volume2, Mic
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SECTION_CONFIG = {
  listening: {
    label: 'Listening',
    subtitle: 'Vidéos YouTube & compréhension orale',
    icon: Headphones,
    color: 'from-red-500 to-rose-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/20',
    text: 'text-red-400',
    chip: 'bg-red-500/20 text-red-300',
  },
  pronunciation: {
    label: 'Pronunciation',
    subtitle: 'Phonèmes, accents & sons de l\'anglais',
    icon: Mic,
    color: 'from-pink-500 to-fuchsia-500',
    bg: 'bg-pink-500/10',
    border: 'border-pink-500/20',
    text: 'text-pink-400',
    chip: 'bg-pink-500/20 text-pink-300',
  },
  grammar: {
    label: 'Grammar',
    subtitle: 'Grammaire, structures & dialogues',
    icon: Library,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    chip: 'bg-emerald-500/20 text-emerald-300',
  },
  vocabulary: {
    label: 'Vocabulary',
    subtitle: 'Textes, vocabulaire & expressions',
    icon: BookOpen,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    chip: 'bg-amber-500/20 text-amber-300',
  },
  practice: {
    label: 'Practice',
    subtitle: 'Films, dessins animés & chansons',
    icon: PlayCircle,
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    chip: 'bg-violet-500/20 text-violet-300',
  },
};

function classifyChapitre(titre) {
  const t = titre.trim();
  // LI1-LI6 = Listening (vidéos YouTube)
  if (/^LI\d+/i.test(t)) return 'listening';
  // L1-L6 = Pronunciation (phonétique/sons)
  if (/^L\d+/i.test(t)) return 'pronunciation';
  // V1-V6 = Vocabulary
  if (/^V\d+/i.test(t) || t.toLowerCase().includes('vocabulary')) return 'vocabulary';
  // P1-P20 = Practice (films, dessins animés, chansons)
  if (/^P\d+/i.test(t) || t.toLowerCase().includes('practice')) return 'practice';
  return 'grammar';
}

export function EspaceLangue() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [chapitres, setChapitres] = useState([]);
  const [leconActive, setLeconActive] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [sectionsOuvertes, setSectionsOuvertes] = useState({ listening: true, pronunciation: true, grammar: true, vocabulary: true, practice: true });
  const [progression, setProgression] = useState({ listening: 0, pronunciation: 0, grammar: 0, vocabulary: 0, practice: 0, total: 0 });
  const [chapitresLus, setChapitresLus] = useState(new Set());

  useEffect(() => {
    if (!user) { navigate('/langue/login', { replace: true }); return; }
    chargerCours();
    const saved = localStorage.getItem('tate_langue_progress');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setChapitresLus(new Set(p.lus || []));
      } catch { /* ignore */ }
    }
  }, []);

  const sauverProgression = (newLus, chaps) => {
    const total = chaps.length;
    const bySection = { listening: 0, pronunciation: 0, grammar: 0, vocabulary: 0, practice: 0 };
    const totalBySection = { listening: 0, pronunciation: 0, grammar: 0, vocabulary: 0, practice: 0 };

    chaps.forEach(c => {
      const sec = classifyChapitre(c.titre);
      totalBySection[sec]++;
      if (newLus.has(c._id)) bySection[sec]++;
    });

    setProgression({
      listening: totalBySection.listening > 0 ? Math.round((bySection.listening / totalBySection.listening) * 100) : 0,
      pronunciation: totalBySection.pronunciation > 0 ? Math.round((bySection.pronunciation / totalBySection.pronunciation) * 100) : 0,
      grammar: totalBySection.grammar > 0 ? Math.round((bySection.grammar / totalBySection.grammar) * 100) : 0,
      vocabulary: totalBySection.vocabulary > 0 ? Math.round((bySection.vocabulary / totalBySection.vocabulary) * 100) : 0,
      practice: totalBySection.practice > 0 ? Math.round((bySection.practice / totalBySection.practice) * 100) : 0,
      total: total > 0 ? Math.round((newLus.size / total) * 100) : 0,
    });

    localStorage.setItem('tate_langue_progress', JSON.stringify({ lus: Array.from(newLus) }));
  };

  const getToken = () => localStorage.getItem('accessToken') || localStorage.getItem('tate_token');

  const chargerCours = async () => {
    try {
      const token = getToken();
      const { data } = await axios.get(`${API}/chapitres?niveau=Adulte&matiereCode=AN-AD`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = data.data || [];
      setChapitres(list);
      // Recalculer progression
      const saved = localStorage.getItem('tate_langue_progress');
      let lus = new Set();
      if (saved) { try { lus = new Set(JSON.parse(saved).lus || []); } catch {} }
      setChapitresLus(lus);
      sauverProgression(lus, list);
    } catch (e) {
      console.error('Erreur chargement cours', e);
    } finally {
      setChargement(false);
    }
  };

  const ouvrirLecon = async (chap) => {
    try {
      const token = getToken();
      const { data } = await axios.get(`${API}/lecons/${chap._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lecon = Array.isArray(data.data) ? data.data[0] : data.data;
      setLeconActive({ chapitre: chap, lecon });
      const newLus = new Set(chapitresLus);
      newLus.add(chap._id);
      setChapitresLus(newLus);
      sauverProgression(newLus, chapitres);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSection = (sec) => {
    setSectionsOuvertes(prev => ({ ...prev, [sec]: !prev[sec] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/langue/login', { replace: true });
  };

  // Grouper par section
  const grouped = { listening: [], pronunciation: [], grammar: [], vocabulary: [], practice: [] };
  chapitres.forEach(c => {
    const sec = classifyChapitre(c.titre);
    grouped[sec].push(c);
  });

  // Tri par ordre
  Object.keys(grouped).forEach(k => {
    grouped[k].sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  });

  if (leconActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="max-w-4xl mx-auto p-4 md:p-6">
          <button onClick={() => setLeconActive(null)}
            className="text-blue-300 hover:text-white mb-4 flex items-center gap-2 transition text-sm">
            ← Retour au programme
          </button>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 md:p-10 border border-white/10"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                <PlayCircle size={24} className="text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-white">{leconActive.chapitre.titre}</h1>
                <p className="text-blue-200/70 text-sm mt-1">{leconActive.chapitre.objectif}</p>
              </div>
            </div>

            {leconActive.lecon?.contenuHTML ? (
              <div className="lecon-contenu text-blue-50 leading-relaxed"
                dangerouslySetInnerHTML={{ __html: leconActive.lecon.contenuHTML }} />
            ) : (
              <p className="text-blue-300/50">Contenu en cours de préparation.</p>
            )}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <Globe size={20} className="text-blue-400" />
            </div>
            <div>
              <span className="text-white font-bold text-lg block leading-tight">Taté English</span>
              <span className="text-blue-300/50 text-xs">Programme Adultes</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 text-sm">
              <GraduationCap size={16} className="text-blue-400" />
              <span className="text-blue-200">{user?.nom || user?.email}</span>
            </div>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/10 text-blue-200 hover:bg-white/20 transition text-sm">
              <LogOut size={15} /> <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-8 pb-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Volume2 size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">Taté English Academy</h1>
              <p className="text-blue-200/60 text-sm">Programme complet pour adultes — 3 sections</p>
            </div>
          </div>
          <p className="text-blue-200/50 text-sm md:text-base max-w-2xl mt-2">
            Maîtrisez l'anglais avec notre programme complet : Listening, Pronunciation, Grammar, Vocabulary et Practice.
            Des vidéos, des chansons, des films et des exercices pour progresser rapidement.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mt-6">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <Headphones size={18} className="text-red-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{grouped.listening.length}</p>
            <p className="text-blue-200/50 text-[10px]">Listening</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-red-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.listening}%` }} />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <Mic size={18} className="text-pink-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{grouped.pronunciation.length}</p>
            <p className="text-blue-200/50 text-[10px]">Pronunciation</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-pink-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.pronunciation}%` }} />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <Library size={18} className="text-emerald-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{grouped.grammar.length}</p>
            <p className="text-blue-200/50 text-[10px]">Grammar</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.grammar}%` }} />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <BookOpen size={18} className="text-amber-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{grouped.vocabulary.length}</p>
            <p className="text-blue-200/50 text-[10px]">Vocabulary</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-amber-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.vocabulary}%` }} />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <PlayCircle size={18} className="text-violet-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{grouped.practice.length}</p>
            <p className="text-blue-200/50 text-[10px]">Practice</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-violet-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.practice}%` }} />
            </div>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-3 border border-white/10 text-center">
            <Clock size={18} className="text-blue-400 mx-auto mb-1" />
            <p className="text-xl font-bold text-white">{progression.total}%</p>
            <p className="text-blue-200/50 text-[10px]">Total</p>
            <div className="w-full bg-white/10 rounded-full h-1.5 mt-1.5">
              <div className="bg-blue-500 h-1.5 rounded-full transition-all" style={{ width: `${progression.total}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu par section */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pb-12">
        {chargement ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-blue-300/50">Chargement du programme...</p>
          </div>
        ) : (
          <div className="space-y-5">
            {(['listening', 'pronunciation', 'grammar', 'vocabulary', 'practice']).map((secKey) => {
              const sec = SECTION_CONFIG[secKey];
              const secChaps = grouped[secKey] || [];
              if (secChaps.length === 0) return null;
              const isOpen = sectionsOuvertes[secKey];
              const completedCount = secChaps.filter(c => chapitresLus.has(c._id)).length;
              const Icon = sec.icon;

              return (
                <motion.div
                  key={secKey}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-2xl border ${sec.border} overflow-hidden`}
                >
                  {/* Header de section */}
                  <button
                    onClick={() => toggleSection(secKey)}
                    className={`w-full flex items-center justify-between p-4 md:p-5 ${sec.bg} hover:bg-white/5 transition`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${sec.color} flex items-center justify-center`}>
                        <Icon size={22} className="text-white" />
                      </div>
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <h3 className="text-white font-bold text-base md:text-lg">{sec.label}</h3>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${sec.chip}`}>
                            {secChaps.length} chapitres
                          </span>
                        </div>
                        <p className="text-blue-200/50 text-xs">{sec.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {completedCount === secChaps.length && (
                        <CheckCircle2 size={18} className="text-emerald-400" />
                      )}
                      {isOpen ? <ChevronUp size={20} className="text-blue-300" /> : <ChevronDown size={20} className="text-blue-300" />}
                    </div>
                  </button>

                  {/* Liste des chapitres */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-white/5 px-4 pb-4">
                          {secChaps.map((chap, idx) => {
                            const isRead = chapitresLus.has(chap._id);
                            return (
                              <motion.button
                                key={chap._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.03 }}
                                onClick={() => ouvrirLecon(chap)}
                                className="w-full flex items-center gap-3 p-3 mt-2 rounded-xl hover:bg-white/5 transition group text-left"
                              >
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                  isRead ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-blue-300'
                                }`}>
                                  {isRead ? <CheckCircle2 size={16} /> : <PlayCircle size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className={`text-sm font-medium truncate ${isRead ? 'text-blue-200/70' : 'text-white group-hover:text-blue-300'}`}>
                                    {chap.titre}
                                  </h4>
                                  <p className="text-blue-200/40 text-xs truncate">{chap.objectif}</p>
                                </div>
                                <ArrowRight size={16} className="text-blue-400/30 group-hover:text-blue-400 transition shrink-0" />
                              </motion.button>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
