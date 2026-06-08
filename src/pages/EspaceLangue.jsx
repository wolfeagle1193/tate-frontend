import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, LogOut, Globe, Clock, ArrowRight, GraduationCap, ChevronDown, ChevronUp, PlayCircle, CheckCircle2, Award } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const MODULE_COLORS = {
  'M1': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: '📚' },
  'M2': { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30', icon: '💼' },
  'M3': { bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30', icon: '☕' },
  'M4': { bg: 'bg-sky-500/20', text: 'text-sky-400', border: 'border-sky-500/30', icon: '✈️' },
  'M5': { bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30', icon: '✍️' },
  'M6': { bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30', icon: '🎧' },
  'FINAL': { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', icon: '🎓' },
};

function parseModule(titre) {
  const match = titre.match(/^(M\d+)/);
  return match ? match[1] : titre.includes('Final') || titre.includes('Bilan') ? 'FINAL' : 'OTHER';
}

function getModuleLabel(code) {
  const labels = {
    'M1': 'Module 1 — English Fundamentals',
    'M2': 'Module 2 — Business English',
    'M3': 'Module 3 — Everyday Conversations',
    'M4': 'Module 4 — Travel & Tourism',
    'M5': 'Module 5 — Writing & Communication',
    'M6': 'Module 6 — Listening & Comprehension',
    'FINAL': 'Final Assessment',
    'OTHER': 'Autres',
  };
  return labels[code] || 'Autres';
}

export function EspaceLangue() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [chapitres, setChapitres] = useState([]);
  const [leconActive, setLeconActive] = useState(null);
  const [chargement, setChargement] = useState(true);
  const [modulesOuverts, setModulesOuverts] = useState({});
  const [progression, setProgression] = useState(0);
  const [chapitresLus, setChapitresLus] = useState(new Set());

  useEffect(() => {
    if (!user) { navigate('/langue/login', { replace: true }); return; }
    chargerCours();
    // Charger progression depuis localStorage
    const saved = localStorage.getItem('tate_langue_progress');
    if (saved) {
      try {
        const p = JSON.parse(saved);
        setChapitresLus(new Set(p.lus || []));
        setProgression(p.pct || 0);
      } catch { /* ignore */ }
    }
  }, []);

  const sauverProgression = (newLus) => {
    const pct = chapitres.length > 0 ? Math.round((newLus.size / chapitres.length) * 100) : 0;
    setProgression(pct);
    localStorage.setItem('tate_langue_progress', JSON.stringify({ lus: Array.from(newLus), pct }));
  };

  const chargerCours = async () => {
    try {
      const token = localStorage.getItem('tate_token');
      const { data } = await axios.get(`${API}/chapitres?niveau=Adulte&matiereCode=AN-AD`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const list = data.data || [];
      setChapitres(list);
      // Ouvrir le premier module par défaut
      if (list.length > 0) {
        const firstMod = parseModule(list[0].titre);
        setModulesOuverts({ [firstMod]: true });
      }
    } catch (e) {
      console.error('Erreur chargement cours', e);
    } finally {
      setChargement(false);
    }
  };

  const ouvrirLecon = async (chap) => {
    try {
      const token = localStorage.getItem('tate_token');
      const { data } = await axios.get(`${API}/lecons/chapitre/${chap._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lecon = Array.isArray(data.data) ? data.data[0] : data.data;
      setLeconActive({ chapitre: chap, lecon });
      // Marquer comme lu
      const newLus = new Set(chapitresLus);
      newLus.add(chap._id);
      setChapitresLus(newLus);
      sauverProgression(newLus);
    } catch (e) {
      console.error(e);
    }
  };

  const toggleModule = (mod) => {
    setModulesOuverts(prev => ({ ...prev, [mod]: !prev[mod] }));
  };

  const handleLogout = () => {
    logout();
    navigate('/langue/login', { replace: true });
  };

  // Grouper les chapitres par module
  const grouped = chapitres.reduce((acc, chap) => {
    const mod = parseModule(chap.titre);
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(chap);
    return acc;
  }, {});

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
              <span className="text-white font-bold text-lg block leading-tight">Taté Langues</span>
              <span className="text-blue-300/50 text-xs">Anglais Adultes</span>
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
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Programme Anglais Adultes
          </h1>
          <p className="text-blue-200/60 text-base md:text-lg max-w-2xl">
            6 modules complets pour maîtriser l'anglais professionnel et quotidien. 
            Du niveau débutant à avancé, avec un contenu riche et pratique.
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 md:gap-4 mt-6">
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <BookOpen size={20} className="text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{chapitres.length}</p>
            <p className="text-blue-200/50 text-xs">Chapitres</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <Award size={20} className="text-emerald-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">6</p>
            <p className="text-blue-200/50 text-xs">Modules</p>
          </div>
          <div className="bg-white/5 backdrop-blur rounded-2xl p-4 border border-white/10 text-center">
            <Clock size={20} className="text-amber-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{progression}%</p>
            <p className="text-blue-200/50 text-xs">Progression</p>
          </div>
        </div>

        {/* Barre de progression */}
        <div className="mt-4">
          <div className="w-full bg-white/10 rounded-full h-2.5">
            <div className="bg-gradient-to-r from-blue-500 to-emerald-500 h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${progression}%` }} />
          </div>
        </div>
      </div>

      {/* Contenu */}
      <main className="max-w-5xl mx-auto px-4 md:px-6 pb-12">
        {chargement ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-blue-300/50">Chargement du programme...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([modCode, modChaps]) => {
              const colors = MODULE_COLORS[modCode] || MODULE_COLORS['OTHER'];
              const isOpen = modulesOuverts[modCode];
              const completedCount = modChaps.filter(c => chapitresLus.has(c._id)).length;

              return (
                <motion.div
                  key={modCode}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-white/5 backdrop-blur rounded-2xl border ${colors.border} overflow-hidden`}
                >
                  {/* Header du module */}
                  <button
                    onClick={() => toggleModule(modCode)}
                    className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center text-lg`}>
                        {colors.icon}
                      </div>
                      <div className="text-left">
                        <h3 className="text-white font-semibold text-base">{getModuleLabel(modCode)}</h3>
                        <p className="text-blue-200/50 text-xs">
                          {completedCount}/{modChaps.length} chapitres • {modChaps.length} leçons
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {completedCount === modChaps.length && modChaps.length > 0 && (
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
                          {modChaps.map((chap, idx) => {
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

        {!chargement && chapitres.length === 0 && (
          <div className="text-center py-20">
            <p className="text-blue-300/50">Aucun cours disponible pour le moment.</p>
          </div>
        )}
      </main>
    </div>
  );
}
