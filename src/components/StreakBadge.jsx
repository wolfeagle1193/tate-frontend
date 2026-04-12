// src/components/StreakBadge.jsx
// ─────────────────────────────────────────────
import { Flame } from 'lucide-react';
export function StreakBadge({ streak = 0 }) {
  if (streak === 0) return null;
  const color = streak >= 7 ? 'text-orange-500' : streak >= 3 ? 'text-tate-soleil' : 'text-yellow-400';
  return (
    <div className="flex items-center gap-1 bg-tate-doux border border-tate-border rounded-full px-3 py-1">
      <Flame size={16} className={`${color} ${streak >= 3 ? 'animate-bounce-slow' : ''}`} />
      <span className="text-sm font-semibold text-tate-terre">{streak} jour{streak > 1 ? 's' : ''}</span>
    </div>
  );
}