import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { getFideliteNiveau } from '@idea-chartrons/shared';
import { Badge, Card } from './ui';
import { api, type FideliteHistoryEntry } from '../lib/api';

interface FideliteHistoryProps {
  userId?: string;
  userPoints?: number;
}

export function FideliteHistory({ userId = 'user-1', userPoints = 0 }: FideliteHistoryProps) {
  const { t, i18n } = useTranslation();
  const [history, setHistory] = useState<FideliteHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getFideliteHistory(userId)
      .then(setHistory)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [userId]);

  const niveau = getFideliteNiveau(userPoints);
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-chartrons-green-dark">{t('fidelite.history')}</h4>
        <Badge variant="gold">{t(`fidelite.levels.${niveau}`)}</Badge>
      </div>

      {loading ? (
        <p className="text-xs text-chartrons-warm-gray">{t('common.loading')}</p>
      ) : history.length === 0 ? (
        <p className="text-xs text-chartrons-warm-gray">{t('fidelite.noHistory')}</p>
      ) : (
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {history.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-2 py-2 border-b border-chartrons-gold/10 last:border-0"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-chartrons-green-dark truncate">
                  {entry.commerceNom}
                </p>
                <p className="text-[10px] text-chartrons-warm-gray">
                  {new Date(entry.date).toLocaleDateString(locale, {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <span className="text-sm font-bold text-chartrons-gold shrink-0">
                +{entry.pointsGagnes}
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
