// ─────────────────────────────────────────────
// src/components/EtoilesScore.jsx
// ─────────────────────────────────────────────
import { Star } from 'lucide-react';
export function EtoilesScore({ score }) {
  const nb = score === 100 ? 3 : score >= 90 ? 2 : score >= 80 ? 1 : 0;
  return (
    <div className="flex gap-1">
      {[1, 2, 3].map(i => (
        <Star key={i} size={20}
          className={i <= nb ? 'fill-tate-soleil text-tate-soleil' : 'text-neutre'}
        />
      ))}
    </div>
  );
}
