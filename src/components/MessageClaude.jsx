

// ─────────────────────────────────────────────
// src/components/MessageClaude.jsx  — bulle tuteur
// ─────────────────────────────────────────────
import { motion } from 'framer-motion';
export function MessageClaude({ texte, type = 'info' }) {
  const styles = {
    info:     'border-tate-border bg-tate-doux',
    succes:   'border-succes/30 bg-green-50',
    erreur:   'border-alerte/30 bg-orange-50',
    question: 'border-savoir/30 bg-purple-50',
  };
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 p-4 rounded-2xl border-2 ${styles[type]}`}>
      <div className="w-9 h-9 rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-sm flex-shrink-0 shadow-tate">T</div>
      <p className="text-sm text-tate-terre leading-relaxed">{texte}</p>
    </motion.div>
  );
}


