import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

/**
 * Bannière d'installation PWA — apparaît automatiquement quand
 * le navigateur déclenche l'événement beforeinstallprompt
 * (Chrome Android, Edge, Samsung Internet…)
 */
export function InstallPWA() {
  const [prompt,  setPrompt]  = useState(null);
  const [visible, setVisible] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Déjà installé ?
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    const handler = (e) => {
      e.preventDefault();
      setPrompt(e);
      // Afficher la bannière après 3s pour ne pas interrompre le chargement
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', () => {
      setVisible(false);
      setInstalled(true);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setPrompt(null);
  };

  if (installed) return null;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0,   opacity: 1 }}
          exit={{   y: 100, opacity: 0 }}
          transition={{ type: 'spring', bounce: 0.3 }}
          className="fixed bottom-20 left-4 right-4 z-[9998] max-w-sm mx-auto">
          <div className="bg-tate-terre rounded-2xl shadow-2xl p-4 flex items-center gap-3 border border-white/10">
            {/* Logo */}
            <div className="w-12 h-12 rounded-xl bg-tate-soleil flex items-center justify-center font-serif font-bold text-tate-terre text-xl flex-shrink-0 shadow-tate">
              T
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-tight">Installer Taté</p>
              <p className="text-white/60 text-xs mt-0.5 leading-tight">Accès rapide depuis ton écran d'accueil</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="flex items-center gap-1.5 bg-tate-soleil text-tate-terre text-xs font-bold px-3 py-2 rounded-xl hover:bg-amber-400 transition-all">
                <Download size={13} />
                Installer
              </button>
              <button
                onClick={() => setVisible(false)}
                className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all">
                <X size={13} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
