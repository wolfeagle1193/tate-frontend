// ============================================================
// src/pages/eleve/FicheMemo.jsx
// Points à retenir + Flashcards Q&R + PDF téléchargeable
// ============================================================
import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookMarked, ChevronDown, ChevronUp, Download, ArrowRight,
  Eye, EyeOff, CheckCircle2, RotateCcw, Lightbulb, ListChecks,
} from 'lucide-react';

// ─── Télécharger la fiche en PDF via impression navigateur ───
function telechargerPDF(chapTitre, matiere, niveau, ficheMemo) {
  const { pointsACretenir = [], questionsReponses = [] } = ficheMemo;

  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <title>Fiche mémo — ${chapTitre}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; color: #2d1600; padding: 32px; max-width: 680px; margin:auto; }
    header { border-bottom: 3px solid #F4C775; padding-bottom: 12px; margin-bottom: 24px; }
    header h1 { font-size: 22px; }
    header p  { font-size: 13px; color: #888; margin-top: 4px; }
    .logo { font-family: Georgia,serif; font-weight:bold; font-size:18px;
            background:#F4C775; display:inline-block; padding:4px 10px; border-radius:6px; margin-bottom:8px; }
    h2 { font-size: 15px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;
         color: #9a6500; margin: 20px 0 10px; border-left: 4px solid #F4C775; padding-left: 8px; }
    .point { display:flex; gap:8px; margin-bottom:8px; align-items:flex-start; }
    .point-num { background:#F4C775; color:#2d1600; font-weight:bold; font-size:12px;
                 min-width:22px; height:22px; border-radius:50%; display:flex;
                 align-items:center; justify-content:center; flex-shrink:0; margin-top:2px; }
    .point-text { font-size:14px; line-height:1.5; }
    .qr { border:1px solid #e8d5b0; border-radius:8px; padding:12px; margin-bottom:10px;
          break-inside: avoid; }
    .qr-q { font-weight: bold; font-size: 14px; margin-bottom:6px; }
    .qr-r { font-size: 13px; color: #555; border-top: 1px dashed #ddd; padding-top:6px; margin-top:4px; }
    .qr-r::before { content:"✏️  "; }
    footer { margin-top:32px; padding-top:12px; border-top:1px solid #eee;
             font-size:11px; color:#aaa; text-align:center; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="logo">Taté</div>
  <header>
    <h1>${chapTitre}</h1>
    <p>${matiere}  •  ${niveau}  •  Fiche mémo</p>
  </header>

  <h2>📌 Ce que tu dois retenir</h2>
  ${pointsACretenir.map((p, i) => `
    <div class="point">
      <div class="point-num">${i + 1}</div>
      <div class="point-text">${p}</div>
    </div>
  `).join('')}

  <h2 style="margin-top:28px;">❓ Questions — Réponses</h2>
  ${questionsReponses.map((qr, i) => `
    <div class="qr">
      <div class="qr-q">${i + 1}. ${qr.question}</div>
      <div class="qr-r">${qr.reponse}</div>
    </div>
  `).join('')}

  <footer>
    Généré par Taté • Plateforme d'apprentissage sénégalaise
  </footer>
</body>
</html>`;

  const blob   = new Blob([html], { type: 'text/html; charset=utf-8' });
  const url    = URL.createObjectURL(blob);
  const win    = window.open(url, '_blank');
  if (win) {
    win.onload = () => {
      win.focus();
      win.print();
    };
  }
  URL.revokeObjectURL(url);
}

// ─── Carte Flashcard ─────────────────────────
function Flashcard({ index, total, question, reponse, onNext, onPrev, isLast }) {
  const [revealed, setRevealed] = useState(false);

  const handleNext = () => {
    setRevealed(false);
    onNext();
  };
  const handlePrev = () => {
    setRevealed(false);
    onPrev();
  };

  return (
    <motion.div
      key={index}
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      className="bg-white rounded-3xl border-2 border-tate-border shadow-card overflow-hidden"
    >
      {/* Barre de progression */}
      <div className="h-1.5 bg-tate-doux">
        <div
          className="h-full bg-tate-soleil transition-all duration-500"
          style={{ width: `${((index + 1) / total) * 100}%` }}
        />
      </div>

      <div className="p-5">
        {/* Compteur */}
        <div className="flex justify-between items-center mb-4">
          <span className="text-xs text-tate-terre/40 font-medium">
            Question {index + 1} / {total}
          </span>
          <button
            onClick={() => setRevealed(false)}
            className={`text-xs px-2 py-1 rounded-lg transition-colors ${
              revealed ? 'text-tate-terre/40 hover:text-tate-terre' : 'opacity-0 pointer-events-none'
            }`}
          >
            <RotateCcw size={12} className="inline mr-1" />
            Cacher
          </button>
        </div>

        {/* Question */}
        <div className="bg-tate-doux rounded-2xl p-4 mb-4">
          <p className="text-xs text-tate-terre/50 font-semibold uppercase tracking-wide mb-2">
            Question
          </p>
          <p className="text-base font-semibold text-tate-terre leading-relaxed">
            {question}
          </p>
        </div>

        {/* Réponse masquée / révélée */}
        <AnimatePresence mode="wait">
          {!revealed ? (
            <motion.button
              key="masquee"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRevealed(true)}
              className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl
                         border-2 border-dashed border-tate-border hover:border-tate-soleil
                         hover:bg-tate-soleil/5 transition-all group"
            >
              <Eye size={16} className="text-tate-terre/40 group-hover:text-tate-terre transition-colors" />
              <span className="text-sm text-tate-terre/50 group-hover:text-tate-terre transition-colors font-medium">
                Voir la réponse
              </span>
            </motion.button>
          ) : (
            <motion.div
              key="revelee"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="bg-green-50 border-2 border-succes/30 rounded-2xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2 size={15} className="text-succes flex-shrink-0" />
                <p className="text-xs text-succes font-semibold uppercase tracking-wide">
                  Réponse
                </p>
              </div>
              <p className="text-sm text-tate-terre leading-relaxed">{reponse}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex gap-3 mt-4">
          {index > 0 && (
            <button
              onClick={handlePrev}
              className="flex-1 py-3 rounded-2xl border-2 border-tate-border text-sm
                         font-semibold text-tate-terre/60 hover:bg-tate-doux transition-all"
            >
              ← Précédente
            </button>
          )}
          <button
            onClick={handleNext}
            className={`flex-1 py-3 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
              isLast
                ? 'bg-succes text-white hover:bg-succes/80'
                : 'btn-tate'
            }`}
          >
            {isLast ? (
              <>
                <CheckCircle2 size={16} />
                Terminer les Q&R
              </>
            ) : (
              <>
                Suivante
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Composant principal FicheMemo ───────────
export function FicheMemo({ chapitre, ficheMemo, onCommencerExercices }) {
  const [phase, setPhase]         = useState('points'); // 'points' | 'flashcards' | 'fini'
  const [cardIndex, setCardIndex] = useState(0);
  const [expanded, setExpanded]   = useState(null);

  const { pointsACretenir = [], questionsReponses = [] } = ficheMemo || {};

  const handleTelecharger = () => {
    telechargerPDF(
      chapitre.titre,
      chapitre.matiere || '',
      chapitre.niveau  || '',
      ficheMemo
    );
  };

  // ── Phase 1 : Points à retenir ───────────
  if (phase === 'points') {
    return (
      <div className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-tate-soleil flex items-center justify-center flex-shrink-0">
            <BookMarked size={20} className="text-tate-terre" />
          </div>
          <div>
            <h2 className="font-serif font-bold text-tate-terre">Ce que tu dois retenir</h2>
            <p className="text-xs text-tate-terre/50">{chapitre.titre}</p>
          </div>
        </div>

        {/* Points */}
        <div className="space-y-2">
          {pointsACretenir.map((point, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex gap-3 bg-white rounded-2xl border border-tate-border p-3.5 shadow-sm"
            >
              <div className="w-7 h-7 rounded-full bg-tate-soleil flex items-center justify-center
                              font-bold text-tate-terre text-xs flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-tate-terre leading-relaxed">{point}</p>
            </motion.div>
          ))}
        </div>

        {/* Bouton PDF */}
        <button
          onClick={handleTelecharger}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl
                     border-2 border-tate-border hover:border-tate-soleil
                     hover:bg-tate-soleil/5 transition-all text-sm font-semibold text-tate-terre/70"
        >
          <Download size={16} />
          Télécharger la fiche PDF (Q&R inclus)
        </button>

        {/* Actions */}
        <div className="flex gap-3">
          {questionsReponses.length > 0 ? (
            <button
              onClick={() => { setPhase('flashcards'); setCardIndex(0); }}
              className="btn-tate flex-1 py-3 flex items-center justify-center gap-2"
            >
              <Lightbulb size={16} />
              Faire les Q&R ({questionsReponses.length})
            </button>
          ) : (
            <button
              onClick={onCommencerExercices}
              className="btn-tate flex-1 py-3 flex items-center justify-center gap-2"
            >
              <ListChecks size={16} />
              Démarrer la solidification
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Phase 2 : Flashcards Q&R ─────────────
  if (phase === 'flashcards') {
    if (cardIndex >= questionsReponses.length) {
      // Toutes les cartes faites
      return (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-8"
        >
          <div className="w-16 h-16 rounded-full bg-succes/10 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-succes" />
          </div>
          <h3 className="font-serif font-bold text-tate-terre text-xl mb-2">
            Bravo ! Q&R terminées 🎉
          </h3>
          <p className="text-sm text-tate-terre/60 mb-6">
            Tu as parcouru toutes les {questionsReponses.length} questions.
            Tu es prêt(e) pour ta séance de solidification !
          </p>
          <div className="space-y-3">
            <button
              onClick={() => { setCardIndex(0); }}
              className="w-full py-3 rounded-2xl border-2 border-tate-border text-sm
                         font-semibold text-tate-terre/60 hover:bg-tate-doux transition-all"
            >
              <RotateCcw size={14} className="inline mr-2" />
              Recommencer les Q&R
            </button>
            <button
              onClick={onCommencerExercices}
              className="btn-tate w-full py-3.5 flex items-center justify-center gap-2"
            >
              <ListChecks size={16} />
              Commencer la solidification →
            </button>
          </div>
        </motion.div>
      );
    }

    const qr = questionsReponses[cardIndex];
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Lightbulb size={16} className="text-tate-soleil" />
          <p className="text-xs font-semibold text-tate-terre/60 uppercase tracking-wide">
            Questions — Réponses
          </p>
        </div>
        <Flashcard
          index={cardIndex}
          total={questionsReponses.length}
          question={qr.question}
          reponse={qr.reponse}
          onNext={() => setCardIndex(i => i + 1)}
          onPrev={() => setCardIndex(i => Math.max(0, i - 1))}
          isLast={cardIndex === questionsReponses.length - 1}
        />
        <button
          onClick={() => setPhase('points')}
          className="w-full text-xs text-tate-terre/40 hover:text-tate-terre transition-colors py-2"
        >
          ← Revenir aux points à retenir
        </button>
      </div>
    );
  }

  return null;
}
