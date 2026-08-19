import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { UserLocationProvider } from './context/UserLocationContext';
import { ConciergePanelProvider } from './context/ConciergePanelContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { RoutesProvider } from './context/RoutesContext';
import { PwaProvider } from './context/PwaContext';
import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './context/ToastContext';
import { ConfortProvider } from './context/ConfortContext';
import { Layout } from './components/Layout';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminLayout } from './components/admin/AdminLayout';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { AntiGaspiPage } from './pages/AntiGaspiPage';
import { RelaisPage } from './pages/RelaisPage';
import { ActeursPage } from './pages/ActeursPage';
import { BrocanteursPage } from './pages/BrocanteursPage';
import { MapPage } from './pages/MapPage';
import { DecouvrirPage } from './pages/DecouvrirPage';
import { PratiquePage } from './pages/PratiquePage';
import { ConciergeriePage } from './pages/ConciergeriePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { SearchPage } from './pages/SearchPage';
import { EventsPage } from './pages/EventsPage';
import { CarnetPage } from './pages/CarnetPage';
import { CgvPage } from './pages/CgvPage';
import { FaqPage } from './pages/FaqPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminRelaisPage } from './pages/admin/AdminRelaisPage';
import { AdminBannersPage } from './pages/admin/AdminBannersPage';
import { AdminQrPage } from './pages/admin/AdminQrPage';
import { ProDashboardPage } from './pages/ProDashboardPage';

export function App() {
  return (
    <ConfortProvider>
    <AdminProvider>
      <ToastProvider>
        <PwaProvider>
        <FavoritesProvider>
        <RoutesProvider>
        <SearchProvider>
          <UserLocationProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
            <ConciergePanelProvider>
            <Routes>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboardPage />} />
                <Route path="panneau" element={<AdminDashboard />} />
                <Route path="annonces" element={<AdminPostsPage />} />
                <Route path="agenda" element={<AdminEventsPage />} />
                <Route path="relais" element={<AdminRelaisPage />} />
                <Route path="banners" element={<AdminBannersPage />} />
                <Route path="qr" element={<AdminQrPage />} />
                <Route path="commerces" element={<Navigate to="/admin/panneau" replace />} />
              </Route>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/anti-gaspi" element={<AntiGaspiPage />} />
                <Route path="/relais" element={<RelaisPage />} />
                <Route path="/acteurs" element={<ActeursPage />} />
                <Route path="/brocanteurs" element={<BrocanteursPage />} />
                <Route path="/carte" element={<MapPage />} />
                <Route path="/decouvrir" element={<DecouvrirPage />} />
                <Route path="/pratique" element={<PratiquePage />} />
                <Route path="/conciergerie" element={<ConciergeriePage />} />
                <Route path="/tourisme" element={<Navigate to="/decouvrir" replace />} />
                <Route path="/favoris" element={<FavoritesPage />} />
                <Route path="/recherche" element={<SearchPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/carnet" element={<CarnetPage />} />
                <Route path="/cgv" element={<CgvPage />} />
                <Route path="/faq" element={<FaqPage />} />
                {/* Anciennes URL de comptes : redirigées vers le carnet local. */}
                <Route path="/profile" element={<Navigate to="/carnet" replace />} />
                <Route path="/pro" element={<ProDashboardPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Routes>
            </ConciergePanelProvider>
          </BrowserRouter>
          </UserLocationProvider>
        </SearchProvider>
        </RoutesProvider>
        </FavoritesProvider>
        </PwaProvider>
      </ToastProvider>
    </AdminProvider>
    </ConfortProvider>
  );
}
