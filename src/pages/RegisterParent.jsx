// ============================================================
// src/pages/RegisterParent.jsx — Inscription parent
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/useAuthStore';
import { Mail, Phone, Plus, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function RegisterParent() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [mode, setMode] = useState('email'); // 'email' | 'telephone'
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', password: '', confirmPassword: '',
  });
  const [enfantsEmails, setEnfantsEmails] = useState(['']);
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const ajouterEnfant  = () => setEnfantsEmails(e => [...e, '']);
  const retirerEnfant  = (i) => setEnfantsEmails(e => e.filter((_, j) => j !== i));
  const modifEnfant    = (i, v) => setEnfantsEmails(e => e.map((x, j) => j === i ? v : x));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Les mots de passe ne correspondent pas');

    if (!form.nom.trim()) return toast.error('Votre nom est requis');
    setLoading(true);
    try {
      const emailsValides = enfantsEmails.filter(e => e.trim());
      const payload = {
        nom:           form.nom.trim(),
        password:      form.password,
        enfantsEmails: emailsValides,
      };
      if (mode === 'email') {
        if (!form.email.trim()) return toast.error('Email requis');
        payload.email = form.email.trim();
      } else {
        if (!form.telephone.trim()) return toast.error('Numéro de téléphone requis');
        payload.telephone = form.telephone.trim();
      }
      const { data } = await axios.post(`${API}/auth/register/parent`, payload);

      localStorage.setItem('accessToken',  data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);

      toast.success(`Bienvenue, ${data.data.user.nom.split(' ')[0]} ! 👨‍👩‍👧`);
      navigate('/parent');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-tate-creme flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-sm">

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-tate-soleil flex items-center justify-center
                          font-serif font-bold text-tate-terre text-2xl shadow-tate mx-auto mb-3">T</div>
          <h1 className="text-2xl font-serif font-bold text-tate-terre">Espace Parent</h1>
          <p className="text-tate-terre/50 text-sm mt-1">Suivez la progression de vos enfants</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">

          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Votre nom complet</label>
            <input value={form.nom} onChange={e => set('nom', e.target.value)}
              placeholder="Ex : Fatou Diop" className="input-tate" required />
          </div>

          {/* Toggle email / téléphone */}
          <div className="flex bg-tate-creme rounded-xl p-1 border border-tate-border shadow-card">
            {[
              { key: 'email', icon: Mail, label: 'Email' },
              { key: 'telephone', icon: Phone, label: 'Téléphone' },
            ].map(opt => {
              const Icon = opt.icon;
              return (
                <button key={opt.key} type="button"
                  onClick={() => { setMode(opt.key); set('email', ''); set('telephone', ''); }}
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

          {/* Email ou Téléphone */}
          <AnimatePresence mode="wait">
            <motion.div key={mode}
              initial={{ opacity: 0, x: mode === 'email' ? -8 : 8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}>
              {mode === 'email' ? (
                <div>
                  <label className="block text-sm font-semibold text-tate-terre mb-1.5">Votre email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="votre@email.com" className="input-tate" />
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-semibold text-tate-terre mb-1.5">Numéro de téléphone</label>
                  <div className="flex gap-2">
                    <span className="input-tate w-16 text-center font-semibold text-tate-terre/60 flex-shrink-0">+221</span>
                    <input type="tel" value={form.telephone} onChange={e => set('telephone', e.target.value)}
                      placeholder="77 123 45 67" className="input-tate flex-1" />
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">
              Email(s) de vos enfants <span className="text-tate-terre/40 font-normal">(optionnel)</span>
            </label>
            <div className="space-y-2">
              {enfantsEmails.map((e, i) => (
                <div key={i} className="flex gap-2">
                  <input type="email" value={e} onChange={ev => modifEnfant(i, ev.target.value)}
                    placeholder={`Email enfant ${i+1}`} className="input-tate flex-1" />
                  {enfantsEmails.length > 1 && (
                    <button type="button" onClick={() => retirerEnfant(i)}
                      className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/50">
                      <X size={16} />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {enfantsEmails.length < 5 && (
              <button type="button" onClick={ajouterEnfant}
                className="flex items-center gap-1 text-sm text-tate-soleil mt-2 hover:underline">
                <Plus size={14} /> Ajouter un enfant
              </button>
            )}
            <p className="text-xs text-tate-terre/40 mt-1">
              Si votre enfant est déjà inscrit, il sera lié automatiquement
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Mot de passe</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="6 caractères minimum" className="input-tate" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Confirmer</label>
            <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              placeholder="••••••••" className="input-tate" required />
          </div>

          <button type="submit" disabled={loading} className="btn-tate w-full py-3.5 text-base">
            {loading ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <button onClick={() => navigate('/login')}
            className="text-sm text-tate-terre/50 hover:text-tate-terre transition-colors">
            ← Déjà un compte ? Se connecter
          </button>
        </div>
      </motion.div>
    </div>
  );
}
