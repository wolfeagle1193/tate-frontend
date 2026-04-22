import { useEffect } from 'react';
import { motion }    from 'framer-motion';
import { Users, BookOpen, CheckCircle, AlertCircle, TrendingUp, Clock, PlusCircle } from 'lucide-react';
import { useProfStore }  from '../../store/useProfStore';
import { useAuthStore }  from '../../store/useAuthStore';
import { LayoutProf }    from './LayoutProf';
import { useNavigate }   from 'react-router-dom';

function StatCard({ label, value, icon: Icon, color, onClick }) {
  return (
    <motion.div whileHover={{ y:-2 }} onClick={onClick}
      className={`card flex items-start gap-4 ${onClick ? 'cursor-pointer hover:border-tate-soleil' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className="text-white" />
      </div>
      <div>
        <p className="text-2xl font-bold text-tate-terre">{value ?? '—'}</p>
        <p className="text-sm text-tate-terre/60">{label}</p>
      </div>
    </motion.div>
  );
}

export function DashboardProf() {
  const { user }    = useAuthStore();
  const { classes, mesLecons, chargerClasses, chargerMesLecons } = useProfStore();
  const navigate    = useNavigate();

  useEffect(() => {
    chargerClasses();
    chargerMesLecons();
  }, []);

  const leconsPubliees  = mesLecons.filter(l => l.statut === 'publie').length;
  const leconsAttente   = mesLecons.filter(l => l.statut === 'en_preparation').length;
  const totalEleves     = classes.reduce((acc, c) => acc + (c.eleves?.length || 0), 0);

  return (
    <LayoutProf titre="Mon tableau de bord"
      action={
        <button onClick={() => navigate('/prof/preparer')}
          className="btn-tate py-2 px-4 text-sm flex items-center gap-2">
          <PlusCircle size={16} /> Préparer un cours
        </button>
      }>

      <div className="mb-6">
        <h2 className="text-xl font-serif font-bold text-tate-terre">
          Bonjour, {user?.nom?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-tate-terre/50 mt-1">Voici un aperçu de votre activité</p>
      </div>

      {/* Alerte leçons en attente */}
      {leconsAttente > 0 && (
        <div className="mb-5 bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center gap-3">
          <AlertCircle size={18} className="text-alerte flex-shrink-0" />
          <p className="text-sm text-tate-terre flex-1">
            <strong>{leconsAttente} leçon{leconsAttente > 1 ? 's' : ''}</strong> en attente de validation
          </p>
          <button onClick={() => navigate('/prof/mes-lecons')}
            className="text-sm font-semibold text-alerte hover:underline">Voir →</button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Mes élèves"      value={totalEleves}    icon={Users}        color="bg-tate-soleil" onClick={() => navigate('/prof/mes-eleves')} />
        <StatCard label="Mes classes"     value={classes.length} icon={TrendingUp}   color="bg-savoir" />
        <StatCard label="Leçons publiées" value={leconsPubliees} icon={CheckCircle}  color="bg-succes"  onClick={() => navigate('/prof/mes-lecons')} />
        <StatCard label="En attente"      value={leconsAttente}  icon={Clock}        color="bg-alerte"  onClick={() => navigate('/prof/mes-lecons')} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* Mes classes */}
        <div className="card">
          <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
            <Users size={18} className="text-tate-soleil" /> Mes classes
          </h2>
          {classes.length === 0 ? (
            <p className="text-sm text-tate-terre/40 text-center py-6">Aucune classe assignée</p>
          ) : (
            <div className="space-y-2">
              {classes.map(c => (
                <button key={c._id} onClick={() => navigate('/prof/mes-eleves')}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-tate-doux hover:bg-tate-border/30 transition-all">
                  <div className="text-left">
                    <p className="font-semibold text-tate-terre text-sm">{c.nom}</p>
                    <p className="text-xs text-tate-terre/50">{c.niveau} · {c.eleves?.length || 0} élèves</p>
                  </div>
                  <span className="text-tate-soleil">→</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dernières leçons */}
        <div className="card">
          <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
            <BookOpen size={18} className="text-tate-soleil" /> Dernières leçons
          </h2>
          {mesLecons.length === 0 ? (
            <div className="text-center py-6">
              <p className="text-sm text-tate-terre/40 mb-3">Aucune leçon préparée</p>
              <button onClick={() => navigate('/prof/preparer')} className="btn-tate py-2 px-4 text-sm">
                Préparer mon premier cours
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {mesLecons.slice(0, 5).map(l => (
                <div key={l._id} className="flex items-center justify-between py-2 border-b border-tate-border/50 last:border-0">
                  <p className="text-sm text-tate-terre truncate flex-1 mr-3">{l.titre}</p>
                  <span className={`badge text-xs flex-shrink-0 ${
                    l.statut === 'publie'         ? 'bg-green-100 text-green-700' :
                    l.statut === 'en_preparation' ? 'bg-orange-100 text-alerte'  :
                    'bg-gray-100 text-gray-500'
                  }`}>
                    {l.statut === 'publie' ? 'Publié' : l.statut === 'en_preparation' ? 'En attente' : 'Brouillon'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </LayoutProf>
  );
}