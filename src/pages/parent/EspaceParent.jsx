import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Star, TrendingUp, AlertTriangle, CheckCircle, BookOpen,
  Flame, Trophy, LogOut, ChevronDown, ChevronUp,
  Calendar, Clock, Target, BarChart2, Award, Zap,
  KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate }  from 'react-router-dom';
import api              from '../../lib/api';
import toast            from 'react-hot-toast';

// ─── Utilitaires ──────────────────────────────────────────────
const clamp = (v, min = 0, max = 100) => Math.max(min, Math.min(max, Math.round(v)));

const dateFr = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffJ = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffJ === 0) return 'Aujourd\'hui';
  if (diffJ === 1) return 'Hier';
  if (diffJ < 7)  return `Il y a ${diffJ}j`;
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
};

const dateLong = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-FR', {
    weekday:'short', day:'2-digit', month:'long', hour:'2-digit', minute:'2-digit',
  });
};

const niveauLabel = (moy) => {
  if (moy >= 85) return { txt:'Excellent',    color:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200', emoji:'🌟' };
  if (moy >= 70) return { txt:'Bien',          color:'text-blue-600',    bg:'bg-blue-50 border-blue-200',       emoji:'👍' };
  if (moy >= 55) return { txt:'En progrès',    color:'text-amber-600',   bg:'bg-amber-50 border-amber-200',     emoji:'📈' };
  return           { txt:'À renforcer',   color:'text-red-600',     bg:'bg-red-50 border-red-200',         emoji:'💪' };
};

const couleurScore = (s) =>
  s >= 80 ? 'text-emerald-600' : s >= 60 ? 'text-amber-500' : 'text-red-500';

const bgScore = (s) =>
  s >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
  : s >= 60 ? 'bg-amber-50 text-amber-700 border-amber-200'
  : 'bg-red-50 text-red-700 border-red-200';

const TYPE_DEVOIR = {
  cours:    { label:'📖 Cours',    bg:'bg-blue-50 text-blue-800 border-blue-200'    },
  exercice: { label:'📝 Exercice', bg:'bg-amber-50 text-amber-800 border-amber-200' },
  revision: { label:'🔄 Révision', bg:'bg-green-50 text-green-800 border-green-200' },
};

const STATUT_DEVOIR = {
  en_attente:            { label:'À faire',        dot:'bg-blue-500'   },
  en_cours:              { label:'En cours',        dot:'bg-amber-500'  },
  fait_sans_validation:  { label:'Fait (non validé)',dot:'bg-orange-500' },
  valide:                { label:'Validé ✓',        dot:'bg-emerald-500'},
  expire:                { label:'Expiré',           dot:'bg-gray-400'   },
};

// ─── Layout parent ─────────────────────────────────────────────
function LayoutParent({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-tate-creme">
      <header className="bg-white border-b border-tate-border px-4 py-3
                         flex items-center justify-between sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-serif font-bold text-white text-sm shadow-tate"
               style={{ background:'linear-gradient(135deg,#F97316,#EA580C)' }}>T</div>
          <div>
            <p className="font-serif font-bold text-tate-terre text-sm leading-none">Taté</p>
            <p className="text-[10px] text-tate-terre/40 mt-0.5">Espace Parent</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tate-terre/60 hidden sm:block">{user?.nom}</span>
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="p-2 rounded-xl hover:bg-red-50 text-tate-terre/50 hover:text-red-500 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6 pb-12">{children}</main>
    </div>
  );
}

// ─── Carte de sélection enfant ─────────────────────────────────
function CarteEnfant({ enfant, actif, onClick, nbChapTotal }) {
  const chapValides = enfant.chapitresValides?.length || 0;
  const total       = Math.max(nbChapTotal || 1, chapValides, 1);
  const pct         = clamp((chapValides / total) * 100);

  return (
    <motion.button whileHover={{ y:-2 }} onClick={onClick}
      className={`w-full card text-left transition-all ${actif ? 'border-tate-soleil shadow-tate' : 'hover:border-tate-soleil/50'}`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-tate-soleil to-orange-600 flex items-center justify-center
                        font-bold text-white text-xl flex-shrink-0 shadow-tate">
          {enfant.nom?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-tate-terre text-base">{enfant.nom}</p>
          <p className="text-xs text-tate-terre/50 mb-2">{enfant.niveau} · {enfant.email}</p>
          <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
            <motion.div className="h-full bg-tate-soleil rounded-full"
              initial={{ width:0 }} animate={{ width:`${pct}%` }} transition={{ duration:0.8, ease:'easeOut' }} />
          </div>
          <p className="text-xs text-tate-terre/40 mt-1">
            {chapValides} chapitre{chapValides > 1 ? 's' : ''} maîtrisé{chapValides > 1 ? 's' : ''}
          </p>
        </div>
        {enfant.streak > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0 bg-amber-50 border border-amber-200 rounded-full px-2 py-1">
            <Flame size={13} className="text-alerte" />
            <span className="text-xs font-bold text-tate-terre">{enfant.streak}j</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Barre de progression mini ─────────────────────────────────
function MiniBar({ pct, color = 'bg-tate-soleil' }) {
  const p = clamp(pct);
  return (
    <div className="h-1.5 bg-tate-doux rounded-full overflow-hidden flex-1">
      <motion.div initial={{ width:0 }} animate={{ width:`${p}%` }}
        transition={{ duration:0.6, ease:'easeOut' }}
        className={`h-full rounded-full ${color}`} />
    </div>
  );
}

// ─── Détail complet enfant ─────────────────────────────────────
function DetailEnfant({ enfant, sessions, progression, devoirs, nbChapTotal }) {
  const chapValides     = enfant.chapitresValides || [];
  const [onglet, setOnglet] = useState('apercu');
  const [chapExpanded, setChapExpanded] = useState({});

  // ── Calculs analytiques ──
  const scoresValides   = sessions.filter(s => s.scorePct != null).map(s => clamp(s.scorePct));
  const scoreMoyen      = scoresValides.length > 0
    ? clamp(scoresValides.reduce((a,b) => a+b, 0) / scoresValides.length)
    : null;

  // Tendance : comparer les 3 dernières sessions vs les 3 précédentes
  const tendance = (() => {
    if (scoresValides.length < 4) return null;
    const recent   = scoresValides.slice(0, 3).reduce((a,b) => a+b, 0) / 3;
    const precedent = scoresValides.slice(3, 6).reduce((a,b) => a+b, 0) / Math.min(3, scoresValides.slice(3,6).length);
    const diff = recent - precedent;
    if (diff > 5)  return { label:'En hausse',  color:'text-emerald-600', emoji:'↑' };
    if (diff < -5) return { label:'En baisse',  color:'text-red-500',     emoji:'↓' };
    return           { label:'Stable',       color:'text-amber-500',    emoji:'→' };
  })();

  const niveau     = scoreMoyen != null ? niveauLabel(scoreMoyen) : null;
  const enDiff     = progression.filter(c => !c.maitrise && c.meilleurScore < 70);
  const points_forts = progression.filter(c => c.maitrise && c.meilleurScore >= 80);

  // Devoirs en attente / à venir
  const devoirsActifs  = devoirs.filter(d => d.statut === 'en_attente' || d.statut === 'en_cours');
  const devoirsValides = devoirs.filter(d => d.statut === 'valide');
  const devoirsExpires = devoirs.filter(d => d.statut === 'expire');

  const ONGLETS = [
    { id:'apercu',    icon:BarChart2, label:'Bilan'       },
    { id:'chapitres', icon:Target,    label:'QCM'          },
    { id:'devoirs',   icon:Calendar,  label:'Devoirs', badge: devoirsActifs.length || 0 },
  ];

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4 mt-4">

      {/* ── Niveau global ── */}
      {niveau && (
        <div className={`border rounded-2xl p-4 flex items-center gap-4 ${niveau.bg}`}>
          <span className="text-3xl">{niveau.emoji}</span>
          <div className="flex-1">
            <p className="font-bold text-sm text-tate-terre">Niveau global : <span className={niveau.color}>{niveau.txt}</span></p>
            <p className="text-xs text-tate-terre/60 mt-0.5">
              Score moyen : <strong className={couleurScore(scoreMoyen)}>{scoreMoyen}%</strong>
              {tendance && <span className={`ml-2 ${tendance.color} font-semibold`}>{tendance.emoji} {tendance.label}</span>}
            </p>
          </div>
        </div>
      )}

      {/* ── Stats rapides ── */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <Flame size={20} className="text-alerte mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{enfant.streak || 0}</p>
          <p className="text-xs text-tate-terre/50">Jours de suite</p>
        </div>
        <div className="card text-center py-4">
          <Trophy size={20} className="text-tate-soleil mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{chapValides.length}</p>
          <p className="text-xs text-tate-terre/50">Validés</p>
        </div>
        <div className="card text-center py-4">
          <Zap size={20} className="text-violet-500 mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{sessions.length}</p>
          <p className="text-xs text-tate-terre/50">Sessions</p>
        </div>
      </div>

      {/* ── Onglets ── */}
      <div className="flex rounded-2xl bg-tate-doux p-1 gap-1">
        {ONGLETS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.id} onClick={() => setOnglet(tab.id)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                onglet === tab.id ? 'bg-white shadow text-tate-terre' : 'text-tate-terre/50 hover:text-tate-terre/70'
              }`}>
              <Icon size={13} />
              {tab.label}
              {tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full bg-alerte text-white text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ══════════════ BILAN ══════════════ */}
      <AnimatePresence mode="wait">
      {onglet === 'apercu' && (
        <motion.div key="apercu" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

          {/* Points nécessitant attention */}
          {enDiff.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={15} className="text-alerte flex-shrink-0" />
                <p className="text-sm font-bold text-red-700">Points à renforcer ({enDiff.length})</p>
              </div>
              <div className="space-y-2">
                {enDiff.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-xs text-tate-terre/70 flex-1 truncate">• {c.titre}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MiniBar pct={clamp(c.meilleurScore)} color="bg-red-400" />
                      <span className={`text-xs font-bold w-9 text-right ${couleurScore(clamp(c.meilleurScore))}`}>
                        {clamp(c.meilleurScore)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Points forts */}
          {points_forts.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Award size={15} className="text-emerald-600 flex-shrink-0" />
                <p className="text-sm font-bold text-emerald-700">Points forts ({points_forts.length})</p>
              </div>
              <div className="space-y-2">
                {points_forts.slice(0, 4).map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <p className="text-xs text-tate-terre/70 flex-1 truncate">• {c.titre}</p>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <MiniBar pct={clamp(c.meilleurScore)} color="bg-emerald-400" />
                      <span className="text-xs font-bold text-emerald-700 w-9 text-right">
                        {clamp(c.meilleurScore)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Activité récente */}
          <div className="card">
            <h3 className="font-serif font-bold text-tate-terre mb-3 flex items-center gap-2">
              <BookOpen size={15} className="text-tate-soleil" /> Activité récente
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-tate-terre/40 text-center py-4">Aucune session enregistrée</p>
            ) : (
              <div className="space-y-2">
                {sessions.slice(0, 8).map((s, i) => {
                  const score = clamp(s.scorePct);
                  return (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-tate-border/40 last:border-0">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-tate-terre truncate">{s.chapitreId?.titre || s.chapitreTitre}</p>
                        <p className="text-xs text-tate-terre/40">
                          {dateFr(s.completedAt || s.createdAt)}
                          {s.serie && ` · Série ${s.serie}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <MiniBar pct={score} color={score >= 80 ? 'bg-emerald-400' : score >= 60 ? 'bg-amber-400' : 'bg-red-400'} />
                        <span className={`text-sm font-bold w-10 text-right ${couleurScore(score)}`}>{score}%</span>
                        {s.maitrise && <Star size={12} className="fill-tate-soleil text-tate-soleil flex-shrink-0" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Chapitres maîtrisés */}
          {chapValides.length > 0 && (
            <div className="card">
              <h3 className="font-serif font-bold text-tate-terre mb-3 flex items-center gap-2">
                <CheckCircle size={15} className="text-emerald-500" /> Chapitres maîtrisés ({chapValides.length})
              </h3>
              <div className="space-y-1.5">
                {chapValides.map((c, i) => (
                  <div key={i} className="flex items-center gap-2 py-1.5 border-b border-tate-border/30 last:border-0">
                    <CheckCircle size={13} className="text-emerald-500 flex-shrink-0" />
                    <p className="text-sm text-tate-terre flex-1 truncate">{c.chapitreId?.titre || 'Chapitre'}</p>
                    <div className="flex gap-0.5">
                      {[1,2,3].map(n => (
                        <Star key={n} size={11}
                          className={n <= (c.etoiles || 1) ? 'fill-tate-soleil text-tate-soleil' : 'text-tate-doux'} />
                      ))}
                    </div>
                    {c.valideAt && (
                      <span className="text-[10px] text-tate-terre/30 ml-1 flex-shrink-0">{dateFr(c.valideAt)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Badges */}
          {enfant.badges?.length > 0 && (
            <div className="card">
              <h3 className="font-serif font-bold text-tate-terre mb-3">Badges obtenus 🏅</h3>
              <div className="flex gap-2 flex-wrap">
                {enfant.badges.map((b, i) => (
                  <span key={i} className="px-3 py-1 rounded-full bg-tate-doux text-tate-terre border border-tate-border text-xs font-semibold">{b}</span>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* ══════════════ PROGRESSION QCM ══════════════ */}
      {onglet === 'chapitres' && (
        <motion.div key="chapitres" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-3">
          {progression.length === 0 ? (
            <div className="card text-center py-10">
              <p className="text-3xl mb-2">📊</p>
              <p className="text-sm text-tate-terre/50">Aucun exercice QCM effectué pour le moment</p>
            </div>
          ) : (
            progression
              .sort((a, b) => new Date(b.derniereAt || 0) - new Date(a.derniereAt || 0))
              .map((chap, i) => {
                const isOpen  = !!chapExpanded[i];
                const best    = clamp(Math.max(...chap.tentatives.map(t => t.score || 0)));
                const lastErr = chap.tentatives[chap.tentatives.length - 1]?.nbErreurs ?? 0;
                return (
                  <div key={i} className={`rounded-2xl border-2 overflow-hidden ${
                    chap.maitrise ? 'border-emerald-200 bg-emerald-50/20' : 'border-tate-border bg-white'
                  }`}>
                    <button onClick={() => setChapExpanded(p => ({ ...p, [i]: !p[i] }))}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left">
                      <span className="text-xl flex-shrink-0">
                        {chap.maitrise ? (lastErr === 0 ? '🥇' : lastErr === 1 ? '🏆' : '⭐') : (best >= 60 ? '💪' : '📚')}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-tate-terre text-sm truncate">{chap.titre}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <span className="text-xs text-tate-terre/40">
                            {chap.tentatives.length} tentative{chap.tentatives.length > 1 ? 's' : ''}
                          </span>
                          {chap.maitrise && <span className="text-xs text-emerald-600 font-semibold">✓ Maîtrisé</span>}
                          {!chap.maitrise && best < 70 && <span className="text-xs text-red-500 font-semibold">⚠ À travailler</span>}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="text-right">
                          <p className={`text-base font-bold ${couleurScore(best)}`}>{best}%</p>
                          <p className="text-[10px] text-tate-terre/30">meilleur</p>
                        </div>
                        {isOpen ? <ChevronUp size={14} className="text-tate-terre/30" /> : <ChevronDown size={14} className="text-tate-terre/30" />}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="border-t border-tate-border/40 px-4 py-3 space-y-2 bg-white/50">
                        {chap.tentatives.map((t, j) => {
                          const sc   = clamp(t.score || 0);
                          const nbErr = t.nbErreurs ?? (t.nbTotal - t.nbCorrectes);
                          return (
                            <div key={j} className="flex items-center gap-2 text-xs">
                              <span className="text-tate-terre/30 w-5 flex-shrink-0 text-center">#{t.tentative}</span>
                              <div className={`w-5 h-5 rounded-lg flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                                t.maitrise ? 'bg-emerald-500 text-white' : 'bg-red-100 text-red-600'
                              }`}>
                                {t.maitrise ? '✓' : '✗'}
                              </div>
                              <div className="flex-1 h-2 bg-tate-doux rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${t.maitrise ? 'bg-emerald-400' : sc >= 60 ? 'bg-amber-400' : 'bg-red-400'}`}
                                  style={{ width:`${sc}%` }} />
                              </div>
                              <span className={`font-bold w-9 text-right ${couleurScore(sc)}`}>{sc}%</span>
                              <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border ${
                                nbErr === 0 ? 'bg-green-50 text-green-700 border-green-200'
                                : nbErr <= 2 ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-red-50 text-red-700 border-red-200'
                              }`}>
                                {nbErr} ✗
                              </span>
                              <span className="text-tate-terre/30 text-[10px] w-10 flex-shrink-0">{dateFr(t.completedAt)}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
          )}
        </motion.div>
      )}

      {/* ══════════════ DEVOIRS ══════════════ */}
      {onglet === 'devoirs' && (
        <motion.div key="devoirs" initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="space-y-4">

          {devoirs.length === 0 ? (
            <div className="card text-center py-10">
              <Calendar size={32} className="text-tate-terre/20 mx-auto mb-3" />
              <p className="font-semibold text-tate-terre">Aucun devoir programmé</p>
              <p className="text-sm text-tate-terre/40 mt-1">
                L'enseignant n'a pas encore programmé de devoirs
              </p>
            </div>
          ) : (
            <>
              {/* Devoirs actifs */}
              {devoirsActifs.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wider mb-2">
                    📌 À faire ({devoirsActifs.length})
                  </p>
                  <div className="space-y-3">
                    {devoirsActifs.map((d, i) => {
                      const dateP   = new Date(d.dateProgrammee);
                      const depasse = dateP < new Date();
                      const type    = TYPE_DEVOIR[d.type] || { label:d.type, bg:'bg-gray-50 text-gray-700 border-gray-200' };
                      const statut  = STATUT_DEVOIR[d.statut] || { label:d.statut, dot:'bg-gray-400' };
                      return (
                        <div key={i} className={`rounded-2xl border-2 p-4 ${
                          depasse ? 'border-red-200 bg-red-50/30' : 'border-tate-border bg-white'
                        }`}>
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${statut.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-tate-terre text-sm">
                                {d.chapitreId?.titre || 'Chapitre'}
                              </p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type.bg}`}>
                                  {type.label}
                                </span>
                                <span className="text-xs text-tate-terre/50 flex items-center gap-1">
                                  <Clock size={10} /> {dateLong(d.dateProgrammee)}
                                </span>
                              </div>
                              {d.noteAdmin && (
                                <p className="text-xs text-tate-terre/60 mt-2 italic bg-tate-doux rounded-lg px-3 py-1.5">
                                  💬 {d.noteAdmin}
                                </p>
                              )}
                              {depasse && (
                                <p className="text-xs text-red-600 font-semibold mt-1.5">
                                  ⚠️ Date dépassée — non encore effectué
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Devoirs validés */}
              {devoirsValides.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wider mb-2">
                    ✅ Réalisés ({devoirsValides.length})
                  </p>
                  <div className="space-y-2">
                    {devoirsValides.map((d, i) => (
                      <div key={i} className="rounded-2xl border border-emerald-200 bg-emerald-50/30 px-4 py-3 flex items-center gap-3">
                        <CheckCircle size={15} className="text-emerald-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-tate-terre truncate">{d.chapitreId?.titre}</p>
                          <p className="text-xs text-tate-terre/40">{dateFr(d.updatedAt)}</p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${TYPE_DEVOIR[d.type]?.bg || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                          {TYPE_DEVOIR[d.type]?.label || d.type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Devoirs expirés */}
              {devoirsExpires.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wider mb-2">
                    ⏰ Expirés ({devoirsExpires.length})
                  </p>
                  <div className="space-y-2">
                    {devoirsExpires.map((d, i) => (
                      <div key={i} className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 flex items-center gap-3 opacity-70">
                        <Clock size={14} className="text-gray-400 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-500 truncate">{d.chapitreId?.titre}</p>
                          <p className="text-xs text-gray-400">Prévu le {dateLong(d.dateProgrammee)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}
      </AnimatePresence>

      {/* Message motivant */}
      <div className="bg-tate-doux border border-tate-border rounded-2xl p-4 text-center">
        <p className="text-sm text-tate-terre leading-relaxed">
          {chapValides.length >= 10
            ? `🌟 Félicitez ${enfant.nom?.split(' ')[0]} — performances exceptionnelles !`
            : niveau?.txt === 'Excellent'
            ? `🌟 ${enfant.nom?.split(' ')[0]} est en excellente progression. Continuez ainsi !`
            : enfant.streak >= 5
            ? `🔥 ${enfant.nom?.split(' ')[0]} travaille ${enfant.streak} jours de suite — c'est remarquable !`
            : enDiff.length > 0
            ? `💪 Encouragez ${enfant.nom?.split(' ')[0]} sur : ${enDiff[0]?.titre?.slice(0,30) || 'les chapitres difficiles'}`
            : `💙 Encouragez ${enfant.nom?.split(' ')[0]} à travailler régulièrement sur Taté !`
          }
        </p>
      </div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE ───────────────────────────────────────────
// ─── Section changement de mot de passe ───────────────────────
function SectionMotDePasse() {
  const [ouvert,       setOuvert]       = useState(false);
  const [ancien,       setAncien]       = useState('');
  const [nouveau,      setNouveau]      = useState('');
  const [confirm,      setConfirm]      = useState('');
  const [showAncien,   setShowAncien]   = useState(false);
  const [showNouveau,  setShowNouveau]  = useState(false);
  const [loading,      setLoading]      = useState(false);

  const reset = () => { setAncien(''); setNouveau(''); setConfirm(''); setOuvert(false); };

  const soumettre = async (e) => {
    e.preventDefault();
    if (nouveau !== confirm) { toast.error('Les nouveaux mots de passe ne correspondent pas'); return; }
    if (nouveau.length < 6)  { toast.error('Le mot de passe doit faire au moins 6 caractères'); return; }
    setLoading(true);
    try {
      await api.put('/auth/changer-mot-de-passe', {
        ancienMotDePasse: ancien,
        nouveauMotDePasse: nouveau,
      });
      toast.success('Mot de passe mis à jour avec succès ! 🔐');
      reset();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-6">
      <button
        onClick={() => setOuvert(o => !o)}
        className="w-full flex items-center gap-3 bg-white border-2 border-tate-border rounded-2xl px-4 py-3
                   hover:border-tate-soleil/50 transition-all text-left group">
        <div className="w-9 h-9 rounded-xl bg-tate-doux flex items-center justify-center flex-shrink-0
                        group-hover:bg-tate-soleil/10 transition-colors">
          <KeyRound size={16} className="text-tate-terre/50" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-tate-terre">Changer mon mot de passe</p>
          <p className="text-xs text-tate-terre/40">Modifier votre mot de passe de connexion</p>
        </div>
        <motion.div animate={{ rotate: ouvert ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown size={16} className="text-tate-terre/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {ouvert && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            onSubmit={soumettre}
            className="overflow-hidden">
            <div className="bg-white border-2 border-tate-border border-t-0 rounded-b-2xl px-4 pt-4 pb-5 space-y-3">

              {/* Ancien mot de passe */}
              <div>
                <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Mot de passe actuel</label>
                <div className="relative">
                  <input
                    type={showAncien ? 'text' : 'password'}
                    value={ancien}
                    onChange={e => setAncien(e.target.value)}
                    required
                    placeholder="Votre mot de passe actuel"
                    className="w-full h-11 rounded-xl border-2 border-tate-border px-3 pr-10 text-sm text-tate-terre
                               bg-tate-creme focus:border-tate-soleil focus:outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowAncien(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tate-terre/30 hover:text-tate-terre/60">
                    {showAncien ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Nouveau mot de passe */}
              <div>
                <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Nouveau mot de passe</label>
                <div className="relative">
                  <input
                    type={showNouveau ? 'text' : 'password'}
                    value={nouveau}
                    onChange={e => setNouveau(e.target.value)}
                    required
                    minLength={6}
                    placeholder="Au moins 6 caractères"
                    className="w-full h-11 rounded-xl border-2 border-tate-border px-3 pr-10 text-sm text-tate-terre
                               bg-tate-creme focus:border-tate-soleil focus:outline-none transition-all"
                  />
                  <button type="button" onClick={() => setShowNouveau(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-tate-terre/30 hover:text-tate-terre/60">
                    {showNouveau ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {/* Confirmer */}
              <div>
                <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Confirmer le nouveau mot de passe</label>
                <input
                  type="password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  required
                  placeholder="Répéter le nouveau mot de passe"
                  className={`w-full h-11 rounded-xl border-2 px-3 text-sm text-tate-terre bg-tate-creme
                             focus:outline-none transition-all ${
                    confirm && nouveau && confirm !== nouveau
                      ? 'border-red-400 focus:border-red-400'
                      : 'border-tate-border focus:border-tate-soleil'
                  }`}
                />
                {confirm && nouveau && confirm !== nouveau && (
                  <p className="text-xs text-red-500 mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              {/* Boutons */}
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={reset}
                  className="flex-1 h-11 rounded-2xl border-2 border-tate-border text-sm font-semibold
                             text-tate-terre/60 hover:bg-tate-doux transition-all">
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={loading || !ancien || !nouveau || !confirm || nouveau !== confirm}
                  className="flex-1 h-11 rounded-2xl text-sm font-bold text-white transition-all disabled:opacity-40"
                  style={{ background:'linear-gradient(135deg,#F97316,#EA580C)', boxShadow:'0 4px 16px rgba(249,115,22,0.3)' }}>
                  {loading ? '⏳ Mise à jour…' : '🔐 Changer'}
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}

export function EspaceParent() {
  const { user }      = useAuthStore();
  const [enfants,     setEnfants]     = useState([]);
  const [actif,       setActif]       = useState(null);
  const [sessions,    setSessions]    = useState([]);
  const [progression, setProgression] = useState([]);
  const [devoirs,     setDevoirs]     = useState([]);
  const [nbChapTotal, setNbChapTotal] = useState(0);
  const [loading,     setLoading]     = useState(true);

  useEffect(() => {
    api.get('/stats/parent')
      .then(({ data }) => {
        const liste = data.data || [];
        setEnfants(liste);
        if (liste.length > 0) {
          setActif(liste[0]);
          chargerEnfant(liste[0]._id, liste[0].niveau);
        }
      })
      .catch(() => setEnfants([]))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const chargerEnfant = async (eleveId, niveau) => {
    try {
      const [sessRes, progRes, devRes, chapRes] = await Promise.allSettled([
        api.get(`/stats/eleve/${eleveId}`),
        api.get(`/resultats/progression/${eleveId}`),
        api.get(`/planning/enfant/${eleveId}`),
        niveau ? api.get(`/chapitres?niveau=${niveau}`) : Promise.resolve({ data:{ data:[] } }),
      ]);

      if (sessRes.status === 'fulfilled') {
        const raw = sessRes.value.data.data || [];
        setSessions(raw.map(s => ({ ...s, scorePct: clamp(s.scorePct) })));
      } else { setSessions([]); }

      if (progRes.status === 'fulfilled') {
        setProgression(progRes.value.data.data || []);
      } else { setProgression([]); }

      if (devRes.status === 'fulfilled') {
        setDevoirs(devRes.value.data.data || []);
      } else { setDevoirs([]); }

      if (chapRes.status === 'fulfilled') {
        setNbChapTotal((chapRes.value.data.data || []).length);
      }
    } catch {
      setSessions([]); setProgression([]); setDevoirs([]);
    }
  };

  const selectionner = (enfant) => {
    setActif(enfant);
    setSessions([]); setProgression([]); setDevoirs([]);
    chargerEnfant(enfant._id, enfant.niveau);
  };

  if (loading) return (
    <LayoutParent>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center
                        font-serif font-bold text-tate-terre text-xl animate-pulse-slow">T</div>
        <p className="text-sm text-tate-terre/50 mt-4">Chargement…</p>
      </div>
    </LayoutParent>
  );

  return (
    <LayoutParent>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-tate-terre">
          Bonjour, {user?.nom?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-tate-terre/50 mt-1">Suivi de vos enfants</p>
      </div>

      {enfants.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp size={40} className="text-neutre mx-auto mb-3" />
          <p className="font-semibold text-tate-terre">Aucun enfant lié à votre compte</p>
          <p className="text-sm text-tate-terre/40 mt-2">
            Contactez l'enseignant pour lier le compte de votre enfant
          </p>
        </div>
      ) : (
        <>
          {/* Sélecteur enfants (si plusieurs) */}
          {enfants.length > 1 && (
            <div className="space-y-3 mb-4">
              {enfants.map(e => (
                <CarteEnfant key={e._id} enfant={e}
                  actif={actif?._id === e._id}
                  nbChapTotal={nbChapTotal}
                  onClick={() => selectionner(e)} />
              ))}
            </div>
          )}
          {enfants.length === 1 && (
            <CarteEnfant enfant={enfants[0]} actif nbChapTotal={nbChapTotal} onClick={() => {}} />
          )}
          {actif && (
            <DetailEnfant
              enfant={actif}
              sessions={sessions}
              progression={progression}
              devoirs={devoirs}
              nbChapTotal={nbChapTotal}
            />
          )}
        </>
      )}

      {/* ── Changer mon mot de passe (toujours visible en bas) ── */}
      <SectionMotDePasse />
    </LayoutParent>
  );
}
