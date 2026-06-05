import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Globe } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function LangueLogin() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const { login, loading, user } = useAuthStore();
  const navigate = useNavigate();

  if (user) {
    if (user.role === 'eleve' && user.niveau === 'Adulte') return <Navigate to="/langue/dashboard" replace />;
    if (user.role === 'admin') return <Navigate to="/admin" replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Veuillez remplir tous les champs');
    
    try {
      const { data } = await axios.post(`${API}/auth/login`, {
        email, password,
        type: 'langue'
      });
      
      if (data?.success && data?.data) {
        useAuthStore.getState().setUser(data.data);
        localStorage.setItem('tate_token', data.data.token || data.token);
        toast.success('Bienvenue !');
        
        if (data.data.niveau === 'Adulte') {
          navigate('/langue/dashboard', { replace: true });
        } else {
          navigate('/eleve', { replace: true });
        }
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Email ou mot de passe incorrect';
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 backdrop-blur mb-4">
            <Globe size={32} className="text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Taté Langues</h1>
          <p className="text-blue-200/70 text-sm mt-1">Espace d'apprentissage des langues</p>
        </div>

        {/* Carte de connexion */}
        <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
          <h2 className="text-xl font-semibold text-white mb-6">Connexion</h2>
          
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-blue-200 mb-2">Mot de passe</label>
              <div className="relative">
                <Lock size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-300/60" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-3.5 rounded-xl bg-white/10 border border-white/20 text-white placeholder-blue-300/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-300/60 hover:text-blue-200">
                  {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold hover:from-blue-500 hover:to-blue-400 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/10 text-center">
            <a href="/login" className="text-blue-300/60 hover:text-blue-200 text-sm transition">
              ← Retour à l'accueil
            </a>
          </div>
        </div>

        <p className="text-center text-blue-300/30 text-xs mt-8">
          Taté Learning © 2026 — Espace réservé aux apprenants
        </p>
      </motion.div>
    </div>
  );
}
