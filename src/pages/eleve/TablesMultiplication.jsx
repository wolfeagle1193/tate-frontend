// ─────────────────────────────────────────────────────────────────
// TablesMultiplication.jsx
// Jeu d'automatismes — Tables de multiplication ×2 à ×9
// Accessible aux élèves de CM1, CM2 et 6ème
// ─────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Star, Zap, RotateCcw, Home, Trophy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { LayoutEleve } from './PagesEleve';
import api from '../../lib/api';

// ─── Constantes ───────────────────────────────────────────────────
const TIMES      = [5, 4, 3, 2];   // secondes par niveau
const N_QS       = 11;             // questions par niveau (×0 → ×10)
const PASS       = 9;              // score minimum pour avancer

// Toutes les classes travaillent les mêmes tables ×2 à ×9
const TABLES_ALL = [2, 3, 4, 5, 6, 7, 8, 9];

function getTablesForNiveau(_niveau) {
  return TABLES_ALL;
}

const CONFETTI_COLS = [
  '#F97316','#10B981','#F59E0B','#3B82F6',
  '#EF4444','#8B5CF6','#EC4899','#14B8A6','#FBBF24',
];

// ─── Utilitaires ──────────────────────────────────────────────────
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(ans, table) {
  const set = new Set([ans]);
  const tableVals = shuffle([...Array(11)].map((_, i) => table * i).filter(v => v !== ans));
  tableVals.forEach(v => { if (set.size < 5) set.add(v); });
  shuffle([1,-1,2,-2,3,-3,4,-4,5,-5]).forEach(d => {
    const v = ans + d;
    if (set.size < 5 && v >= 0 && !set.has(v)) set.add(v);
  });
  return shuffle([...set]);
}

// ─── Hook : son (Web Audio) ────────────────────────────────────────
function useTone() {
  const acRef = useRef(null);
  const play = useCallback((freq, gain = 0.12, type = 'sine', dur = 0.28) => {
    try {
      if (!acRef.current) acRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const ac  = acRef.current;
      const osc = ac.createOscillator();
      const g   = ac.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      g.gain.setValueAtTime(gain, ac.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + dur);
      osc.connect(g); g.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + dur);
    } catch {}
  }, []);
  const fanfare = useCallback(() => {
    [523, 659, 784, 1047, 1319].forEach((n, i) =>
      setTimeout(() => play(n, 0.12, 'sine', 0.3), i * 110));
    setTimeout(() => [523, 659, 784, 1047, 1319].forEach((n, i) =>
      setTimeout(() => play(n * 2, 0.07, 'sine', 0.25), i * 90)), 700);
  }, [play]);
  return { play, fanfare };
}

// ─── Composant Confettis ──────────────────────────────────────────
function Confettis({ actif }) {
  const pieces = useMemo(() => {
    if (!actif) return [];
    return Array.from({ length: 70 }, (_, i) => ({
      id: i,
      left:     2 + (i * 1.4) % 96,
      delay:    (i * 0.04) % 2,
      duration: 1.9 + (i * 0.08) % 1.4,
      color:    CONFETTI_COLS[i % CONFETTI_COLS.length],
      w: 5 + (i * 3) % 10, h: 3 + (i * 2) % 8,
      rot: (i * 97) % 720,
      round: i % 3 === 0 ? 50 : 3,
    }));
  }, [actif]);

  if (!actif) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -20, opacity: 1, rotate: 0 }}
          animate={{ y: '110vh', opacity: [1, 1, 0.6, 0], rotate: p.rot }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.25, 0.1, 0.8, 1] }}
          style={{
            position: 'absolute', top: 0, left: `${p.left}%`,
            width: p.w, height: p.h,
            background: p.color, borderRadius: p.round,
          }}
        />
      ))}
    </div>
  );
}

