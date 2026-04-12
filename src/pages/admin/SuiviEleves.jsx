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

// ── Modal détail élève ────────────────────────────────────────
function ModalDetailEleve({ eleve, onClose }) {
  const tauxMaitrise = eleve.totalSessions > 0
    ? Math.round((eleve.maitrises / eleve.totalSessions) * 100)
    : 0;

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
              { label: 'Sessions', value: eleve.totalSessions, icon: BookOpen, color: 'text-savoir' },
              { label: 'Maîtrisés', value: eleve.maitrises, icon: CheckCircle, color: 'text-succes' },
              { label: 'Score moy.', value: eleve.scoreMoyen !== null ? `${eleve.scoreMoyen}%` : '—', icon: Target, color: couleurScore(eleve.scoreMoyen) },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="bg-white rounded-2xl p-3 text-center shadow-card">
                <Icon size={16} className={`mx-auto mb-1 ${color}`} />
                <p className={`text-lg font-bold ${color}`}>{value}</p>
                <p className="text-xs text-tate-terre/50">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Corps scrollable */}
        <div className="overflow-y-auto flex-1 p-5 space-y-5">

          {/* Taux de maîtrise */}
          {eleve.totalSessions > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide">Taux de maîtrise</p>
                <span className={`text-sm font-bold ${couleurScore(tauxMaitrise)}`}>{tauxMaitrise}%</span>
              </div>
              <Barre pct={tauxMaitrise} color={tauxMaitrise >= 70 ? 'bg-succes' : tauxMaitrise >= 50 ? 'bg-amber-400' : 'bg-alerte'} />
              <p className="text-xs text-tate-terre/40 mt-1">
                {eleve.maitrises} chapitre{eleve.maitrises > 1 ? 's' : ''} maîtrisé{eleve.maitrises > 1 ? 's' : ''} sur {eleve.totalSessions} tentative{eleve.totalSessions > 1 ? 's' : ''}
              </p>
            </div>
          )}

          {/* Historique graphique */}
          {eleve.sessions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide mb-2">
                Évolution des scores (12 dernières sessions)
              </p>
              <div className="bg-tate-creme rounded-2xl p-3">
                <GrapheScores sessions={eleve.sessions} />
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
          {eleve.chapitresEnDifficulte?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={14} className="text-alerte" />
                <p className="text-xs font-bold text-alerte uppercase tracking-wide">
                  Chapitres en difficulté ({eleve.chapitresEnDifficulte.length})
                </p>
              </div>
              <div className="space-y-2">
                {eleve.chapitresEnDifficulte.map((c, i) => (
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
          {eleve.chapitresMaitrises?.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle size={14} className="text-succes" />
                <p className="text-xs font-bold text-succes uppercase tracking-wide">
                  Chapitres maîtrisés ({eleve.chapitresMaitrises.length})
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {eleve.chapitresMaitrises.map((c, i) => (
                  <span key={i} className="bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-2.5 py-1 rounded-full">
                    ✓ {c.titre}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Historique sessions récentes */}
          {eleve.sessions?.length > 0 && (
            <div>
              <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wide mb-3">
                Dernières sessions
              </p>
              <div className="space-y-2">
                {eleve.sessions.slice(0, 10).map((s, i) => (
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

          {eleve.totalSessions === 0 && (
            <div className="text-center py-8">
              <p className="text-4xl mb-2">📚</p>
              <p className="text-sm text-tate-terre/50">Cet élève n'a pas encore fait d'exercices</p>
            </div>
          )}

          {/* Infos compte */}
          <div className="bg-tate-creme rounded-2xl p-3 space-y-1.5">
            <p className="text-xs font-bold text-tate-terre/40 uppercase tracking-wide mb-2">Infos compte</p>
            <p className="text-xs text-tate-terre/60">📧 {eleve.email}</p>
            {eleve.dernierAt && (
              <p className="text-xs text-tate-terre/60">🕐 Dernier exercice : {dateLongFr(eleve.dernierAt)}</p>
            )}
          </div>
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
    if (!eleve.dernierAt) return { label: 'Jamais actif', color: 'text-tate-terre/30', dot: 'bg-gray-200' };
    const diffJ = Math.floor((new Date() - new Date(eleve.dernierAt)) / (1000 * 60 * 60 * 24));
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
      setEleves(data.data || []);
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
        if (!e.dernierAt) return false;
        const diffJ = Math.floor((new Date() - new Date(e.dernierAt)) / (1000 * 60 * 60 * 24));
        return diffJ <= 7;
      }
      if (filtreStatut === 'difficultés') return e.chapitresEnDifficulte?.length > 0;
      if (filtreStatut === 'inactifs') {
        if (!e.dernierAt) return true;
        const diffJ = Math.floor((new Date() - new Date(e.dernierAt)) / (1000 * 60 * 60 * 24));
        return diffJ > 14;
      }
      return true;
    })
    .sort((a, b) => {
      if (triPar === 'sessions') return b.totalSessions - a.totalSessions;
      if (triPar === 'score')    return (b.scoreMoyen ?? -1) - (a.scoreMoyen ?? -1);
      if (triPar === 'nom')      return a.nom.localeCompare(b.nom, 'fr');
      if (triPar === 'recent') {
        return new Date(b.dernierAt || 0) - new Date(a.dernierAt || 0);
      }
      return 0;
    });

  // ── Stats globales ──
  const totalActifs  = eleves.filter(e => {
    if (!e.dernierAt) return false;
    return Math.floor((new Date() - new Date(e.dernierAt)) / (1000 * 60 * 60 * 24)) <= 7;
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
