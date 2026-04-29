import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { useAuthStore }  from './store/useAuthStore';
import { useEleveStore } from './store/useEleveStore';
import { proactiveTokenRefresh } from './lib/api';
import { InstallPWA } from './components/InstallPWA';

import { Login }          from './pages/Login';
import { RegisterEleve }  from './pages/RegisterEleve';
import { RegisterParent } from './pages/RegisterParent';
import { RegisterProf }   from './pages/RegisterProf';

import { AccueilEleve, PageCours } from './pages/eleve/PagesEleve';
import { Tutorat }         from './pages/eleve/Tutorat';
import { SectionEpreuves } from './pages/eleve/SectionEpreuves';
import { PageQCM }         from './pages/eleve/PageQCM';

import { Dashboard }             from './pages/admin/Dashboard';
import { GestionUsers }          from './pages/admin/GestionUsers';
import { GestionChapitres }      from './pages/admin/GestionChapitres';
import { GestionLecons }         from './pages/admin/GestionLecons';
import { GestionReservations }   from './pages/admin/GestionReservations';
import { StatsAdmin }            from './pages/admin/StatsAdmin';
import { GestionEpreuves }       from './pages/admin/GestionEpreuves';
import { SuiviEleves }           from './pages/admin/SuiviEleves';
import { GestionQCM }            from './pages/admin/GestionQCM';
import { GestionMatieres }       from './pages/admin/GestionMatieres';
import { SessionsVirtuelles }    from './pages/admin/SessionsVirtuelles';
import { LayoutAdmin }           from './pages/admin/LayoutAdmin';

import { DashboardProf }        from './pages/prof/DashboardProf';
import { PreparerCours }        from './pages/prof/PreparerCours';
import { MesEleves }            from './pages/prof/MesEleves';
import { MesLecons }            from './pages/prof/MesLecons';
import { MesReservationsProf }  from './pages/prof/MesReservationsProf';
import { LayoutProf }           from './pages/prof/LayoutProf';

import { EspaceParent }  from './pages/parent/EspaceParent';

// ── Garde de route ────────────────────────────
function PrivateRoute({ children, roles }) {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />;
  return children;
}

// ── Router adaptatif pour l'espace élève ──────
function RouterEleve() {
  const { leconActive } = useEleveStore();
  // Si une leçon est chargée, afficher le cours HTML plein écran
  if (leconActive) return <PageCours />;
  // Sinon, afficher l'accueil avec la liste des chapitres
  return <AccueilEleve />;
}

// ── Redirection selon le rôle ─────────────────
function RootRedirect() {
  const { user } = useAuthStore();
  if (!user) return <Navigate to="/login" replace />;
  const routes = {
    admin:  '/admin',
    prof:   '/prof',
    eleve:  '/eleve',
    parent: '/parent',
  };
  return <Navigate to={routes[user.role] || '/login'} replace />;
}

