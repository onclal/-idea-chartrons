import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { isReadyForPickup } from '@idea-chartrons/shared';
import type { LocalRelais, PostAnnonce } from '@idea-chartrons/shared';
import { Badge } from './ui';

interface PickupAlertProps {
  relaisList: LocalRelais[];
  posts: PostAnnonce[];
  userId?: string;
}

export function PickupAlert({ relaisList, posts, userId = 'user-1' }: PickupAlertProps) {
  const { t } = useTranslation();

  const readyItems = relaisList.filter(
    (r) => r.userId === userId && isReadyForPickup(r),
  );

  if (readyItems.length === 0) return null;

  const getTitle = (postId: string) =>
    posts.find((p) => p.id === postId)?.titre ?? '';

  return (
    <div className="rounded-2xl bg-gradient-to-r from-chartrons-brass/20 to-chartrons-brick/10 border border-chartrons-brass/40 p-4 shadow-card animate-pulse-slow">
      <div className="flex items-start gap-3">
        <div className="w-11 h-11 rounded-2xl bg-chartrons-bordeaux flex items-center justify-center text-lg shrink-0 shadow-sm">
          🔔
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="local" icon="📦">{t('badges.local')}</Badge>
          </div>
          <p className="font-semibold text-chartrons-bordeaux text-sm">
            {t('relais.alert.title', { count: readyItems.length })}
          </p>
          <ul className="mt-1.5 space-y-0.5">
            {readyItems.map((r) => (
              <li key={r.id} className="text-xs text-chartrons-warm-gray truncate">
                ✓ {getTitle(r.postId)}
              </li>
            ))}
          </ul>
          <Link
            to="/relais"
            className="inline-flex items-center touch-target mt-2 text-xs font-semibold text-chartrons-bordeaux underline underline-offset-2"
          >
            {t('relais.alert.action')} →
          </Link>
        </div>
      </div>
    </div>
  );
}
