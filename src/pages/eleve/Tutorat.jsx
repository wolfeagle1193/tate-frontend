// ============================================================
// src/pages/eleve/Tutorat.jsx — Cours particuliers & abonnement
// ============================================================
import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, CheckCircle, ChevronRight, Calendar,
  AlertCircle, Star, LogOut,
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useNavigate }  from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const getToken = () => localStorage.getItem('accessToken');

// ── Forfaits ──────────────────────────────────
const FORFAITS = [
  { code:'consultation', label:'1ère consultation', prix:0,     duree:'30 min',    desc:'Gratuite · Définir vos besoins avec le prof',    badge:'🎁 OFFERT',           couleur:'border-succes' },
  { code:'1h',           label:'1 heure',           prix:1500,  duree:'1 séance',  desc:'Idéal pour un point précis',                     badge:null,                  couleur:'border-tate-border' },
  { code:'3h',           label:'3 heures',          prix:4000,  duree:'3 séances', desc:'Progression sur un thème complet',               badge:'⭐ POPULAIRE',        couleur:'border-tate-soleil/70' },
  { code:'5h',           label:'5 heures',          prix:6000,  duree:'5 séances', desc:'Suivi approfondi d\'un chapitre',                badge:null,                  couleur:'border-tate-border' },
  { code:'10h',          label:'10 heures',         prix:12000, duree:'10 séances','desc':'Préparation intensive · Examens',               badge:'💡 MEILLEURE VALEUR', couleur:'border-savoir/70' },
  { code:'20h',          label:'20 heures',         prix:22000, duree:'20 séances', desc:'Accompagnement long terme',                     badge:null,                  couleur:'border-tate-border' },
];

const MATIERES = ['Français','Mathématiques','Anglais','Histoire-Géographie','Sciences'];

const METHODES = [
  { code:'wave',         label:'Wave',           icone:'📱', desc:'Paiement instantané' },
  { code:'orange_money', label:'Orange Money',   icone:'🟠', desc:'Composer le *144#' },
  { code:'carte',        label:'Carte bancaire', icone:'💳', desc:'Visa / Mastercard' },
];

const STATUTS = {
  en_attente:             { label:'En attente',             couleur:'bg-amber-100 text-amber-700' },
  consultation_planifiee: { label:'Consultation planifiée', couleur:'bg-blue-100 text-blue-700' },
  cours_prepare:          { label:'Cours prêt !',           couleur:'bg-purple-100 text-purple-700' },
  confirme:               { label:'Confirmé',               couleur:'bg-green-100 text-green-700' },
  en_cours:               { label:'En cours',               couleur:'bg-tate-soleil/20 text-tate-terre' },
  termine:                { label:'Terminé',                couleur:'bg-gray-100 text-gray-600' },
  annule:                 { label:'Annulé',                 couleur:'bg-red-100 text-red-600' },
};

