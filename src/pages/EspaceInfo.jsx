import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, LogOut, Clock, ArrowRight,
  ChevronDown, ChevronUp, FileSpreadsheet, Bot,
  CheckCircle2, GraduationCap, Monitor
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const SECTION_CONFIG = {
  debutant: {
    label: 'Excel Débutant',
    subtitle: 'Bases, formules simples & mise en forme',
    icon: FileSpreadsheet,
    color: 'from-emerald-500 to-teal-500',
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/20',
    text: 'text-emerald-400',
    chip: 'bg-emerald-500/20 text-emerald-300',
  },
  intermediaire: {
    label: 'Excel Intermédiaire',
    subtitle: 'RECHERCHEV, SI & tableaux croisés',
    icon: FileSpreadsheet,
    color: 'from-blue-500 to-indigo-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400',
    chip: 'bg-blue-500/20 text-blue-300',
  },
  ia: {
    label: 'Excel + IA',
    subtitle: 'Automatisation avec intelligence artificielle',
    icon: Bot,
    color: 'from-violet-500 to-purple-500',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
    text: 'text-violet-400',
    chip: 'bg-violet-500/20 text-violet-300',
  },
  exercices: {
    label: 'Exercices Pratiques',
    subtitle: 'Cas concrets pour valider vos acquis',
    icon: CheckCircle2,
    color: 'from-amber-500 to-orange-500',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
    text: 'text-amber-400',
    chip: 'bg-amber-500/20 text-amber-300',
  },
};

function classifyChapitre(titre) {
  const t = titre.trim();
  if (/^IN1/i.test(t)) return 'debutant';
  if (/^IN2/i.test(t)) return 'intermediaire';
  if (/^IN3/i.test(t)) return 'ia';
  if (/^IN4/i.test(t)) return 'exercices';
  return 'debutant';
}

export function EspaceInfo() {
  const navigate = useNavigate();
  const { user, setUser, logout } = useAuthStore();
  const [chapitres, setChapitres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openSection, setOpenSection] = useState(null);
  const [progress, setProgress] = useState({});

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchData() {
    try {
      const { data } = await axios.get(`${API}/chapitres?matiereCode=IN-AD&niveau=Adulte`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      const chaps = data?.data || data?.chapitres || data || [];
      setChapitres(chaps);
      // calculer progression
      const p = {};
      for (const c of chaps) {
        const section = classifyChapitre(c.titre || c.titre);
        p[section] = (p[section] || 0) + 1;
      }
      setProgress(p);
    } catch (e) {
      console.error('Erreur chargement chapitres:', e);
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  // Grouper les chapitres par section
  const grouped = {};
  for (const c of chapitres) {
    const section = classifyChapitre(c.titre || c.titre);
    if (!grouped[section]) grouped[section] = [];
    grouped[section].push(c);
  }

  return (
    <div className="min-h-screen bg-tate-creme">
      {/* ── Header ────────────────────────── */}
      <header className="bg-white border-b border-tate-border sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-serif font-bold text-white text-sm shadow-sm">
              I
            </div>
            <div>
              <h1 className="font-serif font-bold text-tate-terre text-lg leading-tight">
                Informatique
              </h1>
              <p className="text-xs text-tate-terre/40">Formation Excel & IA</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && (
              <span className="text-xs text-tate-terre/40 hidden sm:block">
                {user.email || user.telephone}
              </span>
            )}
            <button onClick={handleLogout}
              className="p-2 rounded-xl hover:bg-red-50 text-red-400 hover:text-red-500 transition-all">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      {/* ── Contenu ────────────────────────── */}
      <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
        {/* Message de bienvenue */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-6 mb-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="font-serif font-bold text-lg">
                Maîtrisez Excel et l'IA 🚀
              </h2>
              <p className="text-white/70 text-sm mt-1">
                De débutant à pro : formules, analyses, automatisation.
                Suivez les cours dans l'ordre et faites les exercices.
              </p>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-tate-terre/50 mt-3">Chargement...</p>
          </div>
        ) : chapitres.length === 0 ? (
          <div className="text-center py-12">
            <Monitor size={48} className="mx-auto text-tate-terre/20 mb-4" />
            <h3 className="font-serif font-bold text-tate-terre/60">Aucun cours disponible</h3>
            <p className="text-sm text-tate-terre/40 mt-1">Les formations arrivent bientôt.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(SECTION_CONFIG).map(([key, cfg]) => {
              const chaps = grouped[key] || [];
              if (chaps.length === 0) return null;
              const isOpen = openSection === key;
              const Icon = cfg.icon;
              const doneCount = Object.values(progress).reduce((a, b) => a + b, 0);
              return (
                <motion.div key={key}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white rounded-2xl border border-tate-border overflow-hidden shadow-card">
                  {/* En-tête de section */}
                  <button onClick={() => setOpenSection(isOpen ? null : key)}
                    className="w-full p-4 flex items-center gap-3 hover:bg-tate-creme/50 transition-colors text-left">
                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-tate-terre text-base">{cfg.label}</h3>
                      <p className="text-xs text-tate-terre/50">{cfg.subtitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-semibold ${cfg.chip} px-2 py-0.5 rounded-full`}>
                        {chaps.length} cours
                      </span>
                      {isOpen ? <ChevronUp size={18} className="text-tate-terre/30" /> : <ChevronDown size={18} className="text-tate-terre/30" />}
                    </div>
                  </button>

                  {/* Liste des leçons */}
                  <AnimatePresence>
                    {isOpen && (
                      <motion.div initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden">
                        <div className="px-4 pb-4 space-y-2">
                          {chaps.map((ch, idx) => {
                            const titre = ch.titre || 'Chapitre';
                            const objectif = ch.objectif || 'Pas de description';
                            return (
                              <motion.button key={ch._id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-tate-creme/60 transition-all text-left border border-transparent hover:border-tate-border"
                                onClick={() => navigate(`/informatique/lecon/${ch._id}`)}>
                                <div className={`w-8 h-8 rounded-lg ${cfg.bg} flex items-center justify-center flex-shrink-0`}>
                                  <BookOpen size={14} className={cfg.text} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="font-semibold text-tate-terre text-sm truncate">{titre}</p>
                                  <p className="text-xs text-tate-terre/40 truncate">{objectif}</p>
                                </div>
                                <ArrowRight size={14} className="text-tate-terre/20 flex-shrink-0" />
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
