// ============================================================
// src/pages/admin/StatsAdmin.jsx — Tableau de bord analytique
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, GraduationCap, BookOpen, TrendingUp,
  CheckCircle, Calendar, Award, Globe2,
  RefreshCw, ChevronUp, ChevronDown, Minus, BarChart2,
} from 'lucide-react';
import { LayoutAdmin } from './LayoutAdmin';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helpers ──────────────────────────────────────────────────
function fmt(n) {
  if (n === null || n === undefined) return '—';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return n;
}

function dateFr(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-SN', {
    day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit',
  });
}

function jourFr(yyyymmdd) {
  if (!yyyymmdd) return '';
  const [, m, d] = yyyymmdd.split('-');
  const jours = ['', 'Jan','Fév','Mar','Avr','Mai','Juin','Juil','Aoû','Sep','Oct','Nov','Déc'];
  return `${parseInt(d)} ${jours[parseInt(m)]}`;
}

const NIVEAU_ORDER = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];

const COULEURS_NIVEAU = {
  CM1:'bg-tate-soleil', CM2:'bg-amber-400',
  '6eme':'bg-savoir',   '5eme':'bg-blue-400',
  '4eme':'bg-purple-400','3eme':'bg-pink-400',
  Seconde:'bg-emerald-500', Premiere:'bg-teal-500', Terminale:'bg-cyan-600',
};

