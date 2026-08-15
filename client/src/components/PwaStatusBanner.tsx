import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { dismissPwaBanner, isPwaBannerDismissed, usePwa } from '../context/PwaContext';
import { Badge, Button } from './ui';

export function PwaStatusBanner() {
  const { t } = useTranslation();
  const { online, installed, canInstall, isIos, install } = usePwa();
  const [dismissed, setDismissed] = useState(isPwaBannerDismissed);

  if (!online) {
    return (
      <div className="rounded-2xl border border-chartrons-brass/40 bg-chartrons-brass/15 p-4 shadow-card mb-4">
        <Badge variant="brass" icon="📴">
          {t('pwa.offlineBadge')}
        </Badge>
        <p className="font-semibold text-chartrons-bordeaux text-sm mt-2">{t('pwa.offlineTitle')}</p>
        <p className="text-xs text-chartrons-warm-gray mt-1">{t('pwa.offlineHint')}</p>
        <Link to="/favoris" className="mt-2 inline-flex text-xs font-semibold text-chartrons-bordeaux">
          {t('pwa.openFavorites')} →
        </Link>
      </div>
    );
  }

  if (dismissed || installed) return null;

  if (canInstall) {
    return (
      <div className="rounded-2xl border border-chartrons-beige bg-white p-4 shadow-card mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-chartrons-olive-dark text-sm">{t('pwa.installTitle')}</p>
            <p className="text-xs text-chartrons-warm-gray mt-1">{t('pwa.installHint')}</p>
          </div>
          <button
            type="button"
            className="touch-target w-8 h-8 rounded-full text-chartrons-warm-gray"
            aria-label={t('pwa.dismiss')}
            onClick={() => {
              dismissPwaBanner();
              setDismissed(true);
            }}
          >
            ✕
          </button>
        </div>
        <Button type="button" size="sm" variant="bordeaux" className="mt-3" onClick={() => void install()}>
          {t('pwa.install')}
        </Button>
      </div>
    );
  }

  if (isIos && !installed) {
    return (
      <div className="rounded-2xl border border-chartrons-beige bg-white p-4 shadow-card mb-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="font-semibold text-chartrons-olive-dark text-sm">{t('pwa.iosTitle')}</p>
            <p className="text-xs text-chartrons-warm-gray mt-1">{t('pwa.iosHint')}</p>
          </div>
          <button
            type="button"
            className="touch-target w-8 h-8 rounded-full text-chartrons-warm-gray"
            aria-label={t('pwa.dismiss')}
            onClick={() => {
              dismissPwaBanner();
              setDismissed(true);
            }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  return null;
}
