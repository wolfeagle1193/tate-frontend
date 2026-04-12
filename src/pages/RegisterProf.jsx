// ============================================================
// src/pages/RegisterProf.jsx — Candidature professeur
// ============================================================
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Upload, X, CheckCircle, FileText } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const NIVEAUX = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];
const MATIERES = [
  { code:'FR', nom:'Français' },
  { code:'MA', nom:'Mathématiques' },
  { code:'AN', nom:'Anglais' },
  { code:'HI', nom:'Histoire' },
  { code:'GE', nom:'Géographie' },
  { code:'SC', nom:'Sciences' },
];

export function RegisterProf() {
  const navigate = useNavigate();
  const fileRef  = useRef(null);

  const [form, setForm] = useState({
    nom: '', email: '', password: '', confirmPassword: '',
    bioPro: '',
  });
  const [matieresCodes,    setMatieresCodes]    = useState([]);
  const [niveauxEnseignes, setNiveauxEnseignes] = useState([]);
  const [fichiers,         setFichiers]         = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [succes,           setSucces]           = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleMatiere = (code) =>
    setMatieresCodes(p => p.includes(code) ? p.filter(c => c !== code) : [...p, code]);
  const toggleNiveau  = (n) =>
    setNiveauxEnseignes(p => p.includes(n) ? p.filter(x => x !== n) : [...p, n]);

  const handleFichiers = (e) => {
    const nouveaux = Array.from(e.target.files || []);
    setFichiers(p => [...p, ...nouveaux].slice(0, 5));
  };
  const retirerFichier = (i) => setFichiers(p => p.filter((_, j) => j !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword)
      return toast.error('Les mots de passe ne correspondent pas');
    if (matieresCodes.length === 0)
      return toast.error('Sélectionne au moins une matière');
    if (fichiers.length === 0)
      return toast.error('Veuillez joindre au moins votre CV');

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('nom',    form.nom.trim());
      fd.append('email',  form.email.trim());
      fd.append('password', form.password);
      fd.append('bioPro', form.bioPro);
      matieresCodes.forEach(c    => fd.append('matieresCodes',    c));
      niveauxEnseignes.forEach(n => fd.append('niveauxEnseignes', n));
      fichiers.forEach(f         => fd.append('documents', f));

      // Ne pas forcer le Content-Type manuellement — axios le fait avec boundary automatiquement
      await axios.post(`${API}/auth/register/prof`, fd);

      setSucces(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Erreur lors de l\'envoi de la candidature');
    } finally {
      setLoading(false);
    }
  };

  if (succes) return (
    <div className="min-h-screen bg-tate-creme flex flex-col items-center justify-center px-4">
      <motion.div initial={{ scale:0.9, opacity:0 }} animate={{ scale:1, opacity:1 }}
        className="w-full max-w-sm text-center">
        <div className="w-20 h-20 rounded-3xl bg-succes flex items-center justify-center mx-auto mb-4 shadow-lg">
          <CheckCircle size={40} className="text-white" />
        </div>
        <h1 className="text-2xl font-serif font-bold text-tate-terre mb-2">Candidature envoyée !</h1>
        <p className="text-tate-terre/60 text-sm mb-6 leading-relaxed">
          L'administrateur de Taté examinera votre dossier et vous contactera sous <strong>48h</strong> à l'adresse <strong>{form.email}</strong>.
        </p>
        <button onClick={() => navigate('/login')} className="btn-tate px-8 py-3">
          Retour à la connexion
        </button>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen bg-tate-creme flex flex-col items-center justify-center px-4 py-8">
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }}
        className="w-full max-w-lg">

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-tate-soleil flex items-center justify-center
                          font-serif font-bold text-tate-terre text-2xl shadow-tate mx-auto mb-3">T</div>
          <h1 className="text-2xl font-serif font-bold text-tate-terre">Devenir professeur Taté</h1>
          <p className="text-tate-terre/50 text-sm mt-1">Soumettez votre candidature — validation sous 48h</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">

          {/* Nom + Email */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-tate-terre mb-1.5">Nom complet</label>
              <input value={form.nom} onChange={e => set('nom', e.target.value)}
                placeholder="Prénom Nom" className="input-tate" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-tate-terre mb-1.5">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="vous@email.com" className="input-tate" required />
            </div>
          </div>

          {/* Mots de passe */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-semibold text-tate-terre mb-1.5">Mot de passe</label>
              <input type="password" value={form.password} onChange={e => set('password', e.target.value)}
                placeholder="6 car. min." className="input-tate" required minLength={6} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-tate-terre mb-1.5">Confirmer</label>
              <input type="password" value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)}
                placeholder="••••••••" className="input-tate" required />
            </div>
          </div>

          {/* Matières */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-2">
              Matières enseignées <span className="text-alerte">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {MATIERES.map(m => (
                <button key={m.code} type="button" onClick={() => toggleMatiere(m.code)}
                  className={`px-3 py-1.5 rounded-xl text-sm font-medium border transition-all ${
                    matieresCodes.includes(m.code)
                      ? 'bg-tate-soleil border-tate-soleil text-tate-terre'
                      : 'bg-white border-tate-border text-tate-terre/60 hover:border-tate-soleil'
                  }`}>
                  {m.nom}
                </button>
              ))}
            </div>
          </div>

          {/* Niveaux */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-2">Niveaux enseignés</label>
            <div className="flex flex-wrap gap-2">
              {NIVEAUX.map(n => (
                <button key={n} type="button" onClick={() => toggleNiveau(n)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                    niveauxEnseignes.includes(n)
                      ? 'bg-savoir border-savoir text-white'
                      : 'bg-white border-tate-border text-tate-terre/60 hover:border-savoir'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-1.5">Présentation professionnelle</label>
            <textarea value={form.bioPro} onChange={e => set('bioPro', e.target.value)}
              rows={3} placeholder="Votre parcours, expérience, approche pédagogique…"
              className="input-tate resize-none" />
          </div>

          {/* Documents */}
          <div>
            <label className="block text-sm font-semibold text-tate-terre mb-2">
              CV et diplômes <span className="text-alerte">*</span>
              <span className="text-tate-terre/40 font-normal ml-1">(PDF, image, Word · max 10MB chacun)</span>
            </label>

            {/* Zone de dépôt */}
            <div
              onClick={() => fileRef.current?.click()}
              className="border-2 border-dashed border-tate-border rounded-2xl p-6 text-center cursor-pointer
                         hover:border-tate-soleil hover:bg-tate-soleil/5 transition-all">
              <Upload size={24} className="text-tate-terre/40 mx-auto mb-2" />
              <p className="text-sm text-tate-terre/60">Cliquer pour ajouter des fichiers</p>
              <p className="text-xs text-tate-terre/40 mt-1">CV, diplômes, attestations · 5 fichiers max</p>
            </div>
            <input ref={fileRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              onChange={handleFichiers} className="hidden" />

            {/* Liste fichiers */}
            {fichiers.length > 0 && (
              <div className="mt-3 space-y-2">
                {fichiers.map((f, i) => (
                  <div key={i} className="flex items-center gap-2 bg-tate-doux rounded-xl px-3 py-2">
                    <FileText size={16} className="text-tate-terre/60 flex-shrink-0" />
                    <span className="text-sm text-tate-terre flex-1 truncate">{f.name}</span>
                    <span className="text-xs text-tate-terre/40">{(f.size/1024/1024).toFixed(1)}MB</span>
                    <button type="button" onClick={() => retirerFichier(i)}
                      className="p-1 rounded-lg hover:bg-tate-border text-tate-terre/40">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info validation */}
          <div className="bg-tate-soleil/10 border border-tate-soleil/30 rounded-2xl p-3">
            <p className="text-xs text-tate-terre/70 leading-relaxed">
              ℹ️ Votre candidature sera examinée par l'administrateur. Une fois validé, vous recevrez un email et pourrez vous connecter pour préparer vos cours.
            </p>
          </div>

          <button type="submit" disabled={loading} className="btn-tate w-full py-3.5 text-base">
            {loading ? 'Envoi en cours…' : 'Envoyer ma candidature'}
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
