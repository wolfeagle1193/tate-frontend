import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle, RotateCcw, ChevronDown, ChevronUp,
  BookOpen, FileText, List, UploadCloud, X, FileImage, File, Loader2,
  Plus, Trash2, ArrowUp, ArrowDown, Eye, EyeOff, GripVertical, PenLine, Code2,
} from 'lucide-react';
import { useProfStore }  from '../../store/useProfStore';
import { useAdminStore } from '../../store/useAdminStore';
import { LayoutProf }    from './LayoutProf';
import { MessageClaude, LoadingTate } from '../../components';
import toast from 'react-hot-toast';

// ── Helpers docs ────────────────────────────────────────────────
const IconeDoc = ({ nom }) => {
  const ext = nom?.split('.').pop()?.toLowerCase();
  if (['jpg','jpeg','png'].includes(ext)) return <FileImage size={13} className="text-blue-500 flex-shrink-0" />;
  if (ext === 'pdf')  return <FileText size={13} className="text-red-500 flex-shrink-0" />;
  return <File size={13} className="text-gray-400 flex-shrink-0" />;
};
const formatTaille = (o) => o < 1024*1024 ? `${(o/1024).toFixed(0)} Ko` : `${(o/1024/1024).toFixed(1)} Mo`;

const NIVEAUX = ['CM1','CM2','6eme','5eme','4eme','3eme','Seconde','Premiere','Terminale'];

// Sous-sections Français (CM1 → 3ème uniquement)
const NIVEAUX_FR_SECTIONS = ['CM1','CM2','6eme','5eme','4eme','3eme'];
const SECTIONS_FR = [
  { value: 'Grammaire',                label: 'Grammaire',                emoji: '🔵', bg: 'bg-blue-50',   border: 'border-blue-300',   text: 'text-blue-700'   },
  { value: 'Conjugaison',              label: 'Conjugaison',              emoji: '🟡', bg: 'bg-yellow-50', border: 'border-yellow-300', text: 'text-yellow-700' },
  { value: 'Orthographe grammaticale', label: 'Orthographe grammaticale', emoji: '🟠', bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-700' },
  { value: "Orthographe d'usage",      label: "Orthographe d'usage",      emoji: '🟢', bg: 'bg-green-50',  border: 'border-green-300',  text: 'text-green-700'  },
];
const MODES = [
  { id: 'A', label: 'Texte libre',      icon: FileText, desc: 'Colle le texte brut de ton cours' },
  { id: 'B', label: 'Formulaire guidé', icon: List,     desc: 'Remplis les champs étape par étape' },
  { id: 'C', label: 'Titre seul',       icon: BookOpen, desc: 'Claude prépare tout à partir du titre' },
  { id: 'D', label: 'Cours structuré',  icon: PenLine,  desc: 'Crée ton cours bloc par bloc' },
  { id: 'E', label: 'Fichier HTML',     icon: Code2,    desc: 'Upload un fichier .html complet' },
];

// ── Configuration des types de blocs ───────────────────────────
const TYPES_BLOCS = [
  { id: 'resume',     label: 'Résumé / Intro', emoji: '📋', bg: 'bg-slate-50',   border: 'border-l-slate-400',   badge: 'bg-slate-100 text-slate-700'   },
  { id: 'section',    label: 'Section',         emoji: '📂', bg: 'bg-tate-doux',  border: 'border-l-tate-soleil', badge: 'bg-tate-soleil/30 text-tate-terre' },
  { id: 'definition', label: 'Définition',      emoji: '📘', bg: 'bg-blue-50',    border: 'border-l-blue-400',    badge: 'bg-blue-100 text-blue-700'     },
  { id: 'important',  label: 'Important',        emoji: '⚠️', bg: 'bg-orange-50',  border: 'border-l-orange-400',  badge: 'bg-orange-100 text-orange-700' },
  { id: 'attention',  label: 'Attention !',      emoji: '🚨', bg: 'bg-red-50',     border: 'border-l-red-400',     badge: 'bg-red-100 text-red-700'       },
  { id: 'astuce',     label: 'Astuce',           emoji: '💡', bg: 'bg-yellow-50',  border: 'border-l-yellow-400',  badge: 'bg-yellow-100 text-yellow-700' },
  { id: 'formule',    label: 'Formule / Règle',  emoji: '🔢', bg: 'bg-purple-50',  border: 'border-l-purple-400',  badge: 'bg-purple-100 text-purple-700' },
  { id: 'exemple',    label: 'Exemple',          emoji: '✏️', bg: 'bg-green-50',   border: 'border-l-green-400',   badge: 'bg-green-100 text-green-700'   },
];
const typeInfo = (id) => TYPES_BLOCS.find(t => t.id === id) || TYPES_BLOCS[0];

// ── Aperçu d'un bloc (mode prévisualisation) ────────────────────
function AperçuBloc({ bloc }) {
  const t = typeInfo(bloc.type);
  if (bloc.type === 'section') {
    return (
      <div className="mt-5 mb-2">
        <h3 className="font-bold text-base text-tate-terre border-b-2 border-tate-soleil pb-1">
          {t.emoji} {bloc.titre || bloc.texte}
        </h3>
      </div>
    );
  }
  if (bloc.type === 'exercice') {
    return (
      <div className={`rounded-xl border-l-4 ${t.border} ${t.bg} p-4 mb-3`}>
        <p className="text-xs font-bold uppercase tracking-wide text-amber-600 mb-1">{t.emoji} Exercice</p>
        <p className="text-sm text-tate-terre font-medium mb-2">{bloc.texte}</p>
        {bloc.correction && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-2 mt-2">
            <p className="text-xs font-bold text-green-700 mb-0.5">✅ Correction</p>
            <p className="text-xs text-tate-terre">{bloc.correction}</p>
          </div>
        )}
        {bloc.explication && (
          <p className="text-xs text-tate-terre/60 mt-1 italic">{bloc.explication}</p>
        )}
      </div>
    );
  }
  const labels = { definition:'📘 Définition', important:'⚠️ Important', attention:'🚨 Attention !', astuce:'💡 Astuce', formule:'🔢 Formule / Règle', exemple:'✏️ Exemple', resume:'📋 Résumé' };
  return (
    <div className={`rounded-xl border-l-4 ${t.border} ${t.bg} p-4 mb-3`}>
      {bloc.type !== 'resume' && (
        <p className="text-xs font-bold uppercase tracking-wide opacity-60 mb-1">{labels[bloc.type]}</p>
      )}
      {bloc.titre && <p className="font-semibold text-sm text-tate-terre mb-1">{bloc.titre}</p>}
      <p className="text-sm text-tate-terre leading-relaxed whitespace-pre-line">{bloc.texte}</p>
    </div>
  );
}

