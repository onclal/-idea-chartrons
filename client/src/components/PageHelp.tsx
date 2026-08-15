import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Modal } from './ui';

export type HelpPage = 'home' | 'posts' | 'relais' | 'acteurs' | 'carte' | 'tourisme' | 'favoris';

interface PageHelpProps {
  page: HelpPage;
  className?: string;
}

export function PageHelp({ page, className = '' }: PageHelpProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  const steps = t(`help.${page}.steps`, { returnObjects: true });
  const stepList = Array.isArray(steps) ? (steps as string[]) : [];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`touch-target w-11 h-11 shrink-0 rounded-full border border-chartrons-beige bg-white text-chartrons-bordeaux font-bold text-lg shadow-card hover:bg-chartrons-stone hover:border-chartrons-bordeaux/30 transition-colors ${className}`}
        aria-label={t('help.button')}
        title={t('help.button')}
      >
        ?
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title={t(`help.${page}.title`)} size="lg">
        <div className="space-y-5">
          <p className="text-sm sm:text-base text-chartrons-olive-dark leading-relaxed">
            {t(`help.${page}.purpose`)}
          </p>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wide text-chartrons-warm-gray mb-3">
              {t('help.stepsTitle')}
            </h4>
            <ol className="space-y-3">
              {stepList.map((step, index) => (
                <li key={index} className="flex gap-3">
                  <span className="shrink-0 w-7 h-7 rounded-full bg-chartrons-bordeaux text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  <p className="text-sm text-chartrons-olive-dark leading-relaxed pt-0.5">{step}</p>
                </li>
              ))}
            </ol>
          </div>

          <Button variant="bordeaux" className="w-full" onClick={() => setOpen(false)}>
            {t('help.gotIt')}
          </Button>
        </div>
      </Modal>
    </>
  );
}
