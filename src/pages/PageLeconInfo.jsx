import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileSpreadsheet, BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';
import axios from 'axios';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export function PageLeconInfo() {
  const { leconId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [lecon, setLecon] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/login'); return; }
    fetchLecon();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leconId]);

  async function fetchLecon() {
    try {
      const { data } = await axios.get(`${API}/lecons/${leconId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
      });
      setLecon(data?.data || data?.lecon || data || null);
    } catch (e) {
      console.error('Erreur chargement leçon:', e);
    } finally {
      setLoading(false);
    }
  }

  const [openSection, setOpenSection] = useState(null);

  return (
    <div className="min-h-screen bg-tate-creme">
      {/* ── Header ────────────────────────── */}
      <header className="bg-white border-b border-tate-border sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate('/informatique/dashboard')}
            className="p-2 rounded-xl hover:bg-tate-creme text-tate-terre/50 hover:text-tate-terre transition-all">
            <ArrowLeft size={20} />
          </button>
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center font-serif font-bold text-white text-xs shadow-sm">
            I
          </div>
          <div>
            <h1 className="font-serif font-bold text-tate-terre text-base leading-tight">
              {loading ? 'Chargement...' : lecon?.titre || 'Leçon'}
            </h1>
          </div>
        </div>
      </header>

      {/* ── Contenu ────────────────────────── */}
      <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin inline-block w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm text-tate-terre/50 mt-3">Chargement...</p>
          </div>
        ) : lecon ? (
          <div className="prose prose-tate max-w-none">
            {/* Titre + objectif */}
            {lecon.objectif && (
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-6">
                <p className="text-blue-700 text-sm font-medium">{lecon.objectif}</p>
              </div>
            )}

            {/* Le contenu HTML */}
            {lecon.contenuHTML ? (
              <div className="bg-white rounded-2xl border border-tate-border shadow-card overflow-hidden">
                <div className="p-4 sm:p-6 lecon-content"
                  dangerouslySetInnerHTML={{ __html: lecon.contenuHTML }} />
              </div>
            ) : (
              <div className="text-center py-12">
                <BookOpen size={48} className="mx-auto text-tate-terre/20 mb-4" />
                <p className="text-sm text-tate-terre/50">Cette leçon n'a pas encore de contenu.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-sm text-tate-terre/50">Leçon introuvable</p>
          </div>
        )}
      </main>
    </div>
  );
}
