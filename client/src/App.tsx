import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SearchProvider } from './context/SearchContext';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { PostsPage } from './pages/PostsPage';
import { RelaisPage } from './pages/RelaisPage';
import { ActeursPage } from './pages/ActeursPage';
import { EventsPage } from './pages/EventsPage';
import { ProfilePage } from './pages/ProfilePage';

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <SearchProvider>
          <BrowserRouter>
            <Routes>
              <Route element={<Layout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/posts" element={<PostsPage />} />
                <Route path="/relais" element={<RelaisPage />} />
                <Route path="/acteurs" element={<ActeursPage />} />
                <Route path="/events" element={<EventsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </SearchProvider>
      </ToastProvider>
    </AuthProvider>
  );
}
