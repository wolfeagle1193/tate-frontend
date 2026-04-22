

// ─────────────────────────────────────────────
// src/components/ProgressBar.jsx
// ─────────────────────────────────────────────
export function ProgressBar({ value, max = 100, color = 'bg-tate-soleil', showLabel = true }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);
  const barColor = pct >= 80 ? 'bg-succes' : pct >= 50 ? 'bg-tate-soleil' : 'bg-alerte';
  return (
    <div>
      {showLabel && (
        <div className="flex justify-between text-xs text-tate-terre/60 mb-1">
          <span>Progression</span>
          <span className={`font-semibold ${pct >= 80 ? 'text-succes' : 'text-tate-soleil'}`}>{pct}%</span>
        </div>
      )}
      <div className="progress-bar">
        <div className={`progress-fill ${color || barColor}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}