// ── Éditeur d'un bloc ───────────────────────────────────────────
function EditeurBloc({ bloc, index, total, onChange, onDelete, onMove }) {
  const t = typeInfo(bloc.type);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      className={`rounded-2xl border-l-4 ${t.border} border border-tate-border bg-white shadow-sm overflow-hidden`}
    >
      {/* En-tête du bloc */}
      <div className={`flex items-center gap-2 px-3 py-2 ${t.bg}`}>
        <GripVertical size={14} className="text-tate-terre/30 flex-shrink-0" />
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${t.badge}`}>
          {t.emoji} {t.label}
        </span>
        <span className="text-xs text-tate-terre/40 flex-1 truncate italic">
          {collapsed && (bloc.texte || bloc.titre)
            ? (bloc.texte || bloc.titre).slice(0, 40) + '…'
            : ''}
        </span>
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <button onClick={() => onMove(index, -1)} disabled={index === 0}
            className="p-1 rounded-lg hover:bg-white/80 text-tate-terre/40 hover:text-tate-terre disabled:opacity-20 transition-colors">
            <ArrowUp size={13} />
          </button>
          <button onClick={() => onMove(index, 1)} disabled={index === total - 1}
            className="p-1 rounded-lg hover:bg-white/80 text-tate-terre/40 hover:text-tate-terre disabled:opacity-20 transition-colors">
            <ArrowDown size={13} />
          </button>
          <button onClick={() => setCollapsed(c => !c)}
            className="p-1 rounded-lg hover:bg-white/80 text-tate-terre/40 hover:text-tate-terre transition-colors">
            {collapsed ? <ChevronDown size={13} /> : <ChevronUp size={13} />}
          </button>
          <button onClick={() => onDelete(index)}
            className="p-1 rounded-lg hover:bg-red-50 text-tate-terre/30 hover:text-red-500 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Corps du bloc */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
            className="overflow-hidden">
            <div className="px-3 py-3 space-y-2">

              {/* Section : titre seulement */}
              {bloc.type === 'section' && (
                <input
                  value={bloc.titre}
                  onChange={e => onChange(index, { titre: e.target.value })}
                  placeholder="Titre de la section…"
                  className="input-tate font-semibold"
                />
              )}

              {/* Blocs de contenu avec titre optionnel */}
              {!['section','resume'].includes(bloc.type) && (
                <input
                  value={bloc.titre}
                  onChange={e => onChange(index, { titre: e.target.value })}
                  placeholder="Titre (optionnel)…"
                  className="input-tate text-sm"
                />
              )}

              {/* Texte principal */}
              {bloc.type !== 'section' && (
                <textarea
                  value={bloc.texte}
                  onChange={e => onChange(index, { texte: e.target.value })}
                  placeholder={
                    bloc.type === 'exercice'   ? 'Formule la question de l\'exercice…' :
                    bloc.type === 'formule'    ? 'Écris la formule ou la règle…' :
                    bloc.type === 'definition' ? 'Écris la définition…' :
                    bloc.type === 'important'  ? 'Point important à retenir…' :
                    bloc.type === 'attention'  ? 'Piège à éviter ou exception…' :
                    bloc.type === 'astuce'     ? 'Astuce ou conseil pédagogique…' :
                    bloc.type === 'exemple'    ? 'Décris l\'exemple…' :
                    'Texte du résumé ou de l\'introduction…'
                  }
                  rows={bloc.type === 'exercice' ? 2 : 3}
                  className="input-tate resize-none text-sm"
                />
              )}

              {/* Exercice : correction + explication */}
              {bloc.type === 'exercice' && (
                <>
                  <textarea
                    value={bloc.correction}
                    onChange={e => onChange(index, { correction: e.target.value })}
                    placeholder="Réponse attendue (correction)…"
                    rows={2}
                    className="input-tate resize-none text-sm border-green-300 focus:border-green-500"
                  />
                  <textarea
                    value={bloc.explication}
                    onChange={e => onChange(index, { explication: e.target.value })}
                    placeholder="Explication pédagogique (pourquoi cette réponse ?)…"
                    rows={2}
                    className="input-tate resize-none text-sm border-blue-200 focus:border-blue-400"
                  />
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── Palette de types ────────────────────────────────────────────
function PaletteBlocs({ onAjouter }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOuvert(o => !o)}
        className="w-full border-2 border-dashed border-tate-soleil/50 rounded-2xl py-3 px-4
                   flex items-center justify-center gap-2 text-sm font-semibold text-tate-terre/60
                   hover:border-tate-soleil hover:text-tate-terre hover:bg-tate-doux transition-all">
        <Plus size={16} /> Ajouter un bloc
      </button>
      <AnimatePresence>
        {ouvert && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            className="absolute left-0 right-0 z-20 mt-2 bg-white border border-tate-border
                       rounded-2xl shadow-xl p-3 grid grid-cols-3 gap-2">
            {TYPES_BLOCS.map(t => (
              <button
                key={t.id}
                onClick={() => { onAjouter(t.id); setOuvert(false); }}
                className={`${t.bg} border border-tate-border rounded-xl p-2 text-center
                            hover:scale-105 transition-all hover:shadow-md`}>
                <div className="text-lg mb-0.5">{t.emoji}</div>
                <p className="text-xs font-semibold text-tate-terre leading-tight">{t.label}</p>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Utilitaire : fusionne un HTML cours + plusieurs HTML QCM
// Extrait styles, scripts et body de chaque QCM et les injecte
// dans le cours principal avant </head> et </body>
// ═══════════════════════════════════════════════════════════════
function fusionnerCoursEtQCMs(coursHTML, qcmHTMLs) {
  let stylesExtra  = '';
  let scriptsExtra = '';
  let bodiesExtra  = '';

  qcmHTMLs.filter(q => q.trim()).forEach(qcmHTML => {
    // Extraire tous les blocs <style>
    const styles = [...qcmHTML.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
    styles.forEach(m => { stylesExtra += `\n<style>${m[1]}</style>`; });

    // Extraire tous les blocs <script>
    const scripts = [...qcmHTML.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)];
    scripts.forEach(m => { scriptsExtra += `\n<script>${m[1]}</script>`; });

    // Extraire le contenu du <body>
    const bodyMatch = qcmHTML.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    if (bodyMatch) {
      // Retirer les scripts inline du body (déjà capturés au-dessus)
      let bodyContent = bodyMatch[1].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      bodiesExtra += `\n<!-- ═══ QCM ═══ -->\n${bodyContent}`;
    } else {
      // HTML partiel collé sans balises html/body → on le prend tel quel
      let partial = qcmHTML.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
      bodiesExtra += `\n<!-- ═══ QCM ═══ -->\n${partial}`;
    }
  });

  let result = coursHTML;

  // Injecter les styles dans <head> (avant </head>)
  if (stylesExtra) {
    result = result.includes('</head>')
      ? result.replace('</head>', stylesExtra + '\n</head>')
      : stylesExtra + result;
  }

  // Injecter body + scripts avant </body>
  const injection = bodiesExtra + (scriptsExtra ? '\n' + scriptsExtra : '');
  if (injection.trim()) {
    result = result.includes('</body>')
      ? result.replace('</body>', injection + '\n</body>')
      : result + injection;
  }

  return result;
}

// ── Sous-composant : zone d'upload + coller d'un fichier HTML ──
function ZoneHtml({ label, value, onChange, placeholder, rows = 5 }) {
  const ref = useRef(null);

  const handleFichier = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.name.endsWith('.html') && !f.name.endsWith('.htm')) {
      toast.error('Choisis un fichier .html'); return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      onChange(ev.target.result);
      toast.success(`✅ "${f.name}" chargé`);
    };
    reader.readAsText(f, 'UTF-8');
    e.target.value = '';
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-tate-terre/70">{label}</span>
        <div className="flex items-center gap-2">
          {value && (
            <span className="text-xs text-succes font-semibold">
              ✅ {Math.round(value.length / 1024)} Ko
            </span>
          )}
          <button type="button" onClick={() => ref.current?.click()}
            className="flex items-center gap-1 text-xs font-semibold text-savoir
                       border border-savoir/30 rounded-lg px-2 py-1
                       hover:bg-savoir/10 transition-colors">
            <UploadCloud size={12} /> Fichier .html
          </button>
          {value && (
            <button type="button" onClick={() => onChange('')}
              className="flex items-center gap-1 text-xs text-alerte/70 hover:text-alerte transition-colors">
              <X size={12} /> Effacer
            </button>
          )}
        </div>
      </div>
      <input ref={ref} type="file" accept=".html,.htm" className="hidden" onChange={handleFichier} />
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className="input-tate resize-none font-mono text-xs"
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Mode E : Upload d'un fichier HTML complet
// ═══════════════════════════════════════════════════════════════
function CreateurHTML({ onSauvegarder, loading }) {
  // Mode : 'unique' = cours+QCM dans 1 fichier | 'separe' = cours + QCMs séparés
  const [modeHtml,         setModeHtml]         = useState('unique');
  const [html,             setHtml]             = useState('');
  const [qcmBlocs,         setQcmBlocs]         = useState(['']); // Mode séparé
  const [preview,          setPreview]          = useState(false);
  const [iaOuverte,        setIaOuverte]        = useState(false);
  const [modifierHtmlIA,   setModifierHtmlIA]   = useState(false);
  const [instructionsHTML, setInstructionsHTML] = useState('');

  // ── Gestion des blocs QCM (mode séparé) ──────────────────────
  const ajouterQcmBloc  = ()          => setQcmBlocs(b => [...b, '']);
  const modifierQcmBloc = (i, val)    => setQcmBlocs(b => b.map((v, idx) => idx === i ? val : v));
  const supprimerQcmBloc = (i)        => setQcmBlocs(b => b.filter((_, idx) => idx !== i));

  // ── HTML final selon le mode ──────────────────────────────────
  const getHtmlFinal = () => {
    if (modeHtml === 'unique') return html;
    const qcmsRemplis = qcmBlocs.filter(q => q.trim());
    if (!qcmsRemplis.length) return html;
    return fusionnerCoursEtQCMs(html, qcmsRemplis);
  };

  const htmlPreview = modeHtml === 'unique' ? html : getHtmlFinal();
  const qcmCount    = qcmBlocs.filter(q => q.trim()).length;

  const handleSauvegarder = () => {
    if (!html.trim()) { toast.error('Charge le fichier HTML du cours d\'abord'); return; }
    if (modeHtml === 'separe' && qcmCount === 0) {
      toast.error('Ajoute au moins un bloc QCM, ou choisis "Cours + QCM intégrés"');
      return;
    }
    if (modifierHtmlIA && !instructionsHTML.trim()) {
      toast.error('Saisis des instructions pour la modification IA');
      return;
    }
    onSauvegarder({
      contenuHTML:      getHtmlFinal(),
      instructionsHTML: modifierHtmlIA ? instructionsHTML : '',
    });
  };

  return (
    <div className="space-y-5">

      {/* ── Choix du mode ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-2">
        {[
          { key: 'unique',  emoji: '📄', label: 'Cours + QCM',      detail: 'Dans un seul fichier HTML' },
          { key: 'separe',  emoji: '📄➕', label: 'Cours séparé',   detail: 'Ajouter des QCM en dessous' },
        ].map(opt => (
          <button key={opt.key} type="button"
            onClick={() => setModeHtml(opt.key)}
            className={`rounded-2xl border-2 p-3 text-left transition-all ${
              modeHtml === opt.key
                ? 'border-savoir bg-savoir/5 shadow-sm'
                : 'border-tate-border bg-white hover:border-savoir/40'
            }`}>
            <p className="text-base mb-0.5">{opt.emoji}</p>
            <p className={`text-xs font-bold ${modeHtml === opt.key ? 'text-savoir' : 'text-tate-terre'}`}>
              {opt.label}
            </p>
            <p className="text-xs text-tate-terre/50 leading-tight mt-0.5">{opt.detail}</p>
          </button>
        ))}
      </div>

      {/* ── Zone cours principal ───────────────────────────────── */}
      <ZoneHtml
        label={modeHtml === 'unique' ? '📁 Fichier HTML (cours + QCM intégrés)' : '📁 Fichier HTML du cours (sans QCM)'}
        value={html}
        onChange={setHtml}
        placeholder={'<!DOCTYPE html>\n<html>\n<head><title>Mon cours</title></head>\n<body>…</body>\n</html>'}
        rows={6}
      />

      {/* ── Blocs QCM (mode séparé uniquement) ────────────────── */}
      <AnimatePresence>
        {modeHtml === 'separe' && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} className="overflow-hidden space-y-3">

            <div className="flex items-center gap-3">
              <div className="h-px bg-tate-border flex-1" />
              <p className="text-xs font-bold text-tate-terre/50 uppercase tracking-wide">
                Blocs QCM à ajouter en dessous
              </p>
              <div className="h-px bg-tate-border flex-1" />
            </div>

            <p className="text-xs text-tate-terre/50 -mt-1">
              Colle ou charge chaque fichier QCM HTML. Ils seront fusionnés automatiquement
              à la suite du cours avant la sauvegarde.
            </p>

            <AnimatePresence>
              {qcmBlocs.map((bloc, i) => (
                <motion.div key={i}
                  initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="border-2 border-amber-200 rounded-2xl p-3 bg-amber-50/50 space-y-2">

                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-700">
                      📝 QCM {i + 1}
                      {bloc.trim() && (
                        <span className="ml-2 font-normal text-amber-600">
                          · {Math.round(bloc.length / 1024)} Ko chargé
                        </span>
                      )}
                    </span>
                    {qcmBlocs.length > 1 && (
                      <button type="button" onClick={() => supprimerQcmBloc(i)}
                        className="p-1 rounded-lg hover:bg-red-50 text-amber-400 hover:text-alerte transition-colors">
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>

                  <ZoneHtml
                    label=""
                    value={bloc}
                    onChange={v => modifierQcmBloc(i, v)}
                    placeholder={`<!-- Colle ici le HTML complet de ton QCM ${i + 1} -->\n<!DOCTYPE html>\n<html>…</html>`}
                    rows={5}
                  />
                </motion.div>
              ))}
            </AnimatePresence>

            <button type="button" onClick={ajouterQcmBloc}
              className="w-full border-2 border-dashed border-amber-300 rounded-2xl py-2.5
                         flex items-center justify-center gap-2 text-sm font-semibold text-amber-600
                         hover:border-amber-400 hover:bg-amber-50 transition-all">
              <Plus size={15} /> Ajouter un autre QCM
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Aperçu du résultat fusionné ────────────────────────── */}
      {htmlPreview.trim() && (
        <div>
          <button type="button" onClick={() => setPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-savoir
                       hover:text-savoir/70 transition-colors">
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview
              ? 'Fermer l\'aperçu'
              : modeHtml === 'separe' && qcmCount > 0
                ? `Prévisualiser (cours + ${qcmCount} QCM fusionné${qcmCount > 1 ? 's' : ''})`
                : 'Prévisualiser'
            }
          </button>
          <AnimatePresence>
            {preview && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
                className="overflow-hidden mt-2">
                <div className="rounded-xl overflow-hidden border border-tate-border">
                  <div className="bg-tate-terre/5 px-3 py-1.5 flex items-center gap-2 border-b border-tate-border">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <p className="text-xs text-tate-terre/40 flex-1 text-center">
                      {modeHtml === 'separe' ? `Aperçu fusionné (cours + ${qcmCount} QCM)` : 'Aperçu du cours'}
                    </p>
                  </div>
                  <iframe srcDoc={htmlPreview} title="Aperçu"
                    style={{ width: '100%', height: '60vh', border: 'none' }}
                    sandbox="allow-scripts" />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ── Section IA ────────────────────────────────────────── */}
      <div className="border-2 border-savoir/30 rounded-2xl overflow-hidden">
        <button type="button" onClick={() => setIaOuverte(o => !o)}
          className="w-full flex items-center justify-between px-4 py-3 bg-savoir/5 hover:bg-savoir/10 transition-colors">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-savoir" />
            <span className="font-semibold text-sm text-tate-terre">
              Consignes pour l'IA <span className="font-normal text-tate-terre/50">(optionnel)</span>
            </span>
            {modifierHtmlIA && (
              <span className="text-xs bg-savoir text-white px-2 py-0.5 rounded-full">HTML IA</span>
            )}
          </div>
          {iaOuverte ? <ChevronUp size={15} className="text-savoir" /> : <ChevronDown size={15} className="text-savoir" />}
        </button>

        <AnimatePresence>
          {iaOuverte && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <div className="px-4 py-4 space-y-4 bg-white">
                <p className="text-xs text-tate-terre/60">
                  Donne des instructions à Claude pour qu'il améliore automatiquement le HTML final.
                </p>
                <div className={`rounded-xl border-2 p-3 transition-all ${modifierHtmlIA ? 'border-savoir/60 bg-savoir/5' : 'border-tate-border bg-tate-doux/50'}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" checked={modifierHtmlIA}
                      onChange={e => setModifierHtmlIA(e.target.checked)}
                      className="w-4 h-4 accent-savoir rounded" />
                    <div>
                      <p className="text-sm font-semibold text-tate-terre">✏️ Modifier / réécrire le HTML</p>
                      <p className="text-xs text-tate-terre/50">Claude retouche ou réécrit le fichier selon tes instructions</p>
                    </div>
                  </label>
                  <AnimatePresence>
                    {modifierHtmlIA && (
                      <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                        <textarea value={instructionsHTML} onChange={e => setInstructionsHTML(e.target.value)}
                          placeholder={`Ex : Simplifie le vocabulaire pour un élève de CM1.\nAjoute une section "À retenir" à la fin.\nMets en valeur les définitions avec un encadré coloré.`}
                          rows={4} className="input-tate resize-none text-sm mt-3" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Bouton sauvegarder ─────────────────────────────────── */}
      {html.trim() && (
        <button onClick={handleSauvegarder} disabled={loading}
          className="btn-tate w-full py-4 flex items-center justify-center gap-2 text-base">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              {modifierHtmlIA ? 'Claude traite le cours…' : 'Fusion et enregistrement…'}
            </>
          ) : (
            <>
              {modifierHtmlIA ? <Sparkles size={18} /> : <CheckCircle size={18} />}
              {modifierHtmlIA
                ? 'Envoyer à Claude · modifier HTML'
                : modeHtml === 'separe' && qcmCount > 0
                  ? `Fusionner et sauvegarder (cours + ${qcmCount} QCM)`
                  : 'Sauvegarder le cours HTML'
              }
            </>
          )}
        </button>
      )}
    </div>
  );
}

