import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  FileText, BarChart2, LogOut, Menu, ChevronRight, CalendarDays, TrendingUp, PlusCircle, ListChecks, Bell,
  Layers, Video,
} from 'lucide-react';
import { useAuthStore }  from '../../store/useAuthStore';
import { Logo }          from '../../components';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../../lib/api';

const NAV = [
  { path: '/admin',                icon: LayoutDashboard, label: 'Tableau de bord'   },
  { path: '/admin/users',          icon: Users,           label: 'Utilisateurs'      },
  { path: '/admin/reservations',   icon: CalendarDays,    label: 'Cours particuliers'},
  { path: '/admin/chapitres',      icon: GraduationCap,   label: 'Chapitres'         },
  { path: '/admin/preparer',       icon: PlusCircle,      label: 'Préparer un cours' },
  { path: '/admin/lecons',         icon: FileText,        label: 'Leçons en attente' },
  { path: '/admin/qcm',            icon: ListChecks,      label: 'QCM'               },
  { path: '/admin/epreuves',       icon: BookOpen,        label: 'Épreuves BFEM/BAC' },
  { path: '/admin/suivi-eleves',   icon: TrendingUp,      label: 'Suivi des élèves'  },
  { path: '/admin/matieres',       icon: Layers,          label: 'Catégories'        },
  { path: '/admin/sessions',       icon: Video,           label: 'Sessions de classe'},
  { path: '/admin/stats',          icon: BarChart2,       label: 'Statistiques'      },
];

