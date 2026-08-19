import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { hasQrVitrine, type ActeurLocal } from '@idea-chartrons/shared';
import { AppointmentLinkEditor } from '../components/AppointmentLinkEditor';
import { QRCodeGenerator } from '../components/QRCodeGenerator';
import { RestaurantMenuEditor } from '../components/RestaurantMenuEditor';
import { Badge, Button, Card, Loading, Select } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { writeLocalStorage } from '../lib/storage';

const SHOP_KEY = 'idea-chartrons-pro-shop-id';
const TABS = [
  { id: 'kit', icon: '▦' },
  { id: 'fidelite', icon: '⭐' },
  { id: 'menu', icon: '🍽️' },
  { id: 'rdv', icon: '📅' },
] as const;

type TabId = (typeof TABS)[number]['id'];

function isTab(value: string | null): value is TabId {
  return TABS.some((tab) => tab.id === value);
}

export function ProDashboardPage() {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingQr, setGeneratingQr] = useState(false);
  const requestedShop = searchParams.get('shop');
  const requestedTab = searchParams.get('tab');
  const [shopId, setShopId] = useState('');
  const [tab, setTab] = useState<TabId>(isTab(requestedTab) ? requestedTab : 'kit');

  const load = () => {
    setLoading(true);
    api
      .getActeurs()
      .then(setActeurs)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  useEffect(() => {
    if (acteurs.length === 0) return;
    if (requestedShop && acteurs.some((item) => item.id === requestedShop)) {
      setShopId(requestedShop);
      return;
    }
    setShopId((current) => {
      if (current && acteurs.some((item) => item.id === current)) return current;
      try {
        const stored = localStorage.getItem(SHOP_KEY) ?? '';
        if (acteurs.some((item) => item.id === stored)) return stored;
      } catch {
        // ignore
      }
      return acteurs[0]?.id ?? '';
    });
  }, [acteurs, requestedShop]);

  useEffect(() => {
    if (isTab(requestedTab)) setTab(requestedTab);
  }, [requestedTab]);

  const acteur = useMemo(() => acteurs.find((item) => item.id === shopId) ?? null, [acteurs, shopId]);

  const selectShop = (id: string) => {
    setShopId(id);
    try {
      writeLocalStorage(SHOP_KEY, id);
    } catch {
      // ignore
    }
    const next = new URLSearchParams(searchParams);
    next.set('shop', id);
    setSearchParams(next, { replace: true });
  };

  const selectTab = (nextTab: TabId) => {
    setTab(nextTab);
    const next = new URLSearchParams(searchParams);
    next.set('tab', nextTab);
    if (shopId) next.set('shop', shopId);
    setSearchParams(next, { replace: true });
  };

  const refreshActeur = (updated: ActeurLocal) => {
    setActeurs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  if (!acteur) {
    return (
      <Card className="!p-5 space-y-3">
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('proSpace.noShop')}</h2>
        <p className="text-sm text-chartrons-warm-gray">{t('proSpace.noShopHint')}</p>
        <Link to="/acteurs?referencer=1">
          <Button variant="bordeaux" className="w-full">
            {t('proSpace.createShop')}
          </Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-chartrons-brass">
          {t('proSpace.badge')}
        </p>
        <h2 className="text-xl font-bold text-chartrons-bordeaux mt-1">
          {t('proSpace.titleWithShop', { shop: acteur.nomCommerce })}
        </h2>
        <p className="text-sm text-chartrons-warm-gray mt-1">{t('proSpace.kit.dashboardHint')}</p>
      </div>

      <Select
        label={t('proSpace.shop')}
        value={acteur.id}
        onChange={(event) => selectShop(event.target.value)}
        options={acteurs.map((item) => ({ value: item.id, label: item.nomCommerce }))}
      />

      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide -mx-1 px-1"
        role="tablist"
        aria-label={t('proSpace.title')}
      >
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => selectTab(item.id)}
              className={`shrink-0 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full text-xs font-semibold border transition-colors ${
                active
                  ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
                  : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:bg-chartrons-stone'
              }`}
            >
              <span aria-hidden>{item.icon}</span>
              {item.id === 'kit' ? t('proSpace.tabs.kit') : t(`proSpace.tabs.${item.id}`)}
            </button>
          );
        })}
      </div>

      {tab === 'kit' && (
        <Card className="!p-4 sm:!p-5">
          <QRCodeGenerator acteur={acteur} />
        </Card>
      )}

      {tab === 'fidelite' && (
        <Card className="!p-4 sm:!p-5 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.rule.title')}</h3>
              <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('proSpace.rule.subtitle')}</p>
            </div>
            {hasQrVitrine(acteur) ? (
              <Badge variant="olive">{t('acteurs.qrActive')}</Badge>
            ) : (
              <Badge variant="stone">{t('acteurs.qrOptional')}</Badge>
            )}
          </div>
          <p className="text-sm text-chartrons-olive-dark leading-relaxed">
            {t(`proSpace.rule.modes.${acteur.regleFideliteMode}.label`)}
          </p>
          {!hasQrVitrine(acteur) && (
            <Button
              type="button"
              variant="gold"
              disabled={generatingQr}
              onClick={async () => {
                setGeneratingQr(true);
                try {
                  const updated = await api.generateQrVitrine(acteur.id);
                  refreshActeur(updated);
                  showToast(t('toast.qrGenerated'));
                } catch (err) {
                  showToast(err instanceof Error ? err.message : t('common.error'), 'error');
                } finally {
                  setGeneratingQr(false);
                }
              }}
            >
              {generatingQr ? t('common.loading') : t('acteurs.generateQr')}
            </Button>
          )}
          <Button type="button" variant="bordeaux" onClick={() => selectTab('kit')}>
            {t('proSpace.tabs.kit')}
          </Button>
        </Card>
      )}

      {tab === 'menu' && (
        <Card className="!p-4 sm:!p-5">
          <RestaurantMenuEditor
            acteur={acteur}
            saving={saving}
            onSave={async (menu) => {
              setSaving(true);
              try {
                await api.updateActeurMenu(acteur.id, menu);
                const list = await api.getActeurs();
                setActeurs(list);
                showToast(t('toast.menuSaved'));
              } catch (err) {
                showToast(err instanceof Error ? err.message : t('common.error'), 'error');
              } finally {
                setSaving(false);
              }
            }}
          />
        </Card>
      )}

      {tab === 'rdv' && (
        <Card className="!p-4 sm:!p-5">
          <AppointmentLinkEditor
            acteur={acteur}
            saving={saving}
            onSave={async (url) => {
              setSaving(true);
              try {
                const updated = await api.updateAppointmentLink(acteur.id, url.trim() || null);
                refreshActeur(updated);
                showToast(t('toast.appointmentSaved'));
              } catch (err) {
                showToast(err instanceof Error ? err.message : t('common.error'), 'error');
              } finally {
                setSaving(false);
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}
