import { useTranslation } from 'react-i18next';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { QrCodeDisplay } from './QrCodeDisplay';
import { AccessibilityBadges } from './AccessibilityBadges';
import { Button } from './ui';
import { appUrl } from '../lib/share';
import { merchantProfilePath } from '../lib/merchantProfile';

interface StorefrontPosterProps {
  acteur: ActeurLocal;
}

export function StorefrontPoster({ acteur }: StorefrontPosterProps) {
  const { t } = useTranslation();
  const profileUrl = appUrl(merchantProfilePath(acteur.id));

  return (
    <div className="storefront-poster space-y-5">
      <div className="rounded-[28px] border-4 border-chartrons-green bg-white px-6 py-8 text-center space-y-5">
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-chartrons-brass">
          {t('poster.kicker')}
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold text-chartrons-green-dark leading-tight">
          {t('poster.title')}
        </h2>
        <p className="text-lg font-semibold text-chartrons-olive-dark">{t('poster.confort')}</p>
        <div className="h-px bg-chartrons-beige" />
        <p className="text-3xl font-bold text-chartrons-bordeaux leading-tight">{acteur.nomCommerce}</p>
        <p className="text-base text-chartrons-olive-dark leading-relaxed">📍 {acteur.adresse}</p>
        {acteur.telephone && <p className="text-lg font-bold text-chartrons-green">📞 {acteur.telephone}</p>}
        <div className="flex justify-center">
          <QrCodeDisplay value={profileUrl} size={240} />
        </div>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed max-w-sm mx-auto">
          {t('poster.scanHint')}
        </p>
        <div className="flex justify-center">
          <AccessibilityBadges source={acteur} />
        </div>
      </div>
      <Button type="button" variant="bordeaux" className="w-full no-print" onClick={() => window.print()}>
        {t('poster.print')}
      </Button>
    </div>
  );
}
