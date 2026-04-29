import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, Share, ArrowUp } from 'lucide-react';

// Détecte Safari sur iOS/iPadOS
function detectIOS() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  // iPadOS 13+ se présente comme Mac mais avec touch
  const isIPadOS = navigator.maxTouchPoints > 1 && /Mac/.test(ua);
  return isIOS || isIPadOS;
}

// Détecte si déjà installé en mode standalone
function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
}

/**
 * Bannière d'installation PWA — 2 modes :
 * 1. Android/Desktop : événement beforeinstallprompt (Chrome, Edge…)
 * 2. iPhone / iPad   : guide "Partager → Sur l'écran d'accueil"
 */
export function InstallPWA() {
  const [androidPrompt, setAndroidPrompt] = useState(null);
  const [visible,       setVisible]       = useState(false);
  const [mode,          setMode]          = useState(null); // 'android' | 'ios'
  const [dismissed,     setDismissed]     = useState(false);

  useEffect(() => {
    // Déjà installé ? → ne rien afficher
    if (isStandalone()) return;

    // Déjà refusé dans cette session ?
    if (sessionStorage.getItem('pwa-dismissed')) return;

    const ios = detectIOS();

    if (ios) {
      // iOS : pas d'événement automatique — afficher le guide après 5s
      const t = setTimeout(() => {
        setMode('ios');
        setVisible(true);
      }, 5000);
      return () => clearTimeout(t);
    }

    // Android / Desktop : attendre l'événement du navigateur
    const handler = (e) => {
      e.preventDefault();
      setAndroidPrompt(e);
      setMode('android');
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => setVisible(false));

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleAndroidInstall = async () => {
    if (!androidPrompt) return;
    androidPrompt.prompt();
    const { outcome } = await androidPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setAndroidPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('pwa-dismissed', '1');
  };

  if (dismissed) return null;

  return (
    <AnimatePresence>
      {visible && mode === 'android' && (
        <motion.div
          key="android"
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: 100, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="fixed bottom-20 left-4 right-4 z-[9998] max-w-sm mx-auto">
          <div className="bg-tate-terre rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/10">
            <div className="w-12 h-12 rounded-xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-xl flex-shrink-0 shadow-tate">
              T
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Installer Taté</p>
              <p className="text-white/60 text-xs mt-0.5 leading-tight">Accès rapide depuis ton écran d'accueil</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleAndroidInstall}
                className="flex items-center gap-1.5 bg-tate-soleil text-tate-terre text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-400 transition-all">
                <Download size={13} />
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {visible && mode === 'ios' && (
        <motion.div
          key="ios"
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: 120, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.25 }}
          className="fixed bottom-0 left-0 right-0 z-[9998]">
          {/* Flèche pointant vers le bouton Partager iOS (en bas) */}
          <div className="flex justify-center mb-1">
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
              className="w-8 h-8 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-6 h-6 fill-tate-soleil drop-shadow-lg">
                <path d="M12 17l-7-7h14l-7 7z" />
              </svg>
            </motion.div>
          </div>

          <div className="bg-tate-terre rounded-t-3xl shadow-2xl px-5 pt-4 pb-8 border-t border-white/10">
            {/* Poignée */}
            <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-4" />

            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-xl shadow-tate flex-shrink-0">
                  T
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Installer Taté sur iPhone</p>
                  <p className="text-white/50 text-xs mt-0.5">Accès rapide, sans App Store</p>
                </div>
              </div>
              <button onClick={handleDismiss}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/50 hover:bg-white/20 flex-shrink-0">
                <X size={13} />
              </button>
            </div>

            {/* Étapes iOS */}
            <div className="space-y-3">
              {[
                {
                  num: 1,
                  icon: '⬆️',
                  text: <>Appuie sur <strong className="text-white">Partager</strong> en bas de Safari</>,
                },
                {
                  num: 2,
                  icon: '➕',
                  text: <>Sélectionne <strong className="text-white">« Sur l'écran d'accueil »</strong></>,
                },
                {
                  num: 3,
                  icon: '✅',
                  text: <>Appuie sur <strong className="text-white">Ajouter</strong> en haut à droite</>,
                },
              ].map(step => (
                <div key={step.num} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-base flex-shrink-0">
                    {step.icon}
                  </div>
                  <p className="text-white/70 text-sm leading-snug">{step.text}</p>
                </div>
              ))}
            </div>

            <p className="text-white/30 text-xs text-center mt-4">
              Fonctionne uniquement avec Safari sur iPhone / iPad
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
