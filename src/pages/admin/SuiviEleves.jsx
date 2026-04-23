// ============================================================
// src/pages/admin/SuiviEleves.jsx
// Tableau de bord de suivi individuel des élèves
// Accessible : admin (/admin/suivi-eleves) + prof (/prof/suivi-eleves)
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, TrendingUp, TrendingDown, BookOpen,
  CheckCircle, AlertTriangle, Star, Flame, Clock,
  ChevronDown, RefreshCw, Users, Award, Target,
  BarChart2, Calendar,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API      = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');
const hdrs     = () => ({ Authorization: `Bearer ${getToken()}` });

// ── Helpers ──────────────────────────────────────────────────
const dateFr = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  const now = new Date();
  const diffJ = Math.floor((now - d) / (1000 * 60 * 60 * 24));
  if (diffJ === 0) return 'Aujourd\'hui';
  if (diffJ === 1) return 'Hier';
  if (diffJ < 7)  return `Il y a ${diffJ} jours`;
  return d.toLocaleDateString('fr-SN', { day:'2-digit', month:'short' });
};

const dateLongFr = (iso) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('fr-SN', { day:'2-digit', month:'long', year:'numeric', hour:'2-digit', minute:'2-digit' });
};

const couleurScore = (s) =>
  s >= 80 ? 'text-succes' : s >= 60 ? 'text-amber-500' : 'text-alerte';

const bgScore = (s) =>
  s >= 80 ? 'bg-green-50 border-green-200' : s >= 60 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200';

const BADGE_NIVEAU = {
  CM1:'bg-amber-100 text-amber-700',       CM2:'bg-amber-100 text-amber-700',
  '6eme':'bg-blue-100 text-blue-700',      '5eme':'bg-blue-100 text-blue-700',
  '4eme':'bg-purple-100 text-purple-700',  '3eme':'bg-pink-100 text-pink-700',
  Seconde:'bg-emerald-100 text-emerald-700',
  Premiere:'bg-teal-100 text-teal-700',
  Terminale:'bg-cyan-100 text-cyan-700',
};

const NIVEAUX = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];

// ── Mini graphe barres (historique scores) ────────────────────
function GrapheScores({ sessions }) {
  if (!sessions || sessions.length === 0) {
    return <p className="text-xs text-tate-terre/40 text-center py-4">Aucun exercice terminé</p>;
  }
  const affichees = [...sessions].reverse().slice(-12);
  const maxH = 48;
  return (
    <div className="flex items-end gap-1.5 h-12">
      {affichees.map((s, i) => {
        const h = Math.max(4, Math.round((s.scorePct / 100) * maxH));
        const color = s.scorePct >= 80 ? 'bg-succes' : s.scorePct >= 60 ? 'bg-amber-400' : 'bg-alerte';
        return (
          <div key={i} className="flex-1 flex flex-col justify-end group relative">
            <div className="absolute bottom-full mb-1 hidden group-hover:block z-10 pointer-events-none">
              <div className="bg-tate-terre text-white text-xs rounded-lg px-2 py-1 whitespace-nowrap shadow-lg -translate-x-1/2 left-1/2 relative">
                {s.scorePct}% · {s.chapitreTitre?.slice(0,20)}
              </div>
            </div>
            <div
              className={`rounded-sm ${color} transition-all`}
              style={{ height: `${h}px` }}
            />
          </div>
        );
      })}
    </div>
  );
}

// ── Barre de progression ─────────────────────────────────────
function Barre({ pct, color = 'bg-succes' }) {
  return (
    <div className="h-2 bg-tate-doux rounded-full overflow-hidden flex-1">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(pct, 100)}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={`h-full rounded-full ${color}`}
      />
    </div>
  );
}

// ── Helpers ──
const couleurFautes = (n) =>
  n === 0 ? 'text-succes' : n <= 2 ? 'text-amber-500' : 'text-alerte';
const bgFautes = (n) =>
  n === 0 ? 'bg-green-100 text-green-800' : n <= 2 ? 'bg-amber-50 text-amber-800' : 'bg-red-50 text-red-800';

