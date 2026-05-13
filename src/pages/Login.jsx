import { useState, useEffect, useRef } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

// Icône Google SVG inline
function IconGoogle() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
    </svg>
  );
}

export function Login() {
  const [mode,        setMode]       = useState('email');   // 'email' | 'telephone'
  const [identifiant, setIdentifiant] = useState('');
  const [password,    setPassword]   = useState('');
  const [showPwd,     setShowPwd]    = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const { login, loading, setUser, user } = useAuthStore();
  const navigate  = useNavigate();
  const googleRef = useRef(null);

  // ── Si déjà connecté : redirection SYNCHRONE au rendu (avant tout affichage) ──
  // useEffect serait trop tard (formulaire flasherait 1 frame) — on court-circuite le rendu
  if (user) {
    const routes = { admin: '/admin', prof: '/prof', eleve: '/eleve', parent: '/parent' };
    return <Navigate to={routes[user.role] || '/eleve'} replace />;
  }

  // ── Initialiser Google Identity Services ─────────────────
  useEffect(() => {
    if (!GOOGLE_CLIENT_ID || !window.google) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback:  handleGoogleCallback,
      auto_select: false,
    });
    if (googleRef.current) {
      // width adaptatif selon la largeur de l'écran
      const w = Math.min(window.innerWidth - 32, 380);
      window.google.accounts.id.renderButton(googleRef.current, {
        theme: 'outline', size: 'large', text: 'continue_with',
        shape: 'rectangular', logo_alignment: 'left', width: w,
      });
    }
  }, []);

  const handleGoogleCallback = async (response) => {
    setGoogleLoading(true);
    try {
      const { data } = await axios.post(`${API}/auth/google`, { credential: response.credential });
      const { accessToken, refreshToken, user } = data.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      setUser(user);
      toast.success(`Bienvenue, ${user.nom.split(' ')[0]} ! 👋`);
      // Si l'élève n'a pas encore choisi son niveau, on le redirige vers la config
      if (user.isNew && user.role === 'eleve') {
        navigate('/eleve/profil', { replace: true });
      } else {
        const routes = { admin: '/admin', prof: '/prof', eleve: '/eleve', parent: '/parent' };
        navigate(routes[user.role] || '/eleve', { replace: true });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Connexion Google échouée');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!identifiant.trim()) return toast.error(mode === 'email' ? 'Email requis' : 'Numéro requis');
    if (!password) return toast.error('Mot de passe requis');
    try {
      const user = await login(identifiant.trim(), password, mode);
      toast.success(`Bienvenue, ${user.nom.split(' ')[0]} ! 👋`);
      const routes = { admin: '/admin', prof: '/prof', eleve: '/eleve', parent: '/parent' };
      navigate(routes[user.role] || '/eleve', { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Identifiant ou mot de passe incorrect');
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Panneau gauche — déco (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] bg-tate-nuit p-10 relative overflow-hidden">
        {/* Cercles déco */}
        <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-tate-soleil/10" />
        <div className="absolute bottom-10 right-10 w-48 h-48 rounded-full bg-savoir/10" />
        <div className="absolute top-1/3 left-1/2 w-32 h-32 rounded-full bg-tate-or/10" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-2xl shadow-tate">
            T
          </div>
          <h1 className="text-white font-serif font-bold text-2xl mt-3">Taté</h1>
          <p className="text-white/50 text-sm">L'école numérique sénégalaise</p>
        </div>

        {/* Citation */}
        <div className="relative z-10">
          <p className="text-white/80 text-lg font-serif leading-relaxed italic">
            "L'éducation est l'arme la plus puissante pour changer le monde."
          </p>
          <p className="text-white/40 text-sm mt-3">— Nelson Mandela</p>
        </div>

        {/* Stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { val: '500+', label: 'Élèves actifs' },
            { val: '120+', label: 'Cours disponibles' },
            { val: '98%', label: 'Satisfaction' },
          ].map(s => (
            <div key={s.label} className="bg-white/5 rounded-2xl p-3 text-center border border-white/10">
              <p className="text-tate-or font-bold text-xl">{s.val}</p>
              <p className="text-white/50 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Panneau droit — formulaire */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 bg-tate-creme min-h-screen lg:min-h-0 overflow-y-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm">

          {/* Header mobile logo */}
          <div className="lg:hidden text-center mb-6">
            <div className="w-14 h-14 rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-2xl shadow-tate mx-auto mb-2">
              T
            </div>
            <h1 className="text-2xl font-serif font-bold text-tate-terre">Taté</h1>
            <p className="text-sm text-tate-terre/50">L'école numérique sénégalaise</p>
          </div>

          <h2 className="text-2xl font-serif font-bold text-tate-terre mb-1">Connexion</h2>
          <p className="text-sm text-tate-terre/50 mb-6">Accède à ton espace de révision</p>

          {/* Toggle email / téléphone */}
          <div className="flex bg-white rounded-xl p-1 border border-tate-border mb-5 shadow-card">
            {[
              { key: 'email', icon: Mail, label: 'Email' },
              { key: 'telephone', icon: Phone, label: 'Téléphone' },
            ].map(opt => {
              const Icon = opt.icon;
              return (
                <button key={opt.key} type="button"
                  onClick={() => { setMode(opt.key); setIdentifiant(''); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all ${
                    mode === opt.key
                      ? 'bg-tate-soleil text-tate-terre shadow-sm'
                      : 'text-tate-terre/50 hover:text-tate-terre'
                  }`}>
                  <Icon size={14} />
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div key={mode}
                initial={{ opacity: 0, x: mode === 'email' ? -10 : 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}>
                <label className="block text-xs font-bold text-tate-terre/60 mb-1.5">
                  {mode === 'email' ? 'Adresse email' : 'Numéro de téléphone'}
                </label>
                {mode === 'email' ? (
                  <input
                    type="email"
                    value={identifiant}
                    onChange={e => setIdentifiant(e.target.value)}
                    placeholder="ton@email.com"
                    className="input-tate"
                    autoFocus
                    required
                  />
                ) : (
                  <div className="flex gap-2">
                    <span className="input-tate w-16 text-center font-semibold text-tate-terre/60 flex-shrink-0">
                      +221
                    </span>
                    <input
                      type="tel"
                      value={identifiant}
                      onChange={e => setIdentifiant(e.target.value)}
                      placeholder="77 123 45 67"
                      className="input-tate flex-1"
                      autoFocus
                      required
                    />
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div>
              <label className="block text-xs font-bold text-tate-terre/60 mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-tate pr-10"
                  required
                />
                <button type="button"
                  onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-tate-terre/40 hover:text-tate-terre transition-colors">
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-tate w-full py-3.5 text-base mt-2 flex items-center justify-center gap-2">
              {loading ? (
                <span className="animate-spin inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full" />
              ) : (
                <>Se connecter <ArrowRight size={16} /></>
              )}
            </button>
          </form>

          {/* Liens inscription */}
          <div className="mt-6 text-center">
            <p className="text-sm text-tate-terre/50 mb-3">Pas encore de compte ?</p>
            <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
              {[
                { label: 'Élève', path: '/register/eleve' },
                { label: 'Parent', path: '/register/parent' },
                { label: 'Professeur', path: '/register/prof' },
              ].map(lnk => (
                <button key={lnk.path} onClick={() => navigate(lnk.path)}
                  className="text-sm font-semibold text-tate-soleil hover:underline">
                  {lnk.label}
                </button>
              ))}
            </div>
          </div>

          <p className="text-center text-xs text-tate-terre/30 mt-6">
            Taté © 2025 — L'école numérique
          </p>
        </motion.div>
      </div>
    </div>
  );
}