// ── Layout ────────────────────────────────────
function LayoutTutorat({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-tate-creme">
      <header className="bg-white border-b border-tate-border px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-card">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-sm">T</div>
          <span className="font-serif font-bold text-tate-terre">Taté</span>
          <span className="text-tate-terre/30 mx-1">·</span>
          <span className="text-sm text-tate-terre/60">Cours particuliers</span>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === 'eleve' && (
            <button onClick={() => navigate('/eleve')}
              className="text-sm text-tate-terre/50 hover:text-tate-terre">← Accueil</button>
          )}
          {user?.role === 'parent' && (
            <button onClick={() => navigate('/parent')}
              className="text-sm text-tate-terre/50 hover:text-tate-terre">← Espace parent</button>
          )}
          <button onClick={async () => { await logout(); navigate('/login'); }}
            className="p-2 rounded-xl hover:bg-tate-doux text-tate-terre/40">
            <LogOut size={16} />
          </button>
        </div>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

// ── Carte forfait ─────────────────────────────
function CarteForfait({ f, selectionne, onSelect }) {
  return (
    <motion.button whileHover={{ y:-1 }} onClick={() => onSelect(f.code)}
      className={`w-full card text-left relative transition-all ${
        selectionne ? 'border-tate-soleil shadow-tate' : f.couleur + ' hover:border-tate-soleil/50'
      }`}>
      {f.badge && (
        <span className="absolute -top-2.5 left-4 text-xs font-bold bg-tate-soleil text-tate-terre px-2 py-0.5 rounded-full">
          {f.badge}
        </span>
      )}
      <div className="flex items-center justify-between mt-1">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-tate-terre">{f.label}</p>
          <p className="text-xs text-tate-terre/50 mt-0.5">{f.desc}</p>
          <p className="text-xs text-tate-terre/40">{f.duree}</p>
        </div>
        <div className="text-right flex-shrink-0 ml-4">
          {f.prix === 0
            ? <p className="text-base font-bold text-succes">GRATUIT</p>
            : <><p className="text-lg font-bold text-tate-terre">{f.prix.toLocaleString('fr-FR')}</p>
               <p className="text-xs text-tate-terre/50">FCFA</p></>
          }
        </div>
      </div>
      {selectionne && <div className="absolute top-3 right-3"><CheckCircle size={16} className="text-tate-soleil" /></div>}
    </motion.button>
  );
}

// ── Carte réservation ─────────────────────────
function CarteReservation({ r }) {
  const [ouvert, setOuvert] = useState(false);
  const forfait  = FORFAITS.find(f => f.code === r.forfait);
  const statut   = STATUTS[r.statut] || { label: r.statut, couleur: 'bg-gray-100 text-gray-600' };
  const confirme = r.statut === 'confirme' || r.statut === 'en_cours';

  return (
    <div className={`card transition-all ${confirme ? 'ring-2 ring-green-200' : ''}`}>

      {/* Bannière "Séance planifiée" si confirmée avec date */}
      {confirme && r.dateDebut && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-3 flex items-start gap-2">
          <CheckCircle size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-green-700 uppercase">Séance planifiée</p>
            <p className="text-sm font-semibold text-tate-terre">
              {new Date(r.dateDebut).toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long'
              })}
            </p>
            <p className="text-sm text-tate-terre/70">
              {new Date(r.dateDebut).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {r.dateFin && ` — ${new Date(r.dateFin).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`}
              {r.dureeMin && <span className="text-tate-terre/40 ml-2">({r.dureeMin} min)</span>}
            </p>
          </div>
        </div>
      )}

      <button onClick={() => setOuvert(!ouvert)} className="w-full flex items-center gap-3 text-left">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statut.couleur}`}>{statut.label}</span>
            {forfait && <span className="text-xs text-tate-terre/40">{forfait.label}</span>}
          </div>
          <p className="text-sm font-semibold text-tate-terre truncate">{r.sujet}</p>
          <p className="text-xs text-tate-terre/50">{r.matiere}</p>
        </div>
        <ChevronRight size={16} className={`text-tate-terre/40 flex-shrink-0 transition-transform ${ouvert?'rotate-90':''}`} />
      </button>

      {/* Lien meeting : toujours visible si confirmé */}
      {confirme && r.lienVisio && (
        <a href={r.lienVisio} target="_blank" rel="noopener noreferrer"
          className="mt-3 flex items-center gap-3 bg-blue-600 rounded-xl p-3 hover:bg-blue-700 transition-all">
          <Video size={18} className="text-white flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-bold text-white">Rejoindre la séance Jitsi</p>
            <p className="text-xs text-blue-200">Cliquer pour ouvrir — aucune installation</p>
          </div>
          <ChevronRight size={16} className="text-blue-300" />
        </a>
      )}

      <AnimatePresence>
        {ouvert && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
            exit={{ height:0, opacity:0 }} className="overflow-hidden">
            <div className="pt-4 mt-4 border-t border-tate-border space-y-3">

              {/* Prof */}
              {r.profId && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-tate-soleil flex items-center justify-center text-sm font-bold text-tate-terre flex-shrink-0">
                    {r.profId.nom?.[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-tate-terre">{r.profId.nom}</p>
                    <p className="text-xs text-tate-terre/50">Votre professeur</p>
                  </div>
                </div>
              )}

              {/* Cours préparé (détails complets) */}
              {r.coursPrepare?.titre && (
                <div className="bg-tate-doux rounded-xl p-3 space-y-2">
                  <p className="text-xs font-bold text-tate-terre/50 uppercase">Cours préparé par votre prof</p>
                  <p className="text-sm font-semibold text-tate-terre">{r.coursPrepare.titre}</p>
                  {r.coursPrepare.objectif && (
                    <p className="text-xs text-tate-terre/60 italic">{r.coursPrepare.objectif}</p>
                  )}
                  {r.coursPrepare.contenu && (
                    <div className="bg-white rounded-lg p-2 mt-1">
                      <p className="text-xs font-semibold text-tate-terre/50 mb-1">Aperçu du contenu</p>
                      <p className="text-xs text-tate-terre/70 leading-relaxed line-clamp-4">
                        {r.coursPrepare.contenu}
                      </p>
                    </div>
                  )}
                  {r.coursPrepare.planSeance && (
                    <div className="bg-white rounded-lg p-2">
                      <p className="text-xs font-semibold text-tate-terre/50 mb-1">Plan de séance</p>
                      <p className="text-xs text-tate-terre/70 whitespace-pre-line">{r.coursPrepare.planSeance}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Notes de l'admin (message pour l'élève) */}
              {r.notes && (
                <div className="bg-amber-50 rounded-xl p-3">
                  <p className="text-xs font-bold text-amber-600 uppercase mb-1">Message de l'administration</p>
                  <p className="text-sm text-tate-terre/80">{r.notes}</p>
                </div>
              )}

              {/* Lien meeting (dupliqué dans les détails si pas encore confirmé) */}
              {!confirme && r.lienVisio && (
                <a href={r.lienVisio} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl p-3 hover:bg-blue-100 transition-all">
                  <Video size={18} className="text-blue-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-blue-700">Rejoindre la visioconférence</p>
                    <p className="text-xs text-blue-500">Jitsi Meet — aucune installation requise</p>
                  </div>
                  <ChevronRight size={16} className="text-blue-400" />
                </a>
              )}

              {/* Montant */}
              <div className="flex justify-between text-sm pt-1 border-t border-tate-border">
                <span className="text-tate-terre/50">Forfait</span>
                <span className="font-bold text-tate-terre">
                  {r.prix === 0 ? '🎁 Gratuit' : `${r.prix.toLocaleString('fr-FR')} FCFA`}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Formulaire réservation ────────────────────
function FormulaireReservation({ onSuccess }) {
  const [etape,        setEtape]       = useState(1);
  const [forfait,      setForfait]     = useState('consultation');
  const [form,         setForm]        = useState({ matiere:'', sujet:'' });
  const [methode,      setMethode]     = useState('');
  const [paiementInfo, setPaiementInfo]= useState(null);
  const [resaId,       setResaId]      = useState(null);
  const [loading,      setLoading]     = useState(false);

  const forfaitInfo = FORFAITS.find(f => f.code === forfait);

  const soumettre = async () => {
    if (!form.matiere) return toast.error('Choisis une matière');
    if (!form.sujet.trim()) return toast.error('Décris ton besoin');
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/reservations`,
        { matiere: form.matiere, sujet: form.sujet, forfait },
        { headers: { Authorization: `Bearer ${getToken()}` } }
      );
      const id = data.data?.reservation?._id;
      setResaId(id);
      if (forfaitInfo.prix === 0) {
        toast.success('🎁 Consultation gratuite demandée ! Un prof vous contactera sous 24h.');
        onSuccess();
      } else {
        setEtape(3);
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la réservation');
    } finally { setLoading(false); }
  };

  const payer = async () => {
    if (!methode) return toast.error('Choisis une méthode de paiement');
    setLoading(true);
    try {
      if (resaId) {
        const { data } = await axios.post(`${API}/reservations/${resaId}/payer`,
          { methode },
          { headers: { Authorization: `Bearer ${getToken()}` } }
        );
        setPaiementInfo({ methode, instruction: data.data?.instruction });
      } else {
        const instructions = {
          wave:         `Ouvre Wave → Payer → Code TATE → ${forfaitInfo.prix.toLocaleString('fr-FR')} FCFA`,
          orange_money: `Compose *144# → Paiements → Code TATE → ${forfaitInfo.prix.toLocaleString('fr-FR')} FCFA`,
          carte:        `Paiement sécurisé par carte pour ${forfaitInfo.prix.toLocaleString('fr-FR')} FCFA`,
        };
        setPaiementInfo({ methode, instruction: instructions[methode] });
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur paiement');
    } finally { setLoading(false); }
  };

  if (paiementInfo) return (
    <div className="space-y-4">
      <div className="bg-tate-doux rounded-2xl p-5 text-center">
        <div className="text-3xl mb-2">{METHODES.find(m => m.code === paiementInfo.methode)?.icone}</div>
        <p className="font-semibold text-tate-terre mb-2">Instructions de paiement</p>
        <p className="text-sm text-tate-terre/70 leading-relaxed">{paiementInfo.instruction}</p>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex gap-2">
          <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700">Une fois ton paiement effectué, ton professeur sera assigné sous 24h et planifiera votre première séance.</p>
        </div>
      </div>
      <button onClick={onSuccess} className="btn-tate w-full py-3">Terminé →</button>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Étape 1 : Forfait */}
      {etape === 1 && (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-tate-terre mb-3">Choisis ton forfait</p>
          {FORFAITS.map(f => (
            <CarteForfait key={f.code} f={f} selectionne={forfait === f.code} onSelect={setForfait} />
          ))}
          <button onClick={() => setEtape(2)} className="btn-tate w-full py-3 mt-2">Continuer →</button>
        </div>
      )}

      {/* Étape 2 : Détails */}
      {etape >= 2 && etape <= 3 && (
        <div className="card">
          <p className="text-sm font-semibold text-tate-terre mb-3">
            Forfait sélectionné : <span className="text-tate-soleil">{forfaitInfo?.label}</span>
            {forfaitInfo?.prix === 0
              ? <span className="ml-2 text-succes text-xs">GRATUIT</span>
              : <span className="ml-2 text-xs text-tate-terre/60">{forfaitInfo?.prix.toLocaleString('fr-FR')} FCFA</span>
            }
          </p>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-tate-terre/70 mb-1.5">Matière</label>
              <select value={form.matiere} onChange={e => setForm(f => ({...f, matiere:e.target.value}))}
                className="input-tate">
                <option value="">-- Choisir --</option>
                {MATIERES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-tate-terre/70 mb-1.5">Décris ton besoin</label>
              <textarea value={form.sujet} onChange={e => setForm(f => ({...f, sujet:e.target.value}))}
                rows={4} placeholder="Ex : Je n'arrive pas à faire les équations du 2nd degré, j'ai un examen dans 2 semaines…"
                className="input-tate resize-none" />
            </div>
            {etape === 2 && (
              <button onClick={soumettre} disabled={loading} className="btn-tate w-full py-3">
                {loading ? 'Envoi…' : forfaitInfo?.prix === 0 ? '🎁 Demander la consultation gratuite' : 'Continuer vers le paiement →'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Étape 3 : Paiement */}
      {etape === 3 && forfaitInfo?.prix > 0 && (
        <div className="card">
          <p className="text-sm font-semibold text-tate-terre mb-3">Choisir le mode de paiement</p>
          <div className="space-y-2 mb-4">
            {METHODES.map(m => (
              <button key={m.code} onClick={() => setMethode(m.code)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  methode === m.code ? 'border-tate-soleil bg-tate-soleil/5' : 'border-tate-border hover:border-tate-soleil/50'
                }`}>
                <span className="text-xl">{m.icone}</span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-tate-terre">{m.label}</p>
                  <p className="text-xs text-tate-terre/50">{m.desc}</p>
                </div>
                {methode === m.code && <CheckCircle size={16} className="text-tate-soleil" />}
              </button>
            ))}
          </div>
          <button onClick={payer} disabled={loading || !methode} className="btn-tate w-full py-3">
            {loading ? 'Traitement…' : `Payer ${forfaitInfo.prix.toLocaleString('fr-FR')} FCFA`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── PAGE PRINCIPALE ───────────────────────────
export function Tutorat() {
  const { user } = useAuthStore();
  const [onglet,       setOnglet]      = useState('reserver');
  const [reservations, setReservations]= useState([]);
  const [loading,      setLoading]     = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/reservations`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      setReservations(data.data || []);
    } catch { setReservations([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (onglet === 'mesResas') charger(); }, [onglet, charger]);

  return (
    <LayoutTutorat>
      <div className="mb-5">
        <h1 className="text-2xl font-serif font-bold text-tate-terre">Cours particuliers</h1>
        <p className="text-tate-terre/50 text-sm mt-1">1ère consultation gratuite · Visioconférence Jitsi intégrée</p>
      </div>

      <div className="flex gap-1 bg-tate-doux rounded-2xl p-1 mb-6">
        {[{id:'reserver',label:'Réserver'},{id:'mesResas',label:'Mes séances'}].map(o => (
          <button key={o.id} onClick={() => setOnglet(o.id)}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              onglet === o.id ? 'bg-white shadow-card text-tate-terre' : 'text-tate-terre/50 hover:text-tate-terre'
            }`}>{o.label}</button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {onglet === 'reserver' ? (
          <motion.div key="form" initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}>
            <FormulaireReservation onSuccess={() => { setOnglet('mesResas'); charger(); }} />
          </motion.div>
        ) : (
          <motion.div key="list" initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="w-10 h-10 rounded-full border-4 border-tate-soleil border-t-transparent animate-spin" />
              </div>
            ) : reservations.length === 0 ? (
              <div className="card text-center py-12">
                <Video size={40} className="text-neutre mx-auto mb-3" />
                <p className="font-semibold text-tate-terre">Aucune séance pour l'instant</p>
                <p className="text-sm text-tate-terre/40 mt-1">Ta 1ère consultation est gratuite !</p>
                <button onClick={() => setOnglet('reserver')} className="btn-tate px-6 py-2.5 text-sm mt-4">Réserver →</button>
              </div>
            ) : (
              <div className="space-y-3">
                {reservations.map(r => <CarteReservation key={r._id} r={r} />)}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutTutorat>
  );
}