// ── Carte stat ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, sub, trend }) {
  return (
    <motion.div whileHover={{ y:-3, boxShadow:'0 8px 24px rgba(61,28,0,.10)' }}
      className="card flex items-start gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-2xl font-bold text-tate-terre leading-none">{value}</p>
        <p className="text-sm text-tate-terre/60 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-tate-terre/40 mt-0.5">{sub}</p>}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${
          trend > 0 ? 'bg-green-50 text-succes' :
          trend < 0 ? 'bg-red-50 text-alerte'  : 'bg-gray-50 text-gray-500'
        }`}>
          {trend > 0 ? <ChevronUp size={12} /> : trend < 0 ? <ChevronDown size={12} /> : <Minus size={12} />}
          {Math.abs(trend)}%
        </div>
      )}
    </motion.div>
  );
}

// ── Barre de progression simple ───────────────────────────────
function BarreProgression({ label, value, max, couleur, pct, right }) {
  const p = pct !== undefined ? pct : (max > 0 ? Math.round((value / max) * 100) : 0);
  return (
    <div className="mb-3">
      <div className="flex justify-between text-sm mb-1.5">
        <span className="font-medium text-tate-terre truncate max-w-[55%]">{label}</span>
        <span className="text-tate-terre/60 text-xs">{right ?? `${value} session${value !== 1 ? 's' : ''}`}</span>
      </div>
      <div className="h-2.5 bg-tate-doux rounded-full overflow-hidden">
        <motion.div
          initial={{ width:0 }} animate={{ width:`${p}%` }}
          transition={{ duration:0.8, ease:'easeOut' }}
          className={`h-full rounded-full ${couleur || 'bg-tate-soleil'}`}
        />
      </div>
    </div>
  );
}

// ── Mini graphique 7 jours (barres CSS) ──────────────────────
function GraphiqueSemaine({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-tate-terre/40 text-center py-8">Aucune donnée cette semaine</p>;
  }
  const maxVal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="flex items-end gap-2 h-28 mt-2">
      {data.map((d, i) => {
        const hPct = Math.round((d.total / maxVal) * 100);
        const rPct = d.total > 0 ? Math.round((d.reussies / d.total) * 100) : 0;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex flex-col items-center z-10">
              <div className="bg-tate-terre text-white text-xs rounded-xl px-3 py-1.5 whitespace-nowrap shadow-lg">
                <p className="font-semibold">{jourFr(d._id)}</p>
                <p>{d.total} session{d.total !== 1 ? 's' : ''} · {rPct}% réussite</p>
              </div>
              <div className="w-2 h-2 bg-tate-terre rotate-45 -mt-1" />
            </div>
            {/* Barre réussite (en vert par-dessus) */}
            <div className="w-full flex-1 relative rounded-t-lg overflow-hidden bg-tate-doux">
              <motion.div
                initial={{ height:0 }}
                animate={{ height:`${hPct}%` }}
                transition={{ duration:0.6, delay: i * 0.05, ease:'easeOut' }}
                className="absolute bottom-0 w-full bg-tate-soleil/80"
              />
              <motion.div
                initial={{ height:0 }}
                animate={{ height:`${Math.round((d.reussies / Math.max(d.total,1)) * hPct)}%` }}
                transition={{ duration:0.6, delay: i * 0.05 + 0.2, ease:'easeOut' }}
                className="absolute bottom-0 w-full bg-succes/70"
              />
            </div>
            <span className="text-[10px] text-tate-terre/50 mt-0.5">{jourFr(d._id)}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut SVG chart ───────────────────────────────────────────
function DonutChart({ segments, size = 120, strokeWidth = 18, children }) {
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const cx = size / 2, cy = size / 2;

  // Build arcs from segments [{value, color}]
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumul = 0;

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="#F3F4F6" strokeWidth={strokeWidth} />
        {segments.map((seg, i) => {
          const pct    = seg.value / total;
          const dash   = pct * circ;
          const gap    = circ - dash;
          const offset = -(cumul / total) * circ;
          cumul += seg.value;
          return (
            <circle key={i} cx={cx} cy={cy} r={r} fill="none"
              stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dasharray 0.8s ease' }}
            />
          );
        })}
      </svg>
      {/* Centre */}
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

// ── Graphique par matière ─────────────────────────────────────
const COULEURS_MATIERE = {
  FR: '#F97316', MA: '#3B82F6', AN: '#10B981',
  HI: '#8B5CF6', GE: '#14B8A6', SC: '#EC4899',
  PC: '#F59E0B', SVT:'#22C55E', PH: '#6366F1',
};

function GraphiqueMatiere({ data }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-tate-terre/40 text-center py-8">Aucune session enregistrée</p>;
  }
  const maxVal = Math.max(...data.map(d => d.total), 1);

  return (
    <div className="space-y-3 mt-2">
      {data.map((mat, i) => {
        const pct      = Math.round((mat.total / maxVal) * 100);
        const reussite = mat.total > 0 ? Math.round((mat.maitrises / mat.total) * 100) : 0;
        const couleur  = COULEURS_MATIERE[mat.code] || '#9CA3AF';
        return (
          <div key={i}>
            <div className="flex justify-between text-xs mb-1">
              <span className="font-semibold text-tate-terre flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: couleur }} />
                {mat._id || '—'}
              </span>
              <span className="text-tate-terre/50">
                {mat.total} sessions &nbsp;·&nbsp;
                <span className={reussite >= 70 ? 'text-succes font-semibold' : reussite >= 50 ? 'text-amber-600' : 'text-alerte'}>
                  {reussite}% réussite
                </span>
              </span>
            </div>
            {/* Barre double : total + maîtrisées */}
            <div className="relative h-5 bg-tate-doux rounded-lg overflow-hidden">
              {/* Barre totale */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-lg opacity-30"
                style={{ background: couleur }}
              />
              {/* Barre maîtrisées */}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((mat.maitrises / maxVal) * 100)}%` }}
                transition={{ duration: 0.7, delay: i * 0.07 + 0.2, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-lg"
                style={{ background: couleur }}
              />
              {/* Valeur */}
              <div className="absolute inset-0 flex items-center px-2.5">
                <span className="text-[10px] font-bold text-white drop-shadow-sm">
                  {mat.maitrises} maîtrisées
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Badge niveau ──────────────────────────────────────────────
function BadgeNiveau({ niveau }) {
  const colors = {
    CM1:'bg-amber-100 text-amber-700', CM2:'bg-amber-100 text-amber-700',
    '6eme':'bg-blue-100 text-blue-700', '5eme':'bg-blue-100 text-blue-700',
    '4eme':'bg-purple-100 text-purple-700', '3eme':'bg-pink-100 text-pink-700',
    Seconde:'bg-emerald-100 text-emerald-700',
    Premiere:'bg-teal-100 text-teal-700',
    Terminale:'bg-cyan-100 text-cyan-700',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${colors[niveau] || 'bg-gray-100 text-gray-600'}`}>
      {niveau || '—'}
    </span>
  );
}

// ── Composant principal ───────────────────────────────────────
export function StatsAdmin() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [err,     setErr]     = useState(null);

  const charger = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const token = localStorage.getItem('accessToken');
      const r = await axios.get(`${API}/stats/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(r.data.data);
    } catch (e) {
      const msg = e.response?.data?.error || e.message;
      setErr(msg);
      toast.error('Impossible de charger les statistiques');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Calculs dérivés ──
  const maxEleves = data
    ? Math.max(...(data.elevesParNiveau || []).map(n => n.count), 1)
    : 1;

  const niveauxTriés = data
    ? [...(data.elevesParNiveau || [])].sort((a, b) => {
        const ia = NIVEAU_ORDER.indexOf(a._id);
        const ib = NIVEAU_ORDER.indexOf(b._id);
        return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
      })
    : [];

  // Couleurs hex pour le donut (correspondant aux classes TW)
  const COULEURS_HEX = {
    CM1:'#F97316', CM2:'#FBBF24',
    '6eme':'#3B82F6', '5eme':'#60A5FA',
    '4eme':'#A855F7', '3eme':'#EC4899',
    Seconde:'#10B981', Premiere:'#14B8A6', Terminale:'#06B6D4',
  };

  // Segments donut niveau
  const segmentsNiveau = niveauxTriés.map(n => ({
    value: n.count,
    color: COULEURS_HEX[n._id] || '#9CA3AF',
    label: n._id,
  }));

  // Segments donut réussite
  const segmentsReussite = data ? [
    { value: data.sessionsReussies,                              color: '#10B981' },
    { value: Math.max(0, data.totalSessions - data.sessionsReussies), color: '#FEE2E2' },
  ] : [];

  // ── Action refresh ──
  const BtnRefresh = (
    <button onClick={charger}
      className="flex items-center gap-2 text-sm font-medium text-tate-terre/60 hover:text-tate-terre
                 bg-white border border-tate-border rounded-xl px-3 py-1.5 hover:bg-tate-doux transition-all">
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      Actualiser
    </button>
  );

  return (
    <LayoutAdmin titre="Statistiques" action={BtnRefresh}>
      <AnimatePresence mode="wait">
        {loading && !data ? (
          <motion.div key="loader" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-tate-soleil border-t-transparent animate-spin" />
            <p className="text-tate-terre/50 text-sm">Chargement des statistiques…</p>
          </motion.div>
        ) : err ? (
          <motion.div key="err" initial={{ opacity:0 }} animate={{ opacity:1 }}
            className="card text-center py-16">
            <p className="text-4xl mb-3">⚠️</p>
            <p className="font-serif text-tate-terre font-bold mb-1">Erreur de chargement</p>
            <p className="text-tate-terre/50 text-sm mb-4">{err}</p>
            <button onClick={charger} className="btn-tate px-6 py-2 text-sm">Réessayer</button>
          </motion.div>
        ) : data && (
          <motion.div key="content" initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }}>

            {/* ── Cartes résumé ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                label="Élèves actifs"     value={fmt(data.totalEleves)}
                icon={Users}              color="bg-tate-soleil"
                sub={`+${data.nouveauxEleves} ce mois`} />
              <StatCard
                label="Professeurs"       value={fmt(data.totalProfs)}
                icon={GraduationCap}      color="bg-savoir" />
              <StatCard
                label="Sessions totales"  value={fmt(data.totalSessions)}
                icon={BookOpen}           color="bg-succes"
                sub={`${data.sessionsAujourd} aujourd'hui`} />
              <StatCard
                label="Taux de réussite"  value={`${data.tauxReussite}%`}
                icon={TrendingUp}         color="bg-alerte"
                sub={`${fmt(data.sessionsReussies)} chapitres maîtrisés`} />
            </div>

            {/* ── Ligne 2 : graphique semaine + répartition niveaux ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">

              {/* Activité 7 jours */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-1 flex items-center gap-2">
                  <Calendar size={17} className="text-tate-soleil" />
                  Activité — 7 derniers jours
                </h2>
                <p className="text-xs text-tate-terre/40 mb-4">
                  <span className="inline-block w-3 h-2 rounded bg-tate-soleil/80 mr-1 align-middle" />sessions totales &nbsp;
                  <span className="inline-block w-3 h-2 rounded bg-succes/70 mr-1 align-middle" />maîtrisées
                </p>
                <GraphiqueSemaine data={data.sessionsParJour} />
              </div>

              {/* Répartition niveaux — donut + barres */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <GraduationCap size={17} className="text-tate-soleil" />
                  Élèves par niveau
                </h2>
                {niveauxTriés.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-8">Aucun élève inscrit</p>
                ) : (
                  <>
                    {/* Donut + légende */}
                    <div className="flex items-center gap-4 mb-4">
                      <DonutChart segments={segmentsNiveau} size={96} strokeWidth={15}>
                        <div className="text-center">
                          <p className="text-lg font-bold text-tate-terre leading-none">{data.totalEleves}</p>
                          <p className="text-[9px] text-tate-terre/40">élèves</p>
                        </div>
                      </DonutChart>
                      <div className="flex-1 flex flex-wrap gap-x-3 gap-y-1">
                        {segmentsNiveau.map(s => (
                          <div key={s.label} className="flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.color }} />
                            <span className="text-xs text-tate-terre/60">{s.label} <strong>{s.value}</strong></span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Barres */}
                    {niveauxTriés.map(n => (
                      <BarreProgression
                        key={n._id}
                        label={n._id || 'Sans niveau'}
                        value={n.count}
                        max={maxEleves}
                        couleur={COULEURS_NIVEAU[n._id] || 'bg-tate-soleil'}
                        right={`${n.count} élève${n.count > 1 ? 's' : ''}`}
                      />
                    ))}
                  </>
                )}
              </div>

            </div>

            {/* ── Ligne 2b : donut réussite (si sessions > 0) ── */}
            {data.totalSessions > 0 && (
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div className="card flex items-center gap-5">
                  <DonutChart segments={segmentsReussite} size={110} strokeWidth={18}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-tate-terre leading-none">{data.tauxReussite}%</p>
                      <p className="text-[10px] text-tate-terre/40">réussite</p>
                    </div>
                  </DonutChart>
                  <div>
                    <h2 className="font-serif font-bold text-tate-terre mb-3">Taux de réussite</h2>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-succes flex-shrink-0" />
                        <span className="text-sm text-tate-terre/70">{data.sessionsReussies} maîtrisé{data.sessionsReussies > 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-200 flex-shrink-0" />
                        <span className="text-sm text-tate-terre/70">{data.totalSessions - data.sessionsReussies} non maîtrisés</span>
                      </div>
                      <p className="text-xs text-tate-terre/40 mt-1">{data.totalSessions} session{data.totalSessions > 1 ? 's' : ''} au total</p>
                    </div>
                  </div>
                </div>
                <div className="card flex items-center gap-5">
                  <DonutChart
                    segments={[
                      { value: data.sessionsAujourd, color: '#F97316' },
                      { value: Math.max(0, data.totalSessions - data.sessionsAujourd), color: '#F3F4F6' },
                    ]}
                    size={110} strokeWidth={18}>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-tate-terre leading-none">{data.sessionsAujourd}</p>
                      <p className="text-[10px] text-tate-terre/40">aujourd'hui</p>
                    </div>
                  </DonutChart>
                  <div>
                    <h2 className="font-serif font-bold text-tate-terre mb-3">Sessions du jour</h2>
                    <p className="text-sm text-tate-terre/60">{data.sessionsAujourd} exercice{data.sessionsAujourd > 1 ? 's' : ''} fait{data.sessionsAujourd > 1 ? 's' : ''}</p>
                    <p className="text-xs text-tate-terre/40 mt-1">sur {data.totalSessions} au total</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Ligne 3 : top chapitres + top élèves ── */}
            <div className="grid lg:grid-cols-2 gap-6 mb-6">

              {/* Top chapitres */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <BookOpen size={17} className="text-tate-soleil" />
                  Chapitres les plus travaillés
                </h2>
                {data.topChapitres.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-8">Aucune session enregistrée</p>
                ) : (
                  <div className="space-y-3">
                    {data.topChapitres.map((c, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-tate-doux text-xs font-bold text-tate-terre flex items-center justify-center flex-shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-tate-terre truncate">{c.titre}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {c.niveau && <BadgeNiveau niveau={c.niveau} />}
                            <span className="text-xs text-tate-terre/40">
                              {c.total} session{c.total !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className={`text-sm font-bold px-2.5 py-1 rounded-xl ${
                          c.tauxPct >= 80 ? 'bg-green-50 text-succes' :
                          c.tauxPct >= 60 ? 'bg-amber-50 text-amber-600' :
                          'bg-red-50 text-alerte'
                        }`}>
                          {c.tauxPct}%
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Top élèves */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <Award size={17} className="text-tate-soleil" />
                  Meilleurs élèves
                </h2>
                {data.topEleves.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-8">Aucun élève actif</p>
                ) : (
                  <div className="space-y-3">
                    {data.topEleves.map((e, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                          i === 0 ? 'bg-tate-soleil' : i === 1 ? 'bg-gray-300' : i === 2 ? 'bg-amber-600' : 'bg-tate-doux text-tate-terre'
                        }`}>
                          {i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-tate-terre truncate">{e.nom}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            {e.niveau && <BadgeNiveau niveau={e.niveau} />}
                            <span className="text-xs text-tate-terre/40">
                              {e.maitrises} chapitre{e.maitrises !== 1 ? 's' : ''} maîtrisé{e.maitrises !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-tate-terre">{e.sessions}</p>
                          <p className="text-xs text-tate-terre/40">sessions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* ── Ligne 3b : sessions par matière ── */}
            {data.sessionsParMatiere && data.sessionsParMatiere.length > 0 && (
              <div className="card mb-6">
                <h2 className="font-serif font-bold text-tate-terre mb-1 flex items-center gap-2">
                  <BarChart2 size={17} className="text-tate-soleil" />
                  Sessions par matière
                </h2>
                <p className="text-xs text-tate-terre/40 mb-4">
                  <span className="inline-block w-3 h-2 rounded opacity-30 bg-tate-soleil mr-1 align-middle" />sessions totales &nbsp;
                  <span className="inline-block w-3 h-2 rounded bg-tate-soleil mr-1 align-middle" />maîtrisées
                </p>
                <GraphiqueMatiere data={data.sessionsParMatiere} />
              </div>
            )}

            {/* ── Ligne 4 : activité langues + sessions récentes ── */}
            <div className="grid lg:grid-cols-2 gap-6">

              {/* Langues */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <Globe2 size={17} className="text-tate-soleil" />
                  Cours de langues — 30 jours
                </h2>
                {data.activiteLangues.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-8">Aucune activité langue ce mois</p>
                ) : (
                  (() => {
                    const maxL = Math.max(...data.activiteLangues.map(l => l.total), 1);
                    return data.activiteLangues.map((l, i) => (
                      <BarreProgression
                        key={i}
                        label={l._id}
                        value={l.total}
                        max={maxL}
                        couleur="bg-savoir"
                        right={`${l.total} session${l.total !== 1 ? 's' : ''}`}
                      />
                    ));
                  })()
                )}
              </div>

              {/* Sessions récentes */}
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <CheckCircle size={17} className="text-tate-soleil" />
                  Sessions récentes
                </h2>
                {data.sessionsRecentes.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-8">Aucune session terminée</p>
                ) : (
                  <div className="space-y-0 divide-y divide-tate-border/40">
                    {data.sessionsRecentes.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 py-2.5">
                        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.maitrise ? 'bg-succes' : 'bg-alerte'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-tate-terre truncate">{s.eleveNom}</p>
                          <p className="text-xs text-tate-terre/50 truncate">{s.chapitreNom}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className={`text-sm font-bold ${s.maitrise ? 'text-succes' : 'text-alerte'}`}>
                            {s.scorePct}%
                          </p>
                          <p className="text-[10px] text-tate-terre/40">{dateFr(s.completedAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </LayoutAdmin>
  );
}
