import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle, Star, Flame, GraduationCap,
  Copy, Clock, X, LogOut, RotateCcw, Home,
  ChevronLeft, BookOpen, Trophy, Zap, ChevronRight, Eye,
} from 'lucide-react';
import { useEleveStore }  from '../../store/useEleveStore';
import { useAuthStore }   from '../../store/useAuthStore';
import { useNavigate }    from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

// ── Accès libre pour TOUS les élèves (pas de verrou)
function verifierAcces(_user) {
  return true; // Accès complet à toute la plateforme sans restriction
}

// ── Type de badge à afficher
function typeBadge(user) {
  if (!user || user.abonnement !== 'premium') return 'aucun';
  if (!user.abonnementExpiry) return 'domicile';
  if (new Date(user.abonnementExpiry) > new Date()) return 'abonne';
  return 'expire';
}

// ─── Config matières ─────────────────────────────────────────────
const MATIERES = [
  { id:'FR', nom:'Français',   icone:'📖', code:'FR',
    gradient:'from-orange-400 to-orange-600',  bg:'bg-orange-50',  border:'border-orange-200',  text:'text-orange-800',  dot:'bg-orange-500'  },
  { id:'MA', nom:'Maths',      icone:'📐', code:'MA',
    gradient:'from-blue-400 to-blue-600',     bg:'bg-blue-50',   border:'border-blue-200',   text:'text-blue-800',   dot:'bg-blue-500'   },
  { id:'AN', nom:'Anglais',    icone:'🇬🇧', code:'AN',
    gradient:'from-emerald-400 to-green-600', bg:'bg-emerald-50',border:'border-emerald-200',text:'text-emerald-800',dot:'bg-emerald-500' },
  { id:'HI', nom:'Histoire',   icone:'🏛️', code:'HI',
    gradient:'from-purple-400 to-violet-600', bg:'bg-purple-50', border:'border-purple-200', text:'text-purple-800', dot:'bg-purple-500'  },
  { id:'GE', nom:'Géographie', icone:'🌍', code:'GE',
    gradient:'from-teal-400 to-cyan-600',     bg:'bg-teal-50',   border:'border-teal-200',   text:'text-teal-800',   dot:'bg-teal-500'    },
  { id:'SC', nom:'Sciences',   icone:'🔬', code:'SC',
    gradient:'from-rose-400 to-pink-600',     bg:'bg-rose-50',   border:'border-rose-200',   text:'text-rose-800',   dot:'bg-rose-500'    },
];

// ─── Config sections Français ────────────────────────────────────
const SECTIONS_FR = [
  { key:'Grammaire',               label:'Grammaire',           icone:'📖', couleur:'border-blue-300 bg-blue-50 text-blue-800',    bar:'bg-blue-400'   },
  { key:'Conjugaison',             label:'Conjugaison',         icone:'⏱️', couleur:'border-yellow-300 bg-yellow-50 text-yellow-800',bar:'bg-yellow-400' },
  { key:'Orthographe grammaticale',label:'Orth. grammaticale',  icone:'✏️', couleur:'border-orange-300 bg-orange-50 text-orange-800',bar:'bg-orange-400' },
  { key:"Orthographe d'usage",     label:"Orth. d'usage",       icone:'🔤', couleur:'border-green-300 bg-green-50 text-green-800',  bar:'bg-green-400'  },
];
const NIVEAUX_4_SECTIONS = ['CM1','CM2','6eme','5eme','4eme','3eme'];
const getSectionChap = (chap) => chap.sectionFr || null;