// ─── Barre de timer animée ─────────────────────────────────────────
function TimerBar({ timeLimit, running, onTimeout }) {
  const [pct,    setPct]    = useState(100);
  const [secs,   setSecs]   = useState(timeLimit);
  const startRef = useRef(null);
  const tickRef  = useRef(null);

  useEffect(() => {
    if (!running) return;
    startRef.current = Date.now();
    setPct(100);
    setSecs(timeLimit);
    tickRef.current = setInterval(() => {
      const rem = Math.max(0, timeLimit * 1000 - (Date.now() - startRef.current));
      setPct((rem / (timeLimit * 1000)) * 100);
      setSecs((rem / 1000).toFixed(1));
      if (rem <= 0) { clearInterval(tickRef.current); onTimeout(); }
    }, 50);
    return () => clearInterval(tickRef.current);
  }, [running, timeLimit, onTimeout]);

  const color = pct > 55
    ? 'from-emerald-400 to-green-500'
    : pct > 25
    ? 'from-amber-400 to-yellow-500'
    : 'from-red-500 to-orange-500';

  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-tate-terre/50">⏱️ Temps restant</span>
        <span className="text-sm font-black text-tate-soleil tabular-nums">{secs}s</span>
      </div>
      <div className="h-3 bg-tate-doux rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${pct}%` }}
          transition={{ ease: 'linear' }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ÉCRAN MENU — grille des tables
// ─────────────────────────────────────────────────────────────────
function EcranMenu({ tables, prog, onStart }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      <div className="text-center mb-6">
        <div className="text-5xl mb-2">⚡</div>
        <h1 className="text-2xl font-black text-tate-terre font-serif">Maître des Tables</h1>
        <p className="text-sm text-tate-terre/50 mt-1">Deviens un champion des multiplications !</p>
      </div>

      <div className="grid grid-cols-4 gap-3 mb-6">
        {tables.map(t => {
          const p       = prog[t] || { lvl: 0, done: false };
          const filled  = p.done ? 4 : p.lvl;
          return (
            <motion.button key={t}
              whileTap={{ scale: 0.92 }}
              onClick={() => onStart(t)}
              className={`rounded-2xl border-2 py-4 text-center transition-all shadow-card hover:shadow-tate
                ${p.done
                  ? 'border-succes/40 bg-green-50'
                  : 'border-tate-border bg-white hover:border-tate-soleil/50'}`}>
              <div className="text-2xl font-black text-tate-soleil">×{t}</div>
              <div className="text-[10px] text-tate-terre/40 mt-0.5">Table de {t}</div>
              <div className="text-[11px] mt-1.5 tracking-wide">
                {'⭐'.repeat(filled)}{'☆'.repeat(4 - filled)}
              </div>
              {p.done && <div className="text-[10px] text-succes font-bold mt-1">✓ Maîtrisée</div>}
            </motion.button>
          );
        })}
      </div>

      <div className="bg-tate-doux rounded-2xl p-3 text-center text-xs text-tate-terre/50 space-y-0.5">
        <div>Maîtrise les 4 niveaux de vitesse pour valider chaque table</div>
        <div className="font-semibold text-tate-terre/70">
          ⏱️ 5 s → 4 s → 3 s → ⚡ <span className="text-tate-soleil">2 s</span>
        </div>
        <div>9 bonnes réponses / 11 pour passer au niveau suivant</div>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ÉCRAN JEU
// ─────────────────────────────────────────────────────────────────
function EcranJeu({ table, level, qs, idx, results, good, bad, onPick, onTimeout, onBack }) {
  const q       = qs[idx] || {};
  const choices = useMemo(() => makeChoices(q.ans ?? 0, table), [q.ans, table]);
  const [picked,    setPicked]    = useState(null); // {val, correct}
  const [showNext,  setShowNext]  = useState(false);
  const [timerKey,  setTimerKey]  = useState(0);

  // Reset when question changes
  useEffect(() => {
    setPicked(null);
    setShowNext(false);
    setTimerKey(k => k + 1);
  }, [idx]);

  const handlePick = (val) => {
    if (picked !== null) return;
    const correct = val === q.ans;
    setPicked({ val, correct });
    setShowNext(true);
    onPick(val, q.ans, correct);
  };

  const handleTimeout = useCallback(() => {
    if (picked !== null) return;
    setPicked({ val: null, correct: false });
    setShowNext(true);
    onTimeout(q.ans);
  }, [picked, q.ans, onTimeout]);

  const timeLimit = TIMES[level];

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={onBack}
          className="w-9 h-9 rounded-xl bg-white border-2 border-tate-border flex items-center justify-center text-tate-terre/60 hover:bg-tate-doux transition-all shadow-card">
          <ChevronLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="font-black text-tate-terre text-base">Table de ×{table}</div>
          <div className="text-xs text-tate-terre/45">Niveau {level + 1} — {timeLimit} seconde{timeLimit > 1 ? 's' : ''}</div>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5 text-xs font-bold text-amber-700">
          ⏱️ {timeLimit}s
        </div>
      </div>

      {/* Chemin des niveaux */}
      <div className="flex items-center justify-center gap-2 mb-4">
        {TIMES.map((t, i) => (
          <div key={i} className="flex items-center gap-2">
            {i > 0 && <div className="w-5 h-px bg-tate-border" />}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all
              ${i < level
                ? 'bg-succes text-white'
                : i === level
                ? 'bg-tate-soleil text-white shadow-[0_0_12px_rgba(249,115,22,0.5)]'
                : 'bg-tate-doux text-tate-terre/30 border-2 border-tate-border'}`}>
              {i < level ? '✓' : `${t}s`}
            </div>
          </div>
        ))}
      </div>

      {/* Points de progression */}
      <div className="flex gap-1.5 justify-center flex-wrap mb-4">
        {results.map((r, i) => (
          <div key={i} className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold border-2 transition-all
            ${r === 'ok'
              ? 'bg-succes border-succes text-white'
              : r === 'ko' || r === 'to'
              ? 'bg-alerte border-alerte text-white'
              : i === idx
              ? 'bg-white border-tate-soleil shadow-[0_0_8px_rgba(249,115,22,0.4)]'
              : 'bg-tate-doux border-tate-border text-transparent'}`}>
            {r === 'ok' ? '✓' : r ? '✗' : ''}
          </div>
        ))}
      </div>

      {/* Carte question */}
      <div className="bg-white rounded-2xl border-2 border-tate-border shadow-card mb-4 overflow-hidden">
        <div className="h-1 w-full bg-gradient-to-r from-tate-soleil via-amber-400 to-succes" />
        <div className="py-8 text-center">
          <span className="text-5xl font-black text-tate-terre tabular-nums">
            {q.a} <span className="text-pink-400">×</span> {q.b} <span className="text-blue-400">=</span>{' '}
            <motion.span
              animate={{ scale: [1, 1.12, 1] }}
              transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
              className="text-tate-soleil inline-block">
              ?
            </motion.span>
          </span>
        </div>
      </div>

      {/* Timer */}
      <TimerBar
        key={timerKey}
        timeLimit={timeLimit}
        running={picked === null}
        onTimeout={handleTimeout}
      />

      {/* Score */}
      <div className="flex justify-center gap-6 text-sm mb-4">
        <span className="text-succes font-bold">✅ {good}</span>
        <span className="text-alerte font-bold">❌ {bad}</span>
        <span className="text-tate-terre/40">📝 {idx + 1}/11</span>
      </div>

      {/* Boutons de réponse */}
      <div className="grid grid-cols-5 gap-2">
        {choices.map((val, i) => {
          let cls = 'bg-white border-tate-border text-tate-terre hover:border-tate-soleil hover:bg-tate-doux';
          if (picked !== null) {
            if (val === q.ans)          cls = 'bg-gradient-to-br from-emerald-400 to-green-500 border-succes text-white scale-[1.05]';
            else if (val === picked.val) cls = 'bg-gradient-to-br from-red-400 to-red-500 border-alerte text-white';
            else                         cls = 'border-tate-border text-tate-terre/30 bg-tate-doux/50';
          }
          return (
            <motion.button key={i}
              whileTap={picked === null ? { scale: 0.9 } : {}}
              onClick={() => handlePick(val)}
              disabled={picked !== null}
              className={`rounded-xl border-2 py-4 text-xl font-black transition-all shadow-card ${cls}`}>
              {val}
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ÉCRAN RÉSULTAT DE NIVEAU
// ─────────────────────────────────────────────────────────────────
function EcranResultat({ table, level, good, passed, isLast, onContinue, onMenu }) {
  return (
    <motion.div
      initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
      exit={{ opacity:0 }}
      className="text-center py-6">

      <motion.div
        initial={{ scale: 0 }} animate={{ scale: 1 }}
        transition={{ type: 'spring', bounce: 0.6, delay: 0.1 }}
        className="text-7xl mb-4">
        {passed ? (isLast ? '🏆' : '⭐') : '💪'}
      </motion.div>

      <h2 className="text-2xl font-black text-tate-terre font-serif mb-1">
        {passed ? (isLast ? 'INCROYABLE !' : 'Niveau réussi !') : 'Encore un effort !'}
      </h2>

      <div className="text-lg font-bold text-tate-soleil mb-2">{good} / 11 bonnes réponses</div>

      <p className="text-sm text-tate-terre/50 mb-6 px-4 leading-relaxed">
        {!passed
          ? `Il faut au moins ${PASS}/11 pour passer. Tu as eu ${good}/11 — tu vas y arriver ! 🔥`
          : isLast
          ? `Tu réponds en 2 secondes sur la table de ×${table} — tu es un·e vrai·e champion·ne ! 🚀`
          : `Prochain défi : répondre en ${TIMES[level]}s — prêt·e ? ⚡`
        }
      </p>

      <div className="space-y-3 max-w-xs mx-auto">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onContinue}
          className="w-full py-4 rounded-2xl font-black text-white text-base shadow-tate flex items-center justify-center gap-2"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 6px 24px rgba(249,115,22,0.4)' }}>
          {!passed
            ? <><RotateCcw size={16} /> Réessayer</>
            : isLast
            ? <><Trophy size={16} /> Voir ma récompense !</>
            : <><Zap size={16} /> Niveau suivant ({TIMES[level]}s) →</>
          }
        </motion.button>
        <button onClick={onMenu}
          className="w-full py-3 rounded-2xl font-semibold text-sm text-tate-terre/60 border-2 border-tate-border hover:bg-tate-doux transition-all">
          🏠 Retour au menu
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ÉCRAN CÉLÉBRATION — table validée !
// ─────────────────────────────────────────────────────────────────
function EcranCelebration({ table, user, onMenu }) {
  const prenom = (user?.nom || 'Toi').split(' ')[0];

  return (
    <>
      <Confettis actif />
      <motion.div
        initial={{ opacity:0, scale:0.8 }} animate={{ opacity:1, scale:1 }}
        exit={{ opacity:0 }}
        className="text-center py-6 relative z-10">

        <motion.div
          animate={{ rotate: [-8, 8], scale: [1, 1.1, 1] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          className="text-7xl mb-3">🏆</motion.div>

        <motion.h2
          animate={{ opacity: [0.8, 1] }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
          className="text-3xl font-black font-serif mb-1"
          style={{
            background: 'linear-gradient(135deg, #F97316, #F59E0B)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 16px rgba(249,115,22,0.4))',
          }}>
          BRAVO, {prenom.toUpperCase()} !
        </motion.h2>

        <p className="text-lg font-bold text-tate-terre mb-1">
          Tu maîtrises la table de ×{table} !
        </p>

        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4, type: 'spring', bounce: 0.6 }}
          className="text-3xl tracking-[8px] my-3">
          ⭐⭐⭐⭐
        </motion.div>

        <p className="text-sm text-tate-terre/50 mb-6 px-4 leading-relaxed">
          Tu réponds en seulement <strong className="text-tate-terre">2 secondes</strong> — tu es un·e vrai·e champion·ne ! 🚀
        </p>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onMenu}
          className="py-4 px-8 rounded-2xl font-black text-white text-base shadow-tate flex items-center justify-center gap-2 mx-auto"
          style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)', boxShadow: '0 6px 24px rgba(249,115,22,0.4)' }}>
          <Home size={16} /> Retour au menu
        </motion.button>
      </motion.div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// COMPOSANT PRINCIPAL
// ─────────────────────────────────────────────────────────────────
export function TablesMultiplication() {
  const { user }   = useAuthStore();
  const navigate   = useNavigate();
  const { play, fanfare } = useTone();

  const niveau = user?.niveau || 'CM2';
  const tables = getTablesForNiveau(niveau);

  // ─ Progression (localStorage = cache, API = source de vérité) ──
  const [prog, setProg] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('tate_tables_prog') || '{}');
    } catch { return {}; }
  });
  const [apiLoading, setApiLoading] = useState(true);

  // Initialiser les tables manquantes
  useEffect(() => {
    const init = {};
    tables.forEach(t => { if (!prog[t]) init[t] = { lvl: 0, done: false }; });
    if (Object.keys(init).length) setProg(p => ({ ...p, ...init }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Charger la vraie progression depuis l'API au montage
  useEffect(() => {
    const chargerDepuisApi = async () => {
      try {
        const { data } = await api.get('/resultats/ma-progression');
        const tablesData = (data.data || []).filter(d => d.type === 'table_multiplication');
        if (tablesData.length > 0) {
          const progFromApi = {};
          for (const t of tablesData) {
            // niveaux est un objet { 1: {...}, 2: {...}, ... }
            const nbNiveaux = Object.keys(t.niveaux || {}).length;
            progFromApi[t.tableNumero] = {
              lvl:  t.maitrise ? 4 : nbNiveaux,
              done: t.maitrise,
            };
          }
          // Fusionner : l'API gagne sur localStorage
          setProg(p => {
            const merged = { ...p, ...progFromApi };
            try { localStorage.setItem('tate_tables_prog', JSON.stringify(merged)); } catch {}
            return merged;
          });
        }
      } catch {
        // Silencieux — on garde le localStorage comme fallback
      } finally {
        setApiLoading(false);
      }
    };
    chargerDepuisApi();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveProg = (next) => {
    setProg(next);
    try { localStorage.setItem('tate_tables_prog', JSON.stringify(next)); } catch {}
  };

  // ─ État du jeu ─────────────────────────────────────────────
  const [screen,   setScreen]   = useState('menu');  // menu | game | result | celebrate
  const [table,    setTable]    = useState(2);
  const [level,    setLevel]    = useState(0);
  const [qs,       setQs]       = useState([]);
  const [idx,      setIdx]      = useState(0);
  const [results,  setResults]  = useState(new Array(N_QS).fill(null));
  const [good,     setGood]     = useState(0);
  const [bad,      setBad]      = useState(0);
  const [resultData, setResultData] = useState(null);

  // ─ Démarrer une table ──────────────────────────────────────
  const startTable = (t) => {
    const p = prog[t] || { lvl: 0, done: false };
    setTable(t);
    setLevel(p.done ? 0 : p.lvl);
    launchLevel(t, p.done ? 0 : p.lvl);
  };

  const launchLevel = (t, lv) => {
    const arr = [...Array(11)].map((_, i) => ({ a: t, b: i, ans: t * i }));
    setQs(shuffle(arr));
    setIdx(0);
    setResults(new Array(N_QS).fill(null));
    setGood(0);
    setBad(0);
    setScreen('game');
  };

  // ─ Répondre ────────────────────────────────────────────────
  const handlePick = (val, ans, correct) => {
    const newResults = [...results];
    newResults[idx] = correct ? 'ok' : 'ko';
    setResults(newResults);
    if (correct) {
      setGood(g => g + 1);
      play(880, 0.1, 'sine');
    } else {
      setBad(b => b + 1);
      play(200, 0.15, 'sawtooth');
    }
    setTimeout(() => advanceIdx(newResults), 900);
  };

  const handleTimeout = useCallback((ans) => {
    const newResults = [...results];
    newResults[idx] = 'to';
    setResults(newResults);
    setBad(b => b + 1);
    play(140, 0.18, 'triangle');
    setTimeout(() => advanceIdx(newResults), 1100);
  }, [results, idx]); // eslint-disable-line react-hooks/exhaustive-deps

  const advanceIdx = (res) => {
    const nextIdx = idx + 1;
    if (nextIdx >= N_QS) {
      const score = res.filter(r => r === 'ok').length;
      endLevel(score);
    } else {
      setIdx(nextIdx);
    }
  };

  // ─ Fin de niveau ───────────────────────────────────────────
  const endLevel = (score) => {
    const passed  = score >= PASS;
    const isLast  = level === 3;
    let nextLevel = level;

    if (passed && !isLast) {
      nextLevel = level + 1;
      const nextProg = { ...prog, [table]: { lvl: nextLevel, done: false } };
      saveProg(nextProg);
      play(660, 0.2, 'sine');
    } else if (passed && isLast) {
      const nextProg = { ...prog, [table]: { lvl: 4, done: true } };
      saveProg(nextProg);
      fanfare();
    }

    // ── Envoyer le résultat à l'API (fire & forget, toujours — pas seulement si réussi) ──
    // On envoie même en cas d'échec pour que l'admin/parent voient les tentatives
    const pctScore = Math.round((score / N_QS) * 100);
    api.post('/resultats/soumettre', {
      type:          'table_multiplication',
      tableNumero:   table,
      niveauVitesse: level + 1,  // 1-indexé (1=5s, 2=4s, 3=3s, 4=2s)
      score:         pctScore,
      nbCorrectes:   score,
      nbTotal:       N_QS,
    }).catch(() => {}); // Silencieux — localStorage reste la source locale

    setResultData({ score, passed, isLast: passed && isLast, nextLevel });
    setScreen('result');
  };

  // ─ Depuis l'écran résultat ─────────────────────────────────
  const handleResultContinue = () => {
    if (!resultData) return;
    if (resultData.passed && resultData.isLast) {
      setScreen('celebrate');
    } else if (resultData.passed) {
      setLevel(resultData.nextLevel);
      launchLevel(table, resultData.nextLevel);
    } else {
      launchLevel(table, level);
    }
  };

  const goMenu = () => setScreen('menu');

  // ─── Rendu ─────────────────────────────────────────────────
  return (
    <LayoutEleve activeTab="cours">
      {/* En-tête de section */}
      <div className="flex items-center gap-2 mb-5">
        <button onClick={() => navigate('/eleve')}
          className="w-8 h-8 rounded-xl bg-white border-2 border-tate-border flex items-center justify-center text-tate-terre/50 hover:bg-tate-doux transition-all shadow-card">
          <ChevronLeft size={16} />
        </button>
        <div>
          <div className="font-bold text-tate-terre text-sm flex items-center gap-1.5">
            <span>📐</span> Automatismes · Maths
          </div>
          <div className="text-[11px] text-tate-terre/40">
            Tables ×2 à ×9 · {niveau}
          </div>
        </div>
      </div>

      {/* Indicateur de synchronisation API */}
      {apiLoading && (
        <div className="flex items-center justify-center gap-2 mb-3 text-xs text-tate-terre/40">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-3 h-3 border-2 border-tate-soleil/30 border-t-tate-soleil rounded-full"
          />
          Chargement de ta progression…
        </div>
      )}

      {/* Contenu principal */}
      <AnimatePresence mode="wait">
        {screen === 'menu' && (
          <motion.div key="menu">
            <EcranMenu
              tables={tables}
              prog={prog}
              onStart={startTable}
            />
          </motion.div>
        )}

        {screen === 'game' && (
          <motion.div key="game">
            <EcranJeu
              table={table}
              level={level}
              qs={qs}
              idx={idx}
              results={results}
              good={good}
              bad={bad}
              onPick={handlePick}
              onTimeout={handleTimeout}
              onBack={goMenu}
            />
          </motion.div>
        )}

        {screen === 'result' && resultData && (
          <motion.div key="result">
            <EcranResultat
              table={table}
              level={resultData.nextLevel}
              good={resultData.score}
              passed={resultData.passed}
              isLast={resultData.isLast}
              onContinue={handleResultContinue}
              onMenu={goMenu}
            />
          </motion.div>
        )}

        {screen === 'celebrate' && (
          <motion.div key="celebrate">
            <EcranCelebration
              table={table}
              user={user}
              onMenu={goMenu}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutEleve>
  );
}
