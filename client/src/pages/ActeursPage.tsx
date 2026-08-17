import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ActeurLocalCategory,
  DIRECTORY_CATEGORIES,
  hasQrVitrine,
  isRestaurantCategory,
  type ActeurLocal,
  type User,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading, Select } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { PhoneLink } from '../components/PhoneLink';
import { AppointmentButton } from '../components/AppointmentButton';
import { PlaceMeta } from '../components/PlaceMeta';
import { RestaurantMenu } from '../components/RestaurantMenu';
import { ContactForm } from '../components/ContactForm';
import { ActeurCreateForm } from '../components/ActeurCreateForm';
import { AdminDeleteButton } from '../components/AdminDeleteButton';
import { FideliteScanner } from '../components/FideliteScanner';
import { FideliteHistory } from '../components/FideliteHistory';
import { QrCodeDisplay } from '../components/QrCodeDisplay';
import { VipOfferCard } from '../components/VipOfferCard';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api, type FideliteScanResult } from '../lib/api';

type CategoryFilter = 'all' | (typeof DIRECTORY_CATEGORIES)[number];

export function ActeursPage() {
  const { t } = useTranslation();
  const { query } = useSearch();
  const { currentUser, currentUserId, refreshUser, isMerchant } = useAuth();
  const { isAdminMode } = useAdmin();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [showCreate, setShowCreate] = useState(false);
  const [generatingQrId, setGeneratingQrId] = useState<string | null>(null);
  const [contactContext, setContactContext] = useState<string | null>(null);

  const loadActeurs = () => {
    setLoading(true);
    Promise.all([api.getActeurs(), api.getUser(currentUserId)])
      .then(([acteursData, userData]) => {
        setActeurs(acteursData);
        setUser(userData);
        if (acteursData[0]) setExpandedId((current) => current ?? acteursData[0].id);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadActeurs();
  }, [currentUserId]);

  const directoryActeurs = useMemo(
    () => acteurs.filter((acteur) => acteur.categorie !== ActeurLocalCategory.TourismeConciergerie),
    [acteurs],
  );

  const filteredActeurs = useMemo(
    () =>
      directoryActeurs.filter((a) => {
        const matchesCategory = categoryFilter === 'all' || a.categorie === categoryFilter;
        const matchesQuery =
          matchesSearch(a.nomCommerce, query) ||
          matchesSearch(a.description, query) ||
          matchesSearch(a.adresse, query) ||
          matchesSearch(a.telephone ?? '', query) ||
          matchesSearch(a.specialite ?? '', query);
        return matchesCategory && matchesQuery;
      }),
    [directoryActeurs, query, categoryFilter],
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
    setUser((u) => (u ? { ...u, pointsFidelite: result.totalPoints } : u));
    await refreshUser();
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

  const canManageFidelite = (acteur: ActeurLocal) =>
    isAdminMode || acteur.userId === currentUserId;

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

      {isMerchant && (
        <Link
          to="/pro"
          className="block p-3 rounded-2xl bg-chartrons-green/10 border border-chartrons-green/20 hover:bg-chartrons-green/15 transition-colors"
        >
          <p className="text-sm font-semibold text-chartrons-green-dark">{t('proSpace.open')}</p>
          <p className="text-xs text-chartrons-warm-gray mt-0.5">{t('proSpace.subtitle')}</p>
        </Link>
      )}

      <FideliteScanner
        acteurs={acteurs}
        userId={currentUserId}
        userPoints={user?.pointsFidelite ?? currentUser?.pointsFidelite ?? 0}
        onScanSuccess={handleScanSuccess}
      />

      <FideliteHistory userId={currentUserId} userPoints={user?.pointsFidelite ?? 0} />

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
              <Card
                key={acteur.id}
                className="!p-0 overflow-hidden cursor-pointer"
                onClick={() => setExpandedId(isExpanded ? null : acteur.id)}
              >
                {acteur.photos[0] && (
                  <img src={acteur.photos[0]} alt="" className="w-full h-40 object-cover" />
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-chartrons-olive-dark text-base">{acteur.nomCommerce}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                        {acteur.offreVip && (
                          <Badge variant="vip" icon="⭐">{t('badges.vip')}</Badge>
                        )}
                        {!hasQrVitrine(acteur) && (
                          <Badge variant="stone">{t('acteurs.qrOptional')}</Badge>
                        )}
                      </div>
                    </div>
                    <span className="text-chartrons-warm-gray text-sm">{isExpanded ? '▲' : '▼'}</span>
                  </div>

                  <p className="text-sm text-chartrons-warm-gray mt-2">{acteur.description}</p>
                  <PlaceMeta
                    rating={acteur.rating}
                    reviewsCount={acteur.reviewsCount}
                    openingHours={acteur.openingHours}
                    specialite={acteur.specialite}
                  />
                  <p className="text-xs text-chartrons-warm-gray/70 mt-2">📍 {acteur.adresse}</p>
                  <div className="mt-2">
                    <PhoneLink phone={acteur.telephone} />
                  </div>
                  <div className="mt-2 space-y-2" onClick={(event) => event.stopPropagation()}>
                    <AppointmentButton acteur={acteur} />
                    <Button
                      variant="ghost"
                      size="md"
                      className="w-full border border-chartrons-beige"
                      onClick={() =>
                        setContactContext(t('contact.shopContext', { name: acteur.nomCommerce }))
                      }
                    >
                      {t('contact.askQuestion')}
                    </Button>
                  </div>

                  {isRestaurantCategory(acteur.categorie) && (
                    <div className="mt-3" onClick={(event) => event.stopPropagation()}>
                      <RestaurantMenu acteur={acteur} />
                    </div>
                  )}

                  <VipOfferCard acteur={acteur} userPoints={user?.pointsFidelite ?? 0} />

                  <AdminDeleteButton
                    label={t('admin.deleteActeur')}
                    confirmMessage={t('admin.deleteActeurConfirm', { name: acteur.nomCommerce })}
                    onDelete={() => handleDeleteActeur(acteur.id)}
                    className="mt-3"
                  />

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-chartrons-gold/10 flex flex-col items-center gap-2">
                      {hasQrVitrine(acteur) ? (
                        <>
                          <p className="text-xs font-medium text-chartrons-warm-gray">
                            {t('acteurs.qrVitrine')}
                          </p>
                          <QrCodeDisplay
                            value={acteur.qrCodeVitrine}
                            label={acteur.qrCodeVitrine}
                            size={140}
                          />
                          <p className="text-[10px] text-chartrons-warm-gray text-center">
                            {t('acteurs.qrHint')}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="text-xs font-medium text-chartrons-warm-gray">
                            {t('acteurs.qrOptional')}
                          </p>
                          <p className="text-[10px] text-chartrons-warm-gray text-center">
                            {t('acteurs.qrOptionalHint')}
                          </p>
                          {canManageFidelite(acteur) && (
                            <Button
                              type="button"
                              size="sm"
                              variant="gold"
                              disabled={generatingQrId === acteur.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleGenerateQr(acteur.id);
                              }}
                            >
                              {generatingQrId === acteur.id
                                ? t('common.loading')
                                : t('acteurs.generateQr')}
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <ActeurCreateForm
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={loadActeurs}
      />

      <ContactForm
        open={!!contactContext}
        onClose={() => setContactContext(null)}
        context={contactContext ?? undefined}
      />
    </div>
  );
}