// ── Constructeur de blocs complet ───────────────────────────────
function CreateurBlocs({ onSauvegarder, loading }) {
  const [blocs, setBlocs] = useState([]);
  const [preview, setPreview] = useState(false);

  const ajouterBloc = (type) => {
    const nouveau = { type, titre: '', texte: '', correction: '', explication: '', _id: Date.now() };
    setBlocs(b => [...b, nouveau]);
  };

  const modifierBloc = (index, champs) => {
    setBlocs(b => b.map((bloc, i) => i === index ? { ...bloc, ...champs } : bloc));
  };

  const supprimerBloc = (index) => {
    setBlocs(b => b.filter((_, i) => i !== index));
  };

  const deplacerBloc = (index, direction) => {
    setBlocs(b => {
      const nouv = [...b];
      const cible = index + direction;
      if (cible < 0 || cible >= nouv.length) return nouv;
      [nouv[index], nouv[cible]] = [nouv[cible], nouv[index]];
      return nouv;
    });
  };

  const handleSauvegarder = () => {
    if (blocs.length === 0) { toast.error('Ajoute au moins un bloc'); return; }
    onSauvegarder(blocs);
  };

  return (
    <div className="space-y-4">
      {/* Barre de statut */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3 text-xs text-tate-terre/50">
          <span>{blocs.length} bloc{blocs.length > 1 ? 's' : ''}</span>
        </div>
        {blocs.length > 0 && (
          <button
            onClick={() => setPreview(p => !p)}
            className="flex items-center gap-1.5 text-xs font-semibold text-savoir hover:text-savoir/70 transition-colors">
            {preview ? <EyeOff size={13} /> : <Eye size={13} />}
            {preview ? 'Modifier' : 'Prévisualiser'}
          </button>
        )}
      </div>

      {/* Mode prévisualisation */}
      {preview && blocs.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="bg-white border border-tate-border rounded-2xl p-5 space-y-1">
          <p className="text-xs text-tate-terre/40 mb-3 text-center uppercase tracking-wide">
            — Aperçu tel que les élèves le verront —
          </p>
          {blocs.map((bloc, i) => <AperçuBloc key={bloc._id || i} bloc={bloc} />)}
        </motion.div>
      )}

      {/* Mode édition */}
      {!preview && (
        <>
          {blocs.length === 0 && (
            <div className="text-center py-10 text-tate-terre/40">
              <p className="text-4xl mb-2">📄</p>
              <p className="text-sm">Ton cours est vide — ajoute des blocs pour commencer</p>
            </div>
          )}

          <AnimatePresence mode="popLayout">
            {blocs.map((bloc, i) => (
              <EditeurBloc
                key={bloc._id || i}
                bloc={bloc}
                index={i}
                total={blocs.length}
                onChange={modifierBloc}
                onDelete={supprimerBloc}
                onMove={deplacerBloc}
              />
            ))}
          </AnimatePresence>

          <PaletteBlocs onAjouter={ajouterBloc} />
        </>
      )}

      {/* Bouton sauvegarder */}
      {blocs.length > 0 && (
        <button
          onClick={handleSauvegarder}
          disabled={loading}
          className="btn-tate w-full py-4 flex items-center justify-center gap-2 text-base">
          {loading
            ? <><Loader2 size={18} className="animate-spin" /> Enregistrement…</>
            : <><CheckCircle size={18} /> Sauvegarder le cours ({blocs.length} bloc{blocs.length>1?'s':''})</>
          }
        </button>
      )}
    </div>
  );
}

