import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFideliteNiveau, UserRole } from '@idea-chartrons/shared';
import { Badge, Button, Card, Loading } from '../components/ui';
import { AdminPanel } from '../components/AdminPanel';
import { FideliteHistory } from '../components/FideliteHistory';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, type VipStatusEntry } from '../lib/api';

export function ProfilePage() {
  const { t } = useTranslation();
  const { currentUser, currentUserId, demoUsers, switchUser, refreshUser } = useAuth();
  const { showToast } = useToast();
  const [vipStatus, setVipStatus] = useState<VipStatusEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  const loadProfile = () => {
    setLoading(true);
    api.getVipStatus(currentUserId)
      .then((vip) => setVipStatus(vip.vipStatus))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(loadProfile, [currentUserId]);

  const handleSwitchUser = (userId: string) => {
    switchUser(userId);
    showToast(t('toast.userSwitched'), 'info');
  };

  const handleReset = async () => {
    if (!window.confirm(t('profile.resetConfirm'))) return;
    setResetting(true);
    try {
      await api.resetDemoData();
      localStorage.setItem('idea-chartrons-current-user', 'user-1');
      switchUser('user-1');
      await refreshUser();
      loadProfile();
      showToast(t('toast.dataReset'));
      window.location.reload();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setResetting(false);
    }
  };

  if (loading || !currentUser) return <Loading message={t('common.loading')} />;

  const niveau = getFideliteNiveau(currentUser.pointsFidelite);

  const roleIcon = (role: UserRole) => {
    if (role === UserRole.Commercant) return '🏪';
    if (role === UserRole.BenevolRelais) return '📦';
    return '🏠';
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('profile.title')}</h2>

      <AdminPanel />

      <Card>
        <h4 className="text-sm font-semibold text-chartrons-green-dark mb-3">
          {t('auth.switchUser')}
        </h4>
        <div className="space-y-2">
          {demoUsers.map((user) => {
            const isActive = user.id === currentUserId;
            return (
              <button
                key={user.id}
                onClick={() => handleSwitchUser(user.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-colors text-left ${
                  isActive
                    ? 'border-chartrons-green bg-chartrons-green/5'
                    : 'border-chartrons-gold/15 hover:border-chartrons-green/30'
                }`}
              >
                <span className="text-xl">{roleIcon(user.role)}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-chartrons-green-dark">{user.nom}</p>
                  <p className="text-xs text-chartrons-warm-gray">
                    {t(`profile.roles.${user.role}`)}
                  </p>
                  {user.role === UserRole.BenevolRelais && (
                    <Badge variant="benevol" icon="🤝" className="mt-1">{t('badges.benevol')}</Badge>
                  )}
                </div>
                {isActive && <Badge variant="olive">{t('auth.active')}</Badge>}
              </button>
            );
          })}
        </div>
      </Card>

      <Card className="text-center !p-6">
        <div className="w-20 h-20 rounded-full bg-chartrons-green/10 flex items-center justify-center text-3xl mx-auto mb-3">
          👤
        </div>
        <h3 className="text-lg font-bold text-chartrons-green-dark">{currentUser.nom}</h3>
        <p className="text-sm text-chartrons-warm-gray">{currentUser.email}</p>
        <div className="flex items-center justify-center gap-2 mt-3 flex-wrap">
          <Badge>{t(`profile.roles.${currentUser.role}`)}</Badge>
          <Badge variant={currentUser.badgeVerifie ? 'olive' : 'stone'}>
            {currentUser.badgeVerifie ? `✓ ${t('profile.verified')}` : t('profile.notVerified')}
          </Badge>
          <Badge variant="brass">{t(`fidelite.levels.${niveau}`)}</Badge>
          {currentUser.role === UserRole.BenevolRelais && (
            <Badge variant="benevol" icon="🤝">{t('badges.benevol')}</Badge>
          )}
        </div>
      </Card>

      <Card>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-chartrons-warm-gray">{t('profile.points')}</p>
            <p className="text-3xl font-bold text-chartrons-gold">{currentUser.pointsFidelite}</p>
          </div>
          <div className="w-14 h-14 rounded-full bg-chartrons-gold/15 flex items-center justify-center text-2xl">
            ⭐
          </div>
        </div>
      </Card>

      <FideliteHistory userId={currentUserId} userPoints={currentUser.pointsFidelite} />

      {vipStatus.length > 0 && (
        <Card>
          <h4 className="text-sm font-semibold text-chartrons-green-dark mb-3">
            {t('acteurs.vip')}
          </h4>
          <div className="space-y-3">
            {vipStatus.map((vip) => {
              const unlocked = currentUser.pointsFidelite >= vip.pointsRequis;
              const progress = Math.min(
                100,
                Math.round((currentUser.pointsFidelite / vip.pointsRequis) * 100),
              );

              return (
                <div
                  key={vip.commerceId}
                  className={`p-3 rounded-xl border ${
                    unlocked
                      ? 'bg-chartrons-gold/15 border-chartrons-gold/40'
                      : 'bg-chartrons-warm-gray/5 border-chartrons-warm-gray/15'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium text-chartrons-green-dark">{vip.commerceNom}</p>
                    <Badge variant={unlocked ? 'gold' : 'gray'}>
                      {unlocked ? t('fidelite.unlocked') : `${currentUser.pointsFidelite}/${vip.pointsRequis} pts`}
                    </Badge>
                  </div>
                  <p className="text-xs text-chartrons-warm-gray">{vip.offreVip}</p>
                  {!unlocked && (
                    <div className="mt-2 h-1.5 rounded-full bg-chartrons-warm-gray/15 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-chartrons-gold"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card>
        <p className="text-xs text-chartrons-warm-gray mb-1">📍</p>
        <p className="text-sm text-chartrons-green-dark">{currentUser.adresse}</p>
      </Card>

      <Card className="!p-4">
        <p className="text-xs text-chartrons-warm-gray mb-3">{t('profile.resetHint')}</p>
        <Button
          variant="secondary"
          className="w-full"
          disabled={resetting}
          onClick={handleReset}
        >
          {resetting ? t('common.loading') : t('profile.resetDemo')}
        </Button>
      </Card>
    </div>
  );
}