// ── Initialisation : rafraîchit le profil silencieusement au démarrage
function AuthInit() {
  const { user, rafraichirUser } = useAuthStore();
  useEffect(() => {
    if (user && localStorage.getItem('accessToken')) {
      // 1. Rafraîchir le token proactivement si < 3 jours restants
      proactiveTokenRefresh().then(() => {
        // 2. Puis rafraîchir le profil utilisateur (chapitresValides, etc.)
        rafraichirUser().catch(() => {});
      }).catch(() => {
        rafraichirUser().catch(() => {});
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthInit />
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FFF8F0',
            border: '1px solid #F4C775',
            color: '#3D1C00',
            borderRadius: '16px',
            fontSize: '14px',
          },
          success: { iconTheme: { primary: '#1D9E75', secondary: '#fff' } },
          error:   { iconTheme: { primary: '#D85A30', secondary: '#fff' } },
        }}
      />
      <InstallPWA />
      <Routes>
        {/* ── PUBLIC ────────────────────────────────────── */}
        <Route path="/login"            element={<Login />} />
        <Route path="/register/eleve"   element={<RegisterEleve />} />
        <Route path="/register/parent"  element={<RegisterParent />} />
        <Route path="/register/prof"    element={<RegisterProf />} />
        <Route path="/"                 element={<RootRedirect />} />

        {/* ── ADMIN ─────────────────────────────────────── */}
        <Route path="/admin" element={
          <PrivateRoute roles={['admin']}><Dashboard /></PrivateRoute>
        } />
        <Route path="/admin/users" element={
          <PrivateRoute roles={['admin']}><GestionUsers /></PrivateRoute>
        } />
        <Route path="/admin/chapitres" element={
          <PrivateRoute roles={['admin']}><GestionChapitres /></PrivateRoute>
        } />
        <Route path="/admin/preparer" element={
          <PrivateRoute roles={['admin','prof']}><PreparerCours /></PrivateRoute>
        } />
        <Route path="/admin/lecons" element={
          <PrivateRoute roles={['admin']}><GestionLecons /></PrivateRoute>
        } />
        <Route path="/admin/reservations" element={
          <PrivateRoute roles={['admin']}><GestionReservations /></PrivateRoute>
        } />
        <Route path="/admin/stats" element={
          <PrivateRoute roles={['admin']}><StatsAdmin /></PrivateRoute>
        } />
        <Route path="/admin/epreuves" element={
          <PrivateRoute roles={['admin']}><GestionEpreuves /></PrivateRoute>
        } />
        <Route path="/admin/qcm" element={
          <PrivateRoute roles={['admin']}><GestionQCM Layout={LayoutAdmin} /></PrivateRoute>
        } />
        <Route path="/admin/suivi-eleves" element={
          <PrivateRoute roles={['admin']}><SuiviEleves Layout={LayoutAdmin} /></PrivateRoute>
        } />
        <Route path="/admin/matieres" element={
          <PrivateRoute roles={['admin']}><GestionMatieres /></PrivateRoute>
        } />
        <Route path="/admin/sessions" element={
          <PrivateRoute roles={['admin']}><SessionsVirtuelles /></PrivateRoute>
        } />

        {/* ── PROF ──────────────────────────────────────── */}
        <Route path="/prof" element={
          <PrivateRoute roles={['prof','admin']}><DashboardProf /></PrivateRoute>
        } />
        <Route path="/prof/preparer" element={
          <PrivateRoute roles={['prof','admin']}><PreparerCours /></PrivateRoute>
        } />
        <Route path="/prof/mes-eleves" element={
          <PrivateRoute roles={['prof','admin']}><MesEleves /></PrivateRoute>
        } />
        <Route path="/prof/mes-lecons" element={
          <PrivateRoute roles={['prof','admin']}><MesLecons /></PrivateRoute>
        } />
        <Route path="/prof/qcm" element={
          <PrivateRoute roles={['prof','admin']}><GestionQCM Layout={LayoutProf} /></PrivateRoute>
        } />
        <Route path="/prof/reservations" element={
          <PrivateRoute roles={['prof','admin']}><MesReservationsProf /></PrivateRoute>
        } />
        <Route path="/prof/suivi-eleves" element={
          <PrivateRoute roles={['prof','admin']}><SuiviEleves Layout={LayoutProf} /></PrivateRoute>
        } />

        {/* ── ÉLÈVE ─────────────────────────────────────── */}
        <Route path="/eleve" element={
          <PrivateRoute roles={['eleve']}><RouterEleve /></PrivateRoute>
        } />
        <Route path="/eleve/tutorat" element={
          <PrivateRoute roles={['eleve']}><Tutorat /></PrivateRoute>
        } />
        <Route path="/eleve/epreuves" element={
          <PrivateRoute roles={['eleve']}><SectionEpreuves /></PrivateRoute>
        } />
        <Route path="/eleve/qcm/:chapitreId" element={
          <PrivateRoute roles={['eleve']}><PageQCM /></PrivateRoute>
        } />

        {/* ── PARENT ────────────────────────────────────── */}
        <Route path="/parent" element={
          <PrivateRoute roles={['parent']}><EspaceParent /></PrivateRoute>
        } />
        <Route path="/parent/tutorat" element={
          <PrivateRoute roles={['parent']}><Tutorat /></PrivateRoute>
        } />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
