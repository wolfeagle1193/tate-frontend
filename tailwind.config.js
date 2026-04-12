/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Charte Taté — version éclatante ──────────────────
        tate: {
          soleil:  '#F97316',   // orange vif (principal)
          or:      '#F59E0B',   // or chaud (secondaire)
          terre:   '#1C0A00',   // brun très profond (textes)
          nuit:    '#1E1B4B',   // indigo profond (accents)
          creme:   '#FFFBF5',   // fond principal
          doux:    '#FFF4E6',   // fond cartes
          border:  '#FDE68A',   // bordures dorées
          vif:     '#FF6B1A',   // orange ultra-vif (CTA)
        },
        // ── Couleurs sémantiques ───────────────────────────
        succes:  '#10B981',   // vert émeraude vif
        savoir:  '#7C3AED',   // violet intense
        alerte:  '#EF4444',   // rouge vif
        neutre:  '#94A3B8',   // gris bleu
        // ── Couleurs accent UI ────────────────────────────
        accent: {
          bleu:   '#3B82F6',
          vert:   '#10B981',
          violet: '#8B5CF6',
          rose:   '#EC4899',
          teal:   '#14B8A6',
          amber:  '#F59E0B',
        },
      },
      fontFamily: {
        serif: ['Georgia', 'serif'],
        sans:  ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl':  '14px',
        '2xl': '20px',
        '3xl': '28px',
        '4xl': '36px',
      },
      boxShadow: {
        'tate':    '0 6px 30px rgba(249, 115, 22, 0.20)',
        'card':    '0 2px 16px rgba(0,0,0,0.07)',
        'card-lg': '0 8px 40px rgba(0,0,0,0.12)',
        'glow':    '0 0 24px rgba(249, 115, 22, 0.35)',
        'inner-tate': 'inset 0 2px 8px rgba(249, 115, 22, 0.12)',
      },
      backgroundImage: {
        'tate-gradient': 'linear-gradient(135deg, #F97316 0%, #F59E0B 100%)',
        'nuit-gradient': 'linear-gradient(135deg, #1E1B4B 0%, #312E81 100%)',
        'hero-gradient': 'linear-gradient(135deg, #1C0A00 0%, #431407 100%)',
        'success-gradient': 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      },
      animation: {
        'bounce-slow':  'bounce 2s infinite',
        'pulse-slow':   'pulse 3s infinite',
        'slide-up':     'slideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'pop':          'pop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'shimmer':      'shimmer 1.8s linear infinite',
        'float':        'float 3s ease-in-out infinite',
      },
      keyframes: {
        slideUp:  { '0%': { opacity:0, transform:'translateY(20px)' }, '100%': { opacity:1, transform:'translateY(0)' } },
        pop:      { '0%': { transform:'scale(0.8)', opacity:0 }, '70%': { transform:'scale(1.06)' }, '100%': { transform:'scale(1)', opacity:1 } },
        shimmer:  { '0%': { backgroundPosition:'200% 0' }, '100%': { backgroundPosition:'-200% 0' } },
        float:    { '0%,100%': { transform:'translateY(0)' }, '50%': { transform:'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}
