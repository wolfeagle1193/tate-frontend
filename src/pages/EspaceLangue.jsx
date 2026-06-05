import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, LogOut, CheckCircle, Globe, Clock, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function EspaceLangue() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [chapitres, setChapitres] = useState([]);
  const [leconActive, setLeconActive] = useState(null);
  const [chargement, setChargement] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/langue/login', { replace: true }); return; }
    chargerCours();
  }, []);

  const chargerCours = async () => {
    try {
      const token = localStorage.getItem('tate_token');
      const { data } = await axios.get(`${API}/chapitres?niveau=Adulte&matiereCode=AN-AD`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setChapitres(data.data || []);
    } catch (e) {
      console.error('Erreur chargement cours', e);
    } finally {
      setChargement(false);
    }
  };

  const ouvrirLecon = async (chap) => {
    try {
      const token = localStorage.getItem('tate_token');
      const { data } = await axios.get(`${API}/lecons/chapitre/${chap._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const lecon = Array.isArray(data.data) ? data.data[0] : data.data;
      setLeconActive({ chapitre: chap, lecon });
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/langue/login', { replace: true });
  };

  if (leconActive) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        <div className="max-w-4xl mx-auto p-6">
          <button onClick={() => setLeconActive(null)}
            className="text-blue-300 hover:text-white mb-6 flex items-center gap-2 transition">
            ← Retour aux leçons
          </button>

          <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10">
            <h1 className="text-2xl font-bold text-white mb-2">{leconActive.chapitre.titre}</h1>
            <p className="text-blue-200/70 mb-6">{leconActive.chapitre.objectif}</p>

            {leconActive.lecon?.contenuHTML ? (
              <div className="text-blue-100 leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: leconActive.lecon.contenuHTML }} />
            ) : (
              <p className="text-blue-300/50">Contenu en cours de préparation.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-white/5 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe size={24} className="text-blue-400" />
            <span className="text-white font-bold text-lg">Taté Langues</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-blue-200/70 text-sm">{user?.nom || user?.email}</span>
            <button onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 text-blue-200 hover:bg-white/20 transition">
              <LogOut size={16} /> Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Contenu */}
      <main className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Vos cours d'anglais</h1>
          <p className="text-blue-200/70">Programme personnalisé — 3 semaines, 9 séances</p>
        </div>

        {chargement ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-blue-300/50">Chargement de vos cours...</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {chapitres.map((chap, i) => (
              <motion.button
                key={chap._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => ouvrirLecon(chap)}
                className="text-left w-full bg-white/5 hover:bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 transition group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <BookOpen size={20} className="text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold group-hover:text-blue-300 transition">
                        {chap.titre}
                      </h3>
                      <p className="text-blue-200/50 text-sm mt-1">{chap.objectif}</p>
                    </div>
                  </div>
                  <ArrowRight size={18} className="text-blue-400/50 group-hover:text-blue-300 transition shrink-0 mt-1" />
                </div>
              </motion.button>
            ))}
          </div>
        )}

        {!chargement && chapitres.length === 0 && (
          <div className="text-center py-20">
            <p className="text-blue-300/50">Aucun cours disponible pour le moment.</p>
          </div>
        )}

        {/* Progression */}
        <div className="mt-8 bg-white/5 backdrop-blur rounded-2xl p-6 border border-white/10">
          <div className="flex items-center gap-3 mb-4">
            <Clock size={18} className="text-blue-400" />
            <h3 className="text-white font-semibold">Votre progression</h3>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div className="bg-blue-500 h-2 rounded-full" style={{ width: '0%' }} />
          </div>
          <p className="text-blue-200/50 text-sm mt-2">{chapitres.length} séances disponibles</p>
        </div>
      </main>
    </div>
  );
}
