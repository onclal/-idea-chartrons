import { useTranslation } from 'react-i18next';
import { getVipProgress, isVipUnlocked } from '@idea-chartrons/shared';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { Badge } from './ui';

interface VipOfferCardProps {
  acteur: ActeurLocal;
  userPoints: number;
}

export function VipOfferCard({ acteur, userPoints }: VipOfferCardProps) {
  const { t } = useTranslation();

  if (!acteur.offreVip) return null;

  const unlocked = isVipUnlocked(userPoints, acteur);
  const progress = getVipProgress(userPoints, acteur);

  return (
    <div
      className={`mt-3 p-3 rounded-xl border transition-colors ${
        unlocked
          ? 'bg-chartrons-gold/15 border-chartrons-gold/40'
          : 'bg-chartrons-warm-gray/5 border-chartrons-warm-gray/15'
      }`}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <p className="text-xs font-medium text-chartrons-green-dark">
          {unlocked ? '🎉' : '🔒'} {t('acteurs.vip')}
        </p>
        <Badge variant={unlocked ? 'gold' : 'gray'}>
          {unlocked ? t('fidelite.unlocked') : `${userPoints}/${acteur.pointsRequisVip} pts`}
        </Badge>
      </div>
      <p className={`text-xs ${unlocked ? 'text-chartrons-green-dark' : 'text-chartrons-warm-gray'}`}>
        {acteur.offreVip}
      </p>
      {!unlocked && (
        <div className="mt-2">
          <div className="h-1.5 rounded-full bg-chartrons-warm-gray/15 overflow-hidden">
            <div
              className="h-full rounded-full bg-chartrons-gold transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-chartrons-warm-gray mt-1">
            {t('fidelite.pointsNeeded', { count: acteur.pointsRequisVip - userPoints })}
          </p>
        </div>
      )}
    </div>
  );
}
