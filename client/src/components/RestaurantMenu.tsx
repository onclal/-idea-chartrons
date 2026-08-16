import { useTranslation } from 'react-i18next';
import { acteurHasMenu, normalizeMenu, type ActeurLocal } from '@idea-chartrons/shared';
import { formatEuro } from '../lib/format';

interface RestaurantMenuProps {
  acteur: ActeurLocal;
}

export function RestaurantMenu({ acteur }: RestaurantMenuProps) {
  const { t, i18n } = useTranslation();
  const sections = normalizeMenu(acteur.menu);

  if (!acteurHasMenu(acteur)) {
    return (
      <div className="rounded-xl border border-chartrons-beige bg-chartrons-beige/40 p-3">
        <p className="text-sm font-semibold text-chartrons-olive-dark">{t('acteurs.menu.title')}</p>
        <p className="text-xs text-chartrons-warm-gray mt-1">{t('acteurs.menu.empty')}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-chartrons-beige bg-white p-3 space-y-3">
      <p className="text-sm font-semibold text-chartrons-olive-dark">{t('acteurs.menu.title')}</p>
      {sections.map((section) => (
        <div key={section.id}>
          <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-brass mb-1.5">
            {section.titre}
          </p>
          <ul className="space-y-2">
            {section.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-chartrons-olive-dark">{item.nom}</p>
                  {item.description ? (
                    <p className="text-xs text-chartrons-warm-gray leading-relaxed">{item.description}</p>
                  ) : null}
                </div>
                <span className="text-sm font-semibold text-chartrons-bordeaux shrink-0">
                  {formatEuro(item.prix, i18n.language)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
