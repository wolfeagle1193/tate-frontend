

// ─────────────────────────────────────────────
// src/components/ChapitreCard.jsx
// ─────────────────────────────────────────────
import { Lock, CheckCircle, ChevronRight } from 'lucide-react';
import { EtoilesScore } from './EtoilesScore';
export function ChapitreCard({ chapitre, valide, etoiles, verrouille, onClick }) {
  return (
    <button onClick={!verrouille ? onClick : undefined}
      className={`w-full card text-left transition-all duration-200 ${
        verrouille ? 'opacity-50 cursor-not-allowed' :
        valide ? 'border-succes/40 hover:shadow-tate cursor-pointer' :
        'hover:border-tate-soleil hover:shadow-tate cursor-pointer'
      }`}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {valide && <CheckCircle size={16} className="text-succes flex-shrink-0" />}
            {verrouille && <Lock size={16} className="text-neutre flex-shrink-0" />}
            <p className="font-semibold text-tate-terre truncate">{chapitre.titre}</p>
          </div>
          <p className="text-xs text-tate-terre/60 truncate">{chapitre.objectif}</p>
          {valide && <div className="mt-2"><EtoilesScore score={etoiles === 3 ? 100 : etoiles === 2 ? 92 : 82} /></div>}
        </div>
        {!verrouille && <ChevronRight size={20} className="text-tate-soleil flex-shrink-0 ml-2" />}
      </div>
    </button>
  );
}

