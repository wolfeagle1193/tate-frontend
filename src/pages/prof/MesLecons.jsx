// ─────────────────────────────────────────────
// src/pages/prof/MesLecons.jsx
// ─────────────────────────────────────────────
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, CheckCircle, Clock, Eye, Plus, X } from 'lucide-react';
import { useProfStore } from '../../store/useProfStore';
import { LayoutProf }   from './LayoutProf';
import { useNavigate }  from 'react-router-dom';

function AperçuModal({ lecon, onClose, onValider }) {
  const cf = lecon.contenuFormate;
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="bg-white rounded-3xl p-6 w-full max-w-xl shadow-xl max-h-[85vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-serif font-bold text-tate-terre">{lecon.titre}</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-tate-doux">
            <X size={18} className="text-tate-terre/50" />
          </button>
        </div>
        {cf && (
          <div className="space-y-3 text-sm">
            <div className="card"><p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Résumé</p><p className="text-tate-terre leading-relaxed">{cf.resume}</p></div>
            <div className="bg-tate-soleil/20 border-2 border-tate-soleil rounded-2xl p-3"><p className="text-xs font-bold text-tate-terre/50 uppercase mb-1">Règle</p><p className="font-semibold text-tate-terre">{cf.regle}</p></div>
            {cf.resumeMemo?.length > 0 && (
              <div className="card bg-tate-doux">
                <p className="text-xs font-bold text-tate-terre/50 uppercase mb-2">À retenir</p>
                {cf.resumeMemo.map((m, i) => <p key={i} className="text-tate-terre mb-1">✓ {m}</p>)}
              </div>
            )}
          </div>
        )}
        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="btn-outline flex-1 py-2.5 text-sm">Fermer</button>
          {lecon.statut !== 'publie' && (
            <button onClick={() => { onValider(lecon._id); onClose(); }}
              className="btn-tate flex-1 py-2.5 text-sm flex items-center justify-center gap-2">
              <CheckCircle size={15} /> Publier
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export function MesLecons() {
  const { mesLecons, chargerMesLecons, validerLecon } = useProfStore();
  const [filtre,   setFiltre]   = useState('tous');
  const [apercu,   setApercu]   = useState(null);
  const navigate = useNavigate();

  useEffect(() => { chargerMesLecons(); }, []);

  const filtres = mesLecons.filter(l =>
    filtre === 'tous' || l.statut === filtre
  );

  const STATUT = {
    publie:         { label: 'Publié',      color: 'bg-green-100 text-green-700' },
    en_preparation: { label: 'En attente',  color: 'bg-orange-100 text-alerte'  },
    brouillon:      { label: 'Brouillon',   color: 'bg-gray-100   text-gray-500' },
  };

  return (
    <LayoutProf titre="Mes leçons"
      action={
        <button onClick={() => navigate('/prof/preparer')} className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <Plus size={16} /> Nouvelle leçon
        </button>
      }>

      {/* Filtres */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {[['tous','Toutes'],['publie','Publiées'],['en_preparation','En attente'],['brouillon','Brouillons']].map(([val, lbl]) => (
          <button key={val} onClick={() => setFiltre(val)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtre === val ? 'bg-tate-soleil text-tate-terre shadow-tate' : 'bg-white border border-tate-border text-tate-terre/60 hover:bg-tate-doux'
            }`}>{lbl}</button>
        ))}
      </div>

      {filtres.length === 0 ? (
        <div className="card text-center py-14">
          <BookOpen size={36} className="text-neutre mx-auto mb-3" />
          <p className="text-tate-terre/40 text-sm mb-4">Aucune leçon pour le moment</p>
          <button onClick={() => navigate('/prof/preparer')} className="btn-tate py-2 px-5 text-sm">
            Préparer mon premier cours
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtres.map((lecon, i) => {
            const s = STATUT[lecon.statut] || STATUT.brouillon;
            return (
              <motion.div key={lecon._id} initial={{ opacity:0, y:6 }} animate={{ opacity:1, y:0 }} transition={{ delay: i * 0.04 }}
                className="card hover:border-tate-soleil transition-all">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-tate-doux flex items-center justify-center flex-shrink-0">
                    <BookOpen size={18} className="text-tate-soleil" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-tate-terre truncate">{lecon.titre}</p>
                      <span className={`badge text-xs ${s.color}`}>{s.label}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock size={11} className="text-tate-terre/30" />
                      <p className="text-xs text-tate-terre/40">
                        {new Date(lecon.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => setApercu(lecon)}
                      className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/50 transition-colors">
                      <Eye size={17} />
                    </button>
                    {lecon.statut !== 'publie' && (
                      <button onClick={() => validerLecon(lecon._id)}
                        className="p-2 rounded-xl hover:bg-green-50 text-succes transition-colors">
                        <CheckCircle size={17} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {apercu && <AperçuModal lecon={apercu} onClose={() => setApercu(null)} onValider={validerLecon} />}
    </LayoutProf>
  );
}
