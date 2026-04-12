


// ─────────────────────────────────────────────
// src/components/LoadingTate.jsx
// ─────────────────────────────────────────────
export function LoadingTate({ message = 'Taté prépare ta leçon…' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-4">
      <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-xl shadow-tate animate-pulse-slow">T</div>
      <p className="text-sm text-tate-terre/60 animate-pulse">{message}</p>
    </div>
  );
}