import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Input } from './ui';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../context/ToastContext';

export function AdminPanel() {
  const { t } = useTranslation();
  const { isAdminMode, login, logout } = useAdmin();
  const { showToast } = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setPassword('');
      setError('');
      showToast(t('admin.loginSuccess'), 'info');
      return;
    }
    setError(t('admin.wrongPassword'));
  };

  const handleLogout = () => {
    logout();
    showToast(t('admin.logoutSuccess'), 'info');
  };

  if (isAdminMode) {
    return (
      <Card className="!p-4 border-chartrons-bordeaux/20 bg-chartrons-bordeaux/5">
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span aria-hidden>🛡️</span>
            <h4 className="text-sm font-semibold text-chartrons-bordeaux">{t('admin.activeTitle')}</h4>
          </div>
          <Badge variant="bordeaux">{t('admin.badge')}</Badge>
        </div>
        <p className="text-xs text-chartrons-warm-gray mb-3">{t('admin.activeHint')}</p>
        <div className="space-y-2">
          <Link to="/admin">
            <Button variant="bordeaux" size="sm" className="w-full">
              {t('admin.openDashboard')}
            </Button>
          </Link>
          <Button variant="secondary" size="sm" className="w-full" onClick={handleLogout}>
            {t('admin.logout')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="!p-4">
      <h4 className="text-sm font-semibold text-chartrons-bordeaux mb-1">{t('admin.title')}</h4>
      <p className="text-xs text-chartrons-warm-gray mb-3">{t('admin.hint')}</p>
      <form onSubmit={handleLogin} className="space-y-3">
        <Input
          type="password"
          label={t('admin.password')}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError('');
          }}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {error && <p className="text-xs text-chartrons-brick">{error}</p>}
        <Button type="submit" variant="bordeaux" size="md" className="w-full">
          {t('admin.login')}
        </Button>
        <Link
          to="/admin"
          className="block text-center text-xs font-semibold text-chartrons-olive hover:text-chartrons-bordeaux min-h-[36px] leading-[36px]"
        >
          {t('admin.openDashboard')} →
        </Link>
      </form>
    </Card>
  );
}