// ── Modal détail élève ────────────────────────────────────────
function ModalDetailEleve({ eleve, onClose }) {
  const [onglet,      setOnglet]      = useState('apercu'); // 'apercu' | 'chapitres' | 'planning'
  const [progression, setProgression] = useState([]);
  const [loadProg,    setLoadProg]    = useState(false);
  const [planning,    setPlanning]    = useState([]);
  const [loadPlan,    setLoadPlan]    = useState(false);
  const [newPlan,     setNewPlan]     = useState({ type:'exercice', dateProgrammee:'', noteAdmin:'' });
  const [chapList,    setChapList]    = useState([]);
  const [chapSelected, setChapSelected] = useState('');
  const [planSubmitting, setPlanSubmitting] = useState(false);

  // ── Stats fraîches chargées à l'ouverture du modal ───────────
  const [liveStats, setLiveStats] = useState({
    totalSessions:        eleve.totalSessions        || 0,
    maitrises:            eleve.maitrises            || 0,
    scoreMoyen:           eleve.scoreMoyen           ?? null,
    sessions:             eleve.sessions             || [],
    chapitresEnDifficulte: eleve.chapitresEnDifficulte || [],
    chapitresMaitrises:   eleve.chapitresMaitrises   || [],
    dernierAt:            eleve.dernierAt            || null,
  });
  const [refreshingStats, setRefreshingStats] = useState(true);

  // Charger les données fraîches depuis l'API dès l'ouverture
  useEffect(() => {
    const fetchFreshStats = async () => {
      setRefreshingStats(true);
      try {
        const { data } = await axios.get(
          `${API}/resultats/eleve/${eleve._id}`,
          { headers: hdrs() }
        );
        const resultats = data.data || [];
        const totalSessions = resultats.length;
        const maitrises = resultats.filter(r => r.maitrise).length;
        const scoreMoyen = totalSessions > 0
          ? Math.round(resultats.reduce((acc, r) => acc + r.score, 0) / totalSessions)
          : null;

        const sessions = resultats.slice(0, 30).map(r => ({
          chapitreTitre:  r.chapitreId?.titre  || 'Chapitre',
          chapitreNiveau: r.chapitreId?.niveau || '—',
          scorePct:       r.score,
          maitrise:       r.maitrise,
          completedAt:    r.completedAt,
        }));

        // Calculer chapitres en difficulté et maîtrisés
        const chapStats = {};
        resultats.forEach(r => {
          const cid = (r.chapitreId?._id || r.chapitreId)?.toString();
          if (!cid) return;
          if (!chapStats[cid]) {
            chapStats[cid] = {
              titre:   r.chapitreId?.titre  || 'Chapitre',
              niveau:  r.chapitreId?.niveau || '—',
              scores:  [],
              maitrise: false,
            };
          }
          chapStats[cid].scores.push(r.score);
          if (r.maitrise) chapStats[cid].maitrise = true;
        });

        const chapitresEnDifficulte = Object.values(chapStats)
          .filter(c => !c.maitrise && c.scores.length > 0)
          .map(c => ({ ...c, moyennePct: Math.round(c.scores.reduce((a,b)=>a+b,0)/c.scores.length) }))
          .sort((a, b) => a.moyennePct - b.moyennePct)
          .slice(0, 5);

        const chapitresMaitrises = Object.values(chapStats)
          .filter(c => c.maitrise)
          .map(c => ({ titre: c.titre, niveau: c.niveau }));

        setLiveStats({
          totalSessions,
          maitrises,
          scoreMoyen,
          sessions,
          chapitresEnDifficulte,
          chapitresMaitrises,
          dernierAt: resultats[0]?.completedAt || eleve.dernierAt || null,
        });
      } catch {
        // Silencieux : on garde les données initiales du parent
      } finally {
        setRefreshingStats(false);
      }
    };
    fetchFreshStats();
  }, [eleve._id]); // eslint-disable-line react-hooks/exhaustive-deps

  const tauxMaitrise = liveStats.totalSessions > 0
    ? Math.round((liveStats.maitrises / liveStats.totalSessions) * 100)
    : 0;

  const chargerProgression = useCallback(async () => {
    if (progression.length > 0) return;
    setLoadProg(true);
    try {
      const { data } = await axios.get(
        `${API}/resultats/progression/${eleve._id}`,
        { headers: hdrs() }
      );
      // Trier par dernier accès
      const sorted = (data.data || []).sort(
        (a, b) => new Date(b.derniereAt || 0) - new Date(a.derniereAt || 0)
      );
      setProgression(sorted);
    } catch { setProgression([]); }
    finally { setLoadProg(false); }
  }, [eleve._id, progression.length]);

  const chargerPlanning = useCallback(async () => {
    setLoadPlan(true);
    try {
      const [planRes, chapRes] = await Promise.all([
        axios.get(`${API}/planning?eleveId=${eleve._id}`, { headers: hdrs() }),
        axios.get(`${API}/chapitres?niveau=${eleve.niveau || ''}`, { headers: hdrs() }),
      ]);
      setPlanning(planRes.data.data || []);
      setChapList(chapRes.data.data || []);
    } catch { setPlanning([]); }
    finally { setLoadPlan(false); }
  }, [eleve._id, eleve.niveau]);

  const programmerDevoir = async () => {
    if (!chapSelected || !newPlan.dateProgrammee) {
      toast.error('Sélectionne un chapitre et une date');
      return;
    }
    setPlanSubmitting(true);
    try {
      await axios.post(`${API}/planning`, {
        eleveId: eleve._id,
        chapitreId: chapSelected,
        type: newPlan.type,
        noteAdmin: newPlan.noteAdmin,
        dateProgrammee: newPlan.dateProgrammee,
      }, { headers: hdrs() });
      toast.success('Devoir programmé avec succès !');
      setNewPlan({ type:'exercice', dateProgrammee:'', noteAdmin:'' });
      setChapSelected('');
      chargerPlanning();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la programmation');
    } finally {
      setPlanSubmitting(false);
    }
  };

  const supprimerPlan = async (id) => {
    try {
      await axios.delete(`${API}/planning/${id}`, { headers: hdrs() });
      setPlanning(p => p.filter(x => x._id !== id));
      toast.success('Devoir supprimé');
    } catch { toast.error('Erreur'); }
  };

  useEffect(() => {
    if (onglet === 'chapitres') chargerProgression();
    if (onglet === 'planning')  chargerPlanning();
  }, [onglet, chargerProgression, chargerPlanning]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
         onClick={onClose}>
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', damping: 25 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-t-3xl sm:rounded-3xl w-full max-w-lg shadow-2xl
                   max-h-[92vh] overflow-hidden flex flex-col">

        {/* En-tête */}
        <div className="bg-gradient-to-r from-tate-doux to-tate-creme p-5 border-b border-tate-border flex-shrink-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center
                              font-bold text-tate-terre text-xl shadow-tate flex-shrink-0">
                {eleve.nom?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-serif font-bold text-tate-terre text-lg leading-tight">{eleve.nom}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${BADGE_NIVEAU[eleve.niveau] || 'bg-gray-100 text-gray-600'}`}>
                    {eleve.niveau || '—'}
                  </span>
                  {eleve.streak > 0 && (
                    <span className="flex items-center gap-1 text-xs font-semibold text-alerte bg-orange-50 px-2 py-0.5 rounded-full">
                      <Flame size={11} /> {eleve.streak}j de streak
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-border/40 flex-shrink-0">
              <X size={18} className="text-tate-terre/50" />
            </button>
          </div>

          {/* Métriques clés */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Sessions',   value: refreshingStats ? '…' : liveStats.totalSessions,                                         icon: BookOpen,   color: 'text-savoir' },
              { label: 'Maîtrisés', value: refreshingStats ? '…' : liveStats.maitrises,                                              icon: CheckCircle, color: 'text-succes' },
              { label: 'Score moy.', value: refreshingStats ? '…' : (liveStats.scoreMoyen !== null ? `${liveStats.scoreMoyen}%` : '—'), icon: Target,     color: couleurScore(liveStats.scoreMoyen) },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-card">
                <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-tate-terre/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-tate-border flex-shrink-0 px-3">
          {[
            { id: 'apercu',    label: '📈 Aperçu'         },
            { id: 'chapitres', label: '📚 Chapitres'      },
            { id: 'planning',  label: '📅 Programmer'     },
          ].map(tab => (
            <button key={tab.id} onClick={() => setOnglet(tab.id)}
              className={`flex-1 py-3 text-xs font-bold border-b-2 transition-all ${
                onglet === tab.id
                  ? 'border-tate-soleil text-tate-terre'
                  : 'border-transparent text-tate-terre/40 hover:text-tate-terre/60'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* ═══════════ ONGLET APERÇU ═══════════ */}
          {onglet === 'apercu' && <>

          {/* Taux de maîtrise */}
          {liveStats.totalSessions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide">Taux de maîtrise</p>
                <span className={`text-sm font-bold ${couleurScore(tauxMaitrise)}`}>{tauxMaitrise}%</span>
              </div>
              <Barre pct={tauxMaitrise} color={tauxMaitrise >= 70 ? 'bg-succes' : tauxMaitrise >= 50 ? 'bg-amber-400' : 'bg-alerte'} />
              <p className="text-xs text-tate-terre/40 mt-1">
                {liveStats.maitrises} chapitre{liveStats.maitrises > 1 ? 's' : ''} maîtrisé{liveStats.maitrises > 1 ? 's' : ''} sur {liveStats.totalSessions} tentative{liveStats.totalSessions > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Historique graphique */}
          {liveStats.sessions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide mb-2">
                Évolution des scores (12 dernières sessions)
              </p>
              <div className="bg-tate-creme rounded-2xl p-3">
                <GrapheScores sessions={liveStats.sessions} />
                <div className="flex items-center gap-4 mt-2 justify-center">
                  <span className="flex items-center gap-1 text-xs text-tate-terre/50">
                    <span className="w-3 h-2 rounded bg-succes inline-block" /> ≥ 80%
                  </span>
                  <span className="flex items-center gap-1 text-xs text-tate-terre/50">
                    <span className="w-3 h-2 rounded bg-amber-400 inline-block" /> 60-79%
                  </span>
                  <span className="flex items-center gap-1 text-xs text-tate-terre/50">
                    <span className="w-3 h-2 rounded bg-alerte inline-block" /> &lt; 60%
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Chapitres en difficulté */}
          {liveStats.chapitresEnDifficulte?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-alerte" />
                <p className="text-xs font-bold text-alerte uppercase tracking-wide">
                  Chapitres en difficulté ({liveStats.chapitresEnDifficulte.length})
                </p>
              </div>
              <div className="space-y-2">
                {liveStats.chapitresEnDifficulte.map((c, i) => (
                  <div key={i} className={`rounded-xl border p-3 flex items-center gap-3 ${bgScore(c.moyennePct)}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-tate-terre truncate">{c.titre}</p>
                      <p className="text-xs text-tate-terre/50">{c.niveau} · {c.scores.length} tentative{c.scores.length > 1 ? 's' : ''}</p>
                    </div>
                    <div className={`text-sm font-bold ${couleurScore(c.moyennePct)} flex-shrink-0`}>
                      {c.moyennePct}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Chapitres maîtrisés */}
          {liveStats.chapitresMaitrises?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-succes" />
                <p className="text-xs font-bold text-succes uppercase tracking-wide">
                  Chapitres maîtrisés ({liveStats.chapitresMaitrises.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {liveStats.chapitresMaitrises.map((c, i) => (
                  <span key={i} className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✓ {c.titre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historique sessions récentes */}
          {liveStats.sessions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide mb-3">
                Dernières sessions
              </p>
              <div className="space-y-2">
                {liveStats.sessions.slice(0, 10).map((s, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-tate-border/40 last:border-0">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${s.maitrise ? 'bg-succes' : 'bg-alerte'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-tate-terre truncate">{s.chapitreTitre}</p>
                      <p className="text-xs text-tate-terre/40">{dateLongFr(s.completedAt)}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className={`text-sm font-bold ${couleurScore(s.scorePct)}`}>{s.scorePct}%</p>
                      {s.maitrise && <p className="text-xs text-succes">Maîtrisé ✓</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Message "aucun exercice" seulement si les stats sont chargées et vraiment vides */}
          {!refreshingStats && liveStats.totalSessions === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📚</p>
              <p className="text-sm text-tate-terre/50">Cet élève n'a pas encore fait d'exercices</p>
            </div>
          )}
          {refreshingStats && (
            <div className="flex items-center justify-center py-6 gap-2">
              <div className="w-5 h-5 rounded-full border-2 border-tate-soleil border-t-transparent animate-spin" />
              <p className="text-xs text-tate-terre/40">Chargement des statistiques…</p>
            </div>
          )}

          {/* Infos compte */}
          <div className="bg-tate-creme rounded-2xl p-3 space-y-1.5">
            <p className="text-xs font-bold text-tate-terre/40 uppercase tracking-wide mb-2">Infos compte</p>
            <p className="text-xs text-tate-terre/60">📧 {eleve.email}</p>
            {liveStats.totalSessions > 0 && liveStats.dernierAt && (
              <p className="text-xs text-tate-terre/60">🕐 Dernier exercice : {dateLongFr(liveStats.dernierAt)}</p>
            )}
            {eleve.derniereConnexion && (
              <p className="text-xs text-tate-terre/60">🔗 Dernière connexion : {dateLongFr(eleve.derniereConnexion)}</p>
            )}
          </div>

          </>} {/* fin onglet apercu */}

          {/* ═══════════ ONGLET PAR CHAPITRE ═══════════ */}
          {onglet === 'chapitres' && (
            <>
              {loadProg ? (
                <div className="flex flex-col items-center py-12 gap-3">
                  <div className="w-8 h-8 rounded-full border-4 border-tate-soleil border-t-transparent animate-spin" />
                  <p className="text-sm text-tate-terre/40">Chargement de l'historique…</p>
                </div>
              ) : progression.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-4xl mb-2">📊</p>
                  <p className="text-sm text-tate-terre/50">Aucun résultat de QCM enregistré</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {progression.map((chap, i) => {
                    const best = Math.max(...chap.tentatives.map(t => t.score));
                    return (
                      <div key={i} className={`rounded-2xl border-2 overflow-hidden ${
                        chap.maitrise ? 'border-green-200 bg-green-50/30' : 'border-tate-border bg-white'
                      }`}>
                        {/* En-tête chapitre */}
                        <div className="flex items-center gap-3 px-4 py-3">
                          <div className={`text-xl flex-shrink-0 ${chap.maitrise ? '' : 'opacity-50'}`}>
                            {chap.maitrise
                              ? (chap.tentatives.find(t => t.maitrise)?.nbErreurs === 0 ? '🥇' :
                                 chap.tentatives.find(t => t.maitrise)?.nbErreurs === 1 ? '🏆' : '⭐')
                              : '📚'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-tate-terre text-sm truncate">{chap.titre}</p>
                            <p className="text-xs text-tate-terre/40">{chap.niveau} · {chap.tentatives.length} tentative{chap.tentatives.length > 1 ? 's' : ''}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className={`text-base font-bold ${couleurScore(best)}`}>{best}%</p>
                            <p className="text-xs text-tate-terre/40">meilleur</p>
                          </div>
                        </div>

                        {/* Historique tentatives */}
                        <div className="border-t border-tate-border/40 px-4 py-2 space-y-1.5">
                          {chap.tentatives.map((t, j) => {
                            const nbErr = t.nbErreurs ?? (t.nbTotal - t.nbCorrectes);
                            return (
                              <div key={j} className="flex items-center gap-2 text-xs">
                                <span className="text-tate-terre/30 w-5 flex-shrink-0">#{t.tentative}</span>
                                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold ${
                                  t.maitrise ? 'bg-succes text-white' : 'bg-alerte/20 text-alerte'
                                }`}>
                                  {t.maitrise ? '✓' : '✗'}
                                </div>
                                <div className="flex-1 h-4 bg-tate-doux rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${t.maitrise ? 'bg-succes' : t.score >= 60 ? 'bg-amber-400' : 'bg-alerte'}`}
                                    style={{ width: `${t.score}%` }} />
                                </div>
                                <span className={`font-bold w-10 text-right ${couleurScore(t.score)}`}>{t.score}%</span>
                                <span className={`px-1.5 py-0.5 rounded-lg text-[10px] font-semibold ${bgFautes(nbErr)}`}>
                                  {nbErr} faute{nbErr !== 1 ? 's' : ''}
                                </span>
                                <span className="text-tate-terre/30 text-[10px] hidden sm:block">
                                  {dateFr(t.completedAt)}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {/* ═══════════ ONGLET PROGRAMMER ═══════════ */}
          {onglet === 'planning' && (
            <div className="space-y-4">
              {/* Formulaire créer un devoir */}
              <div className="bg-tate-creme rounded-2xl border-2 border-tate-border p-4 space-y-3">
                <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wider">📅 Programmer un devoir</p>

                {/* Chapitre */}
                <div>
                  <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Chapitre</label>
                  {loadPlan ? (
                    <div className="h-10 bg-tate-doux rounded-xl animate-pulse" />
                  ) : (
                    <select
                      value={chapSelected}
                      onChange={e => setChapSelected(e.target.value)}
                      className="w-full h-10 rounded-xl border-2 border-tate-border px-3 text-sm text-tate-terre bg-white focus:border-tate-soleil focus:outline-none transition-all">
                      <option value="">— Choisir un chapitre —</option>
                      {chapList.map(c => (
                        <option key={c._id} value={c._id}>{c.titre}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Type */}
                <div>
                  <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Type de devoir</label>
                  <div className="flex gap-2">
                    {[
                      { v:'cours',    l:'📖 Cours',    bg:'bg-blue-100 text-blue-800'   },
                      { v:'exercice', l:'📝 Exercice', bg:'bg-amber-100 text-amber-800' },
                      { v:'revision', l:'🔄 Révision', bg:'bg-green-100 text-green-800' },
                    ].map(t => (
                      <button key={t.v}
                        onClick={() => setNewPlan(p => ({ ...p, type: t.v }))}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all border-2 ${
                          newPlan.type === t.v ? 'border-tate-soleil ' + t.bg : 'border-transparent bg-white text-tate-terre/50'
                        }`}>
                        {t.l}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date & heure */}
                <div>
                  <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Date & heure limite</label>
                  <input
                    type="datetime-local"
                    value={newPlan.dateProgrammee}
                    min={new Date().toISOString().slice(0,16)}
                    onChange={e => setNewPlan(p => ({ ...p, dateProgrammee: e.target.value }))}
                    className="w-full h-10 rounded-xl border-2 border-tate-border px-3 text-sm text-tate-terre bg-white focus:border-tate-soleil focus:outline-none transition-all"
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-semibold text-tate-terre/60 block mb-1">Message pour l'élève (optionnel)</label>
                  <textarea
                    value={newPlan.noteAdmin}
                    onChange={e => setNewPlan(p => ({ ...p, noteAdmin: e.target.value }))}
                    placeholder="Ex : Concentre-toi sur les exemples du cours…"
                    rows={2}
                    className="w-full rounded-xl border-2 border-tate-border px-3 py-2 text-sm text-tate-terre bg-white focus:border-tate-soleil focus:outline-none resize-none transition-all"
                  />
                </div>

                <button
                  onClick={programmerDevoir}
                  disabled={planSubmitting || !chapSelected || !newPlan.dateProgrammee}
                  className="w-full h-11 rounded-2xl font-bold text-sm text-white transition-all disabled:opacity-50"
                  style={{ background:'linear-gradient(135deg,#F97316,#EA580C)', boxShadow:'0 4px 16px rgba(249,115,22,0.3)' }}>
                  {planSubmitting ? '⏳ Programmation…' : '📅 Programmer ce devoir'}
                </button>
              </div>

              {/* Liste des plannings existants */}
              <div>
                <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wider mb-2">
                  Devoirs programmés ({planning.length})
                </p>
                {loadPlan ? (
                  <div className="space-y-2">
                    {[1,2].map(i => <div key={i} className="h-14 bg-tate-doux rounded-xl animate-pulse" />)}
                  </div>
                ) : planning.length === 0 ? (
                  <p className="text-sm text-tate-terre/40 text-center py-6">Aucun devoir programmé pour cet élève.</p>
                ) : (
                  <div className="space-y-2">
                    {planning.map(p => {
                      const dateP = new Date(p.dateProgrammee);
                      const depasse = dateP < new Date();
                      const STATUT_LABEL = {
                        en_attente: { l:'En attente', c:'bg-blue-50 text-blue-700' },
                        en_cours:   { l:'En cours',   c:'bg-amber-50 text-amber-700' },
                        fait_sans_validation: { l:'Fait (non validé)', c:'bg-orange-50 text-orange-700' },
                        valide:     { l:'Validé ✓',   c:'bg-green-50 text-green-700' },
                        expire:     { l:'Expiré',     c:'bg-gray-50 text-gray-500' },
                      };
                      const s = STATUT_LABEL[p.statut] || { l:p.statut, c:'bg-gray-50 text-gray-600' };
                      return (
                        <div key={p._id}
                          className={`bg-white rounded-2xl border-2 px-4 py-3 flex items-center gap-3 ${
                            p.statut === 'valide' ? 'border-green-200' : depasse ? 'border-red-200' : 'border-tate-border'
                          }`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-tate-terre truncate">
                              {p.type === 'cours' ? '📖' : p.type === 'revision' ? '🔄' : '📝'}{' '}
                              {p.chapitreId?.titre || '—'}
                            </p>
                            <p className={`text-[10px] font-medium mt-0.5 ${depasse && p.statut === 'en_attente' ? 'text-red-500' : 'text-tate-terre/40'}`}>
                              {depasse && p.statut === 'en_attente' ? '⚠️ En retard · ' : ''}
                              {dateP.toLocaleDateString('fr-SN', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                            </p>
                          </div>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${s.c}`}>{s.l}</span>
                          {p.statut === 'en_attente' && (
                            <button onClick={() => supprimerPlan(p._id)}
                              className="w-7 h-7 rounded-lg flex items-center justify-center text-red-400 hover:bg-red-50 flex-shrink-0">
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </motion.div>
    </div>
  );
}

// ── Carte élève dans la liste ─────────────────────────────────
function CarteEleve({ eleve, onClick }) {
  const tauxMaitrise = eleve.totalSessions > 0
    ? Math.round((eleve.maitrises / eleve.totalSessions) * 100)
    : null;

  const statutActivite = (() => {
    // Utiliser la date la plus récente entre dernière session ET dernière connexion
    const d1 = eleve.dernierAt        ? new Date(eleve.dernierAt)        : null;
    const d2 = eleve.derniereConnexion ? new Date(eleve.derniereConnexion) : null;
    const ref = d1 && d2 ? (d1 > d2 ? d1 : d2) : d1 ?? d2;
    if (!ref) return { label: 'Jamais actif', color: 'text-tate-terre/30', dot: 'bg-gray-200' };
    const diffJ = Math.floor((new Date() - ref) / (1000 * 60 * 60 * 24));
    if (diffJ <= 1)  return { label: 'Actif récemment', color: 'text-succes',    dot: 'bg-succes'    };
    if (diffJ <= 7)  return { label: `Il y a ${diffJ}j`,   color: 'text-amber-500', dot: 'bg-amber-400' };
    if (diffJ <= 30) return { label: `Il y a ${diffJ}j`,   color: 'text-alerte',    dot: 'bg-alerte'    };
    return { label: 'Inactif (+30j)', color: 'text-tate-terre/40', dot: 'bg-gray-300' };
  })();

  return (
    <motion.button
      whileHover={{ y: -2, boxShadow: '0 6px 20px rgba(61,28,0,.08)' }}
      onClick={onClick}
      className="card w-full text-left hover:border-tate-soleil transition-all cursor-pointer">

      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-11 h-11 rounded-xl bg-tate-soleil flex items-center justify-center
                          font-bold text-tate-terre text-base">
            {eleve.nom?.[0]?.toUpperCase()}
          </div>
          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statutActivite.dot}`} />
        </div>

        {/* Infos */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <p className="font-semibold text-tate-terre text-sm truncate">{eleve.nom}</p>
            {eleve.streak > 0 && (
              <span className="flex items-center gap-0.5 text-xs text-alerte font-semibold">
                <Flame size={10} />{eleve.streak}j
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${BADGE_NIVEAU[eleve.niveau] || 'bg-gray-100 text-gray-600'}`}>
              {eleve.niveau || '—'}
            </span>
            <span className={`text-xs ${statutActivite.color}`}>{statutActivite.label}</span>
          </div>

          {/* Mini graphe */}
          {eleve.sessions?.length > 0 && (
            <div className="mt-2">
              <GrapheScores sessions={eleve.sessions.slice(0, 8)} />
            </div>
          )}
        </div>

        {/* Score côté droit */}
        <div className="flex-shrink-0 text-right">
          {eleve.totalSessions > 0 ? (
            <>
              <p className={`text-lg font-bold leading-none ${eleve.scoreMoyen !== null ? couleurScore(eleve.scoreMoyen) : 'text-tate-terre/30'}`}>
                {eleve.scoreMoyen !== null ? `${eleve.scoreMoyen}%` : '—'}
              </p>
              <p className="text-xs text-tate-terre/40 mt-0.5">moy.</p>
              <p className="text-xs font-semibold text-succes mt-1">
                {eleve.maitrises} ✓
              </p>
            </>
          ) : (
            <p className="text-xs text-tate-terre/30 mt-1">Pas de sessions</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// ── Page principale ───────────────────────────────────────────
export function SuiviEleves({ Layout }) {
  const [eleves,       setEleves]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [filtreNiveau, setFiltreNiveau] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous'); // tous | actifs | difficultés | inactifs
  const [triPar,       setTriPar]       = useState('sessions'); // sessions | score | nom | recent
  const [eleveModal,   setEleveModal]   = useState(null);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/stats/tous-eleves`, { headers: hdrs() });
      const fresh = data.data || [];
      setEleves(fresh);
      // Synchroniser le modal avec les données fraîches si un élève est affiché
      setEleveModal(prev =>
        prev ? (fresh.find(e => e._id?.toString() === prev._id?.toString()) || prev) : null
      );
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Filtres + tri ──
  const elevesFiltres = eleves
    .filter(e => {
      if (search && !e.nom.toLowerCase().includes(search.toLowerCase())) return false;
      if (filtreNiveau && e.niveau !== filtreNiveau) return false;
      if (filtreStatut === 'actifs') {
        const d1 = e.dernierAt        ? new Date(e.dernierAt)        : null;
        const d2 = e.derniereConnexion ? new Date(e.derniereConnexion) : null;
        const ref = d1 && d2 ? (d1 > d2 ? d1 : d2) : d1 ?? d2;
        if (!ref) return false;
        return Math.floor((new Date() - ref) / (1000 * 60 * 60 * 24)) <= 7;
      }
      if (filtreStatut === 'difficultés') return e.chapitresEnDifficulte?.length > 0;
      if (filtreStatut === 'inactifs') {
        const d1 = e.dernierAt        ? new Date(e.dernierAt)        : null;
        const d2 = e.derniereConnexion ? new Date(e.derniereConnexion) : null;
        const ref = d1 && d2 ? (d1 > d2 ? d1 : d2) : d1 ?? d2;
        if (!ref) return true;
        return Math.floor((new Date() - ref) / (1000 * 60 * 60 * 24)) > 14;
      }
      return true;
    })
    .sort((a, b) => {
      if (triPar === 'sessions') return b.totalSessions - a.totalSessions;
      if (triPar === 'score')    return (b.scoreMoyen ?? -1) - (a.scoreMoyen ?? -1);
      if (triPar === 'nom')      return a.nom.localeCompare(b.nom, 'fr');
      if (triPar === 'recent') {
        const refA = Math.max(new Date(a.dernierAt || 0), new Date(a.derniereConnexion || 0));
        const refB = Math.max(new Date(b.dernierAt || 0), new Date(b.derniereConnexion || 0));
        return refB - refA;
      }
      return 0;
    });

  // ── Stats globales ──
  const totalActifs  = eleves.filter(e => {
    const d1 = e.dernierAt        ? new Date(e.dernierAt)        : null;
    const d2 = e.derniereConnexion ? new Date(e.derniereConnexion) : null;
    const ref = d1 && d2 ? (d1 > d2 ? d1 : d2) : d1 ?? d2;
    if (!ref) return false;
    return Math.floor((new Date() - ref) / (1000 * 60 * 60 * 24)) <= 7;
  }).length;
  const totalEnDiff  = eleves.filter(e => e.chapitresEnDifficulte?.length > 0).length;
  const scoreMoyenGlobal = eleves.filter(e => e.scoreMoyen !== null).length > 0
    ? Math.round(eleves.filter(e => e.scoreMoyen !== null)
        .reduce((acc, e) => acc + e.scoreMoyen, 0) /
        eleves.filter(e => e.scoreMoyen !== null).length)
    : null;

  const BtnRefresh = (
    <button onClick={charger}
      className="flex items-center gap-2 text-sm font-medium text-tate-terre/60 hover:text-tate-terre
                 bg-white border border-tate-border rounded-xl px-3 py-1.5 hover:bg-tate-doux transition-all">
      <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
      Actualiser
    </button>
  );

  const Contenu = (
    <div className="space-y-5">

      {/* Résumé global */}
      {!loading && eleves.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Élèves total',       value: eleves.length,       icon: Users,         color: 'bg-tate-soleil',  onClick: () => setFiltreStatut('tous')        },
            { label: 'Actifs cette semaine',value: totalActifs,         icon: Flame,         color: 'bg-alerte',       onClick: () => setFiltreStatut('actifs')      },
            { label: 'En difficulté',      value: totalEnDiff,          icon: AlertTriangle, color: 'bg-amber-400',    onClick: () => setFiltreStatut('difficultés') },
            { label: 'Score moyen',        value: scoreMoyenGlobal !== null ? `${scoreMoyenGlobal}%` : '—', icon: Target, color: 'bg-succes', onClick: null },
          ].map(({ label, value, icon: Icon, color, onClick }) => (
            <motion.button
              key={label}
              whileHover={{ y: -2 }}
              onClick={onClick}
              className={`card flex items-center gap-3 py-3 text-left w-full ${onClick ? 'cursor-pointer hover:border-tate-soleil' : 'cursor-default'}`}>
              <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
                <Icon size={18} className="text-white" />
              </div>
              <div>
                <p className="text-xl font-bold text-tate-terre leading-none">{value}</p>
                <p className="text-xs text-tate-terre/50 leading-tight mt-0.5">{label}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutre" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un élève…"
            className="input-tate pl-9 w-full"
          />
        </div>
        <select
          value={filtreNiveau}
          onChange={e => setFiltreNiveau(e.target.value)}
          className="input-tate sm:w-36">
          <option value="">Tous niveaux</option>
          {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select
          value={filtreStatut}
          onChange={e => setFiltreStatut(e.target.value)}
          className="input-tate sm:w-44">
          <option value="tous">Tous les élèves</option>
          <option value="actifs">Actifs (7 jours)</option>
          <option value="difficultés">En difficulté</option>
          <option value="inactifs">Inactifs (+14j)</option>
        </select>
      </div>

      {/* Tri + compteur */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-tate-terre/50">
          {elevesFiltres.length} élève{elevesFiltres.length > 1 ? 's' : ''}
          {(search || filtreNiveau || filtreStatut !== 'tous') ? ' filtrés' : ''}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-tate-terre/40">Trier :</span>
          <select
            value={triPar}
            onChange={e => setTriPar(e.target.value)}
            className="text-xs border border-tate-border rounded-xl px-2 py-1 bg-white text-tate-terre focus:outline-none">
            <option value="sessions">Sessions</option>
            <option value="score">Score moyen</option>
            <option value="recent">Récent</option>
            <option value="nom">Nom A→Z</option>
          </select>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-10 h-10 rounded-full border-4 border-tate-soleil border-t-transparent animate-spin" />
          <p className="text-sm text-tate-terre/50">Chargement des élèves…</p>
        </div>
      ) : elevesFiltres.length === 0 ? (
        <div className="card text-center py-16">
          <p className="text-4xl mb-3">🔍</p>
          <p className="font-semibold text-tate-terre/50">Aucun élève trouvé</p>
          {(search || filtreNiveau || filtreStatut !== 'tous') && (
            <button
              onClick={() => { setSearch(''); setFiltreNiveau(''); setFiltreStatut('tous'); }}
              className="mt-3 text-sm text-savoir hover:underline">
              Effacer les filtres
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
          <AnimatePresence>
            {elevesFiltres.map((eleve, i) => (
              <motion.div
                key={eleve._id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}>
                <CarteEleve eleve={eleve} onClick={() => setEleveModal(eleve)} />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Modal élève */}
      <AnimatePresence>
        {eleveModal && (
          <ModalDetailEleve eleve={eleveModal} onClose={() => setEleveModal(null)} />
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <Layout titre="Suivi des élèves" action={BtnRefresh}>
      {Contenu}
    </Layout>
  );
}
