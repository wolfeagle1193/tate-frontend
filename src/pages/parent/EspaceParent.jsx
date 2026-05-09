import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp, AlertTriangle, CheckCircle,
  Flame, LogOut, ChevronDown,
  Calendar, Clock,
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
function DetailEnfant({ enfant, sessions, progression, devoirs }) {
  const [onglet, setOnglet] = useState('bilan');

  // ── Nom de matière depuis un chapitre ──
  const getMat = (chap) => {
    const mid = chap.chapitreId?.matiereId;
    if (!mid) return { nom: 'Autre matière', code: '?' };
    if (typeof mid === 'object') return { nom: mid.nom || 'Autre matière', code: mid.code || '?' };
    return { nom: 'Autre matière', code: '?' };
  };

  // ── Toutes les dates de travail (calendrier) ──
  const allDates = progression
    .flatMap(c => c.tentatives.map(t => t.completedAt))
    .filter(Boolean)
    .map(d => new Date(d).toISOString().slice(0, 10));
  const activeDays = new Set(allDates);

  // ── Calendrier 28 derniers jours ──
  const last28 = Array.from({ length: 28 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (27 - i));
    return d.toISOString().slice(0, 10);
  });
  const actifCetteSemaine = last28.slice(-7).filter(d => activeDays.has(d)).length;
  const actifCeMois       = last28.filter(d => activeDays.has(d)).length;

  // ── Statistiques par matière ──
  const matiereMap = {};
  for (const chap of progression) {
    const { nom, code } = getMat(chap);
    if (!matiereMap[nom]) {
      matiereMap[nom] = { nom, code, chapitres: [], maitrises: 0, scores: [] };
    }
    matiereMap[nom].chapitres.push(chap);
    matiereMap[nom].scores.push(clamp(chap.meilleurScore));
    if (chap.maitrise) matiereMap[nom].maitrises++;
  }
  const matieres = Object.values(matiereMap)
    .map(m => ({
      ...m,
      scoreMoyen: m.scores.length > 0
        ? clamp(m.scores.reduce((a, b) => a + b, 0) / m.scores.length)
        : 0,
    }))
    .sort((a, b) => b.scoreMoyen - a.scoreMoyen);

  // ── Chapitres en difficulté (≥ 3 tentatives sans maîtrise) ──
  const chapDiff = progression
    .filter(c => !c.maitrise && c.tentatives.length >= 3)
    .sort((a, b) => b.tentatives.length - a.tentatives.length);

  // ── Chapitres maîtrisés (triés du plus récent) ──
  const chapMaitrises = progression
    .filter(c => c.maitrise)
    .sort((a, b) => new Date(b.derniereAt || 0) - new Date(a.derniereAt || 0));

  // ── Score moyen global (basé sur meilleur score par chapitre) ──
  const scoresValides = progression.map(c => clamp(c.meilleurScore)).filter(s => s > 0);
  const scoreMoyen = scoresValides.length > 0
    ? clamp(scoresValides.reduce((a, b) => a + b, 0) / scoresValides.length)
    : null;
  const niv = scoreMoyen != null ? niveauLabel(scoreMoyen) : null;

  // ── Tendance (3 dernières sessions vs 3 précédentes) ──
  const allScoresChron = progression
    .flatMap(c => c.tentatives.map(t => ({ score: clamp(t.score || 0), date: t.completedAt })))
    .filter(t => t.date)
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map(t => t.score);
  const tendance = (() => {
    if (allScoresChron.length < 4) return null;
    const recent    = allScoresChron.slice(0, 3).reduce((a, b) => a + b, 0) / 3;
    const precedent = allScoresChron.slice(3, 6).reduce((a, b) => a + b, 0) / Math.min(3, allScoresChron.slice(3, 6).length);
    const diff = recent - precedent;
    if (diff > 5)  return { label: 'En hausse', color: 'text-emerald-600', emoji: '↑' };
    if (diff < -5) return { label: 'En baisse',  color: 'text-red-500',    emoji: '↓' };
    return           { label: 'Stable',       color: 'text-amber-500',   emoji: '→' };
  })();

  const devoirsActifs  = devoirs.filter(d => d.statut === 'en_attente' || d.statut === 'en_cours');
  const devoirsValides = devoirs.filter(d => d.statut === 'valide');
  const devoirsExpires = devoirs.filter(d => d.statut === 'expire');

  const prenom = enfant.nom?.split(' ')[0] || enfant.nom;

  const ONGLETS = [
    { id: 'bilan',    label: '📊 Bilan' },
    { id: 'matieres', label: '📚 Matières' },
    { id: 'devoirs',  label: '📅 Devoirs', badge: devoirsActifs.length || 0 },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 mt-4">

      {/* ── Bannière niveau global ── */}
      {niv && (
        <div className={`border-2 rounded-2xl p-4 ${niv.bg}`}>
          <div className="flex items-center gap-4">
            <span className="text-4xl">{niv.emoji}</span>
            <div className="flex-1">
              <p className="font-bold text-tate-terre">
                Niveau global : <span className={`${niv.color} text-base`}>{niv.txt}</span>
                {tendance && (
                  <span className={`ml-3 text-sm font-semibold ${tendance.color}`}>
                    {tendance.emoji} {tendance.label}
                  </span>
                )}
              </p>
              <p className="text-sm text-tate-terre/60 mt-0.5">
                Meilleur score moyen tous chapitres : <strong className={couleurScore(scoreMoyen)}>{scoreMoyen}%</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Métriques clés 4 cases ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          {
            val: chapMaitrises.length,
            label: 'Chapitres maîtrisés',
            color: 'text-emerald-600',
          },
          {
            val: progression.length,
            label: 'Chapitres tentés',
            color: 'text-tate-terre',
          },
          {
            val: `${actifCetteSemaine}/7`,
            label: 'Jours actifs (semaine)',
            color: actifCetteSemaine >= 4 ? 'text-emerald-600' : actifCetteSemaine >= 2 ? 'text-amber-500' : 'text-red-500',
          },
          {
            val: chapDiff.length,
            label: 'Chapitres en difficulté',
            color: chapDiff.length === 0 ? 'text-emerald-600' : chapDiff.length <= 2 ? 'text-amber-500' : 'text-red-500',
          },
        ].map(({ val, label, color }, i) => (
          <div key={i} className="card text-center py-3">
            <p className={`text-2xl font-bold ${color}`}>{val}</p>
            <p className="text-xs text-tate-terre/50 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* ── Onglets ── */}
      <div className="flex rounded-2xl bg-tate-doux p-1 gap-1">
        {ONGLETS.map(tab => (
          <button key={tab.id} onClick={() => setOnglet(tab.id)}
            className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              onglet === tab.id ? 'bg-white shadow text-tate-terre' : 'text-tate-terre/50 hover:text-tate-terre/70'
            }`}>
            {tab.label}
            {tab.badge > 0 && (
              <span className="w-4 h-4 rounded-full bg-alerte text-white text-[9px] font-bold flex items-center justify-center">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">

        {/* ══════════════ ONGLET BILAN ══════════════ */}
        {onglet === 'bilan' && (
          <motion.div key="bilan" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {/* Régularité — calendrier 28 jours */}
            <div className="card">
              <h3 className="font-serif font-bold text-tate-terre mb-3 flex items-center gap-2">
                <Calendar size={15} className="text-tate-soleil" />
                Régularité de travail — 28 derniers jours
              </h3>
              <div className="grid grid-cols-7 gap-1 mb-3">
                {['L','M','M','J','V','S','D'].map((j, i) => (
                  <p key={i} className="text-center text-[9px] text-tate-terre/30 font-semibold">{j}</p>
                ))}
                {/* Remplir les cases vides avant le premier jour si nécessaire */}
                {(() => {
                  const firstDay = new Date(last28[0] + 'T00:00:00');
                  const dow = (firstDay.getDay() + 6) % 7; // lundi=0
                  return Array.from({ length: dow }, (_, i) => (
                    <div key={`empty-${i}`} />
                  ));
                })()}
                {last28.map((day, i) => {
                  const isActive = activeDays.has(day);
                  const isToday  = day === new Date().toISOString().slice(0, 10);
                  const dayNum   = new Date(day + 'T00:00:00').getDate();
                  return (
                    <div key={i} title={day}
                      className={`aspect-square rounded-lg flex items-center justify-center text-[10px] font-bold transition-all ${
                        isActive
                          ? 'bg-tate-soleil text-white shadow-sm'
                          : isToday
                          ? 'bg-tate-border border-2 border-tate-soleil/40 text-tate-terre/40'
                          : 'bg-tate-doux text-tate-terre/20'
                      }`}>
                      {dayNum}
                    </div>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-tate-terre/50">
                  Cette semaine :
                  <span className={`ml-1 font-bold ${actifCetteSemaine >= 4 ? 'text-emerald-600' : actifCetteSemaine >= 2 ? 'text-amber-500' : 'text-red-500'}`}>
                    {actifCetteSemaine} jour{actifCetteSemaine > 1 ? 's' : ''}
                  </span>
                </span>
                <span className="text-tate-terre/50">
                  Ce mois :
                  <span className="ml-1 font-bold text-tate-terre">{actifCeMois} jour{actifCeMois > 1 ? 's' : ''}</span>
                </span>
              </div>
              {actifCetteSemaine === 0 && (
                <p className="text-xs text-red-600 font-medium mt-2 bg-red-50 border border-red-100 rounded-xl px-3 py-2">
                  ⚠️ {prenom} n'a pas travaillé sur Taté cette semaine. Un rappel serait utile !
                </p>
              )}
              {actifCetteSemaine >= 5 && (
                <p className="text-xs text-emerald-700 font-medium mt-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2">
                  🌟 Excellente régularité ! {prenom} a travaillé {actifCetteSemaine} jours cette semaine.
                </p>
              )}
            </div>

            {/* Chapitres en difficulté (≥ 3 tentatives sans maîtrise) */}
            {chapDiff.length > 0 && (
              <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={15} className="text-alerte flex-shrink-0" />
                  <p className="text-sm font-bold text-red-700">
                    Chapitres qui posent problème ({chapDiff.length})
                  </p>
                </div>
                <p className="text-xs text-red-600/80 mb-3">
                  3 tentatives ou plus sans maîtrise — {prenom} a besoin d'un accompagnement sur ces points.
                </p>
                <div className="space-y-2">
                  {chapDiff.map((c, i) => {
                    const mat  = getMat(c);
                    const best = clamp(c.meilleurScore);
                    return (
                      <div key={i} className="bg-white rounded-xl p-3 border border-red-100">
                        <div className="flex items-start gap-2 mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-tate-terre">{c.titre}</p>
                            <p className="text-xs mt-0.5">
                              <span className="font-bold text-red-600">{mat.nom}</span>
                              <span className="text-tate-terre/40 ml-2">
                                {c.tentatives.length} essais · meilleur score : {best}%
                              </span>
                            </p>
                          </div>
                          <span className="text-xs font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                            {c.tentatives.length} tentatives
                          </span>
                        </div>
                        <MiniBar pct={best} color="bg-red-400" />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Chapitres maîtrisés avec matière */}
            {chapMaitrises.length > 0 && (
              <div className="card">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle size={15} className="text-emerald-500" />
                  <p className="text-sm font-bold text-emerald-700">
                    Chapitres maîtrisés ({chapMaitrises.length})
                  </p>
                </div>
                <div className="space-y-2">
                  {chapMaitrises.slice(0, 8).map((c, i) => {
                    const mat     = getMat(c);
                    const best    = clamp(c.meilleurScore);
                    const nbTent  = c.tentatives.length;
                    const medal   = nbTent === 1 ? '🥇' : nbTent === 2 ? '🏆' : '⭐';
                    return (
                      <div key={i} className="flex items-center gap-3 py-2 border-b border-tate-border/30 last:border-0">
                        <span className="text-xl flex-shrink-0">{medal}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-tate-terre truncate">{c.titre}</p>
                          <p className="text-xs text-tate-terre/40">
                            <span className="text-emerald-600 font-medium">{mat.nom}</span>
                            <span className="mx-1">·</span>
                            {nbTent === 1 ? 'Réussi du premier coup !' : `En ${nbTent} tentative${nbTent > 1 ? 's' : ''}`}
                          </p>
                        </div>
                        <span className={`text-sm font-bold flex-shrink-0 ${couleurScore(best)}`}>{best}%</span>
                      </div>
                    );
                  })}
                  {chapMaitrises.length > 8 && (
                    <p className="text-xs text-tate-terre/40 text-center pt-1">
                      + {chapMaitrises.length - 8} autres chapitres maîtrisés
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Message de synthèse */}
            <div className="bg-tate-doux border border-tate-border rounded-2xl p-4 text-center">
              <p className="text-sm text-tate-terre leading-relaxed">
                {chapDiff.length === 0 && chapMaitrises.length > 0
                  ? `🌟 ${prenom} maîtrise tous les chapitres travaillés — continuez à l'encourager !`
                  : chapDiff.length > 2
                  ? `💪 ${prenom} rencontre des difficultés sur ${chapDiff.length} chapitres. N'hésitez pas à contacter le professeur.`
                  : actifCetteSemaine >= 5
                  ? `🔥 ${prenom} a été très actif(ve) cette semaine — félicitez-le/la !`
                  : actifCetteSemaine === 0
                  ? `⏰ ${prenom} n'a pas travaillé cette semaine. Un petit encouragement peut faire la différence !`
                  : `💙 Encouragez ${prenom} à travailler régulièrement sur Taté pour progresser !`
                }
              </p>
            </div>

          </motion.div>
        )}

        {/* ══════════════ ONGLET PAR MATIÈRE ══════════════ */}
        {onglet === 'matieres' && (
          <motion.div key="matieres" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">

            {matieres.length === 0 ? (
              <div className="card text-center py-10">
                <p className="text-3xl mb-2">📚</p>
                <p className="text-sm text-tate-terre/50">Aucun exercice effectué pour le moment</p>
              </div>
            ) : (
              <>
                {/* Bandeaux résumé */}
                {matieres[0]?.scoreMoyen >= 70 && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">🏆</span>
                    <p className="text-sm text-emerald-700">
                      Meilleure matière : <strong>{matieres[0].nom}</strong>
                      <span className="text-emerald-600 ml-1">({matieres[0].scoreMoyen}% de moyenne · {matieres[0].maitrises}/{matieres[0].chapitres.length} maîtrisés)</span>
                    </p>
                  </div>
                )}
                {matieres.length > 1 && matieres[matieres.length - 1].scoreMoyen < 65 && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
                    <span className="text-2xl">💪</span>
                    <p className="text-sm text-red-700">
                      À renforcer : <strong>{matieres[matieres.length - 1].nom}</strong>
                      <span className="text-red-600 ml-1">({matieres[matieres.length - 1].scoreMoyen}% de moyenne)</span>
                    </p>
                  </div>
                )}

                {/* Carte par matière */}
                {matieres.map((mat, idx) => {
                  const statut = mat.scoreMoyen >= 80
                    ? { txt: 'Forte', cls: 'bg-emerald-100 text-emerald-700', border: 'border-emerald-200', bg: 'bg-emerald-50/30' }
                    : mat.scoreMoyen >= 65
                    ? { txt: 'Correcte', cls: 'bg-amber-100 text-amber-700', border: 'border-amber-200', bg: 'bg-amber-50/20' }
                    : { txt: 'À soutenir', cls: 'bg-red-100 text-red-700', border: 'border-red-200', bg: 'bg-red-50/20' };
                  const emoji = mat.scoreMoyen >= 80 ? '🌟' : mat.scoreMoyen >= 65 ? '👍' : '⚠️';

                  return (
                    <div key={idx} className={`rounded-2xl border-2 overflow-hidden ${statut.border} ${statut.bg}`}>
                      {/* En-tête matière */}
                      <div className="flex items-center gap-3 px-4 py-3">
                        <span className="text-2xl flex-shrink-0">{emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-tate-terre text-base">{mat.nom}</p>
                          <p className="text-xs text-tate-terre/50 mt-0.5">
                            {mat.maitrises} maîtrisé{mat.maitrises > 1 ? 's' : ''} sur {mat.chapitres.length} chapitre{mat.chapitres.length > 1 ? 's' : ''} tentés
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-2xl font-bold ${couleurScore(mat.scoreMoyen)}`}>{mat.scoreMoyen}%</p>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statut.cls}`}>{statut.txt}</span>
                        </div>
                      </div>

                      {/* Barre globale matière */}
                      <div className="px-4 pb-3">
                        <MiniBar pct={mat.scoreMoyen}
                          color={mat.scoreMoyen >= 80 ? 'bg-emerald-400' : mat.scoreMoyen >= 65 ? 'bg-amber-400' : 'bg-red-400'} />
                      </div>

                      {/* Liste des chapitres de cette matière */}
                      <div className="border-t border-tate-border/20 bg-white/50 px-4 py-2 space-y-1.5">
                        {mat.chapitres.map((chap, j) => {
                          const best    = clamp(chap.meilleurScore);
                          const nbTent  = chap.tentatives.length;
                          const enDiff  = !chap.maitrise && nbTent >= 3;
                          const iconChap = chap.maitrise
                            ? (nbTent === 1 ? '🥇' : nbTent === 2 ? '🏆' : '⭐')
                            : enDiff ? '⚠️' : '📖';
                          return (
                            <div key={j} className="flex items-center gap-2 text-xs py-1 border-b border-tate-border/10 last:border-0">
                              <span className="flex-shrink-0">{iconChap}</span>
                              <p className={`flex-1 truncate ${enDiff ? 'text-red-600 font-medium' : chap.maitrise ? 'text-emerald-700 font-medium' : 'text-tate-terre/70'}`}>
                                {chap.titre}
                              </p>
                              <span className="text-tate-terre/30 flex-shrink-0 whitespace-nowrap">
                                {nbTent} essai{nbTent > 1 ? 's' : ''}
                              </span>
                              <span className={`font-bold w-9 text-right flex-shrink-0 ${couleurScore(best)}`}>{best}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </motion.div>
        )}

        {/* ══════════════ ONGLET DEVOIRS ══════════════ */}
        {onglet === 'devoirs' && (
          <motion.div key="devoirs" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">

            {devoirs.length === 0 ? (
              <div className="card text-center py-10">
                <Calendar size={32} className="text-tate-terre/20 mx-auto mb-3" />
                <p className="font-semibold text-tate-terre">Aucun devoir programmé</p>
                <p className="text-sm text-tate-terre/40 mt-1">
                  L'enseignant n'a pas encore programmé de devoirs pour {prenom}
                </p>
              </div>
            ) : (
              <>
                {devoirsActifs.length > 0 && (
                  <div>
                    <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wider mb-2">
                      📌 À faire ({devoirsActifs.length})
                    </p>
                    <div className="space-y-3">
                      {devoirsActifs.map((d, i) => {
                        const dateP   = new Date(d.dateProgrammee);
                        const depasse = dateP < new Date();
                        const type    = TYPE_DEVOIR[d.type] || { label: d.type, bg: 'bg-gray-50 text-gray-700 border-gray-200' };
                        const statut  = STATUT_DEVOIR[d.statut] || { dot: 'bg-gray-400' };
                        const matNom  = d.chapitreId?.matiereId?.nom;
                        return (
                          <div key={i} className={`rounded-2xl border-2 p-4 ${depasse ? 'border-red-200 bg-red-50/30' : 'border-tate-border bg-white'}`}>
                            <div className="flex items-start gap-3">
                              <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${statut.dot}`} />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-tate-terre text-sm">{d.chapitreId?.titre || 'Chapitre'}</p>
                                {matNom && <p className="text-xs text-tate-soleil font-medium mt-0.5">{matNom}</p>}
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${type.bg}`}>{type.label}</span>
                                  <span className="text-xs text-tate-terre/40 flex items-center gap-1">
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
                            <p className="text-sm text-tate-terre font-medium truncate">{d.chapitreId?.titre}</p>
                            {d.chapitreId?.matiereId?.nom && (
                              <p className="text-xs text-tate-terre/40">{d.chapitreId.matiereId.nom}</p>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex-shrink-0 ${TYPE_DEVOIR[d.type]?.bg || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                            {TYPE_DEVOIR[d.type]?.label || d.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                            {d.chapitreId?.matiereId?.nom && (
                              <p className="text-xs text-gray-400">{d.chapitreId.matiereId.nom}</p>
                            )}
                          </div>
                          <p className="text-xs text-gray-400 flex-shrink-0">{dateLong(d.dateProgrammee)}</p>
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
    </motion.div>
  );
}

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