// ─── NavItem — en dehors du layout ──────────
function NavItem({ item, active, onClick }) {
  const Icon = item.icon;
  return (
    <button onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
        ${active
          ? 'bg-tate-soleil text-tate-terre shadow-tate'
          : 'text-tate-terre/60 hover:bg-tate-doux hover:text-tate-terre'}`}>
      <Icon size={18} />
      <span>{item.label}</span>
      {active && <ChevronRight size={14} className="ml-auto" />}
    </button>
  );
}

// ─── Sidebar — en dehors du layout ──────────
function Sidebar({ user, onLogout, onNavigate, currentPath, onClose }) {
  return (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-tate-border">
        <Logo size="sm" />
        <div className="mt-3 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-tate-soleil flex items-center justify-center text-xs font-bold text-tate-terre">
            {user?.nom?.[0]}
          </div>
          <div>
            <p className="text-xs font-semibold text-tate-terre truncate max-w-[140px]">{user?.nom}</p>
            <p className="text-xs text-tate-terre/40">Administrateur</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <NavItem key={item.path} item={item}
            active={currentPath === item.path}
            onClick={() => { onNavigate(item.path); onClose?.(); }} />
        ))}
      </nav>
      <div className="p-4 border-t border-tate-border">
        <button onClick={onLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-alerte hover:bg-orange-50 transition-all">
          <LogOut size={18} />
          <span>Déconnexion</span>
        </button>
      </div>
    </div>
  );
}

// ─── Cloche notifications ─────────────────────
function ClochNotifs({ onClick, nb }) {
  return (
    <button onClick={onClick}
      className="relative p-2 rounded-xl hover:bg-tate-doux transition-colors">
      <Bell size={20} className="text-tate-terre/60" />
      {nb > 0 && (
        <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-alerte text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {nb > 9 ? '9+' : nb}
        </span>
      )}
    </button>
  );
}

// ─── Panneau notifications ────────────────────
function PanneauNotifs({ notifs, onLireTout, onClose }) {
  const couleur = (type) => {
    if (type === 'qcm_maitrise')  return 'bg-green-50 border-green-200';
    if (type === 'qcm_difficulte') return 'bg-red-50 border-red-200';
    return 'bg-tate-doux border-tate-border';
  };
  return (
    <motion.div initial={{ opacity:0, y:-8, scale:0.97 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0, y:-8, scale:0.97 }}
      className="absolute right-0 top-full mt-2 w-80 bg-white border border-tate-border rounded-2xl shadow-xl z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-tate-border">
        <p className="font-semibold text-sm text-tate-terre">Notifications</p>
        <button onClick={onLireTout} className="text-xs text-savoir hover:underline">Tout lire</button>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {notifs.length === 0 ? (
          <p className="text-center py-8 text-sm text-tate-terre/40">Aucune notification</p>
        ) : notifs.map(n => (
          <div key={n._id} className={`px-4 py-3 border-b border-tate-border/50 ${n.lue ? 'opacity-60' : ''}`}>
            <p className={`text-xs font-bold mb-0.5 ${n.lue ? 'text-tate-terre/50' : 'text-tate-terre'}`}>{n.titre}</p>
            <p className="text-xs text-tate-terre/70 leading-relaxed">{n.message}</p>
            <p className="text-xs text-tate-terre/30 mt-1">{new Date(n.createdAt).toLocaleDateString('fr-FR', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
          </div>
        ))}
      </div>
      <div className="px-4 py-2 border-t border-tate-border bg-tate-doux/50">
        <button onClick={onClose} className="text-xs text-tate-terre/50 hover:text-tate-terre">Fermer</button>
      </div>
    </motion.div>
  );
}

// ─── Layout principal ────────────────────────
export function LayoutAdmin({ children, titre, action }) {
  const { user, logout } = useAuthStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [open, setOpen] = useState(false);
  const [showNotifs, setShowNotifs]   = useState(false);
  const [notifs,     setNotifs]       = useState([]);
  const [nbNonLues,  setNbNonLues]    = useState(0);

  // Charger le compteur de notifications au montage et toutes les 60s
  useEffect(() => {
    const charger = async () => {
      try {
        const { data } = await api.get('/notifications/count');
        setNbNonLues(data.data.nbNonLues);
      } catch {}
    };
    charger();
    const interval = setInterval(charger, 60000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const ouvrirNotifs = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifs(data.data.notifications);
      setNbNonLues(0);
    } catch {}
    setShowNotifs(s => !s);
  };

  const lireTout = async () => {
    try { await api.put('/notifications/lire-tout'); } catch {}
    setNotifs(n => n.map(x => ({ ...x, lue: true })));
    setNbNonLues(0);
  };

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-tate-border fixed h-full z-20">
        <Sidebar user={user} onLogout={handleLogout} onNavigate={navigate} currentPath={location.pathname} />
      </aside>

      {/* Sidebar mobile */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setOpen(false)} />
            <motion.aside initial={{ x:-280 }} animate={{ x:0 }} exit={{ x:-280 }} transition={{ type:'spring', damping:25 }}
              className="fixed left-0 top-0 h-full w-64 bg-white border-r border-tate-border z-40 lg:hidden">
              <Sidebar user={user} onLogout={handleLogout} onNavigate={navigate} currentPath={location.pathname} onClose={() => setOpen(false)} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Contenu */}
      <div className="flex-1 lg:ml-64">
        <header className="bg-white border-b border-tate-border px-6 py-4 flex items-center justify-between sticky top-0 z-10 shadow-card">
          <div className="flex items-center gap-4">
            <button onClick={() => setOpen(true)} className="lg:hidden p-2 rounded-xl hover:bg-tate-doux">
              <Menu size={20} className="text-tate-terre" />
            </button>
            <h1 className="text-lg font-serif font-bold text-tate-terre">{titre}</h1>
          </div>
          <div className="flex items-center gap-2">
            {action && <div>{action}</div>}
            <div className="relative">
              <ClochNotifs nb={nbNonLues} onClick={ouvrirNotifs} />
              <AnimatePresence>
                {showNotifs && (
                  <PanneauNotifs notifs={notifs} onLireTout={lireTout} onClose={() => setShowNotifs(false)} />
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>
        <main className="p-6">
          <motion.div key={location.pathname} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}>
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}