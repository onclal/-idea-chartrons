import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hasDailySpecial, type ActeurLocal } from '@idea-chartrons/shared';

interface DailyMenuSectionProps {
  acteur: ActeurLocal;
}

export function DailyMenuSection({ acteur }: DailyMenuSectionProps) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);

  if (!hasDailySpecial(acteur)) return null;

  return (
    <div
      className="mt-3 rounded-2xl border border-chartrons-brass/35 bg-gradient-to-br from-chartrons-beige/90 to-white p-3"
      onClick={(event) => event.stopPropagation()}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chartrons-brass">
        {t('acteurs.dailyMenu.kicker')}
      </p>
      {acteur.dailyMenuText ? (
        <p className="mt-1 text-sm font-semibold text-chartrons-olive-dark leading-snug">
          {acteur.dailyMenuText}
        </p>
      ) : null}
      {acteur.dailyMenuImage ? (
        <>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-chartrons-green underline underline-offset-2 cursor-pointer"
            onClick={() => setExpanded((open) => !open)}
          >
            {expanded ? t('acteurs.dailyMenu.hide') : t('acteurs.dailyMenu.show')}
          </button>
          {expanded ? (
            <img
              src={acteur.dailyMenuImage}
              alt={t('acteurs.dailyMenu.alt', { name: acteur.nomCommerce })}
              className="mt-2 w-full h-40 object-cover rounded-xl border border-chartrons-beige"
            />
          ) : (
            <img
              src={acteur.dailyMenuImage}
              alt=""
              className="mt-2 w-full h-20 object-cover rounded-xl border border-chartrons-beige opacity-90"
            />
          )}
        </>
      ) : null}
    </div>
  );
}
