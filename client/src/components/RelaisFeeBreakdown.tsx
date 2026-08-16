import { useTranslation } from 'react-i18next';
import { RELAIS_FRAIS_GESTION_EUR } from '@idea-chartrons/shared';
import { formatEuro } from '../lib/format';

interface RelaisFeeBreakdownProps {
  prix: number | null;
  compact?: boolean;
}

export function RelaisFeeBreakdown({ prix, compact = false }: RelaisFeeBreakdownProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const servicePrice = prix ?? 0;
  const fees = RELAIS_FRAIS_GESTION_EUR;
  const total = servicePrice + fees;

  return (
    <div
      className={`rounded-xl border border-chartrons-beige bg-chartrons-beige/40 ${
        compact ? 'p-2.5' : 'p-3'
      }`}
    >
      <p className={`font-semibold text-chartrons-olive-dark ${compact ? 'text-xs mb-1.5' : 'text-sm mb-2'}`}>
        {t('relais.fees.title')}
      </p>
      <dl className="space-y-1">
        <div className="flex items-center justify-between gap-3 text-sm">
          <dt className="text-chartrons-warm-gray">{t('relais.fees.price')}</dt>
          <dd className="font-medium text-chartrons-olive-dark">
            {prix == null ? t('posts.free') : formatEuro(servicePrice, locale)}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm">
          <dt className="text-chartrons-warm-gray">{t('relais.fees.management')}</dt>
          <dd className="font-medium text-chartrons-olive-dark">+{formatEuro(fees, locale)}</dd>
        </div>
        <div className="flex items-center justify-between gap-3 text-sm pt-1 border-t border-chartrons-beige">
          <dt className="font-semibold text-chartrons-olive-dark">{t('relais.fees.total')}</dt>
          <dd className="font-bold text-chartrons-bordeaux">{formatEuro(total, locale)}</dd>
        </div>
      </dl>
    </div>
  );
}
