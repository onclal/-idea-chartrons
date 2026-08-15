import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { FavoritesProvider } from './context/FavoritesContext';
import { AuthProvider } from './context/AuthContext';
import { AdminProvider } from './context/AdminContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { AdminLayout } from './components/admin/AdminLayout';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { RelaisPage } from './pages/RelaisPage';
import { ActeursPage } from './pages/ActeursPage';
import { MapPage } from './pages/MapPage';
import { TourismePage } from './pages/TourismePage';
import { FavoritesPage } from './pages/FavoritesPage';
import { EventsPage } from './pages/EventsPage';
import { ProfilePage } from './pages/ProfilePage';
import { CgvPage } from './pages/CgvPage';
import { FaqPage } from './pages/FaqPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminPostsPage } from './pages/admin/AdminPostsPage';
import { AdminActeursPage } from './pages/admin/AdminActeursPage';
import { AdminEventsPage } from './pages/admin/AdminEventsPage';
import { AdminRelaisPage } from './pages/admin/AdminRelaisPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';

export function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <ToastProvider>
          <FavoritesProvider>
          <SearchProvider>
            <BrowserRouter>
              <Routes>
                <Route path="/admin" element={<AdminLayout />}>
                  <Route index element={<AdminDashboardPage />} />
                  <Route path="annonces" element={<AdminPostsPage />} />
                  <Route path="commerces" element={<AdminActeursPage />} />
                  <Route path="agenda" element={<AdminEventsPage />} />
                  <Route path="relais" element={<AdminRelaisPage />} />
                  <Route path="utilisateurs" element={<AdminUsersPage />} />
                </Route>
                <Route element={<Layout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/posts" element={<PostsPage />} />
                  <Route path="/relais" element={<RelaisPage />} />
                  <Route path="/acteurs" element={<ActeursPage />} />
                  <Route path="/carte" element={<MapPage />} />
                  <Route path="/tourisme" element={<TourismePage />} />
                  <Route path="/favoris" element={<FavoritesPage />} />
                  <Route path="/events" element={<EventsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/cgv" element={<CgvPage />} />
                  <Route path="/faq" element={<FaqPage />} />
                </Route>
              </Routes>
            </BrowserRouter>
          </SearchProvider>
          </FavoritesProvider>
        </ToastProvider>
      </AdminProvider>
    </AuthProvider>
  );
}
