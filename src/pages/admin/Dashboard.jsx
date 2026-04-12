// ═══════════════════════════════════════════════════════
// Dashboard.jsx — Admin : tableau de bord principal
// ═══════════════════════════════════════════════════════
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, GraduationCap, TrendingUp, CheckCircle,
  BookOpen, Clock, AlertCircle, ArrowRight, Layers,
  Video, FileText, Star, Zap, UserPlus, Calendar,
} from 'lucide-react';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutAdmin }   from './LayoutAdmin';
import { useNavigate }   from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

// ── Carte stat ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, gradient, sub, onClick }) {
  return (
    <motion.button
      whileHover={{ y: -2, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`w-full text-left rounded-3xl p-5 text-white shadow-card-lg overflow-hidden relative ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ background: `linear-gradient(135deg, ${gradient})` }}>
      {/* Cercle déco */}
      <div className="absolute -right-4 -top-4 w-20 h-20 rounded-full bg-white/10" />
      <div className="absolute -right-2 top-8 w-12 h-12 rounded-full bg-white/10" />
      <div className="relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-white/20 flex items-center justify-center mb-3">
          <Icon size={22} className="text-white" />
        </div>
        <p className="text-3xl font-bold">{value ?? '—'}</p>
        <p className="text-sm text-white/80 mt-0.5">{label}</p>
        {sub && <p className="text-xs text-white/50 mt-1">{sub}</p>}
      </div>
    </motion.button>
  );
}

// ── Raccourci d'action ────────────────────────────────────────
function ActionCard({ icon: Icon, label, desc, onClick, color }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border-2 border-tate-border hover:border-tate-soleil/50 hover:shadow-tate p-4 transition-all flex items-center gap-4 group">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-tate-terre text-sm">{label}</p>
        <p className="text-xs text-tate-terre/50 mt-0.5">{desc}</p>
      </div>
      <ArrowRight size={16} className="text-tate-terre/30 group-hover:text-tate-soleil group-hover:translate-x-0.5 transition-all flex-shrink-0" />
    </motion.button>
  );
}

export function Dashboard() {
  const { stats, leconsEnAttente, chargerStats, chargerLeconsEnAttente, users, chargerUsers } = useAdminStore();
  const navigate = useNavigate();
  const [recentUsers, setRecentUsers] = useState([]);

  useEffect(() => {
    chargerStats();
    chargerLeconsEnAttente();
    chargerUsers();
  }, []);

  useEffect(() => {
    if (users?.length) {
      setRecentUsers([...users].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5));
    }
  }, [users]);

  const eleves  = users?.filter(u => u.role === 'eleve')  || [];
  const profs   = users?.filter(u => u.role === 'prof' && u.statutCompte === 'actif') || [];
  const pending = users?.filter(u => u.role === 'prof' && u.statutCompte === 'en_attente') || [];
  const premium = eleves.filter(u => u.abonnement === 'premium');

  return (
    <LayoutAdmin titre="Tableau de bord">

      {/* ── Alertes ─────────────────────────────────────────── */}
      <div className="space-y-3 mb-6">
        {leconsEnAttente?.length > 0 && (
          <motion.button initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/admin/lecons')}
            className="w-full bg-amber-50 border-2 border-amber-200 rounded-2xl p-4 flex items-center gap-3 hover:border-amber-300 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
              <AlertCircle size={18} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-800">
                {leconsEnAttente.length} leçon{leconsEnAttente.length > 1 ? 's' : ''} en attente de validation
              </p>
              <p className="text-xs text-amber-600 mt-0.5">Cliquer pour valider et publier aux élèves</p>
            </div>
            <ArrowRight size={16} className="text-amber-500 flex-shrink-0" />
          </motion.button>
        )}
        {pending.length > 0 && (
          <motion.button initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            onClick={() => navigate('/admin/users')}
            className="w-full bg-blue-50 border-2 border-blue-200 rounded-2xl p-4 flex items-center gap-3 hover:border-blue-300 hover:shadow-sm transition-all text-left">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <GraduationCap size={18} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-blue-800">
                {pending.length} candidature{pending.length > 1 ? 's' : ''} prof en attente
              </p>
              <p className="text-xs text-blue-600 mt-0.5">Examiner les dossiers des enseignants</p>
            </div>
            <ArrowRight size={16} className="text-blue-500 flex-shrink-0" />
          </motion.button>
        )}
      </div>

      {/* ── Stats ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {[
          { label: 'Élèves inscrits',  value: eleves.length,  icon: Users,         gradient: '#F97316, #EA580C', sub: 'comptes actifs',      path: '/admin/users' },
          { label: 'Professeurs',      value: profs.length,   icon: GraduationCap, gradient: '#7C3AED, #6D28D9', sub: 'validés',             path: '/admin/users' },
          { label: 'Élèves Premium',   value: premium.length, icon: Star,          gradient: '#10B981, #059669', sub: 'abonnés ou domicile', path: '/admin/users' },
          { label: 'Cours en attente', value: leconsEnAttente?.length || 0, icon: Clock, gradient: '#EF4444, #DC2626', sub: 'à valider',     path: '/admin/lecons' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
            <StatCard {...s} onClick={s.path ? () => navigate(s.path) : undefined} />
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        {/* ── Actions rapides ──────────────────────────────── */}
        <div>
          <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2 text-base">
            <Zap size={18} className="text-tate-soleil" /> Actions rapides
          </h2>
          <div className="space-y-2.5">
            {[
              { icon: FileText,      label: 'Valider des leçons',     desc: `${leconsEnAttente?.length || 0} en attente`, onClick: () => navigate('/admin/lecons'),    color: 'bg-amber-500' },
              { icon: Layers,        label: 'Gérer les catégories',   desc: 'Matières et chapitres',    onClick: () => navigate('/admin/matieres'),  color: 'bg-savoir' },
              { icon: Video,         label: 'Planifier une session',  desc: 'Classe virtuelle Zoom/Meet', onClick: () => navigate('/admin/sessions'), color: 'bg-succes' },
              { icon: UserPlus,      label: 'Nouvel utilisateur',     desc: 'Élève, prof ou parent',     onClick: () => navigate('/admin/users'),    color: 'bg-tate-soleil' },
              { icon: BookOpen,      label: 'Préparer un cours',      desc: 'Avec IA ou en manuel',      onClick: () => navigate('/admin/preparer'), color: 'bg-blue-500' },
              { icon: TrendingUp,    label: 'Suivi des élèves',       desc: 'Progression et scores',     onClick: () => navigate('/admin/suivi-eleves'), color: 'bg-pink-500' },
            ].map(a => (
              <ActionCard key={a.label} {...a} />
            ))}
          </div>
        </div>

        {/* ── Derniers inscrits ────────────────────────────── */}
        <div>
          <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2 text-base">
            <Calendar size={18} className="text-tate-soleil" /> Derniers inscrits
          </h2>
          <div className="bg-white rounded-2xl border border-tate-border overflow-hidden shadow-card">
            {recentUsers.length === 0 ? (
              <div className="text-center py-10">
                <Users size={32} className="text-tate-terre/20 mx-auto mb-2" />
                <p className="text-sm text-tate-terre/40">Aucun utilisateur</p>
              </div>
            ) : (
              <div className="divide-y divide-tate-border/50">
                {recentUsers.map((u, i) => {
                  const COLORS = { admin: 'bg-purple-100 text-purple-700', prof: 'bg-blue-100 text-blue-700', eleve: 'bg-tate-doux text-tate-terre', parent: 'bg-green-100 text-green-700' };
                  const date   = new Date(u.createdAt);
                  const since  = Math.floor((Date.now() - date) / 86400000);
                  return (
                    <motion.div key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-tate-creme transition-colors">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold flex-shrink-0 ${u.abonnement === 'premium' ? 'bg-tate-soleil text-white' : 'bg-tate-doux text-tate-terre'}`}>
                        {u.nom?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-tate-terre truncate">{u.nom}</p>
                        <p className="text-xs text-tate-terre/40 truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 flex-shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${COLORS[u.role]}`}>{u.role}</span>
                        <span className="text-[10px] text-tate-terre/30">
                          {since === 0 ? "Aujourd'hui" : since === 1 ? 'Hier' : `Il y a ${since}j`}
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Mini-stats supplémentaires */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            {[
              { label: 'Chapitres créés',  value: stats?.totalChapitres || '—',  color: 'bg-blue-50 text-blue-700 border-blue-200' },
              { label: 'Leçons publiées',  value: stats?.totalLecons    || '—',  color: 'bg-tate-doux text-tate-terre border-tate-border' },
            ].map(s => (
              <div key={s.label} className={`border-2 rounded-2xl px-4 py-3 ${s.color}`}>
                <p className="text-xl font-bold">{s.value}</p>
                <p className="text-xs font-medium mt-0.5 opacity-70">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </LayoutAdmin>
  );
}
