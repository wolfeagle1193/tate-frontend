

// ─────────────────────────────────────────────
// src/components/BadgeItem.jsx
// ─────────────────────────────────────────────
import { motion } from 'framer-motion';
const BADGES = {
  'Premier pas':   { emoji: '🌱', color: 'bg-green-50  border-green-200' },
  'Sans faute !':  { emoji: '⭐', color: 'bg-yellow-50 border-yellow-200' },
  '3 jours':       { emoji: '🔥', color: 'bg-orange-50 border-orange-200' },
  'Excellent !':   { emoji: '🏅', color: 'bg-blue-50   border-blue-200' },
  'Parfait !':     { emoji: '💎', color: 'bg-purple-50 border-purple-200' },
  'Bien joué !':   { emoji: '👏', color: 'bg-tate-doux border-tate-border' },
};
export function BadgeItem({ nom, nouveau = false }) {
  const b = BADGES[nom] || { emoji: '🏆', color: 'bg-tate-doux border-tate-border' };
  return (
    <motion.div initial={nouveau ? { scale: 0 } : false} animate={{ scale: 1 }} transition={{ type: 'spring', bounce: 0.5 }}
      className={`flex flex-col items-center gap-1 p-3 rounded-2xl border-2 ${b.color} ${nouveau ? 'shadow-tate' : ''}`}>
      <span className="text-2xl">{b.emoji}</span>
      <span className="text-xs font-semibold text-tate-terre text-center leading-tight">{nom}</span>
      {nouveau && <span className="text-xs text-tate-soleil font-bold animate-bounce-slow">Nouveau !</span>}
    </motion.div>
  );
}
