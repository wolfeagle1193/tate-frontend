import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'

// ── ErrorBoundary : capture les erreurs JS et évite l'écran blanc ──
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err, info) {
    console.error('[Taté] Erreur capturée :', err, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          background: '#FFF8F0', padding: '24px', textAlign: 'center',
        }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20, marginBottom: 20,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'linear-gradient(135deg,#F97316,#EA580C)',
            fontFamily: 'Georgia,serif', fontWeight: 'bold', color: '#fff', fontSize: 28,
          }}>T</div>
          <h1 style={{ fontFamily: 'Georgia,serif', color: '#3D1C00', marginBottom: 8 }}>
            Oups, une erreur s'est produite
          </h1>
          <p style={{ color: '#8B4513', fontSize: 14, marginBottom: 24, maxWidth: 320 }}>
            Essayez de vider le cache de votre navigateur ou de vous reconnecter.
          </p>
          <button
            onClick={() => { window.location.href = '/login'; }}
            style={{
              background: 'linear-gradient(135deg,#F97316,#EA580C)',
              color: '#fff', border: 'none', borderRadius: 16,
              padding: '12px 28px', fontWeight: 'bold', fontSize: 15, cursor: 'pointer',
            }}>
            Retour à la connexion
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
)

// ── Enregistrement du Service Worker PWA ──────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('✅ Service Worker Taté enregistré');
        // Nouveau SW activé → recharger pour obtenir les derniers assets
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                window.location.reload();
              }
            });
          }
        });
      })
      .catch(e => console.warn('SW erreur:', e));
  });
}
