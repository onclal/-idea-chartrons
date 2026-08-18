import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DIRECTORY_CATEGORIES, type ActeurLocal } from '@idea-chartrons/shared';
import { Button, EmptyState, Loading, Select } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { MerchantCard } from '../components/MerchantCard';
import { ContactForm } from '../components/ContactForm';
import { ActeurCreateForm } from '../components/ActeurCreateForm';
import { PremiumProModal } from '../components/PremiumProModal';
import { FideliteScanner } from '../components/FideliteScanner';
import { FideliteHistory } from '../components/FideliteHistory';
import { useAdmin } from '../context/AdminContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api, type FideliteScanResult } from '../lib/api';
import { getDeviceId } from '../lib/guestCarnet';

type CategoryFilter = 'all' | (typeof DIRECTORY_CATEGORIES)[number];

export function ActeursPage() {
  const { t } = useTranslation();
  const { query } = useSearch();
  const { isAdminMode } = useAdmin();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [carnetPoints, setCarnetPoints] = useState(0);
  const deviceId = getDeviceId();
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [searchParams, setSearchParams] = useSearchParams();
  const [showCreate, setShowCreate] = useState(searchParams.get('referencer') === '1');
  const [generatingQrId, setGeneratingQrId] = useState<string | null>(null);
  const [contactContext, setContactContext] = useState<string | null>(null);
  const [proActeur, setProActeur] = useState<ActeurLocal | null>(null);

  const loadActeurs = () => {
    setLoading(true);
    Promise.all([api.getActeurs(), api.getCarnetPoints(deviceId)])
      .then(([acteursData, points]) => {
        setActeurs(acteursData);
        setCarnetPoints(points);
        if (acteursData[0]) setExpandedId((current) => current ?? acteursData[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadActeurs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceId]);

  useEffect(() => {
    if (searchParams.get('referencer') === '1') setShowCreate(true);
  }, [searchParams]);

  const closeCreateForm = () => {
    setShowCreate(false);
    if (searchParams.has('referencer')) {
      const next = new URLSearchParams(searchParams);
      next.delete('referencer');
      setSearchParams(next, { replace: true });
    }
  };

  const filteredActeurs = useMemo(
    () =>
      acteurs.filter((a) => {
        const matchesCategory = categoryFilter === 'all' || a.categorie === categoryFilter;
        const matchesQuery =
          matchesSearch(a.nomCommerce, query) ||
          matchesSearch(a.description, query) ||
          matchesSearch(a.adresse, query) ||
          matchesSearch(a.telephone ?? '', query) ||
          matchesSearch(a.specialite ?? '', query);
        return matchesCategory && matchesQuery;
      }),
    [acteurs, query, categoryFilter],
  );

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: t('acteurs.filters.all') },
      ...DIRECTORY_CATEGORIES.map((cat) => ({
        value: cat,
        label: t(`acteurs.categories.${cat}`),
      })),
    ],
    [t],
  );

  const handleScanSuccess = async (result: FideliteScanResult) => {
    setCarnetPoints(result.totalPoints);
    showToast(t('toast.pointsEarned', { points: result.pointsGagnes }));
    if (result.vipUnlocked) {
      setTimeout(() => showToast(t('toast.vipUnlocked', { offer: result.vipUnlocked }), 'info'), 400);
    }
  };

  const handleDeleteActeur = async (acteurId: string) => {
    await api.deleteActeur(acteurId);
    const acteursData = await api.getActeurs();
    setActeurs(acteursData);
    if (expandedId === acteurId) setExpandedId(acteursData[0]?.id ?? null);
    showToast(t('admin.deleteSuccess'));
  };

  const handleGenerateQr = async (acteurId: string) => {
    setGeneratingQrId(acteurId);
    try {
      const updated = await api.generateQrVitrine(acteurId);
      setActeurs((list) => list.map((a) => (a.id === acteurId ? updated : a)));
      showToast(t('toast.qrGenerated'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setGeneratingQrId(null);
    }
  };

  // En mode invité, seule la modération admin peut piloter la fidélité d'un commerce.
  const canManageFidelite = (_acteur: ActeurLocal) => isAdminMode;

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <div className="min-w-0">
            <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('acteurs.title')}</h2>
            <p className="text-sm text-chartrons-warm-gray mt-1">{t('acteurs.subtitle')}</p>
            {query && (
              <p className="text-xs text-chartrons-warm-gray mt-0.5">
                {t('search.results', { count: filteredActeurs.length, query })}
              </p>
            )}
          </div>
          <PageHelp page="acteurs" />
        </div>
        <Button size="sm" variant="bordeaux" onClick={() => setShowCreate(true)} className="shrink-0">
          + {t('acteurs.create.button')}
        </Button>
      </div>

      <FideliteScanner
        acteurs={acteurs}
        deviceId={deviceId}
        carnetPoints={carnetPoints}
        onScanSuccess={handleScanSuccess}
      />

      <FideliteHistory deviceId={deviceId} carnetPoints={carnetPoints} />

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          type="button"
          onClick={() => setCategoryFilter('all')}
          className={`shrink-0 touch-target px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
            categoryFilter === 'all'
              ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
              : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:border-chartrons-bordeaux/30'
          }`}
        >
          {t('acteurs.filters.all')}
        </button>
        {DIRECTORY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`shrink-0 touch-target px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              categoryFilter === cat
                ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
                : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:border-chartrons-bordeaux/30'
            }`}
          >
            {t(`acteurs.categories.${cat}`)}
          </button>
        ))}
      </div>

      <Select
        label={t('acteurs.filters.label')}
        value={categoryFilter}
        onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
        options={categoryOptions}
      />

      {filteredActeurs.length === 0 ? (
        <EmptyState
          icon={query ? '🔍' : '🏪'}
          title={query ? t('search.noResultsTitle') : t('acteurs.emptyTitle')}
          message={query ? t('search.noResultsHint') : t('acteurs.emptyHint')}
          action={
            !query
              ? { label: `+ ${t('acteurs.create.button')}`, onClick: () => setShowCreate(true) }
              : undefined
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredActeurs.map((acteur) => {
            const isExpanded = expandedId === acteur.id;
            return (
              <MerchantCard
                key={acteur.id}
                acteur={acteur}
                isExpanded={isExpanded}
                carnetPoints={carnetPoints}
                generatingQrId={generatingQrId}
                canManageFidelite={canManageFidelite(acteur)}
                onToggle={() => setExpandedId(isExpanded ? null : acteur.id)}
                onUpdated={(updated) =>
                  setActeurs((list) => list.map((item) => (item.id === updated.id ? updated : item)))
                }
                onAskQuestion={() =>
                  setContactContext(t('contact.shopContext', { name: acteur.nomCommerce }))
                }
                onDelete={() => handleDeleteActeur(acteur.id)}
                onGenerateQr={() => handleGenerateQr(acteur.id)}
                onSubscribePro={() => setProActeur(acteur)}
              />
            );
          })}
        </div>
      )}

      <ActeurCreateForm
        open={showCreate}
        onClose={closeCreateForm}
        onCreated={(acteur, options) => {
          loadActeurs();
          if (options?.subscribePro) setProActeur(acteur);
        }}
      />

      <PremiumProModal
        open={!!proActeur}
        acteur={proActeur}
        onClose={() => setProActeur(null)}
        onSubscribed={(updated) => {
          setActeurs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
          setProActeur(null);
        }}
      />

      <ContactForm
        open={!!contactContext}
        onClose={() => setContactContext(null)}
        context={contactContext ?? undefined}
      />
    </div>
  );
}
