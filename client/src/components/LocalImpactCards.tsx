import { useTranslation } from 'react-i18next';
import { Card } from './ui';
import { formatEuro } from '../lib/format';
import type { LocalImpactStats } from '../lib/localImpact';

interface LocalImpactCardsProps {
  stats: LocalImpactStats;
}

function formatKm(km: number, locale: string): string {
  const value = km >= 10 ? km.toFixed(0) : km.toFixed(1);
  const formatted = locale.startsWith('fr') ? value.replace('.', ',') : value;
  return `${formatted} km`;
}

function formatCo2(kg: number, locale: string): string {
  const value = kg >= 10 ? kg.toFixed(0) : kg.toFixed(1);
  const formatted = locale.startsWith('fr') ? value.replace('.', ',') : value;
  return `${formatted} kg`;
}

export function LocalImpactCards({ stats }: LocalImpactCardsProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;

  const cards = [
    {
      icon: '🚶',
      value: formatKm(stats.walkingKm, locale),
      label: t('carnet.impact.walked'),
      color: 'text-chartrons-green',
    },
    {
      icon: '🌿',
      value: formatCo2(stats.co2Kg, locale),
      label: t('carnet.impact.co2'),
      color: 'text-chartrons-olive',
    },
    {
      icon: '💶',
      value: formatEuro(stats.averageSpend, locale),
      label: t('carnet.impact.budget'),
      color: 'text-chartrons-bordeaux',
    },
  ];

  return (
    <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      {cards.map((card) => (
        <Card key={card.label} className="!p-4 text-center space-y-1">
          <p className="text-xl" aria-hidden>
            {card.icon}
          </p>
          <p className={`text-2xl font-bold ${card.color}`}>{card.value}</p>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-chartrons-warm-gray leading-tight">
            {card.label}
          </p>
        </Card>
      ))}
    </section>
  );
}
