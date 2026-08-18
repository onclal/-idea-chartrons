import { lazy, Suspense, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from './ui';
import { ConciergeBeretLoader } from './ConciergeBeretLoader';
import { ConciergeRichResults } from './ConciergeRichResults';
import { useConciergePanel } from '../context/ConciergePanelContext';
import { PhoneLink } from './PhoneLink';

const ConciergeMiniMap = lazy(() =>
  import('./ConciergeMiniMap').then((mod) => ({ default: mod.ConciergeMiniMap })),
);

export function AISidePanel() {
  const { t } = useTranslation();
  const {
    open,
    collapsed,
    pending,
    messages,
    lastAssistant,
    matchingPosts,
    checklist,
    closePanel,
    toggleCollapsed,
    ask,
  } = useConciergePanel();

  useEffect(() => {
    if (!open || collapsed) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closePanel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, collapsed, closePanel]);

  if (!open) return null;

  const recommendations = lastAssistant?.recommendations ?? [];
  const heritage = lastAssistant?.heritage ?? [];
  const answerLang = lastAssistant?.lang ?? 'fr';
  const lastUser = [...messages].reverse().find((message) => message.role === 'user');

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={toggleCollapsed}
        className="fixed z-[60] right-3 bottom-[5.5rem] md:bottom-6 md:right-4 min-h-[48px] px-4 rounded-full bg-chartrons-green text-white shadow-card-hover inline-flex items-center gap-2"
        aria-expanded={false}
      >
        <ConciergeBeretLoader size="sm" />
        <span className="text-sm font-semibold">{t('conciergePanel.expand')}</span>
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] pointer-events-none">
      <button
        type="button"
        className="absolute inset-0 bg-chartrons-olive-dark/25 pointer-events-auto"
        aria-label={t('conciergePanel.close')}
        onClick={closePanel}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={t('conciergePanel.title')}
        className="pointer-events-auto absolute bg-white shadow-card-hover flex flex-col
          inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl pb-[env(safe-area-inset-bottom)]
          md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:h-dvh md:w-[min(100%,28rem)] md:rounded-none md:pb-0"
      >
        <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-chartrons-beige">
          <div className="min-w-0">
            <p className="text-sm font-bold text-chartrons-green-dark">{t('conciergePanel.title')}</p>
            {lastUser && (
              <p className="text-[11px] text-chartrons-warm-gray truncate">{lastUser.content}</p>
            )}
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={toggleCollapsed}
              className="touch-target w-10 h-10 rounded-full bg-chartrons-beige/80 text-chartrons-olive-dark"
              aria-label={t('conciergePanel.collapse')}
            >
              ▾
            </button>
            <button
              type="button"
              onClick={closePanel}
              className="touch-target w-10 h-10 rounded-full bg-chartrons-beige/80 text-chartrons-olive-dark"
              aria-label={t('conciergePanel.close')}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 pb-8">
          {pending && (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <ConciergeBeretLoader size="md" label={t('conciergerie.ai.thinking')} />
            </div>
          )}

          {!pending && lastAssistant && (
            <Card className="!p-3 bg-chartrons-stone/70">
              <p className="text-sm text-chartrons-olive-dark leading-relaxed whitespace-pre-wrap">
                {lastAssistant.content}
              </p>
            </Card>
          )}

          {!pending && recommendations.length > 0 && (
            <div className="h-48 overflow-hidden rounded-2xl border border-chartrons-beige">
              <Suspense fallback={<div className="h-full bg-chartrons-beige/40 animate-pulse" />}>
                <ConciergeMiniMap recommendations={recommendations} />
              </Suspense>
            </div>
          )}

          {!pending && lastAssistant && (
            <ConciergeRichResults
              recommendations={recommendations}
              heritage={heritage}
              lang={answerLang}
              compact
            />
          )}

          {!pending && lastAssistant?.basket && (
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-chartrons-bordeaux">{t('conciergePanel.basket')}</h4>
              <Card className="!p-3 space-y-2">
                <p className="font-semibold text-sm text-chartrons-olive-dark">{lastAssistant.basket.title}</p>
                <p className="text-xs text-chartrons-warm-gray leading-relaxed">{lastAssistant.basket.summary}</p>
                <ol className="space-y-2 list-decimal list-inside">
                  {lastAssistant.basket.stops.map((stop) => (
                    <li key={stop.poiId} className="text-xs text-chartrons-olive-dark">
                      <span className="font-semibold">{stop.name}</span>
                      <span className="text-chartrons-warm-gray"> — {stop.address}</span>
                      <ul className="mt-1 ml-4 list-disc">
                        {stop.lines.map((line) => (
                          <li key={line.ingredientId}>
                            {line.name} ({line.quantity}) · {line.price.toFixed(2)} €
                          </li>
                        ))}
                      </ul>
                    </li>
                  ))}
                </ol>
                <p className="text-sm font-semibold text-chartrons-green">
                  {t('conciergePanel.basketTotal', { total: lastAssistant.basket.totalEstimate.toFixed(2) })}
                </p>
              </Card>
            </section>
          )}

          {!pending && checklist.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-chartrons-bordeaux">{t('conciergePanel.checklist')}</h4>
              <ul className="space-y-2">
                {checklist.map((item) => (
                  <li key={item}>
                    <label className="flex items-start gap-2 text-sm text-chartrons-olive-dark">
                      <input type="checkbox" className="mt-1 rounded border-chartrons-beige" />
                      <span>{item}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!pending && matchingPosts.length > 0 && (
            <section className="space-y-2">
              <h4 className="text-sm font-bold text-chartrons-bordeaux">{t('conciergePanel.posts')}</h4>
              {matchingPosts.map((post) => (
                <Link key={post.id} to="/posts" onClick={closePanel}>
                  <Card className="!p-3 hover:shadow-card-hover">
                    <p className="font-semibold text-sm text-chartrons-olive-dark">{post.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1 line-clamp-2">{post.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>
                      <PhoneLink phone={post.telephone} />
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {!pending && lastUser && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={() => void ask(lastUser.content)}
            >
              {t('conciergePanel.retry')}
            </Button>
          )}
        </div>
      </aside>
    </div>
  );
}
