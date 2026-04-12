import { useEffect, useState } from 'react';
import { motion }    from 'framer-motion';
import { Star, TrendingUp, AlertTriangle, CheckCircle, BookOpen, Flame, Trophy, LogOut } from 'lucide-react';
import { useAuthStore }  from '../../store/useAuthStore';
import { useNavigate }   from 'react-router-dom';
import api               from '../../lib/api';

// ─── Layout parent ───────────────────────────
function LayoutParent({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-tate-creme">
      <header className="bg-white border-b border-tate-border px-4 py-3
                         flex items-center justify-between sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-tate-soleil flex items-center justify-center
                          font-serif font-bold text-tate-terre text-sm">T</div>
          <span className="font-serif font-bold text-tate-terre">Taté</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-tate-terre/60 hidden sm:block">{user?.nom}</span>
          <button onClick={handleLogout}
            className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/50 transition-colors">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// ─── Carte enfant ────────────────────────────
function CarteEnfant({ enfant, actif, onClick }) {
  const chapValides = enfant.chapitresValides?.length || 0;
  const total = 8;

  return (
    <motion.button whileHover={{ y:-2 }} onClick={onClick}
      className={`w-full card text-left transition-all ${actif ? 'border-tate-soleil shadow-tate' : 'hover:border-tate-soleil'}`}>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center
                        font-bold text-tate-terre text-xl flex-shrink-0 shadow-tate">
          {enfant.nom?.[0]?.toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-serif font-bold text-tate-terre text-base">{enfant.nom}</p>
          <p className="text-xs text-tate-terre/50 mb-2">{enfant.niveau}</p>
          <div className="h-2 bg-tate-doux rounded-full overflow-hidden">
            <div className="h-full bg-tate-soleil rounded-full transition-all"
              style={{ width:`${Math.min((chapValides/total)*100, 100)}%` }} />
          </div>
          <p className="text-xs text-tate-terre/40 mt-1">{chapValides} chapitre{chapValides > 1 ? 's' : ''} maîtrisé{chapValides > 1 ? 's' : ''}</p>
        </div>
        {enfant.streak > 0 && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <Flame size={14} className="text-alerte" />
            <span className="text-xs font-bold text-tate-terre">{enfant.streak}j</span>
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ─── Détail progression ──────────────────────
function DetailEnfant({ enfant, sessions }) {
  const chapValides  = enfant.chapitresValides || [];
  const enDifficulte = sessions.filter(s => s.scorePct < 80);

  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4 mt-4">

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card text-center py-4">
          <Flame size={20} className="text-alerte mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{enfant.streak || 0}</p>
          <p className="text-xs text-tate-terre/50">Jours de suite</p>
        </div>
        <div className="card text-center py-4">
          <Trophy size={20} className="text-tate-soleil mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{chapValides.length}</p>
          <p className="text-xs text-tate-terre/50">Chapitres validés</p>
        </div>
        <div className="card text-center py-4">
          <Star size={20} className="text-savoir mx-auto mb-1" />
          <p className="text-xl font-bold text-tate-terre">{enfant.badges?.length || 0}</p>
          <p className="text-xs text-tate-terre/50">Badges</p>
        </div>
      </div>

      {/* Alerte difficultés */}
      {enDifficulte.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-alerte" />
            <p className="text-sm font-semibold text-alerte">Points nécessitant attention</p>
          </div>
          {enDifficulte.slice(0,3).map(s => (
            <div key={s._id} className="flex items-center justify-between py-1">
              <p className="text-xs text-tate-terre/70">• {s.chapitreId?.titre}</p>
              <span className="text-xs font-bold text-alerte">{s.scorePct}%</span>
            </div>
          ))}
        </div>
      )}

      {/* Chapitres maîtrisés */}
      <div className="card">
        <h3 className="font-serif font-bold text-tate-terre mb-3 flex items-center gap-2">
          <CheckCircle size={16} className="text-succes" /> Chapitres maîtrisés
        </h3>
        {chapValides.length === 0 ? (
          <p className="text-sm text-tate-terre/40 text-center py-4">
            Pas encore de chapitre validé — encouragez votre enfant !
          </p>
        ) : (
          <div className="space-y-2">
            {chapValides.map((c, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-tate-border/40 last:border-0">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <CheckCircle size={13} className="text-succes flex-shrink-0" />
                  <p className="text-sm text-tate-terre truncate">{c.chapitreId?.titre || 'Chapitre'}</p>
                </div>
                <div className="flex gap-1 ml-2 flex-shrink-0">
                  {[1,2,3].map(i => (
                    <Star key={i} size={12}
                      className={i <= (c.etoiles||1) ? 'fill-tate-soleil text-tate-soleil' : 'text-neutre'} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      {enfant.badges?.length > 0 && (
        <div className="card">
          <h3 className="font-serif font-bold text-tate-terre mb-3">Badges obtenus 🏅</h3>
          <div className="flex gap-2 flex-wrap">
            {enfant.badges.map((b, i) => (
              <span key={i} className="badge bg-tate-doux text-tate-terre border border-tate-border text-xs">{b}</span>
            ))}
          </div>
        </div>
      )}

      {/* Historique */}
      <div className="card">
        <h3 className="font-serif font-bold text-tate-terre mb-3 flex items-center gap-2">
          <BookOpen size={16} className="text-tate-soleil" /> Activité récente
        </h3>
        {sessions.length === 0 ? (
          <p className="text-sm text-tate-terre/40 text-center py-4">Aucune session enregistrée</p>
        ) : (
          <div className="space-y-2">
            {sessions.slice(0,6).map(s => (
              <div key={s._id} className="flex items-center justify-between py-2 border-b border-tate-border/40 last:border-0">
                <div className="flex-1 min-w-0 mr-3">
                  <p className="text-sm text-tate-terre truncate">{s.chapitreId?.titre}</p>
                  <p className="text-xs text-tate-terre/40">
                    Série {s.serie} · {new Date(s.completedAt || s.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className={`text-sm font-bold ${s.scorePct >= 80 ? 'text-succes' : 'text-alerte'}`}>
                    {s.scorePct}%
                  </span>
                  {s.maitrise && <Star size={13} className="fill-tate-soleil text-tate-soleil" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message */}
      <div className="bg-tate-doux border border-tate-border rounded-2xl p-4 text-center">
        <p className="text-sm text-tate-terre leading-relaxed">
          {chapValides.length >= 5
            ? `🌟 Félicitez ${enfant.nom?.split(' ')[0]} — il/elle progresse très bien !`
            : enfant.streak >= 3
            ? `🔥 ${enfant.nom?.split(' ')[0]} travaille ${enfant.streak} jours de suite — bravo !`
            : `💪 Encouragez ${enfant.nom?.split(' ')[0]} à travailler régulièrement sur Taté !`
          }
        </p>
      </div>
    </motion.div>
  );
}

// ─── PAGE PRINCIPALE PARENT ──────────────────
export function EspaceParent() {
  const { user }  = useAuthStore();
  const [enfants,  setEnfants]  = useState([]);
  const [actif,    setActif]    = useState(null);
  const [sessions, setSessions] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get('/stats/parent')
      .then(({ data }) => {
        setEnfants(data.data || []);
        if (data.data?.length > 0) {
          setActif(data.data[0]);
          chargerSessions(data.data[0]._id);
        }
      })
      .catch(() => setEnfants([]))
      .finally(() => setLoading(false));
  }, []);

  const chargerSessions = async (eleveId) => {
    try {
      const { data } = await api.get(`/stats/eleve/${eleveId}`);
      setSessions(data.data || []);
    } catch { setSessions([]); }
  };

  const selectionner = (enfant) => {
    setActif(enfant);
    chargerSessions(enfant._id);
  };

  if (loading) return (
    <LayoutParent>
      <div className="flex flex-col items-center justify-center py-20">
        <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center
                        font-serif font-bold text-tate-terre text-xl animate-pulse-slow">T</div>
        <p className="text-sm text-tate-terre/50 mt-4">Chargement…</p>
      </div>
    </LayoutParent>
  );

  return (
    <LayoutParent>
      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-tate-terre">
          Bonjour, {user?.nom?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-tate-terre/50 mt-1">Progression de vos enfants</p>
      </div>

      {enfants.length === 0 ? (
        <div className="card text-center py-16">
          <TrendingUp size={40} className="text-neutre mx-auto mb-3" />
          <p className="font-semibold text-tate-terre">Aucun enfant lié à votre compte</p>
          <p className="text-sm text-tate-terre/40 mt-2">
            Contactez l'administrateur pour lier le compte de votre enfant
          </p>
        </div>
      ) : (
        <>
          {enfants.length > 1 && (
            <div className="space-y-3 mb-2">
              {enfants.map(e => (
                <CarteEnfant key={e._id} enfant={e}
                  actif={actif?._id === e._id}
                  onClick={() => selectionner(e)} />
              ))}
            </div>
          )}
          {enfants.length === 1 && (
            <CarteEnfant enfant={enfants[0]} actif onClick={() => {}} />
          )}
          {actif && <DetailEnfant enfant={actif} sessions={sessions} />}
        </>
      )}
    </LayoutParent>
  );
}