// ─────────────────────────────────────────────────────────────────
// Petits composants utilitaires
// ─────────────────────────────────────────────────────────────────
export function LayoutEleve({ children, activeTab = 'cours' }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const badge = typeBadge(user);

  return (
    <div className="min-h-screen bg-tate-creme flex flex-col">
      {/* Header compact */}
      <header className="bg-white border-b border-tate-border px-4 py-3 flex items-center justify-between sticky top-0 z-20 shadow-card">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl flex items-center justify-center font-serif font-bold text-white text-sm shadow-tate"
               style={{background:'linear-gradient(135deg,#F97316,#EA580C)'}}>T</div>
          <div>
            <p className="font-serif font-bold text-tate-terre text-sm leading-none">Taté</p>
            <p className="text-[10px] text-tate-terre/40 mt-0.5">Bonjour, {user?.nom?.split(' ')[0]} 👋</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.streak > 0 && (
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1">
              <Flame size={12} className="text-alerte" />
              <span className="text-xs font-bold text-tate-terre">{user.streak}</span>
            </div>
          )}
          {badge === 'domicile' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-violet-100 text-violet-700 border border-violet-200">⭐ Premium</span>
          )}
          {badge === 'abonne' && (
            <span className="text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">✨ Abonné</span>
          )}
          <button onClick={() => { logout(); navigate('/login'); }}
            className="w-8 h-8 rounded-full bg-tate-doux border border-tate-border flex items-center justify-center text-tate-terre/50 hover:text-alerte hover:border-alerte/40 hover:bg-red-50 transition-all"
            title="Se déconnecter">
            <LogOut size={14} />
          </button>
        </div>
      </header>

      {/* Contenu principal */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 pb-24">{children}</main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-tate-border z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center max-w-lg mx-auto">
          {[
            { id:'cours',    icon: BookOpen,      label:'Cours',      path:'/eleve'          },
            { id:'tutorat',  icon: GraduationCap, label:'Tutorat',    path:'/eleve/tutorat'  },
            { id:'epreuves', icon: Trophy,        label:'Examens',    path:'/eleve/epreuves' },
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => navigate(tab.path)}
                className={`flex-1 flex flex-col items-center gap-0.5 py-3 px-2 transition-all ${active ? 'text-tate-soleil' : 'text-tate-terre/40 hover:text-tate-terre/60'}`}>
                <div className={`relative ${active ? 'scale-110' : ''} transition-transform`}>
                  <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
                  {active && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-tate-soleil" />}
                </div>
                <span className={`text-[10px] font-semibold mt-1 ${active ? 'text-tate-soleil' : ''}`}>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

function LoadingTate({ message = 'Chargement…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center
                      font-serif font-bold text-tate-terre text-xl shadow-tate animate-pulse-slow">T</div>
      <p className="text-sm text-tate-terre/60 animate-pulse">{message}</p>
    </div>
  );
}

function ProgressBar({ value, max = 100, color = '' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = color || (pct >= 80 ? 'bg-succes' : pct >= 50 ? 'bg-tate-soleil' : 'bg-alerte');
  return (
    <div>
      <div className="flex justify-between text-xs text-tate-terre/60 mb-1">
        <span>Progression</span>
        <span className={`font-semibold ${pct >= 80 ? 'text-succes' : 'text-tate-soleil'}`}>{pct}%</span>
      </div>
      <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width:`${pct}%` }} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// CSS injecté dans les iframes HTML — design moderne Taté
// ─────────────────────────────────────────────────────────────────
const IFRAME_CSS = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Lora:ital,wght@0,600;0,700;1,600&display=swap');

  /* ── Variables de marque ── */
  :root {
    --or:      #F97316;
    --or-fonce:#EA580C;
    --terre:   #1C0A00;
    --terre2:  #3D1C00;
    --vert:    #10B981;
    --creme:   #FFFBF5;
    --doux:    #FFF3E0;
    --card-bg: #ffffff;
    --radius:  16px;
    --sh:      0 4px 24px rgba(249,115,22,0.10);
    --sh-md:   0 8px 32px rgba(249,115,22,0.15);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; font-size: 16px; }

  /* ══════════════════════════════════════
     PLEIN ÉCRAN — padding uniquement sur body
  ══════════════════════════════════════ */
  body {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 1rem;
    line-height: 1.85;
    color: var(--terre2);
    background: var(--creme);
    width: 100%;
    min-height: 100vh;
    padding: 0 16px 120px;   /* padding latéral UNIQUEMENT ici */
    overflow-x: hidden;
  }

  /* ══════════════════════════════════════
     TYPOGRAPHIE & TITRES
     — 0 margin/padding latéral : body s'en charge
  ══════════════════════════════════════ */
  h1 {
    font-family: 'Lora', Georgia, serif;
    font-size: clamp(1.35rem, 4vw, 1.85rem);
    font-weight: 700;
    color: var(--terre);
    line-height: 1.25;
    margin: 24px 0 4px;
    padding: 0;
  }

  h2 {
    font-family: 'Lora', Georgia, serif;
    font-size: clamp(1.05rem, 3vw, 1.2rem);
    font-weight: 700;
    color: var(--terre);
    line-height: 1.3;
    margin: 28px -16px 0;     /* déborde sur les bords pour prendre toute la largeur */
    padding: 12px 16px;
    background: linear-gradient(90deg, #FFF3E0 0%, #FFFBF5 70%, transparent 100%);
    border-left: 5px solid var(--or);
    position: relative;
  }
  h2::after {
    content: '';
    position: absolute;
    bottom: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, #F4C77544, transparent);
  }

  h3 {
    font-size: 1rem;
    font-weight: 700;
    color: var(--or-fonce);
    margin: 20px 0 6px;
    display: flex;
    align-items: center;
    gap: 7px;
  }
  h3::before { content: '▸'; font-size: 0.8em; opacity: 0.6; }

  h4 {
    font-size: 0.87rem;
    font-weight: 700;
    color: var(--terre);
    opacity: 0.55;
    text-transform: uppercase;
    letter-spacing: 0.07em;
    margin: 18px 0 5px;
  }

  /* ══════════════════════════════════════
     CONTENU DE BASE
  ══════════════════════════════════════ */
  p {
    margin: 9px 0;
    font-size: 0.97rem;
    line-height: 1.85;
    color: var(--terre2);
  }

  ul, ol {
    padding-left: 22px;
    margin: 8px 0;
  }
  li {
    margin: 6px 0;
    padding-left: 4px;
    line-height: 1.75;
    font-size: 0.96rem;
  }
  ul li::marker { color: var(--or); font-size: 1.15em; }
  ol li::marker { color: var(--or); font-weight: 800; }

  strong { color: var(--terre); font-weight: 700; }
  em     { color: #7C3A00; font-style: italic; }

  /* ══════════════════════════════════════
     BLOCS SPÉCIAUX — pleine largeur
  ══════════════════════════════════════ */

  /* Règle / blockquote — pleine largeur */
  blockquote {
    margin: 18px -16px;
    padding: 16px 20px 16px 22px;
    background: linear-gradient(135deg, #FFF3E0, #FFFBF5 80%);
    border: none;
    border-left: 5px solid var(--or);
    box-shadow: var(--sh);
    position: relative;
    font-style: normal;
  }
  blockquote::before {
    content: '📌';
    position: absolute;
    top: -12px; left: 12px;
    font-size: 20px;
  }
  blockquote p { margin: 0; font-weight: 600; color: var(--terre); }

  /* Astuce / info — pleine largeur */
  .astuce, .info, .note, [class*="astuce"], [class*="info-box"] {
    margin: 14px -16px;
    padding: 13px 20px;
    background: #EFF6FF;
    border-left: 4px solid #3B82F6;
    font-size: 0.93rem;
    color: #1D4ED8;
    line-height: 1.65;
  }

  /* Piège / attention — pleine largeur */
  .piege, .warning, .attention, [class*="piege"], [class*="attention"] {
    margin: 14px -16px;
    padding: 13px 20px;
    background: #FFF7ED;
    border-left: 4px solid var(--or);
    font-size: 0.93rem;
    color: #7C2D12;
    line-height: 1.65;
  }

  /* Fin de cours — pleine largeur (sélecteur précis, évite les faux positifs) */
  .fin-cours, [class*="fin-cours"] {
    margin: 28px -16px 0;
    padding: 22px 24px;
    background: linear-gradient(135deg, #F0FDF4, #FFFBF5);
    border-top: 2px solid #86EFAC;
    border-bottom: 2px solid #86EFAC;
    text-align: center;
    box-shadow: 0 4px 20px rgba(16,185,129,.10);
  }

  /* ══════════════════════════════════════
     MASQUER les encadrés de métadonnées cours (matière / classe / chapitre)
     généré automatiquement par l'IA en fin de HTML
  ══════════════════════════════════════ */
  .info-cours, .course-info, .meta-cours, .metadata-cours,
  .entete-cours, .header-cours, .chapitre-info, .cours-info,
  [class*="info-cours"], [class*="course-info"],
  [class*="meta-cours"], [class*="entete-cours"],
  [class*="header-cours"], [class*="chapitre-info"],
  [id*="info-cours"], [id*="course-info"], [id*="meta-cours"],
  /* Div avec fond orange/ambre inline (pattern IA commun) */
  [style*="background: #FFF3E0"],
  [style*="background-color: #FFF3E0"],
  [style*="background: #FFFBF0"],
  [style*="background: #FFF7ED"],
  [style*="background-color: #FFF7ED"],
  [style*="background: orange"],
  [style*="background-color: orange"] {
    display: none !important;
  }

  /* ══════════════════════════════════════
     TABLEAUX — pleine largeur
  ══════════════════════════════════════ */
  table {
    width: 100%;
    margin: 18px 0;
    border-collapse: collapse;
    border-radius: var(--radius);
    overflow: hidden;
    box-shadow: var(--sh);
    font-size: 0.9rem;
  }
  thead {
    background: linear-gradient(90deg, var(--or), var(--or-fonce));
    color: white;
  }
  thead th {
    padding: 12px 16px;
    font-weight: 700;
    text-align: left;
    font-size: 0.88rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  tbody tr:nth-child(even) { background: #FFF9F0; }
  tbody tr:nth-child(odd)  { background: white; }
  tbody tr:hover           { background: #FFEDD5; transition: background 0.15s; }
  tbody td { padding: 11px 16px; border-bottom: 1px solid #FDE68A33; }

  /* ══════════════════════════════════════
     CODE — pleine largeur
  ══════════════════════════════════════ */
  code {
    background: #FFF0E0;
    color: var(--or-fonce);
    border: 1px solid #FDDCAA;
    border-radius: 6px;
    padding: 2px 7px;
    font-size: 0.87em;
    font-family: 'Courier New', monospace;
  }
  pre {
    background: #1C0A00;
    color: #FFD580;
    border-radius: var(--radius);
    padding: 18px 20px;
    overflow-x: auto;
    margin: 16px -16px;
    font-size: 0.87rem;
    line-height: 1.65;
    box-shadow: 0 4px 20px rgba(0,0,0,.2);
  }
  pre code { background: transparent; color: inherit; border: none; padding: 0; }

  /* ══════════════════════════════════════
     HR — pleine largeur
  ══════════════════════════════════════ */
  hr {
    border: none;
    height: 2px;
    background: linear-gradient(90deg, transparent, var(--or) 40%, var(--or) 60%, transparent);
    margin: 28px 0;
    opacity: 0.22;
    border-radius: 2px;
  }

  /* ══════════════════════════════════════
     IMAGES — pleine largeur
  ══════════════════════════════════════ */
  img {
    max-width: 100%;
    border-radius: var(--radius);
    margin: 14px auto;
    display: block;
    box-shadow: var(--sh);
  }

  /* ══════════════════════════════════════
     QCM — SECTION EXERCICES
  ══════════════════════════════════════ */

  /* Titre QCM */
  h1:first-child, h2:first-child {
    color: var(--terre);
  }

  /* Numéro de question sous forme de carte — pleine largeur */
  .question, [class*="question-block"], [class*="q-card"] {
    background: var(--card-bg);
    border: 2px solid #FDE68A66;
    border-radius: 18px;
    padding: 20px;
    margin: 16px 0;
    box-shadow: var(--sh);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .question:hover, [class*="question-block"]:hover {
    box-shadow: var(--sh-md);
    border-color: #F4C775;
  }

  /* Label = option de réponse */
  label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 13px 18px;
    margin: 8px 0;
    background: white;
    border: 2px solid #F4C77544;
    border-radius: 14px;
    cursor: pointer;
    font-size: 0.95rem;
    line-height: 1.55;
    transition: all 0.18s;
    -webkit-user-select: none;
    user-select: none;
  }
  label:hover {
    background: #FFFBF0;
    border-color: var(--or);
    transform: translateX(3px);
    box-shadow: 0 3px 12px rgba(249,115,22,0.12);
  }
  label:has(input:checked) {
    background: linear-gradient(90deg, #FFF7ED, #FFFBF5);
    border-color: var(--or);
    font-weight: 600;
    color: var(--or-fonce);
    box-shadow: 0 4px 14px rgba(249,115,22,0.18);
  }

  input[type="radio"] {
    accent-color: var(--or);
    width: 20px;
    height: 20px;
    cursor: pointer;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* Inputs texte */
  input[type="text"], input[type="input"], textarea {
    width: 100%;
    padding: 13px 18px;
    border: 2px solid #FDE68A88;
    border-radius: 14px;
    font-size: 0.96rem;
    font-family: inherit;
    outline: none;
    background: white;
    color: var(--terre);
    transition: border-color 0.2s, box-shadow 0.2s;
    margin-top: 8px;
  }
  input[type="text"]:focus, textarea:focus {
    border-color: var(--or);
    box-shadow: 0 0 0 4px rgba(249,115,22,0.10);
  }

  /* Boutons de soumission QCM générés par l'IA :
     MASQUÉS — la validation est gérée par le bouton React "Valider mes réponses"
     Cela évite le double bouton de validation */
  button[type="submit"],
  input[type="submit"],
  button.valider, button.soumettre, button.submit,
  button.btn-valider, button.btn-soumettre,
  [class*="btn-submit"], [class*="btn-valider"], [class*="btn-soumettre"],
  form > button:last-of-type,
  .qcm-submit, .quiz-submit, .quiz-btn {
    display: none !important;
  }

  /* ══════════════════════════════════════
     RÉSULTATS CORRECTION (après soumission)
  ══════════════════════════════════════ */
  .correct, [class*="correct"] {
    background: #F0FDF4 !important;
    border-color: #86EFAC !important;
    color: #15803D;
  }
  .incorrect, [class*="incorrect"], [class*="faux"] {
    background: #FFF1F2 !important;
    border-color: #FCA5A5 !important;
    color: #B91C1C;
  }

  /* ══════════════════════════════════════
     BADGES / TAGS
  ══════════════════════════════════════ */
  .badge, .tag, [class*="badge"], [class*="tag"] {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: #FFF3E0;
    color: var(--or-fonce);
    border: 1.5px solid #F4C775;
    border-radius: 100px;
    font-size: 0.8rem;
    font-weight: 700;
    margin: 3px 2px;
    letter-spacing: 0.02em;
  }

  /* ══════════════════════════════════════
     SÉLECTION DE TEXTE
  ══════════════════════════════════════ */
  ::selection {
    background: rgba(249,115,22,0.18);
    color: var(--terre);
  }

  /* ══════════════════════════════════════
     SCROLLBAR DISCRÈTE
  ══════════════════════════════════════ */
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #F4C775; border-radius: 10px; }
</style>
`;

// ─────────────────────────────────────────────────────────────────
// CONFETTI — particules animées pour la victoire
// ─────────────────────────────────────────────────────────────────
const CONFETTI_COLORS = ['#F97316','#10B981','#F59E0B','#3B82F6','#EF4444','#8B5CF6','#EC4899','#14B8A6','#FBBF24','#34D399'];

function ConfettiPluie({ actif }) {
  const pieces = useMemo(() => {
    if (!actif) return [];
    return Array.from({ length: 36 }, (_, i) => ({
      id: i,
      left:     4 + (i * 2.6) % 92,
      delay:    (i * 0.09) % 1.6,
      duration: 1.6 + (i * 0.11) % 1.4,
      color:    CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      w:        6 + (i * 2) % 8,
      h:        4 + (i * 3) % 6,
      rot:      (i * 73) % 540,
    }));
  }, [actif]);

  if (!actif) return null;
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 60 }}>
      {pieces.map(p => (
        <motion.div key={p.id}
          initial={{ y: -16, opacity: 1, rotate: 0 }}
          animate={{ y: '105vh', opacity: [1, 1, 0.7, 0], rotate: p.rot }}
          transition={{ duration: p.duration, delay: p.delay, ease: [0.2, 0, 0.8, 1] }}
          style={{
            position: 'absolute', top: 0, left: `${p.left}%`,
            width: p.w, height: p.h,
            background: p.color, borderRadius: 2,
          }}
        />
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// SCORE OVERLAY — partagé entre les deux modes de cours
// Règle : max 2 fautes pour valider — recommencer OBLIGATOIRE si échec
// ─────────────────────────────────────────────────────────────────
function ScoreOverlay({ overlay, onRetour, onReessayer }) {
  // Les hooks doivent être appelés avant tout early return
  const nbErreurs = overlay ? (overlay.nbErreurs ?? (overlay.nbTotal - overlay.nbCorrectes)) : 0;
  const valide    = !!(overlay?.maitrise && overlay?.avecQCM);
  const nbEtoiles = valide ? (nbErreurs === 0 ? 3 : nbErreurs === 1 ? 2 : 1) : 0;

  const champCfg = useMemo(() => {
    if (!overlay) return {};
    if (overlay.avecQCM === false) return { icon:'📖', titre:'Cours terminé !', bg:'from-blue-50', titreCls:'text-tate-terre' };
    if (!overlay.maitrise) return {
      icon: nbErreurs >= 6 ? '📚' : nbErreurs >= 4 ? '😞' : '😓',
      titre: `${nbErreurs} faute${nbErreurs > 1 ? 's' : ''}`,
      sous:  'Non validé — recommence !',
      bg:    'from-red-50', titreCls: 'text-alerte',
    };
    if (nbErreurs === 0) return { icon:'🥇', titre:'PARFAIT !',    sous:'Zéro faute — tu es un vrai champion !',       bg:'from-amber-50',  titreCls:'text-amber-500' };
    if (nbErreurs === 1) return { icon:'🏆', titre:'EXCELLENT !',  sous:'1 seule faute — performance remarquable !',   bg:'from-yellow-50', titreCls:'text-yellow-600' };
    return             { icon:'⭐', titre:'BRAVO !',      sous:'2 fautes — limite respectée. Chapitre validé !', bg:'from-green-50',  titreCls:'text-succes' };
  }, [overlay, nbErreurs]);

  if (!overlay) return null;

  return (
    <>
      {/* Confettis hors du card */}
      <ConfettiPluie actif={valide} />

      <AnimatePresence>
        {overlay && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">

            <motion.div
              initial={{ scale: 0.75, opacity: 0, y: 40 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: 'spring', bounce: 0.42, duration: 0.5 }}
              className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden">

              {/* ══════════ VICTOIRE ══════════ */}
              {valide && (
                <>
                  {/* Zone trophée */}
                  <div className={`px-6 pt-10 pb-6 text-center bg-gradient-to-b ${champCfg.bg} to-white relative overflow-hidden`}>
                    {/* Halo lumineux derrière l'icône */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <motion.div
                        animate={{ scale: [1, 1.18, 1], opacity: [0.25, 0.45, 0.25] }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-40 h-40 rounded-full bg-tate-soleil/20"
                      />
                    </div>

                    {/* Grande icône */}
                    <motion.div
                      initial={{ scale: 0, rotate: -25 }}
                      animate={{ scale: [0, 1.35, 1], rotate: [-25, 8, 0] }}
                      transition={{ duration: 0.55, delay: 0.05, ease: 'easeOut' }}
                      className="relative text-8xl leading-none mb-3"
                      style={{ filter: 'drop-shadow(0 10px 24px rgba(249,115,22,0.45))' }}>
                      {champCfg.icon}
                    </motion.div>

                    {/* Titre PARFAIT / EXCELLENT / BRAVO */}
                    <motion.h2
                      initial={{ opacity: 0, y: 14, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 0.3, type: 'spring', bounce: 0.4 }}
                      className={`text-4xl font-black tracking-tight mb-0.5 ${champCfg.titreCls}`}
                      style={{ fontFamily: 'Georgia, serif', letterSpacing: '-0.01em' }}>
                      {champCfg.titre}
                    </motion.h2>
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.48 }}
                      className="text-sm text-tate-terre/55 mb-5">
                      {champCfg.sous}
                    </motion.p>

                    {/* ⭐⭐⭐ étoiles animées */}
                    <div className="flex justify-center gap-4 mb-4">
                      {[1, 2, 3].map(i => (
                        <motion.div key={i}
                          initial={{ scale: 0, rotate: 60, opacity: 0 }}
                          animate={i <= nbEtoiles
                            ? { scale: [0, 1.6, 1.1, 1], rotate: [60, -12, 5, 0], opacity: 1 }
                            : { scale: 1, opacity: 0.15 }
                          }
                          transition={{ delay: 0.58 + i * 0.18, type: 'spring', bounce: 0.7 }}>
                          <Star size={40}
                            className={i <= nbEtoiles
                              ? 'fill-tate-soleil text-tate-soleil drop-shadow-sm'
                              : 'text-gray-200 fill-gray-100'
                            }
                          />
                        </motion.div>
                      ))}
                    </div>

                    {/* Pills stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.0 }}
                      className="flex items-center justify-center gap-2 flex-wrap">
                      <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-xl text-xs font-bold">
                        ✓ {overlay.nbCorrectes}/{overlay.nbTotal} bonnes
                      </span>
                      <span className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                        nbErreurs === 0 ? 'bg-green-50 text-green-600' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {nbErreurs === 0 ? '🎯 Sans faute !' : `${nbErreurs} faute${nbErreurs > 1 ? 's' : ''}`}
                      </span>
                      {overlay.tentative > 1 && (
                        <span className="bg-tate-doux text-tate-terre/55 px-3 py-1.5 rounded-xl text-xs font-bold">
                          essai #{overlay.tentative}
                        </span>
                      )}
                    </motion.div>
                  </div>

                  {/* Bouton suivant */}
                  <div className="px-6 pb-6 pt-3">
                    <motion.button
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 1.15 }}
                      onClick={onRetour}
                      whileHover={{ scale: 1.02, boxShadow: '0 8px 32px rgba(249,115,22,0.45)' }}
                      whileTap={{ scale: 0.97 }}
                      className="w-full py-4 rounded-2xl font-black text-base tracking-wide flex items-center justify-center gap-2.5"
                      style={{
                        background: 'linear-gradient(135deg, #F97316, #EA580C)',
                        color: 'white',
                        boxShadow: '0 6px 24px rgba(249,115,22,0.40)',
                        letterSpacing: '0.02em',
                      }}>
                      <Trophy size={19} />
                      Chapitre suivant !
                    </motion.button>
                  </div>
                </>
              )}

              {/* ══════════ COURS SANS QCM terminé ══════════ */}
              {overlay.avecQCM === false && (
                <>
                  <div className="px-6 pt-8 pb-6 text-center">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.55, delay: 0.1 }}
                      className="text-6xl mb-3">📖</motion.div>
                    <h2 className="text-xl font-serif font-bold text-tate-terre mb-2">Cours terminé !</h2>
                    <p className="text-sm text-tate-terre/50">Chapitre enregistré — continue comme ça !</p>
                  </div>
                  <div className="px-6 pb-6">
                    <button onClick={onRetour}
                      className="btn-tate w-full py-3.5 flex items-center justify-center gap-2">
                      Continuer
                    </button>
                  </div>
                </>
              )}

              {/* ══════════ ÉCHEC — RECOMMENCER OBLIGATOIRE ══════════ */}
              {!overlay.maitrise && overlay.avecQCM && (
                <>
                  <div className="px-6 pt-8 pb-5 text-center bg-gradient-to-b from-red-50 to-white">
                    {/* Icône secouée */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1, x: [0, -6, 6, -4, 4, 0] }}
                      transition={{ scale: { type:'spring', bounce:0.5, delay:0.1 }, x: { delay: 0.55, duration: 0.5 } }}
                      className="text-7xl mb-3">
                      {nbErreurs >= 6 ? '📚' : '😓'}
                    </motion.div>

                    <motion.h2
                      initial={{ opacity:0, y:10 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay:0.3 }}
                      className="text-3xl font-black text-alerte mb-1"
                      style={{ fontFamily:'Georgia, serif' }}>
                      {nbErreurs} faute{nbErreurs > 1 ? 's' : ''}
                    </motion.h2>
                    <p className="text-sm text-tate-terre/60 mb-5">
                      Il faut <strong className="text-tate-terre">au maximum 2 fautes</strong> pour valider ce chapitre.
                    </p>

                    {/* Barre d'erreurs */}
                    <div className="mx-4 mb-4">
                      <div className="flex items-center justify-between text-xs text-tate-terre/40 mb-1.5">
                        <span>Tes réponses</span>
                        <span>{overlay.nbCorrectes} ✓ · {nbErreurs} ✗</span>
                      </div>
                      <div className="h-4 bg-tate-doux rounded-full overflow-hidden flex">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(overlay.nbCorrectes / overlay.nbTotal) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.4 }}
                          className="h-full bg-succes rounded-l-full"
                        />
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(nbErreurs / overlay.nbTotal) * 100}%` }}
                          transition={{ duration: 0.7, delay: 0.6 }}
                          className="h-full bg-alerte rounded-r-full"
                        />
                      </div>
                    </div>

                    {/* Seuil limite */}
                    <div className="flex items-center justify-center gap-2">
                      {[...Array(Math.min(overlay.nbTotal, 8))].map((_, i) => (
                        <div key={i}
                          className={`w-3 h-3 rounded-full transition-all ${
                            i < overlay.nbCorrectes ? 'bg-succes' : 'bg-alerte'
                          }`}
                        />
                      ))}
                    </div>
                    {overlay.tentative > 1 && (
                      <p className="text-xs text-tate-terre/30 mt-3">Tentative n°{overlay.tentative}</p>
                    )}
                  </div>

                  {/* Conseil + bouton UNIQUE */}
                  <div className="px-6 pb-6 pt-3 space-y-3">
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 text-sm text-amber-800 leading-relaxed text-center">
                      💡 <strong>Relis attentivement le cours</strong> en te concentrant sur les points difficiles, puis réessaie !
                    </div>

                    {/* ─ PAS de "Retour aux chapitres" — SEUL le bouton Recommencer ─ */}
                    <motion.button
                      initial={{ opacity:0, y:8 }}
                      animate={{ opacity:1, y:0 }}
                      transition={{ delay:0.45 }}
                      onClick={onReessayer}
                      whileHover={{ scale:1.02 }}
                      whileTap={{ scale:0.97 }}
                      className="w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2.5 tracking-wide"
                      style={{
                        background:'linear-gradient(135deg,#1C0A00,#3D1500)',
                        color:'white',
                        boxShadow:'0 5px 20px rgba(28,10,0,0.30)',
                        letterSpacing:'0.02em',
                      }}>
                      <RotateCcw size={17} /> Recommencer le cours
                    </motion.button>
                  </div>
                </>
              )}

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────
// PAGE COURS FORMATÉ — pour leçons Claude (contenuFormate)
// Design : cours + séparateur + exercices interactifs
// ─────────────────────────────────────────────────────────────────
function PageCoursFormate() {
  const { leconActive, chapitreActif, retourAccueil, soumettreScore } = useEleveStore();
  const [phase,       setPhase]       = useState('cours'); // 'cours' | 'exercices'
  const [exoIndex,    setExoIndex]    = useState(0);
  const [reveles,     setReveles]     = useState({});   // { [index]: true }
  const [corrects,    setCorrects]    = useState({});   // { [index]: true|false }
  const [scoreOverlay,setScoreOverlay]= useState(null);
  const [submitting,  setSubmitting]  = useState(false);
  const topRef = useRef(null);

  if (!leconActive || !chapitreActif) return null;

  const cf       = leconActive.contenuFormate || {};
  const exercices = cf.correctionsTypes || [];
  const exoActif  = exercices[exoIndex];
  const nbExos    = exercices.length;
  const exosFaits = Object.keys(reveles).length;

  const revelerReponse = (i) => setReveles(r => ({ ...r, [i]: true }));
  const marquerCorrect = (i, ok) => setCorrects(c => ({ ...c, [i]: ok }));

  const passerExercices = () => {
    setPhase('exercices');
    setExoIndex(0);
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const terminer = async () => {
    setSubmitting(true);
    try {
      const nbCorrectes = Object.values(corrects).filter(Boolean).length;
      const nbTotal     = Object.keys(corrects).length || 1;
      const nbErreurs   = nbTotal - nbCorrectes;
      const score       = Math.round((nbCorrectes / nbTotal) * 100);
      const result = await soumettreScore({
        chapitreId: chapitreActif._id,
        leconId:    leconActive._id,
        score: exosFaits === 0 ? 100 : score,
        nbCorrectes: exosFaits === 0 ? 1 : nbCorrectes,
        nbTotal:     exosFaits === 0 ? 1 : nbTotal,
      });
      setScoreOverlay({
        score:       exosFaits === 0 ? 100 : score,
        nbCorrectes: exosFaits === 0 ? 1 : nbCorrectes,
        nbTotal:     exosFaits === 0 ? 1 : nbTotal,
        nbErreurs:   exosFaits === 0 ? 0 : nbErreurs,
        maitrise:    result.maitrise,
        tentative:   result.tentative,
        avecQCM:     exosFaits > 0,
      });
    } catch (e) {
      toast.error(e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div ref={topRef} className="fixed inset-0 bg-tate-creme overflow-y-auto" style={{ zIndex: 9999 }}>

      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur border-b border-tate-border px-4 py-3 flex items-center gap-3 shadow-card">
        <button onClick={retourAccueil}
          className="flex items-center gap-1 px-2.5 h-9 rounded-xl bg-tate-doux text-tate-terre/70 hover:bg-tate-soleil/20 hover:text-tate-terre transition-all flex-shrink-0 font-semibold text-xs">
          <ChevronLeft size={16} />
          Retour
        </button>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-tate-terre text-sm truncate">{chapitreActif.titre}</p>
          <p className="text-xs text-tate-terre/40 mt-0.5">
            {phase === 'cours' ? '📖 Cours' : `📝 Exercices · ${exoIndex + 1}/${nbExos}`}
          </p>
        </div>
        {/* Tabs cours / exercices */}
        {nbExos > 0 && (
          <div className="flex bg-tate-doux rounded-xl p-0.5 gap-0.5 flex-shrink-0">
            <button onClick={() => setPhase('cours')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${phase === 'cours' ? 'bg-white shadow text-tate-terre' : 'text-tate-terre/50'}`}>
              Cours
            </button>
            <button onClick={passerExercices}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${phase === 'exercices' ? 'bg-white shadow text-tate-terre' : 'text-tate-terre/50'}`}>
              S'exercer
              {nbExos > 0 && <span className={`text-[10px] px-1.5 rounded-full font-bold ${phase === 'exercices' ? 'bg-tate-soleil text-white' : 'bg-tate-terre/20 text-tate-terre'}`}>{nbExos}</span>}
            </button>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">

        {/* ── PHASE COURS ──────────────────────────────────────── */}
        {phase === 'cours' && (
          <motion.div key="cours" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
            className="max-w-2xl mx-auto px-4 py-6 space-y-4 pb-32">

            {/* Objectif */}
            {cf.objectif && (
              <div className="bg-tate-soleil/10 border-2 border-tate-soleil/30 rounded-2xl p-4 flex items-start gap-3">
                <span className="text-xl flex-shrink-0 mt-0.5">🎯</span>
                <div>
                  <p className="text-xs font-bold text-tate-soleil uppercase tracking-wide mb-1">Objectif</p>
                  <p className="text-sm text-tate-terre font-medium leading-relaxed">{cf.objectif}</p>
                </div>
              </div>
            )}

            {/* Résumé du cours */}
            {cf.resume && (
              <div className="bg-white rounded-2xl border-2 border-tate-border p-5 shadow-card">
                <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-base">📋</span> Résumé du cours
                </p>
                <p className="text-sm text-tate-terre leading-relaxed whitespace-pre-line">{cf.resume}</p>
              </div>
            )}

            {/* Règle principale */}
            {cf.regle && (
              <div className="rounded-2xl border-2 border-tate-soleil overflow-hidden shadow-tate">
                <div className="bg-tate-soleil px-4 py-2.5 flex items-center gap-2">
                  <span className="text-lg">📌</span>
                  <p className="text-sm font-bold text-tate-terre">Règle principale à retenir</p>
                </div>
                <div className="bg-tate-doux px-5 py-4">
                  <p className="text-sm text-tate-terre font-semibold leading-relaxed">{cf.regle}</p>
                </div>
              </div>
            )}

            {/* Exemples */}
            {cf.exemples?.length > 0 && (
              <div className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-card">
                <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-base">✏️</span> Exemples
                </p>
                <div className="space-y-2.5">
                  {cf.exemples.map((ex, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-green-100 text-green-700 text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm text-tate-terre leading-relaxed">{ex}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pièges à éviter */}
            {cf.pieges?.length > 0 && (
              <div className="bg-red-50 rounded-2xl border-2 border-red-200 p-5">
                <p className="text-xs font-bold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-base">⚠️</span> Pièges à éviter
                </p>
                <div className="space-y-2">
                  {cf.pieges.map((p, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-red-500 flex-shrink-0 mt-0.5">❌</span>
                      <p className="text-sm text-red-800 leading-relaxed">{p}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mémo éclair */}
            {cf.resumeMemo?.length > 0 && (
              <div className="bg-violet-50 rounded-2xl border-2 border-violet-200 p-5">
                <p className="text-xs font-bold text-violet-700 uppercase tracking-wide mb-3 flex items-center gap-2">
                  <span className="text-base">⚡</span> Mémo éclair
                </p>
                <div className="space-y-2">
                  {cf.resumeMemo.map((m, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Star size={12} className="text-violet-500 flex-shrink-0 fill-violet-500" />
                      <p className="text-sm text-violet-900 font-medium">{m}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* CTA vers exercices — carte attractive plein écran */}
            {nbExos > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35, type: 'spring', bounce: 0.3 }}
                className="mt-8 mb-4">

                {/* Séparateur "cours terminé" */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tate-border to-transparent" />
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 border border-green-200">
                    <CheckCircle size={12} className="text-succes" />
                    <span className="text-xs font-bold text-succes">Cours lu</span>
                  </div>
                  <div className="flex-1 h-px bg-gradient-to-r from-transparent via-tate-border to-transparent" />
                </div>

                {/* Carte "S'exercer" attractive */}
                <button
                  onClick={passerExercices}
                  className="group w-full rounded-3xl overflow-hidden shadow-tate hover:shadow-xl transition-all duration-300 active:scale-[0.97] block text-left">
                  {/* Header foncé */}
                  <div className="bg-gradient-to-r from-tate-terre via-tate-terre to-amber-900 px-6 py-5 flex items-center gap-4">
                    <motion.div
                      animate={{ rotate: [0, -8, 8, -4, 0] }}
                      transition={{ delay: 0.8, duration: 0.5 }}
                      className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center text-3xl shadow-lg flex-shrink-0 group-hover:scale-110 transition-transform">
                      📝
                    </motion.div>
                    <div className="flex-1 min-w-0">
                      <p className="text-tate-soleil text-[10px] font-bold uppercase tracking-widest mb-0.5">Cours terminé !</p>
                      <h3 className="text-white font-serif font-bold text-xl leading-tight">Passer aux exercices</h3>
                      <p className="text-white/60 text-xs mt-1">{nbExos} exercice{nbExos > 1 ? 's' : ''} t'attendent</p>
                    </div>
                    <div className="bg-tate-soleil/20 border border-tate-soleil/40 text-tate-soleil text-sm font-bold px-3 py-1.5 rounded-xl flex-shrink-0">
                      {nbExos}
                    </div>
                  </div>
                  {/* Footer doré */}
                  <div className="bg-tate-soleil px-6 py-3.5 flex items-center justify-between">
                    <span className="text-tate-terre font-bold text-sm">Passer aux exercices →</span>
                    <ChevronRight size={20} className="text-tate-terre group-hover:translate-x-1.5 transition-transform duration-200" />
                  </div>
                </button>
              </motion.div>
            )}

            {/* Terminer sans exercices */}
            {nbExos === 0 && (
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={terminer} disabled={submitting}
                className="btn-succes w-full py-4 text-base font-bold flex items-center justify-center gap-2 rounded-3xl mt-8">
                {submitting ? '⏳ Enregistrement…' : '✅ Cours terminé — Valider'}
              </motion.button>
            )}
          </motion.div>
        )}

        {/* ── PHASE EXERCICES ───────────────────────────────────── */}
        {phase === 'exercices' && exoActif && (
          <motion.div key={`exo-${exoIndex}`}
            initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
            className="max-w-2xl mx-auto px-4 py-6 pb-36">

            {/* Barre de progression */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-tate-terre/50 mb-2">
                <span>Question {exoIndex + 1} sur {nbExos}</span>
                <span>{exosFaits} révélée{exosFaits > 1 ? 's' : ''}</span>
              </div>
              <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${((exoIndex + 1) / nbExos) * 100}%` }}
                  transition={{ duration: 0.4 }}
                  className="h-full rounded-full bg-gradient-to-r from-tate-soleil to-amber-400" />
              </div>
            </div>

            {/* Carte question */}
            <div className="bg-white rounded-3xl border-2 border-tate-border shadow-card-lg overflow-hidden mb-4">
              {/* En-tête numéro */}
              <div className="bg-gradient-to-r from-tate-soleil to-amber-400 px-5 py-3 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-tate-terre/20 flex items-center justify-center font-bold text-tate-terre text-sm">
                  {exoIndex + 1}
                </div>
                <p className="text-sm font-bold text-tate-terre">Question</p>
                <span className="ml-auto text-xs text-tate-terre/60">{exoIndex + 1}/{nbExos}</span>
              </div>

              {/* Question */}
              <div className="p-5">
                <p className="text-base text-tate-terre font-medium leading-relaxed mb-5">
                  {exoActif.question}
                </p>

                {/* Bouton révéler / réponse */}
                <AnimatePresence mode="wait">
                  {!reveles[exoIndex] ? (
                    <motion.button key="btn" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      onClick={() => revelerReponse(exoIndex)}
                      className="w-full py-3.5 rounded-2xl border-2 border-tate-soleil/40 bg-tate-doux text-tate-terre font-bold text-sm hover:bg-tate-soleil/10 hover:border-tate-soleil transition-all flex items-center justify-center gap-2">
                      <Eye size={16} /> Voir la réponse
                    </motion.button>
                  ) : (
                    <motion.div key="reponse" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      {/* Réponse */}
                      <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 mb-3">
                        <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <CheckCircle size={13} /> Réponse correcte
                        </p>
                        <p className="text-sm font-bold text-green-800 leading-relaxed">
                          {exoActif.reponse}
                        </p>
                      </div>
                      {/* Explication */}
                      {exoActif.explication && (
                        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-4">
                          <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-1.5">💡 Explication</p>
                          <p className="text-sm text-blue-900 leading-relaxed">{exoActif.explication}</p>
                        </div>
                      )}
                      {/* Auto-évaluation */}
                      {corrects[exoIndex] === undefined && (
                        <div>
                          <p className="text-xs text-center text-tate-terre/50 mb-2.5">Est-ce que tu avais trouvé ?</p>
                          <div className="flex gap-3">
                            <button onClick={() => marquerCorrect(exoIndex, true)}
                              className="flex-1 py-2.5 rounded-xl bg-green-100 text-green-700 border-2 border-green-200 font-bold text-sm hover:bg-green-200 transition-all flex items-center justify-center gap-1.5">
                              <CheckCircle size={14} /> Oui, j'avais bon !
                            </button>
                            <button onClick={() => marquerCorrect(exoIndex, false)}
                              className="flex-1 py-2.5 rounded-xl bg-orange-100 text-orange-700 border-2 border-orange-200 font-bold text-sm hover:bg-orange-200 transition-all flex items-center justify-center gap-1.5">
                              <X size={14} /> Non, j'avais tort
                            </button>
                          </div>
                        </div>
                      )}
                      {corrects[exoIndex] !== undefined && (
                        <div className={`text-center py-2 rounded-xl text-sm font-bold ${corrects[exoIndex] ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                          {corrects[exoIndex] ? '✅ Bravo, tu avais bon !' : '📚 Continue à réviser !'}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Navigation */}
            <div className="flex gap-3 items-center mb-4">
              <button
                onClick={() => { setExoIndex(i => Math.max(0, i - 1)); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                disabled={exoIndex === 0}
                className="flex-1 py-3 rounded-2xl border-2 border-tate-border bg-white text-tate-terre font-bold text-sm hover:bg-tate-doux disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-1.5">
                <ChevronLeft size={16} /> Précédent
              </button>

              {exoIndex < nbExos - 1 ? (
                <button
                  onClick={() => { setExoIndex(i => i + 1); topRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                  className="flex-1 py-3 rounded-2xl bg-tate-terre text-white font-bold text-sm hover:bg-tate-terre/85 transition-all flex items-center justify-center gap-1.5">
                  Suivant <ChevronRight size={16} />
                </button>
              ) : (
                <button onClick={terminer} disabled={submitting}
                  className="flex-1 py-3 rounded-2xl bg-succes text-white font-bold text-sm hover:bg-succes/85 transition-all flex items-center justify-center gap-1.5">
                  {submitting ? '⏳…' : <><CheckCircle size={14} /> Terminer</>}
                </button>
              )}
            </div>

            {/* Retour au cours */}
            <button onClick={() => setPhase('cours')}
              className="w-full py-2 text-xs text-tate-terre/40 hover:text-tate-terre transition-colors">
              ← Revoir le cours
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <ScoreOverlay overlay={scoreOverlay} onRetour={retourAccueil} onReessayer={nbExos > 0 ? () => { setScoreOverlay(null); setReveles({}); setCorrects({}); setExoIndex(0); setPhase('exercices'); } : null} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Utilitaire : scinder le HTML cours / exercices
// Détecte le titre "Exercices", "QCM", "Questions", etc.
// ─────────────────────────────────────────────────────────────────
function splitCourseExercices(html) {
  if (!html) return { coursHTML: '', exercicesHTML: '', aExercices: false };
  const patterns = [
    // QCM (titre h1, h2, h3, h4 — peu importe le style ou la casse)
    /<h[1-4][^>]*>[^<]*QCM[^<]*<\/h[1-4]>/i,
    // "Exercices", "Exercice"
    /<h[1-4][^>]*>\s*[^<]*[Ee]xercices?[^<]*<\/h[1-4]>/,
    /<h[1-4][^>]*>\s*[^<]*[Ee]xercises?[^<]*<\/h[1-4]>/,
    // "Questions" (section de QCM)
    /<h[1-4][^>]*>[^<]*Questions[^<]*<\/h[1-4]>/i,
    // "À toi", "Pratique", "Application", "Entraînement"
    /<h[1-4][^>]*>\s*[^<]*(À toi|A toi|Pratique|Entraînement|Entraînement|Application)[^<]*<\/h[1-4]>/i,
    // Sections ou divs marquées exercice/qcm
    /<section[^>]*(?:class|id)="[^"]*(?:exercice|qcm)[^"]*"/i,
    /<div[^>]*(?:class|id)="[^"]*(?:exercice|qcm)[^"]*"/i,
  ];
  for (const re of patterns) {
    const idx = html.search(re);
    if (idx !== -1) {
      return {
        coursHTML:     html.slice(0, idx),
        exercicesHTML: html.slice(idx),
        aExercices:    true,
      };
    }
  }
  return { coursHTML: html, exercicesHTML: '', aExercices: false };
}

// ─────────────────────────────────────────────
// PAGE COURS HTML — plein écran iframe
// Phase 'cours' : affiche uniquement le contenu de cours
// Phase 'exercices' : affiche uniquement les exercices + validation
// ─────────────────────────────────────────────
function PageCoursHTML() {
  const { leconActive, chapitreActif, retourAccueil, soumettreScore } = useEleveStore();
  const iframeRef = useRef(null);

  const [phaseHTML,    setPhaseHTML]    = useState('cours'); // 'cours' | 'exercices'
  const [scoreOverlay, setScoreOverlay] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [erreur,       setErreur]       = useState('');
  const [aDesQCM,      setADesQCM]      = useState(null);

  // ── Scinder le HTML en cours + exercices ──────────────────────
  // (hook appelé avant le early return pour respecter les règles des hooks)
  const { coursHTML, exercicesHTML, aExercices } = useMemo(
    () => splitCourseExercices(leconActive?.contenuHTML || ''),
    [leconActive?.contenuHTML]
  );

  if (!leconActive || !chapitreActif) return null;

  // HTML affiché dans l'iframe selon la phase
  const htmlAffiche = phaseHTML === 'cours' ? coursHTML : exercicesHTML;

  const onIframeLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iDoc) return;
    const radios = iDoc.querySelectorAll('input[type="radio"][data-correct="true"]');
    setADesQCM(radios.length > 0);
  };

  const detecterEtValider = async () => {
    setErreur('');
    const iframe = iframeRef.current;
    if (!iframe) return;
    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iDoc) { setErreur("Impossible d'accéder au contenu."); return; }

    const groupes = {};
    iDoc.querySelectorAll('input[type="radio"]').forEach(input => {
      const name = input.name;
      if (!name) return;
      if (!groupes[name]) groupes[name] = { correct: null, selectionne: null, aReponseCorrecte: false };
      if (input.getAttribute('data-correct') === 'true') {
        groupes[name].correct = input.value;
        groupes[name].aReponseCorrecte = true;
      }
      if (input.checked) groupes[name].selectionne = input.value;
    });

    const questionsValides = Object.values(groupes).filter(g => g.aReponseCorrecte);
    const nbTotal = questionsValides.length;
    if (nbTotal === 0) {
      setErreur('Aucune question QCM trouvée dans les exercices.');
      return;
    }

    const nonRepondues = questionsValides.filter(g => g.selectionne === null);
    if (nonRepondues.length > 0) {
      setErreur(`Il reste ${nonRepondues.length} question${nonRepondues.length > 1 ? 's' : ''} sans réponse.`);
      return;
    }

    const nbCorrectes = questionsValides.filter(g => g.selectionne === g.correct).length;
    const nbErreurs   = nbTotal - nbCorrectes;
    const score       = Math.round((nbCorrectes / nbTotal) * 100);

    setSubmitting(true);
    try {
      const resultat = await soumettreScore({
        chapitreId: chapitreActif._id,
        leconId:    leconActive._id,
        score, nbCorrectes, nbTotal,
      });
      setScoreOverlay({ score, nbCorrectes, nbTotal, nbErreurs, maitrise: resultat.maitrise, tentative: resultat.tentative, avecQCM: true });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Erreur lors de la sauvegarde');
    } finally {
      setSubmitting(false);
    }
  };

  const terminerSansQCM = async () => {
    setSubmitting(true);
    try {
      const resultat = await soumettreScore({
        chapitreId: chapitreActif._id,
        leconId:    leconActive._id,
        score: 100, nbCorrectes: 1, nbTotal: 1,
      });
      setScoreOverlay({ score: 100, nbCorrectes: 1, nbTotal: 1, maitrise: true, tentative: resultat?.tentative || 1, avecQCM: false });
    } catch (e) {
      toast.error(e.response?.data?.error || e.message || 'Erreur');
    } finally {
      setSubmitting(false);
    }
  };

  const reessayer = () => {
    setScoreOverlay(null);
    setErreur('');
    setPhaseHTML('exercices');
    const iframe = iframeRef.current;
    if (!iframe) return;
    const iDoc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!iDoc) return;
    iDoc.querySelectorAll('input[type="radio"]').forEach(i => { i.checked = false; });
    iframe.contentWindow?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const allerAuxExercices = () => {
    setPhaseHTML('exercices');
    setADesQCM(null);
    setErreur('');
  };

  const revenirAuCours = () => {
    setPhaseHTML('cours');
    setErreur('');
  };

  /* Indicateur de phase (point coloré) */
  const phaseLabel = phaseHTML === 'cours'
    ? { dot: 'bg-blue-400', text: 'Lecture du cours', icon: '📖' }
    : { dot: 'bg-tate-soleil', text: 'Exercices', icon: '📝' };

  return (
    <div className="fixed inset-0 overflow-hidden" style={{ zIndex: 9999, background: '#FFFBF5' }}>

      {/* ── Header moderne ─────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-3 px-3"
           style={{
             height: 54,
             background: 'rgba(255,251,245,0.97)',
             backdropFilter: 'blur(12px)',
             borderBottom: '1px solid #F4C77555',
             boxShadow: '0 1px 16px rgba(249,115,22,0.08)',
           }}>

        {/* Bouton retour */}
        <button
          onClick={phaseHTML === 'exercices' && aExercices ? revenirAuCours : retourAccueil}
          className="flex items-center gap-1 h-9 px-3 rounded-xl font-semibold text-xs
                     text-tate-terre/70 hover:text-tate-terre transition-all flex-shrink-0"
          style={{ background: '#F4C77522', border: '1.5px solid #F4C77566' }}>
          <ChevronLeft size={15} strokeWidth={2.5} />
          {phaseHTML === 'exercices' && aExercices ? '← Cours' : '← Retour'}
        </button>

        {/* Titre + phase */}
        <div className="flex-1 min-w-0">
          <p className="font-bold text-tate-terre text-sm leading-tight truncate" style={{ fontFamily: 'Georgia, serif' }}>
            {chapitreActif.titre}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={`w-1.5 h-1.5 rounded-full ${phaseLabel.dot} inline-block`} />
            <span className="text-[10px] text-tate-terre/45 font-medium">{phaseLabel.icon} {phaseLabel.text}</span>
          </div>
        </div>

        {/* Pills cours / exercices */}
        {aExercices && (
          <div className="flex rounded-xl overflow-hidden flex-shrink-0"
               style={{ border: '1.5px solid #F4C77566', background: '#FFF3E0' }}>
            <button onClick={revenirAuCours}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${
                phaseHTML === 'cours'
                  ? 'bg-tate-terre text-white'
                  : 'text-tate-terre/50 hover:text-tate-terre'
              }`}>
              Cours
            </button>
            <button onClick={allerAuxExercices}
              className={`px-3 py-1.5 text-xs font-bold transition-all ${
                phaseHTML === 'exercices'
                  ? 'bg-tate-soleil text-tate-terre'
                  : 'text-tate-terre/50 hover:text-tate-terre'
              }`}>
              S'exercer
            </button>
          </div>
        )}
      </div>

      {/* ── Iframe plein écran ──────────────────────────────── */}
      <iframe
        key={phaseHTML}
        ref={iframeRef}
        srcDoc={IFRAME_CSS + htmlAffiche}
        title={chapitreActif.titre}
        onLoad={onIframeLoad}
        className="absolute border-none"
        style={{
          top: 54,
          left: 0,
          right: 0,
          width: '100%',
          height: 'calc(100% - 54px - 68px)',
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin"
      />

      {/* ── Barre du bas moderne ───────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4"
           style={{
             height: 68,
             background: 'rgba(255,251,245,0.97)',
             backdropFilter: 'blur(12px)',
             borderTop: '1px solid #F4C77555',
             boxShadow: '0 -4px 24px rgba(249,115,22,0.09)',
             display: 'flex',
             alignItems: 'center',
           }}>
        <div className="flex items-center gap-3 w-full max-w-2xl mx-auto">

          {phaseHTML === 'cours' ? (
            /* ── Phase COURS ─── */
            <>
              <button
                onClick={retourAccueil}
                className="w-10 h-10 rounded-xl flex items-center justify-center
                           text-tate-terre/50 hover:text-tate-terre transition-all flex-shrink-0"
                style={{ background: '#F4C77522', border: '1.5px solid #F4C77566' }}
                title="Accueil">
                <Home size={17} />
              </button>

              {aExercices ? (
                <button
                  onClick={allerAuxExercices}
                  className="flex-1 h-11 rounded-2xl font-bold text-sm transition-all
                             flex items-center justify-center gap-2 active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #F97316, #EA580C)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(249,115,22,0.35)',
                    letterSpacing: '0.01em',
                  }}>
                  <span>📝</span>
                  <span>Passer aux exercices</span>
                  <ChevronRight size={16} />
                </button>
              ) : (
                <button
                  onClick={terminerSansQCM}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-2xl font-bold text-sm transition-all
                             flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                  }}>
                  {submitting
                    ? <><span className="animate-spin inline-block">⏳</span> Enregistrement…</>
                    : <>✅ Cours terminé — Valider</>}
                </button>
              )}
            </>
          ) : (
            /* ── Phase EXERCICES ─── */
            <>
              <button
                onClick={revenirAuCours}
                className="w-10 h-10 rounded-xl flex items-center justify-center
                           text-tate-terre/50 hover:text-tate-terre transition-all flex-shrink-0"
                style={{ background: '#F4C77522', border: '1.5px solid #F4C77566' }}
                title="Revoir le cours">
                <ChevronLeft size={17} />
              </button>

              {erreur ? (
                <div className="flex-1 flex items-center gap-2 rounded-xl px-3 py-2"
                     style={{ background: '#FFF7ED', border: '1.5px solid #FED7AA' }}>
                  <span className="text-xs text-orange-700 flex-1">⚠️ {erreur}</span>
                  <button onClick={() => setErreur('')} className="text-orange-400 hover:text-orange-600 flex-shrink-0">
                    <X size={14} />
                  </button>
                </div>
              ) : aDesQCM === false ? (
                <button
                  onClick={terminerSansQCM}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-2xl font-bold text-sm transition-all
                             flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #10B981, #059669)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(16,185,129,0.30)',
                  }}>
                  {submitting
                    ? <><span className="animate-spin inline-block">⏳</span> Enregistrement…</>
                    : <>✅ Exercices terminés</>}
                </button>
              ) : (
                <button
                  onClick={detecterEtValider}
                  disabled={submitting}
                  className="flex-1 h-11 rounded-2xl font-bold text-sm transition-all
                             flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-60"
                  style={{
                    background: 'linear-gradient(135deg, #1C0A00, #3D1500)',
                    color: 'white',
                    boxShadow: '0 4px 16px rgba(28,10,0,0.25)',
                  }}>
                  {submitting
                    ? <><span className="animate-spin inline-block">⏳</span> Calcul du score…</>
                    : <>✅ Valider mes réponses</>}
                </button>
              )}
            </>
          )}
        </div>
      </div>

      <ScoreOverlay overlay={scoreOverlay} onRetour={retourAccueil} onReessayer={reessayer} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ROUTER PageCours — détecte le type et délègue au bon renderer
// ─────────────────────────────────────────────────────────────────
export function PageCours() {
  const { leconActive } = useEleveStore();
  if (!leconActive) return null;
  // Leçon HTML → rendu iframe
  if (leconActive.contenuHTML) return <PageCoursHTML />;
  // Leçon Claude formatée → rendu React structuré
  return <PageCoursFormate />;
}

// ─────────────────────────────────────────────────────────────
// Modal abonnement
// ─────────────────────────────────────────────────────────────
const PRIX_ABONNEMENT = 2000;

const AVANTAGES_PREMIUM = [
  { icone: '📚', label: 'Tous les chapitres débloqués', detail: 'CM1 jusqu\'à Terminale', premium: true },
  { icone: '♾️', label: 'Accès illimité', detail: 'Sans restriction', premium: true },
  { icone: '📊', label: 'Suivi de progression', detail: 'Scores, historique', premium: true },
  { icone: '📋', label: 'Rapports pour les parents', detail: 'Suivi partageable', premium: true },
  { icone: '👨‍🏫', label: 'Cours particuliers', detail: 'Réservation ouverte à tous', premium: false },
  { icone: '🎓', label: 'Révisions BFEM & BAC', detail: 'Examens nationaux ciblés', premium: true },
];

function ModalAbonnement({ onClose, motif }) {
  const [etape,        setEtape]        = useState('presentation');
  const [methode,      setMethode]      = useState(null);
  const [instructions, setInstructions] = useState(null);
  const [reference,    setReference]    = useState(null);
  const [loading,      setLoading]      = useState(false);

  const METHODES = [
    { code: 'wave',         label: 'Wave',         icone: '📱', couleur: 'border-blue-300 bg-blue-50 text-blue-800' },
    { code: 'orange_money', label: 'Orange Money', icone: '🟠', couleur: 'border-orange-300 bg-orange-50 text-orange-800' },
  ];

  const initierPaiement = async (m) => {
    setMethode(m);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/users/souscrire`, { methode: m.code }, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setReference(data.data.reference);
      setInstructions(data.data.instructions);
      setEtape('instructions');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  const confirmerPaiement = async () => {
    setLoading(true);
    try {
      await axios.post(`${API}/users/confirmer-paiement`, {}, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setEtape('attente');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
         onClick={onClose}>
      <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

        <div className="bg-gradient-to-r from-tate-soleil to-amber-400 p-5 relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full bg-black/10 hover:bg-black/20">
            <X size={14} className="text-tate-terre" />
          </button>
          <div className="w-10 h-10 rounded-xl bg-tate-terre/10 flex items-center justify-center
                          font-serif font-bold text-tate-terre text-lg mb-2">T</div>
          <h2 className="font-serif font-bold text-tate-terre text-lg">Taté Premium</h2>
          <p className="text-tate-terre/70 text-xs mt-0.5">
            {motif === 'chapitre' ? '📚 Ce chapitre est disponible avec Premium' : 'Accès illimité à toute la plateforme'}
          </p>
          <div className="mt-3 flex items-baseline gap-1">
            <span className="text-3xl font-serif font-bold text-tate-terre">{PRIX_ABONNEMENT.toLocaleString('fr-FR')}</span>
            <span className="text-tate-terre/70 text-sm">FCFA / mois</span>
          </div>
        </div>

        <div className="p-5 overflow-y-auto flex-1">
          <AnimatePresence mode="wait">
            {etape === 'presentation' && (
              <motion.div key="pres" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <div className="space-y-2 mb-5">
                  {AVANTAGES_PREMIUM.map((av, i) => (
                    <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl ${av.premium ? 'bg-tate-doux' : 'bg-green-50'}`}>
                      <span className="text-lg w-7 text-center flex-shrink-0">{av.icone}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-tate-terre leading-tight">{av.label}</p>
                        <p className="text-xs text-tate-terre/50">{av.detail}</p>
                      </div>
                      {av.premium
                        ? <Star size={14} className="text-tate-soleil fill-tate-soleil flex-shrink-0" />
                        : <CheckCircle size={14} className="text-succes flex-shrink-0" />
                      }
                    </div>
                  ))}
                </div>
                <button onClick={() => setEtape('choix')} className="btn-tate w-full py-3.5 text-sm font-bold">
                  S'abonner pour {PRIX_ABONNEMENT.toLocaleString('fr-FR')} FCFA/mois →
                </button>
              </motion.div>
            )}

            {etape === 'choix' && (
              <motion.div key="choix" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <p className="text-sm text-tate-terre/70 mb-4 text-center">Choisis ta méthode de paiement</p>
                <div className="space-y-3 mb-4">
                  {METHODES.map(m => (
                    <button key={m.code} onClick={() => initierPaiement(m)}
                      disabled={loading}
                      className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 font-semibold transition-all ${m.couleur} hover:shadow-md disabled:opacity-60`}>
                      <span className="text-2xl">{m.icone}</span>
                      <span>{m.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {etape === 'instructions' && instructions && (
              <motion.div key="instrs" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                {instructions.titre && (
                  <p className="text-sm font-bold text-tate-terre text-center mb-4">{instructions.titre}</p>
                )}
                <div className="bg-tate-doux rounded-2xl p-4 mb-4">
                  <p className="text-xs font-bold text-tate-terre/60 uppercase mb-2">Ta référence de paiement</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold text-tate-terre flex-1 text-sm break-all">{reference}</p>
                    <button onClick={() => navigator.clipboard.writeText(reference).then(() => toast.success('Référence copiée !'))}
                      className="p-1.5 rounded-lg hover:bg-tate-soleil/20 transition-colors flex-shrink-0">
                      <Copy size={14} className="text-tate-terre/60" />
                    </button>
                  </div>
                </div>

                {instructions.numero && (
                  <div className="bg-white border border-tate-border rounded-2xl p-4 mb-4 text-center">
                    <p className="text-xs text-tate-terre/50 mb-1">Numéro de paiement</p>
                    <p className="text-xl font-bold text-tate-terre tracking-widest">{instructions.numero}</p>
                    <button onClick={() => navigator.clipboard.writeText(instructions.numero).then(() => toast.success('Numéro copié !'))}
                      className="mt-2 text-xs text-savoir font-semibold hover:underline">
                      Copier le numéro
                    </button>
                  </div>
                )}

                {Array.isArray(instructions.etapes) && instructions.etapes.length > 0 && (
                  <div className="bg-white border border-tate-border rounded-2xl p-4 mb-4">
                    <p className="text-xs font-bold text-tate-terre/60 uppercase mb-3">Comment payer</p>
                    <ol className="space-y-2">
                      {instructions.etapes.map((etape, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-5 h-5 rounded-full bg-tate-soleil text-tate-terre text-xs font-bold
                                           flex items-center justify-center flex-shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <p className="text-sm text-tate-terre leading-relaxed">{etape}</p>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                <button onClick={confirmerPaiement} disabled={loading}
                  className="btn-tate w-full py-3.5 disabled:opacity-60">
                  {loading ? '⏳ Confirmation…' : "✅ J'ai effectué le paiement"}
                </button>
                <button onClick={() => setEtape('choix')}
                  className="w-full mt-2 py-2 text-xs text-tate-terre/40 hover:text-tate-terre transition-colors">
                  ← Changer de méthode
                </button>
              </motion.div>
            )}

            {etape === 'attente' && (
              <motion.div key="attente" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="text-center py-4">
                <Clock size={40} className="mx-auto text-tate-soleil mb-3" />
                <h3 className="font-serif font-bold text-tate-terre text-lg mb-2">Paiement reçu !</h3>
                <p className="text-sm text-tate-terre/60 mb-4">L'accès premium sera activé sous 24h.</p>
                <button onClick={onClose} className="btn-tate w-full py-3">Fermer</button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Carte chapitre — nouvelle version visuelle
// ─────────────────────────────────────────────────────────────────
function CarteChapitreBeauty({ chap, index, isValide, matiere, onClick }) {
  const valide = isValide(chap._id);
  return (
    <motion.button
      initial={{ opacity:0, y:10 }}
      animate={{ opacity:1, y:0 }}
      transition={{ delay: index * 0.04 }}
      onClick={onClick}
      className={`w-full text-left rounded-2xl border-2 p-4 transition-all group
        hover:shadow-md active:scale-[0.98]
        ${valide
          ? 'border-succes/30 bg-green-50/60 hover:border-succes/60'
          : `bg-white hover:border-${matiere?.dot?.replace('bg-','') || 'tate-soleil'} hover:bg-tate-doux/30`
        }
      `}
      style={{ borderColor: valide ? undefined : undefined }}>
      <div className="flex items-center gap-3">
        {/* Numéro / check */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 font-bold text-sm transition-all
          ${valide
            ? 'bg-succes text-white'
            : `bg-gradient-to-br ${matiere?.gradient || 'from-tate-soleil to-amber-500'} text-white`
          }`}>
          {valide ? <CheckCircle size={18} /> : <span>{index + 1}</span>}
        </div>

        {/* Titre + objectif */}
        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm leading-snug mb-0.5 ${valide ? 'text-succes' : 'text-tate-terre'}`}>
            {chap.titre}
          </p>
          {chap.objectif && (
            <p className="text-xs text-tate-terre/50 truncate leading-tight">{chap.objectif}</p>
          )}
        </div>

        {/* Flèche */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all
          group-hover:translate-x-0.5
          ${valide ? 'bg-succes/10 text-succes' : 'bg-tate-doux text-tate-terre/40 group-hover:bg-tate-soleil/20 group-hover:text-tate-terre'}`}>
          <ChevronRight size={14} />
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Sections Français — onglets redesignés
// ─────────────────────────────────────────────────────────────────
const SEC_TOUS = { key: '__tous__', label: 'Tous', icone: '📚', couleur: 'border-tate-soleil bg-tate-doux text-tate-terre', bar: 'bg-tate-soleil' };

function FrancaisOnglets({ chapitres, isValide, matiere, onDemarrer }) {
  const [onglet, setOnglet] = useState('__tous__');

  // Chapitres sans section définie
  const sectionKeys = SECTIONS_FR.map(s => s.key);
  const chapsAvecSection = chapitres.filter(c => sectionKeys.includes(getSectionChap(c)));
  const chapsSansSection = chapitres.filter(c => !sectionKeys.includes(getSectionChap(c)));

  // Construire la liste d'onglets à afficher (sections ayant au moins 1 chapitre + "Tous" toujours en premier)
  const secAvecChap = SECTIONS_FR.filter(s => chapitres.some(c => getSectionChap(c) === s.key));
  const onglets = [SEC_TOUS, ...secAvecChap];

  // Chapitres à afficher selon l'onglet actif
  const chapsOnglet = onglet === '__tous__'
    ? chapitres
    : chapitres.filter(c => getSectionChap(c) === onglet);

  const secActive = onglet === '__tous__' ? SEC_TOUS : (SECTIONS_FR.find(s => s.key === onglet) || SEC_TOUS);

  return (
    <div>
      {/* Onglets compacts scrollables */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
        {onglets.map(sec => {
          const total  = sec.key === '__tous__' ? chapitres.length : chapitres.filter(c => getSectionChap(c) === sec.key).length;
          const valides = sec.key === '__tous__'
            ? chapitres.filter(c => isValide(c._id)).length
            : chapitres.filter(c => getSectionChap(c) === sec.key && isValide(c._id)).length;
          const actif  = onglet === sec.key;
          return (
            <button key={sec.key} onClick={() => setOnglet(sec.key)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-xl border-2 text-xs font-semibold transition-all
                ${actif ? `${sec.couleur} shadow-sm` : 'border-tate-border bg-white text-tate-terre/60 hover:bg-tate-doux'}`}>
              <span>{sec.icone}</span>
              <span>{sec.label}</span>
              {total > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${actif ? 'bg-white/60' : 'bg-tate-doux'}`}>
                  {valides}/{total}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={onglet} initial={{ opacity:0, y:5 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} transition={{ duration:0.15 }}>
          {chapsOnglet.length === 0 ? (
            <div className="text-center py-12 bg-tate-creme rounded-2xl border-2 border-dashed border-tate-border">
              <span className="text-4xl block mb-3">{secActive?.icone}</span>
              <p className="text-sm font-semibold text-tate-terre/50">Aucun chapitre disponible</p>
              <p className="text-xs text-tate-terre/30 mt-1">Le contenu sera bientôt ajouté</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {chapsOnglet.map((chap, i) => (
                <CarteChapitreBeauty key={chap._id} chap={chap} index={i}
                  isValide={isValide} matiere={matiere} onClick={() => onDemarrer(chap)} />
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Carte matière — design attrayant
// ─────────────────────────────────────────────────────────────────
function CarteMatiere({ matiere, nbChapitres, nbValides, onClick }) {
  const pct = nbChapitres > 0 ? Math.round((nbValides / nbChapitres) * 100) : 0;
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-3xl border-2 border-tate-border overflow-hidden shadow-card hover:shadow-tate transition-all hover:border-tate-soleil/40 active:scale-[0.97]">
      {/* Bande couleur top */}
      <div className={`h-1.5 w-full bg-gradient-to-r ${matiere.gradient}`} />
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${matiere.gradient} flex items-center justify-center text-2xl shadow-sm flex-shrink-0`}>
            {matiere.icone}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-tate-terre text-base leading-tight">{matiere.nom}</p>
            <p className="text-xs text-tate-terre/50 mt-0.5">{nbChapitres} chapitre{nbChapitres !== 1 ? 's' : ''}</p>
          </div>
          <div className={`text-lg font-bold ${pct === 100 ? 'text-succes' : pct > 0 ? 'text-tate-soleil' : 'text-tate-terre/20'}`}>
            {pct === 100 ? '✅' : pct > 0 ? `${pct}%` : '→'}
          </div>
        </div>
        {/* Barre progression */}
        <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }} animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className={`h-full rounded-full bg-gradient-to-r ${matiere.gradient}`} />
        </div>
        <div className="flex justify-between text-[10px] text-tate-terre/40 mt-1.5">
          <span>{nbValides} validé{nbValides !== 1 ? 's' : ''}</span>
          <span>{nbChapitres - nbValides} restant{(nbChapitres - nbValides) !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </motion.button>
  );
}

// ─────────────────────────────────────────────────────────────────
// Vue chapitres pour une matière sélectionnée
// ─────────────────────────────────────────────────────────────────
function VueChapitres({ matiere, chapitres, isValide, nbValides, chargement, onDemarrer, onRetour }) {
  return (
    <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
      transition={{ duration:0.2 }}>

      {/* Bouton retour visible en haut */}
      <button onClick={onRetour}
        className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-xl bg-white border-2 border-tate-border text-tate-terre font-semibold text-sm hover:bg-tate-doux transition-all shadow-card">
        <ChevronLeft size={16} className="text-tate-terre" />
        ← Retour aux matières
      </button>

      {/* En-tête matière */}
      <div className={`rounded-2xl p-4 mb-5 bg-gradient-to-r ${matiere.gradient} relative overflow-hidden`}>
        {/* Cercle décoratif */}
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-6 w-10 h-10 rounded-full bg-white/10" />

        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl leading-none">{matiere.icone}</span>
          <div>
            <h2 className="font-serif font-bold text-white text-xl leading-tight">{matiere.nom}</h2>
            <p className="text-white/70 text-xs mt-0.5">
              {chargement ? 'Chargement…' : `${chapitres.length} chapitre${chapitres.length !== 1 ? 's' : ''} · ${nbValides} validé${nbValides !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Mini barre progression */}
        {!chargement && chapitres.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-white/30 overflow-hidden relative z-10">
            <motion.div initial={{ width:0 }} animate={{ width:`${Math.round((nbValides/chapitres.length)*100)}%` }}
              transition={{ duration:0.8, delay:0.2 }}
              className="h-full rounded-full bg-white/80" />
          </div>
        )}
      </div>

      {/* Contenu */}
      {chargement ? (
        <LoadingTate message={`Chargement des chapitres de ${matiere.nom}…`} />
      ) : chapitres.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-tate-border bg-white">
          <span className="text-5xl block mb-3">{matiere.icone}</span>
          <p className="font-semibold text-tate-terre">Aucun chapitre disponible</p>
          <p className="text-xs text-tate-terre/40 mt-1">Le contenu sera bientôt publié</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {chapitres.map((chap, i) => (
            <CarteChapitreBeauty key={chap._id} chap={chap} index={i}
              isValide={isValide} matiere={matiere} onClick={() => onDemarrer(chap)} />
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Vue chapitres Français avec sections
// ─────────────────────────────────────────────────────────────────
function VueChapitresFr({ matiere, chapitres, isValide, nbValides, chargement, onDemarrer, onRetour }) {
  return (
    <motion.div initial={{ opacity:0, x:20 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-20 }}
      transition={{ duration:0.2 }}>

      {/* Bouton retour visible en haut */}
      <button onClick={onRetour}
        className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-xl bg-white border-2 border-tate-border text-tate-terre font-semibold text-sm hover:bg-tate-doux transition-all shadow-card">
        <ChevronLeft size={16} className="text-tate-terre" />
        ← Retour aux matières
      </button>

      {/* En-tête matière */}
      <div className={`rounded-2xl p-4 mb-5 bg-gradient-to-r ${matiere.gradient} relative overflow-hidden`}>
        <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
        <div className="absolute -right-2 top-6 w-10 h-10 rounded-full bg-white/10" />

        <div className="flex items-center gap-3 relative z-10">
          <span className="text-3xl leading-none">{matiere.icone}</span>
          <div>
            <h2 className="font-serif font-bold text-white text-xl leading-tight">{matiere.nom}</h2>
            <p className="text-white/70 text-xs mt-0.5">
              {chargement ? 'Chargement…' : `${chapitres.length} chapitres · ${nbValides} validés`}
            </p>
          </div>
        </div>

        {!chargement && chapitres.length > 0 && (
          <div className="mt-3 h-1.5 rounded-full bg-white/30 overflow-hidden relative z-10">
            <motion.div initial={{ width:0 }} animate={{ width:`${Math.round((nbValides/chapitres.length)*100)}%` }}
              transition={{ duration:0.8, delay:0.2 }}
              className="h-full rounded-full bg-white/80" />
          </div>
        )}
      </div>

      {chargement ? (
        <LoadingTate message="Chargement des chapitres de Français…" />
      ) : chapitres.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-tate-border bg-white">
          <span className="text-5xl block mb-3">{matiere.icone}</span>
          <p className="font-semibold text-tate-terre">Aucun chapitre disponible</p>
          <p className="text-xs text-tate-terre/40 mt-1">Le contenu sera bientôt publié</p>
        </div>
      ) : (
        <FrancaisOnglets
          chapitres={chapitres}
          isValide={isValide}
          matiere={matiere}
          onDemarrer={onDemarrer}
        />
      )}
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// ACCUEIL ÉLÈVE — refonte complète
// ─────────────────────────────────────────────────────────────────
export function AccueilEleve() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { chapitres, chargerChapitres, ouvrirChapitre, leconActive, chargement } = useEleveStore();

  const [matiereActive,  setMatiereActive]  = useState(null);
  const [showPaywall,    setShowPaywall]    = useState(false);
  const [motifPaywall,   setMotifPaywall]   = useState('general');
  const [erreurCours,    setErreurCours]    = useState('');
  const [progression,    setProgression]    = useState([]);
  const [showAllProg,    setShowAllProg]    = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    axios.get(`${API}/resultats/ma-progression`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(({ data }) => setProgression(data.data || []))
      .catch(() => setProgression([]));
  }, []);

  if (leconActive) return <PageCours />;

  const aAcces = verifierAcces(user);
  const badge  = typeBadge(user);

  const chapitresValides = user?.chapitresValides || [];
  const isValide = (id) => chapitresValides.some(c => c.chapitreId === id || c.chapitreId?._id === id);
  const nbValidesMat  = chapitresValides.length;

  const matiereObj = MATIERES.find(m => m.id === matiereActive);
  const nbValidesMatiere = chapitresValides.filter(c =>
    chapitres.some(ch => (ch._id === c.chapitreId || ch._id === c.chapitreId?._id))
  ).length;

  const afficherSectionsFr = matiereActive === 'FR';

  const handleSelectMatiere = useCallback((mat) => {
    setMatiereActive(mat.id);
    setErreurCours('');
    chargerChapitres(user?.niveau, mat.code);
  }, [chargerChapitres, user?.niveau]);

  const handleDemarrer = async (chap) => {
    if (!aAcces) {
      setMotifPaywall('chapitre');
      setShowPaywall(true);
      return;
    }
    setErreurCours('');
    try {
      await ouvrirChapitre(chap);
    } catch (e) {
      setErreurCours(e.message || "Ce cours n'est pas encore disponible.");
    }
  };

  const handleRetour = () => {
    setMatiereActive(null);
    setErreurCours('');
  };

  return (
    <LayoutEleve activeTab="cours">

      {/* ── VUE CHAPITRES ─────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {matiereActive && matiereObj ? (
          <motion.div key="chapitres">
            {/* Erreur cours non disponible */}
            {erreurCours && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                className="rounded-2xl border-2 border-blue-200 bg-blue-50 text-center py-4 px-4 mb-4">
                <p className="text-sm font-semibold text-tate-terre mb-1">📚 Cours pas encore disponible</p>
                <p className="text-xs text-tate-terre/60 mb-2">{erreurCours}</p>
                <button onClick={() => setErreurCours('')} className="text-xs text-blue-600 font-semibold">← Fermer</button>
              </motion.div>
            )}

            {afficherSectionsFr ? (
              <VueChapitresFr
                matiere={matiereObj}
                chapitres={chapitres}
                isValide={isValide}
                nbValides={nbValidesMatiere}
                chargement={chargement}
                onDemarrer={handleDemarrer}
                onRetour={handleRetour}
              />
            ) : (
              <VueChapitres
                matiere={matiereObj}
                chapitres={chapitres}
                isValide={isValide}
                nbValides={nbValidesMatiere}
                chargement={chargement}
                onDemarrer={handleDemarrer}
                onRetour={handleRetour}
              />
            )}

            {/* CTA Réserver un cours — toujours visible */}
            <CTAReserver onAbonner={() => { setMotifPaywall('general'); setShowPaywall(true); }} />
          </motion.div>

        ) : (
          /* ── VUE ACCUEIL ──────────────────────────────────── */
          <motion.div key="accueil" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>

            {/* Hero */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-1">
                <h1 className="text-2xl font-serif font-bold text-tate-terre">
                  Bonjour, {user?.nom?.split(' ')[0]} 👋
                </h1>
                {user?.streak > 0 && (
                  <div className="flex items-center gap-1 bg-orange-50 border border-orange-200 rounded-full px-2.5 py-1">
                    <Flame size={13} className="text-orange-500" />
                    <span className="text-xs font-bold text-orange-700">{user.streak} jour{user.streak > 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-tate-terre/60">{user?.niveau}</span>
                {badge === 'domicile' && (
                  <span className="text-xs bg-savoir/10 text-savoir font-semibold px-2 py-0.5 rounded-full border border-savoir/20">🏠 Suivi à domicile</span>
                )}
                {badge === 'abonne' && (
                  <span className="text-xs bg-succes/10 text-succes font-semibold px-2 py-0.5 rounded-full border border-succes/20">⭐ Premium</span>
                )}
                {(badge === 'aucun' || badge === 'expire') && (
                  <span className="text-xs bg-tate-doux text-tate-terre/60 font-medium px-2 py-0.5 rounded-full">
                    {badge === 'expire' ? '⚠️ Abonnement expiré' : 'Compte gratuit'}
                  </span>
                )}
              </div>
            </div>

            {/* Carte progression globale */}
            <div className="bg-white rounded-2xl border-2 border-tate-border p-4 mb-5 shadow-card">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-tate-soleil/20 flex items-center justify-center">
                  <Trophy size={18} className="text-tate-soleil" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-tate-terre text-sm">Ma progression</p>
                  <p className="text-xs text-tate-terre/50">{nbValidesMat} chapitre{nbValidesMat !== 1 ? 's' : ''} validé{nbValidesMat !== 1 ? 's' : ''} au total</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-serif font-bold text-tate-soleil">{nbValidesMat}</p>
                  <p className="text-xs text-tate-terre/40">chapitres</p>
                </div>
              </div>
              {nbValidesMat > 0 && (
                <div className="h-2 rounded-full bg-tate-doux overflow-hidden">
                  <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(nbValidesMat * 5, 100)}%` }}
                    transition={{ duration:0.8 }}
                    className="h-full rounded-full bg-gradient-to-r from-tate-soleil to-amber-500" />
                </div>
              )}
            </div>

            {/* ── Mes notes récentes ──────────────────────────── */}
            {progression.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">📊</span>
                    <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wider">Mes notes</p>
                  </div>
                  {progression.length > 3 && (
                    <button onClick={() => setShowAllProg(v => !v)}
                      className="text-xs text-tate-soleil font-semibold hover:underline">
                      {showAllProg ? 'Réduire' : `Voir tout (${progression.length})`}
                    </button>
                  )}
                </div>
                <div className="space-y-2">
                  {(showAllProg ? progression : progression.slice(0, 3))
                    .sort((a, b) => new Date(b.derniereAt || 0) - new Date(a.derniereAt || 0))
                    .map((chap, i) => {
                      const derniereT = chap.tentatives[chap.tentatives.length - 1];
                      const lastErr   = derniereT?.nbErreurs ?? 0;
                      const lastScore = derniereT?.score ?? 0;
                      return (
                        <motion.div key={chap.chapitreId?._id || i}
                          initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }}
                          transition={{ delay: i * 0.04 }}
                          className={`bg-white rounded-2xl border-2 p-3 flex items-center gap-3 shadow-card ${
                            chap.maitrise ? 'border-green-200' : lastErr <= 3 ? 'border-amber-200' : 'border-red-100'
                          }`}>
                          {/* Icône statut */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg ${
                            chap.maitrise ? 'bg-green-100' : lastErr <= 3 ? 'bg-amber-50' : 'bg-red-50'
                          }`}>
                            {chap.maitrise
                              ? (lastErr === 0 ? '🥇' : lastErr === 1 ? '🏆' : '⭐')
                              : (lastErr <= 3 ? '💪' : '📚')}
                          </div>
                          {/* Infos chapitre */}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-tate-terre truncate">{chap.titre}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-xs text-tate-terre/40">
                                {chap.tentatives.length} tentative{chap.tentatives.length > 1 ? 's' : ''}
                              </span>
                              {chap.maitrise && (
                                <span className="text-xs text-succes font-semibold">✓ Validé</span>
                              )}
                            </div>
                            {/* Mini historique des scores */}
                            <div className="flex items-center gap-1 mt-1.5">
                              {chap.tentatives.slice(-5).map((t, j) => (
                                <div key={j} title={`Tentative ${t.tentative}: ${t.score}% (${t.nbErreurs ?? '?'} faute${(t.nbErreurs ?? 1) > 1 ? 's' : ''})`}
                                  className={`h-4 flex-1 rounded-sm text-[9px] font-bold flex items-center justify-center text-white ${
                                    t.maitrise ? 'bg-succes' : t.score >= 60 ? 'bg-amber-400' : 'bg-alerte'
                                  }`}>
                                  {t.score}
                                </div>
                              ))}
                            </div>
                          </div>
                          {/* Dernier score */}
                          <div className="text-right flex-shrink-0">
                            <p className={`text-xl font-bold ${
                              chap.maitrise ? 'text-succes' : lastErr <= 3 ? 'text-amber-500' : 'text-alerte'
                            }`}>{lastScore}%</p>
                            <p className="text-[10px] text-tate-terre/40 mt-0.5">
                              {lastErr} faute{lastErr !== 1 ? 's' : ''}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Bannière premium si pas d'accès */}
            {!aAcces && (
              <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                className="mb-5 rounded-2xl overflow-hidden border-2 border-amber-300 shadow-sm">
                <div className="bg-gradient-to-r from-tate-soleil to-amber-400 px-4 py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-tate-terre text-sm">
                      {badge === 'expire' ? '⚠️ Abonnement expiré' : '⭐ Accès complet à Taté'}
                    </p>
                    <p className="text-xs text-tate-terre/70 mt-0.5">
                      {PRIX_ABONNEMENT.toLocaleString('fr-FR')} FCFA/mois · Tous niveaux · BFEM & BAC
                    </p>
                  </div>
                  <button onClick={() => { setMotifPaywall('general'); setShowPaywall(true); }}
                    className="bg-tate-terre text-white text-xs font-bold px-4 py-2 rounded-xl
                               hover:bg-tate-terre/80 transition-all whitespace-nowrap flex-shrink-0">
                    {badge === 'expire' ? 'Renouveler' : "S'abonner"}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Titre section matières */}
            <div className="flex items-center gap-2 mb-3">
              <BookOpen size={15} className="text-tate-soleil" />
              <p className="text-xs font-bold text-tate-terre/60 uppercase tracking-wider">Choisir une matière</p>
            </div>

            {/* Grille matières */}
            <div className="grid grid-cols-2 gap-3 mb-5">
              {MATIERES.map(mat => (
                <CarteMatiere
                  key={mat.id}
                  matiere={mat}
                  nbChapitres={0}
                  nbValides={0}
                  onClick={() => handleSelectMatiere(mat)}
                />
              ))}
            </div>

            {/* BFEM ou BAC */}
            {(user?.niveau === '3eme' || user?.niveau === 'Terminale') && (
              <button onClick={() => navigate('/eleve/epreuves')}
                className={`w-full mb-4 rounded-2xl overflow-hidden border-2 transition-all hover:shadow-md group
                  ${user.niveau === '3eme' ? 'border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 hover:border-blue-400' : 'border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 hover:border-purple-400'}`}>
                <div className="px-4 py-3.5 flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0
                    ${user.niveau === '3eme' ? 'bg-blue-100 group-hover:bg-blue-200' : 'bg-purple-100 group-hover:bg-purple-200'} transition-all`}>
                    <GraduationCap size={20} className={user.niveau === '3eme' ? 'text-blue-700' : 'text-purple-700'} />
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-bold text-tate-terre">
                      {user.niveau === '3eme' ? 'Épreuves BFEM 🎓' : 'Épreuves BAC 🎓'}
                    </p>
                    <p className="text-xs text-tate-terre/50 mt-0.5">Sujets officiels · Corrigés détaillés</p>
                  </div>
                  <ChevronRight size={16} className={user.niveau === '3eme' ? 'text-blue-400' : 'text-purple-400'} />
                </div>
              </button>
            )}

            {/* CTA Réserver cours — toujours visible */}
            <CTAReserver onAbonner={() => { setMotifPaywall('general'); setShowPaywall(true); }} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal abonnement */}
      <AnimatePresence>
        {showPaywall && (
          <ModalAbonnement onClose={() => setShowPaywall(false)} motif={motifPaywall} />
        )}
      </AnimatePresence>
    </LayoutEleve>
  );
}

// ─────────────────────────────────────────────────────────────────
// CTA Réserver un cours — toujours visible
// ─────────────────────────────────────────────────────────────────
function CTAReserver({ onAbonner }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const badge = typeBadge(user);
  const isPremium = badge === 'domicile' || badge === 'abonne';

  if (isPremium) return null; // Les premium n'ont pas besoin du CTA

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="mt-6 rounded-3xl overflow-hidden shadow-glow border-2 border-tate-soleil/30"
      style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFF4E6 100%)' }}>
      <div className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-tate-soleil to-amber-500 flex items-center justify-center shadow-tate">
            <GraduationCap size={22} className="text-white" />
          </div>
          <div>
            <p className="font-serif font-bold text-tate-terre text-base">Cours particuliers</p>
            <p className="text-xs text-tate-terre/60">Avec un professeur Taté</p>
          </div>
        </div>
        <p className="text-sm text-tate-terre/70 mb-4 leading-relaxed">
          Réserve un cours particulier en ligne ou à domicile avec nos professeurs certifiés.
        </p>
        <div className="flex gap-3">
          <button onClick={() => navigate('/eleve/tutorat')}
            className="flex-1 btn-tate py-3 text-sm font-bold flex items-center justify-center gap-2">
            <Zap size={14} /> Réserver un cours
          </button>
          <button onClick={onAbonner}
            className="flex-1 py-3 rounded-2xl border-2 border-tate-soleil/40 text-tate-terre text-sm font-semibold hover:bg-tate-soleil/10 transition-all">
            ⭐ Premium
          </button>
        </div>
      </div>
    </motion.div>
  );
}
