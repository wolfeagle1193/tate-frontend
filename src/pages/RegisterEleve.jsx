// ============================================================
// src/pages/RegisterEleve.jsx — Inscription élève
// ============================================================
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NIVEAUX = [
  { groupe: 'Primaire',  niveaux: ['CM1','CM2'] },
  { groupe: 'Collège',   niveaux: ['6eme','5eme','4eme','3eme'] },
  { groupe: 'Lycée',     niveaux: ['Seconde','Premiere','Terminale'] },
];

export function RegisterEleve() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  const [mode, setMode] = useState('email'); // 'email' | 'telephone'
  const [form, setForm] = useState({
    nom: '', email: '', telephone: '', password: '', confirmPassword: '',
    niveau: '', parentEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Les mots de passe ne correspondent pas');
    if (!form.niveau)
      return toast.error('Choisis ton niveau scolaire');
    if (!form.nom.trim())
      return toast.error('Ton prénom et nom sont requis');

    setLoading(true);
    try {
      const payload = {
        nom:         form.nom.trim(),
        password:    form.password,
        niveau:      form.niveau,
        parentEmail: form.parentEmail.trim() || undefined,
      };
      if (mode === 'email') {
        if (!form.email.trim()) return toast.error('Email requis');
        payload.email = form.email.trim();
      } else {
        if (!form.telephone.trim()) return toast.error('Numéro de téléphone requis');
        payload.telephone = form.telephone.trim();
      }
      const { data } = await axios.post(`${API}/auth/register/eleve`, payload);

      // Stocker tokens et user
      localStorage.setItem('accessToken',  data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
      setUser(data.data.user);

      toast.success(`Bienvenue sur Taté, ${data.data.user.nom.split(' ')[0]} ! 🎉`);
      navigate('/eleve');
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

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-tate-soleil flex items-center justify-center
                          font-serif font-bold text-tate-terre text-2xl shadow-tate mx-auto mb-3">T</div>
          <h1 className="text-2xl font-serif font-bold text-tate-terre">Rejoindre Taté</h1>
          <p className="text-tate-terre/50 text-sm mt-1">Crée ton compte élève — gratuit</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">

          {/* Nom */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Ton prénom et nom</label>
            <input value={form.nom} onChange={e => set('nom', e.target.value)}
              placeholder="Ex : Aminata Diallo" className="input-tate" required />
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
                  <label className="block text-sm font-semibold text-tate-terre mb-1.5">Adresse email</label>
                  <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                    placeholder="ton@email.com" className="input-tate" />
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

          {/* Niveau */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Ton niveau scolaire</label>
            <select value={form.niveau} onChange={e => set('niveau', e.target.value)}
              className="input-tate" required>
              <option value="">-- Choisir ton niveau --</option>
              {NIVEAUX.map(g => (
                <optgroup key={g.groupe} label={g.groupe}>
                  {g.niveaux.map(n => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          {/* Email parent (optionnel) */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">
              Email de ton parent <span className="text-tate-terre/40 font-normal">(optionnel)</span>
            </label>
            <input type="email" value={form.parentEmail} onChange={e => set('parentEmail', e.target.value)}
              placeholder="parent@email.com" className="input-tate" />
            <p className="text-xs text-tate-terre/40 mt-1">Permet à ton parent de suivre ta progression</p>
          </div>

          {/* Mot de passe */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Mot de passe</label>
            <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
              placeholder="6 caractères minimum" className="input-tate" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Confirmer le mot de passe</label>
            <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
              placeholder="••••••••" className="input-tate" required />
          </div>

          {/* Mention freemium */}
          <div className="bg-tate-soleil/10 border border-tate-soleil/30 rounded-2xl p-3 text-center">
            <p className="text-xs text-tate-terre/70">
              🎁 Accès <strong>gratuit</strong> pour commencer · Abonnement Premium à <strong>2 000 FCFA/mois</strong>
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-tate w-full py-3.5 text-base">
            {loading ? 'Inscription…' : 'Créer mon compte'}
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