// ── Aperçu cours structuré après sauvegarde ─────────────────────
function AperçuCoursManuel({ contenuStructure }) {
  if (!contenuStructure?.length) return null;
  const exercices = contenuStructure.filter(b => b.type === 'exercice');
  return (
    <div className="space-y-3">
      <div className="bg-white border border-tate-border rounded-2xl p-5">
        <p className="text-xs text-tate-terre/40 mb-4 text-center uppercase tracking-wide">
          — Aperçu du cours —
        </p>
        {contenuStructure.map((bloc, i) => <AperçuBloc key={i} bloc={bloc} />)}
      </div>
      {exercices.length > 0 && (
        <div className="border border-tate-border rounded-2xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-3 border-b border-tate-border">
            <p className="font-semibold text-sm text-tate-terre">
              📝 {exercices.length} exercice{exercices.length > 1 ? 's' : ''} avec corrections
            </p>
          </div>
          <div className="px-4 py-4 space-y-3">
            {exercices.map((e, i) => (
              <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-semibold text-tate-terre/60 mb-1">Question {i+1}</p>
                <p className="text-sm font-medium text-tate-terre mb-1">{e.texte}</p>
                <p className="text-sm text-green-700 font-semibold">→ {e.correction}</p>
                {e.explication && <p className="text-xs text-tate-terre/50 mt-1 italic">{e.explication}</p>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Accordéon ───────────────────────────────────────────────────
function Section({ titre, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-tate-border rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-tate-doux hover:bg-tate-border/30 transition-colors">
        <span className="font-semibold text-sm text-tate-terre">{titre}</span>
        {open ? <ChevronUp size={16} className="text-tate-terre/50" /> : <ChevronDown size={16} className="text-tate-terre/50" />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }} exit={{ height:0, opacity:0 }}
            className="overflow-hidden">
            <div className="px-4 py-4 bg-white">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// Page principale
// ═══════════════════════════════════════════════════════════════
export function PreparerCours() {
  const {
    chapitres, chargerChapitres, preparerCours, preparerCoursManuel, preparerCoursHTML,
    validerLecon, preparation, loadingIA, resetPreparation,
  } = useProfStore();
  const { matieres: matieresStore, chargerMatieres } = useAdminStore();
  const [matieresLocales, setMatieresLocales] = useState([]);

  const [mode,       setMode]       = useState('A');
  const [niveau,     setNiveau]     = useState('CM1');
  const [matiereId,  setMatiereId]  = useState('');
  const [sectionFr,  setSectionFr]  = useState('');   // sous-section Français
  const [chapitreId, setChapitreId] = useState('');
  // Mode "nouveau chapitre" : saisie libre du titre sans passer par GestionChapitres
  const [modeLibre,        setModeLibre]        = useState(false);
  const [libreObjectif,    setLibreObjectif]    = useState('');
  const [libreTitre,       setLibreTitre]       = useState('');
  const [contenuBrut, setContenuBrut] = useState('');
  const [formB, setFormB] = useState({ reglePrincipale:'', motsVocabulaire:'', exemplesProf:'', pieges:'' });
  const [promptProf,  setPromptProf]  = useState('');
  const [fichiers,    setFichiers]    = useState([]);
  const inputFileRef = useRef(null);

  // Matières = store (si déjà chargé) ou fetch direct (garanti même si le store est vide)
  const matieres = matieresStore.length > 0 ? matieresStore : matieresLocales;

  useEffect(() => {
    // Charger via le store (met à jour le cache global)
    chargerMatieres().catch(() => {});
    // Fetch direct en parallèle comme filet de sécurité
    const token = localStorage.getItem('accessToken');
    const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    import('axios').then(({ default: axios }) =>
      axios.get(`${API_BASE}/matieres`, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => { if (Array.isArray(r.data?.data)) setMatieresLocales(r.data.data); })
        .catch(() => {})
    );
  }, []);

  useEffect(() => {
    if (matiereId && !modeLibre) chargerChapitres(niveau, matiereId);
  }, [niveau, matiereId, modeLibre]);

  // Matière sélectionnée (pour détecter Français)
  const matSelected = matieres.find(m => m._id === matiereId);
  const isFrancais  = matSelected?.code === 'FR';
  const showSectionsFr = isFrancais && NIVEAUX_FR_SECTIONS.includes(niveau);

  // Reset sectionFr si on change de matière ou de niveau
  useEffect(() => { setSectionFr(''); setChapitreId(''); }, [matiereId, niveau]);

  // Chapitres filtrés par sous-section Français (si applicable)
  const chapitresFiltres = showSectionsFr && sectionFr
    ? chapitres.filter(c => c.sectionFr === sectionFr)
    : chapitres;

  // ── Créer un chapitre à la volée et retourner son ID ─────────
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const creerChapitreVolee = async () => {
    if (!libreTitre.trim()) { toast.error('Saisis le titre du chapitre'); return null; }
    if (!matiereId)         { toast.error('Choisis une matière'); return null; }
    const token = localStorage.getItem('accessToken');
    const { data } = await (await import('axios')).default.post(
      `${API_URL}/chapitres`,
      {
        titre:    libreTitre.trim(),
        matiereId,
        niveau:   matSelected?.estLangue ? null : niveau,
        objectif: libreObjectif.trim() || `Cours de ${libreTitre.trim()}`,
        ordre:    99,
        sectionFr: showSectionsFr && sectionFr ? sectionFr : null,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    return data.data._id;
  };

  const retirerFichier = (idx) => setFichiers(prev => prev.filter((_, i) => i !== idx));
  const handleAjouterFichiers = (e) => {
    const nouveaux = Array.from(e.target.files || []);
    e.target.value = '';
    setFichiers(prev => {
      const reste = 5 - prev.length;
      return [...prev, ...nouveaux.slice(0, reste)];
    });
  };

  // ── Résoudre l'ID du chapitre (existant ou nouveau) ─────────────
  const resolveChapitreId = async () => {
    if (modeLibre) return await creerChapitreVolee();
    if (!chapitreId) { toast.error('Choisis ou crée un chapitre'); return null; }
    return chapitreId;
  };

  // ── Soumission selon le mode ──
  const handlePreparer = async () => {
    const cId = await resolveChapitreId();
    if (!cId) return;
    try {
      if (mode === 'D') return; // géré par CreateurBlocs directement
      const payload = {
        chapitreId: cId, promptProf, fichiers,
        contenuBrut:   mode === 'A' ? contenuBrut : undefined,
        formStructure: mode === 'B' ? {
          reglePrincipale:  formB.reglePrincipale,
          motsVocabulaire:  formB.motsVocabulaire.split(',').map(s => s.trim()).filter(Boolean),
          exemplesProf:     formB.exemplesProf.split('\n').filter(Boolean),
          pieges:           formB.pieges.split('\n').filter(Boolean),
        } : undefined,
      };
      await preparerCours(payload);
      toast.success('Cours prêt ! Vérifiez puis publiez.');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la préparation');
    }
  };

  // ── Soumission mode D ──
  const handleSauvegarderBlocs = async (blocs) => {
    const cId = await resolveChapitreId();
    if (!cId) return;
    try {
      await preparerCoursManuel({ chapitreId: cId, contenuStructure: blocs });
      toast.success('Cours structuré sauvegardé ! Vérifiez puis publiez.');
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  // ── Soumission mode E (HTML) ──
  const handleSauvegarderHTML = async ({ contenuHTML, exercices, instructionsHTML, instructionsExos, genererExos }) => {
    const cId = await resolveChapitreId();
    if (!cId) return;
    try {
      const res = await preparerCoursHTML({ chapitreId: cId, contenuHTML, exercices, instructionsHTML, instructionsExos, genererExos });
      const nbIA  = res?.nbIA  || 0;
      const nbMan = res?.nbManuels || 0;
      if (genererExos && nbIA > 0) {
        toast.success(`Cours sauvegardé ! Claude a généré ${nbIA} exercice${nbIA>1?'s':''} 🤖`);
      } else if (instructionsHTML) {
        toast.success('Cours HTML modifié par l\'IA et sauvegardé ! ✨');
      } else {
        toast.success('Cours HTML sauvegardé ! Vérifiez puis publiez.');
      }
    } catch (e) {
      toast.error(e.response?.data?.error || 'Erreur lors de la sauvegarde');
    }
  };

  const handleValider = async () => {
    try {
      await validerLecon(preparation.lecon._id);
      toast.success('Leçon publiée ! Les élèves peuvent y accéder.');
    } catch (e) {
      toast.error('Erreur lors de la validation');
    }
  };

  return (
    <LayoutProf titre="Préparer un cours">
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── FORMULAIRE (avant préparation) ─────────────────── */}
        {!preparation && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-5">

            {/* Étape 1 : Choisir le chapitre */}
            <div className="card">
              <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-tate-soleil text-tate-terre text-xs font-bold flex items-center justify-center">1</span>
                Chapitre concerné
              </h2>

              {/* Toggle Existant / Nouveau */}
              <div className="flex gap-2 mb-4">
                <button type="button"
                  onClick={() => setModeLibre(false)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    !modeLibre ? 'bg-tate-soleil/20 border-tate-soleil text-tate-terre' : 'border-tate-border text-tate-terre/50 hover:bg-tate-doux'
                  }`}>
                  📋 Chapitre existant
                </button>
                <button type="button"
                  onClick={() => setModeLibre(true)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border-2 transition-all ${
                    modeLibre ? 'bg-tate-soleil/20 border-tate-soleil text-tate-terre' : 'border-tate-border text-tate-terre/50 hover:bg-tate-doux'
                  }`}>
                  ✏️ Nouveau chapitre (saisie libre)
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Niveau</label>
                  <select value={niveau} onChange={e => setNiveau(e.target.value)} className="input-tate">
                    {NIVEAUX.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Matière</label>
                  <select value={matiereId} onChange={e => setMatiereId(e.target.value)} className="input-tate">
                    <option value="">Choisir…</option>
                    {matieres.map(m => <option key={m._id} value={m._id}>{m.icone} {m.nom}</option>)}
                  </select>
                </div>
              </div>

              {/* Mode saisie libre */}
              {modeLibre && (
                <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} className="space-y-2 mb-3 p-3 bg-tate-soleil/5 border border-tate-soleil/30 rounded-xl">
                  <input
                    value={libreTitre}
                    onChange={e => setLibreTitre(e.target.value)}
                    placeholder="Titre du chapitre (ex : Les fractions, La phrase complexe…)"
                    className="input-tate font-semibold"
                  />
                  <input
                    value={libreObjectif}
                    onChange={e => setLibreObjectif(e.target.value)}
                    placeholder="Objectif pédagogique (optionnel)"
                    className="input-tate text-sm"
                  />
                  {showSectionsFr && (
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {SECTIONS_FR.map(s => (
                        <button key={s.value} type="button"
                          onClick={() => setSectionFr(s.value)}
                          className={`p-2 rounded-xl border text-xs font-semibold transition-all ${
                            sectionFr === s.value ? `${s.bg} ${s.border} ${s.text}` : 'border-tate-border text-tate-terre/50'
                          }`}>
                          {s.emoji} {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
              {/* Chapitre existant : sous-sections + dropdown (masqués en mode nouveau chapitre) */}
              {!modeLibre && (
                <>
                  {/* Sous-sections Français */}
                  {showSectionsFr && (
                    <div className="mb-3">
                      <label className="block text-xs font-bold text-tate-terre/70 mb-2">
                        📚 Sous-section Français
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {SECTIONS_FR.map(s => (
                          <button key={s.value} type="button"
                            onClick={() => { setSectionFr(s.value); setChapitreId(''); }}
                            className={`p-2.5 rounded-xl border-2 text-xs font-semibold text-left transition-all ${
                              sectionFr === s.value
                                ? `${s.bg} ${s.border} ${s.text} shadow-sm`
                                : 'border-tate-border bg-white text-tate-terre/60 hover:border-tate-soleil/50'
                            }`}>
                            {s.emoji} {s.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropdown chapitre */}
                  {chapitresFiltres.length > 0 && (!showSectionsFr || sectionFr) && (
                    <div>
                      <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Chapitre</label>
                      <select value={chapitreId} onChange={e => setChapitreId(e.target.value)} className="input-tate">
                        <option value="">Choisir un chapitre…</option>
                        {chapitresFiltres.map(c => (
                          <option key={c._id} value={c._id}>Chap. {c.ordre} — {c.titre}</option>
                        ))}
                      </select>
                      {showSectionsFr && (
                        <p className="text-xs text-tate-terre/40 mt-1">
                          {chapitresFiltres.length} chapitre{chapitresFiltres.length > 1 ? 's' : ''} en {sectionFr}
                        </p>
                      )}
                    </div>
                  )}
                  {/* Message si Français sélectionné mais pas encore de sous-section */}
                  {showSectionsFr && !sectionFr && (
                    <p className="text-xs text-tate-soleil font-medium mt-1">
                      ↑ Choisis une sous-section pour voir les chapitres disponibles
                    </p>
                  )}
                  {/* Message si sous-section choisie mais aucun chapitre */}
                  {showSectionsFr && sectionFr && chapitresFiltres.length === 0 && (
                    <p className="text-xs text-neutre mt-1">
                      Aucun chapitre en {sectionFr} pour le niveau {niveau}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Étape 2 : Mode de saisie */}
            <div className="card">
              <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-tate-soleil text-tate-terre text-xs font-bold flex items-center justify-center">2</span>
                Comment veux-tu créer le cours ?
              </h2>
              <div className="grid grid-cols-2 gap-2 mb-4 sm:grid-cols-3 lg:grid-cols-5">
                {MODES.map(m => {
                  const Icon = m.icon;
                  const isNew = m.id === 'D';
                  return (
                    <button key={m.id} onClick={() => setMode(m.id)}
                      className={`p-3 rounded-xl border-2 text-center transition-all relative ${
                        mode === m.id
                          ? 'border-tate-soleil bg-tate-doux shadow-tate'
                          : 'border-tate-border hover:border-tate-soleil/50'
                      }`}>
                      {isNew && (
                        <span className="absolute -top-1.5 -right-1.5 text-[9px] bg-succes text-white font-bold px-1.5 py-0.5 rounded-full">
                          NOUVEAU
                        </span>
                      )}
                      <Icon size={18} className={`mx-auto mb-1 ${mode === m.id ? 'text-tate-terre' : 'text-neutre'}`} />
                      <p className="text-xs font-semibold text-tate-terre">{m.label}</p>
                      <p className="text-xs text-tate-terre/40 mt-0.5 leading-tight">{m.desc}</p>
                    </button>
                  );
                })}
              </div>

              <AnimatePresence mode="wait">
                {mode === 'A' && (
                  <motion.div key="A" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                    <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Texte de ton cours</label>
                    <textarea value={contenuBrut} onChange={e => setContenuBrut(e.target.value)}
                      placeholder="Colle ici le texte brut de ton cours, ton manuel, tes notes… Claude va tout restructurer selon le modèle pédagogique."
                      className="input-tate resize-none" rows={6} />
                    <p className="text-xs text-tate-terre/40 mt-1">Plus tu donnes de contenu, plus le cours sera précis</p>
                  </motion.div>
                )}

                {mode === 'B' && (
                  <motion.div key="B" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Règle principale</label>
                      <input value={formB.reglePrincipale} onChange={e => setFormB(f => ({ ...f, reglePrincipale: e.target.value }))}
                        placeholder="Ex : On ajoute -s au nom pour former le pluriel" className="input-tate" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Mots de vocabulaire clés <span className="font-normal">(séparés par des virgules)</span></label>
                      <input value={formB.motsVocabulaire} onChange={e => setFormB(f => ({ ...f, motsVocabulaire: e.target.value }))}
                        placeholder="Ex : pluriel, singulier, nom, déterminant" className="input-tate" />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Tes exemples <span className="font-normal">(un par ligne)</span></label>
                      <textarea value={formB.exemplesProf} onChange={e => setFormB(f => ({ ...f, exemplesProf: e.target.value }))}
                        placeholder={"un chat → des chats\nun gâteau → des gâteaux"} className="input-tate resize-none" rows={3} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-tate-terre/60 mb-1">Pièges / exceptions <span className="font-normal">(un par ligne)</span></label>
                      <textarea value={formB.pieges} onChange={e => setFormB(f => ({ ...f, pieges: e.target.value }))}
                        placeholder={"Les noms en -eau prennent -x\nLes noms en -al font -aux"} className="input-tate resize-none" rows={3} />
                    </div>
                  </motion.div>
                )}

                {mode === 'C' && (
                  <motion.div key="C" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                    <MessageClaude
                      texte="Je vais préparer tout le cours à partir du titre du chapitre. Je connais le programme scolaire et je vais créer un cours complet avec la règle, les exemples, les exercices et les corrections-types !"
                      type="info" />
                  </motion.div>
                )}

                {mode === 'D' && (
                  <motion.div key="D" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                    <div className="mb-3 p-3 bg-tate-doux rounded-xl border border-tate-soleil/30">
                      <p className="text-xs text-tate-terre/70 leading-relaxed">
                        ✨ <strong>Mode manuel :</strong> Crée ton cours bloc par bloc — définitions, règles, exemples, exercices avec corrections.
                        Tout ce que tu saisiras sera affiché exactement comme tu l'as écrit, sans modification par l'IA.
                      </p>
                    </div>
                    <CreateurBlocs
                      onSauvegarder={handleSauvegarderBlocs}
                      loading={loadingIA}
                    />
                  </motion.div>
                )}

                {mode === 'E' && (
                  <motion.div key="E" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                    <div className="mb-3 p-3 bg-purple-50 rounded-xl border border-purple-200">
                      <p className="text-xs text-purple-700 leading-relaxed">
                        🌐 <strong>Mode HTML :</strong> Upload ton fichier <code className="bg-purple-100 px-1 rounded">.html</code> ou colle ton code.
                        Le cours sera affiché tel quel avec toutes tes couleurs et mises en forme.
                        Ajoute ensuite les exercices interactifs ci-dessous.
                      </p>
                    </div>
                    <CreateurHTML
                      onSauvegarder={handleSauvegarderHTML}
                      loading={loadingIA}
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Étape 3 : Consignes + docs (modes A, B, C seulement) */}
            {mode !== 'D' && mode !== 'E' && (
              <div className="card">
                <h2 className="font-serif font-bold text-tate-terre mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-tate-soleil text-tate-terre text-xs font-bold flex items-center justify-center">3</span>
                  Tes consignes et documents
                  <span className="text-xs font-normal text-tate-terre/40">(facultatif)</span>
                </h2>
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-tate-terre/70 mb-1.5">✍️ Consignes personnelles</label>
                  <textarea value={promptProf} onChange={e => setPromptProf(e.target.value)} rows={3}
                    placeholder={`Indique comment tu veux que le cours soit structuré :\n• Ex : Insiste sur les exceptions du pluriel en -ail/-aux\n• Utilise des exemples tirés de la vie en Afrique de l'Ouest`}
                    className="input-tate resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-tate-terre/70 mb-1.5 flex items-center justify-between">
                    <span>📎 Documents de référence</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${fichiers.length >= 5 ? 'bg-alerte/10 text-alerte' : 'bg-savoir/10 text-savoir'}`}>{fichiers.length}/5</span>
                  </label>
                  {fichiers.length > 0 && (
                    <div className="space-y-1.5 mb-3">
                      {fichiers.map((f, i) => (
                        <div key={i} className="flex items-center gap-2 bg-tate-doux rounded-xl px-3 py-2 border border-tate-border">
                          <IconeDoc nom={f.name} />
                          <span className="text-xs text-tate-terre flex-1 truncate font-medium">{f.name}</span>
                          <span className="text-xs text-tate-terre/40 flex-shrink-0">{formatTaille(f.size)}</span>
                          <button onClick={() => retirerFichier(i)} className="p-1 rounded-lg hover:bg-red-50 text-neutre hover:text-alerte transition-colors"><X size={12} /></button>
                        </div>
                      ))}
                    </div>
                  )}
                  {fichiers.length < 5 && (
                    <>
                      <input ref={inputFileRef} type="file" multiple accept=".pdf,.txt,.docx,.doc,.jpg,.jpeg,.png" className="hidden" onChange={handleAjouterFichiers} />
                      <button onClick={() => inputFileRef.current?.click()}
                        className="w-full border-2 border-dashed border-savoir/30 rounded-xl py-3 text-xs text-savoir/70 hover:border-savoir hover:bg-savoir/5 transition-all flex items-center justify-center gap-2 font-medium">
                        <UploadCloud size={14} /> Sélectionner des documents
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Bouton lancer (modes A, B, C) */}
            {mode !== 'D' && mode !== 'E' && (
              <>
                <button onClick={handlePreparer} disabled={!chapitreId || loadingIA}
                  className="btn-tate w-full py-4 flex items-center justify-center gap-2 text-base">
                  <Sparkles size={18} />
                  {loadingIA ? 'Taté prépare ton cours…' : `Lancer la préparation${fichiers.length > 0 ? ` avec ${fichiers.length} doc(s)` : ''}`}
                </button>
                {loadingIA && <LoadingTate message="Taté analyse tes documents et structure le cours…" />}
              </>
            )}
          </motion.div>
        )}

        {/* ── RÉSULTAT (après préparation) ────────────────────── */}
        {preparation && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} className="space-y-4">

            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-2xl">
              <CheckCircle size={20} className="text-succes flex-shrink-0" />
              <div>
                <p className="font-semibold text-tate-terre text-sm">
                  {preparation.source === 'manuel' ? 'Cours structuré sauvegardé !' : 'Cours préparé par Claude !'}
                </p>
                <p className="text-xs text-tate-terre/50">Vérifiez le contenu puis publiez-le aux élèves</p>
              </div>
            </div>

            {/* Cours HTML uploadé */}
            {preparation.source === 'html' && preparation.lecon?.contenuHTML && (
              <div className="space-y-3">
                <div className="rounded-2xl overflow-hidden border border-tate-border">
                  <div className="bg-tate-terre/5 px-3 py-2 flex items-center gap-2 border-b border-tate-border">
                    <div className="flex gap-1">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                    </div>
                    <p className="text-xs text-tate-terre/40 flex-1 text-center">Aperçu du cours HTML</p>
                  </div>
                  <iframe
                    srcDoc={preparation.lecon.contenuHTML}
                    title="Aperçu"
                    style={{ width: '100%', height: '60vh', border: 'none' }}
                    sandbox="allow-scripts"
                  />
                </div>
                <div className="border border-tate-border rounded-2xl overflow-hidden">
                  <div className="bg-amber-50 px-4 py-3 border-b border-tate-border">
                    <p className="font-semibold text-sm text-tate-terre">
                      📝 {preparation.correctionsTypes?.length || 0} exercice{(preparation.correctionsTypes?.length||0) > 1 ? 's' : ''} avec corrections
                    </p>
                  </div>
                  <div className="px-4 py-4 space-y-3">
                    {preparation.correctionsTypes?.map((c, i) => (
                      <div key={i} className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                        <p className="text-xs font-semibold text-tate-terre/60 mb-1">Question {i+1}</p>
                        <p className="text-sm font-medium text-tate-terre mb-1">{c.question}</p>
                        <p className="text-sm text-green-700 font-semibold">→ {c.reponse}</p>
                        {c.explication && <p className="text-xs text-tate-terre/50 mt-1 italic">{c.explication}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Cours structuré manuel */}
            {preparation.source === 'manuel' && preparation.lecon?.contenuStructure?.length > 0 && (
              <AperçuCoursManuel contenuStructure={preparation.lecon.contenuStructure} />
            )}

            {/* Cours Claude (modes A/B/C) */}
            {preparation.source !== 'manuel' && preparation.lecon?.contenuFormate && (
              <div className="space-y-3">
                <Section titre="📋 Résumé du cours" defaultOpen>
                  <p className="text-sm text-tate-terre leading-relaxed">{preparation.lecon.contenuFormate.resume}</p>
                </Section>
                <Section titre="📌 Règle principale" defaultOpen>
                  <div className="bg-tate-soleil/20 border-l-4 border-tate-soleil p-3 rounded-r-xl">
                    <p className="font-semibold text-tate-terre">{preparation.lecon.contenuFormate.regle}</p>
                  </div>
                </Section>
                <Section titre="💡 Exemples">
                  <div className="space-y-2">
                    {preparation.lecon.contenuFormate.exemples?.map((ex, i) => (
                      <div key={i} className="flex gap-3">
                        <span className="w-5 h-5 rounded-full bg-tate-soleil flex items-center justify-center text-xs font-bold text-tate-terre flex-shrink-0 mt-0.5">{i+1}</span>
                        <p className="text-sm text-tate-terre">{ex}</p>
                      </div>
                    ))}
                  </div>
                </Section>
                {preparation.lecon.contenuFormate.pieges?.length > 0 && (
                  <Section titre="⚠️ Pièges et exceptions">
                    {preparation.lecon.contenuFormate.pieges.map((p, i) => (
                      <p key={i} className="text-sm text-tate-terre mb-1">• {p}</p>
                    ))}
                  </Section>
                )}
                <Section titre="📝 Résumé mémo (à retenir)">
                  {preparation.lecon.contenuFormate.resumeMemo?.map((m, i) => (
                    <div key={i} className="flex gap-2 mb-1">
                      <CheckCircle size={14} className="text-succes mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-tate-terre">{m}</p>
                    </div>
                  ))}
                </Section>
                <Section titre={`✅ Exercices avec corrections (${preparation.correctionsTypes?.length || 0} questions)`}>
                  <div className="space-y-3">
                    {preparation.correctionsTypes?.map((c, i) => (
                      <div key={i} className="p-3 bg-tate-creme rounded-xl border border-tate-border">
                        <p className="text-xs font-semibold text-tate-terre/60 mb-1">Question {i+1}</p>
                        <p className="text-sm font-medium text-tate-terre mb-1">{c.question}</p>
                        <p className="text-sm text-succes font-semibold">→ {c.reponse}</p>
                        <p className="text-xs text-tate-terre/50 mt-1 italic">{c.explication}</p>
                      </div>
                    ))}
                  </div>
                </Section>
                {preparation.notesProf && (
                  <Section titre="🗒️ Notes pédagogiques pour le professeur">
                    <p className="text-sm text-tate-terre/70 leading-relaxed italic">{preparation.notesProf}</p>
                  </Section>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button onClick={resetPreparation} className="btn-outline flex-1 py-3 flex items-center justify-center gap-2 text-sm">
                <RotateCcw size={16} /> Recommencer
              </button>
              <button onClick={handleValider} className="btn-tate flex-1 py-3 flex items-center justify-center gap-2">
                <CheckCircle size={16} /> Publier aux élèves
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </LayoutProf>
  );
}
