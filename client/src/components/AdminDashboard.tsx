import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AdminArdoiseModeration } from './admin/AdminArdoiseModeration';
import { AdminCivicReports } from './admin/AdminCivicReports';
import { AdminConciergeSettings } from './admin/AdminConciergeSettings';
import { AdminPoiManager } from './admin/AdminPoiManager';

const TABS = [
  { id: 'pois', icon: '📍' },
  { id: 'ardoises', icon: '🍽️' },
  { id: 'reports', icon: '📮' },
  { id: 'ai', icon: '🤖' },
] as const;

type TabId = (typeof TABS)[number]['id'];

/**
 * Panneau de contrôle administrateur.
 *
 * Seule zone privilégiée de la plateforme : la modération remplace les comptes commerçants.
 * L'accès est protégé par le code `VITE_ADMIN_PASSCODE` vérifié dans `AdminLayout`.
 */
export function AdminDashboard() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<TabId>('pois');

  return (
    <div className="space-y-5 animate-fade-in">
      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1"
        role="tablist"
        aria-label={t('adminSpace.panel.title')}
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(item.id)}
              className={`shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
                  : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:bg-chartrons-stone'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {t(`adminSpace.panel.tabs.${item.id}`)}
            </button>
          );
        })}
      </div>

      {tab === 'pois' && <AdminPoiManager />}
      {tab === 'ardoises' && <AdminArdoiseModeration />}
      {tab === 'reports' && <AdminCivicReports />}
      {tab === 'ai' && <AdminConciergeSettings />}
    </div>
  );
}
