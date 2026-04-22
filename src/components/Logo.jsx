
// ─────────────────────────────────────────────
// src/components/Logo.jsx
// ─────────────────────────────────────────────
export function Logo({ size = 'md' }) {
  const s = { sm: 'text-xl', md: 'text-3xl', lg: 'text-5xl' }[size];
  const i = { sm: 'w-8 h-8 text-sm', md: 'w-12 h-12 text-base', lg: 'w-16 h-16 text-xl' }[size];
  return (
    <div className="flex items-center gap-2">
      <div className={`${i} rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre shadow-tate`}>T</div>
      <span className={`${s} font-serif font-bold text-tate-terre tracking-wide`}>Taté</span>
    </div>
  );
}
