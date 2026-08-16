import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  calculateAwardPoints,
  FideliteRegleMode,
  findUserByClientToken,
  generateQrClientCode,
  getActeurFideliteRegle,
  UserRole,
  type ActeurLocal,
  type PostAnnonce,
  type User,
} from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Input, Loading, Modal, Select } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { useAdmin } from '../context/AdminContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api, type FideliteAwardResult, type FideliteCommerceHistoryEntry } from '../lib/api';

const RULE_MODES = [
  FideliteRegleMode.ChiffreAffaires,
  FideliteRegleMode.Visite,
  FideliteRegleMode.Forfait,
] as const;

export function ProPage() {
  const { t, i18n } = useTranslation();
  const { currentUser, currentUserId, demoUsers, isMerchant, switchUser } = useAuth();
  const { isAdminMode } = useAdmin();
  const { showToast } = useToast();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [loading, setLoading] = useState(true);
  const [offerOpen, setOfferOpen] = useState(false);
  const [boosting, setBoosting] = useState(false);
  const [selectedId, setSelectedId] = useState('');
  const [ruleMode, setRuleMode] = useState<FideliteRegleMode>(FideliteRegleMode.Visite);
  const [ruleValue, setRuleValue] = useState('5');
  const [savingRule, setSavingRule] = useState(false);
  const [clientToken, setClientToken] = useState('');
  const [montant, setMontant] = useState('');
  const [scanning, setScanning] = useState(false);
  const [crediting, setCrediting] = useState(false);
  const [awardResult, setAwardResult] = useState<FideliteAwardResult | null>(null);
  const [awardError, setAwardError] = useState<string | null>(null);
  const [history, setHistory] = useState<FideliteCommerceHistoryEntry[]>([]);

  const canAccess = isMerchant || isAdminMode;
  const isDemoOrAdmin =
    isAdminMode || currentUser?.role === UserRole.Admin;
  const locale = i18n.language === 'fr' ? 'fr-FR' : 'en-GB';

  const myShops = useMemo(() => {
    if (isDemoOrAdmin) return acteurs;
    return acteurs.filter((acteur) => acteur.userId === currentUserId);
  }, [acteurs, currentUserId, isDemoOrAdmin]);

  const showShopSelector = isDemoOrAdmin && myShops.length > 1;
  const selectedShop = showShopSelector
    ? (myShops.find((acteur) => acteur.id === selectedId) ?? myShops[0] ?? null)
    : (myShops[0] ?? null);

  const load = () => {
    setLoading(true);
    Promise.all([api.getActeurs(), api.getUsers(), api.getPosts()])
      .then(([acteursData, usersData, postsData]) => {
        setActeurs(acteursData);
        setUsers(usersData);
        setPosts(postsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, [currentUserId]);

  useEffect(() => {
    if (!selectedShop) return;
    const rule = getActeurFideliteRegle(selectedShop);
    setRuleMode(rule.mode);
    setRuleValue(String(rule.valeur));
    setAwardResult(null);
    setAwardError(null);
    setMontant('');
    api.getCommerceFideliteHistory(selectedShop.id).then(setHistory).catch(console.error);
  }, [selectedShop?.id]);

  useEffect(() => {
    if (selectedId && !myShops.some((shop) => shop.id === selectedId) && myShops[0]) {
      setSelectedId(myShops[0].id);
    }
    if (!selectedId && myShops[0]) setSelectedId(myShops[0].id);
  }, [myShops, selectedId]);

  const parsedValue = Number(ruleValue.replace(',', '.'));
  const liveRule = {
    mode: ruleMode,
    valeur: Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0,
  };
  const amountNumber = Number(montant.replace(',', '.'));
  const previewPoints = calculateAwardPoints(liveRule, amountNumber);
  const identifiedClient = findUserByClientToken(users, clientToken);
  const myPosts = useMemo(
    () =>
      posts
        .filter((post) => post.auteurId === currentUserId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [posts, currentUserId],
  );
  const offerFeatures = t('proSpace.offer.features', { returnObjects: true });
  const offerFeatureList = Array.isArray(offerFeatures) ? (offerFeatures as string[]) : [];

  const handleBoost = () => {
    setBoosting(true);
    window.setTimeout(() => {
      setBoosting(false);
      showToast(t('toast.boostRequested'));
    }, 500);
  };

  const handleSaveRule = async () => {
    if (!selectedShop) return;
    if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
      showToast(t('proSpace.rule.invalidValue'), 'error');
      return;
    }
    setSavingRule(true);
    try {
      const updated = await api.updateActeur(selectedShop.id, {
        regleFideliteMode: ruleMode,
        regleFideliteValeur: parsedValue,
      });
      setActeurs((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      showToast(t('toast.ruleSaved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSavingRule(false);
    }
  };

  const demoClient = users.find((user) => user.id !== currentUserId) ?? users[0];

  const simulateScan = async () => {
    if (!demoClient) return;
    setScanning(true);
    setAwardError(null);
    setAwardResult(null);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    setClientToken(demoClient.qrCodeClient || generateQrClientCode(demoClient.id));
    setScanning(false);
  };

  const handleCredit = async () => {
    if (!selectedShop) return;
    setCrediting(true);
    setAwardError(null);
    setAwardResult(null);
    try {
      const result = await api.awardFidelite({
        commerceId: selectedShop.id,
        clientToken,
        montant: ruleMode === FideliteRegleMode.ChiffreAffaires ? amountNumber : undefined,
      });
      setAwardResult(result);
      setMontant('');
      showToast(t('toast.pointsCredited', { points: result.pointsGagnes, name: result.clientNom }));
      const nextHistory = await api.getCommerceFideliteHistory(selectedShop.id);
      setHistory(nextHistory);
    } catch (err) {
      const message = err instanceof Error ? err.message : t('common.error');
      if (message === 'CLIENT_NOT_FOUND') setAwardError(t('proSpace.award.clientUnknown'));
      else if (message === 'INVALID_POINTS') setAwardError(t('proSpace.award.invalidAmount'));
      else setAwardError(message);
    } finally {
      setCrediting(false);
    }
  };

  const canCredit =
    Boolean(identifiedClient) &&
    !crediting &&
    !scanning &&
    (ruleMode !== FideliteRegleMode.ChiffreAffaires || (Number.isFinite(amountNumber) && amountNumber > 0));

  if (loading || !currentUser) return <Loading message={t('common.loading')} />;

  if (!canAccess) {
    const merchantDemo = demoUsers.find((user) => user.role === 'Commerçant');
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('proSpace.title')}</h2>
        <Card className="text-center !p-6">
          <p className="text-3xl mb-3" aria-hidden>🏪</p>
          <h3 className="text-lg font-bold text-chartrons-olive-dark">{t('proSpace.restrictedTitle')}</h3>
          <p className="text-sm text-chartrons-warm-gray mt-2 leading-relaxed">
            {t('proSpace.restrictedHint')}
          </p>
          {merchantDemo && (
            <Button
              className="w-full mt-4"
              onClick={() => {
                switchUser(merchantDemo.id);
                showToast(t('toast.userSwitched'), 'info');
              }}
            >
              {t('proSpace.demoSwitch', { name: merchantDemo.nom })}
            </Button>
          )}
          <Link
            to="/profile"
            className="mt-3 inline-flex items-center justify-center min-h-[44px] text-sm font-medium text-chartrons-bordeaux"
          >
            {t('proSpace.backProfile')}
          </Link>
        </Card>
      </div>
    );
  }

  if (myShops.length === 0) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('proSpace.title')}</h2>
        <EmptyState
          icon="🏪"
          title={t('proSpace.noShop')}
          message={t('proSpace.noShopHint')}
        />
        <Link
          to="/acteurs"
          className="block text-center text-sm font-semibold text-chartrons-bordeaux min-h-[44px] leading-[44px]"
        >
          {t('proSpace.createShop')}
        </Link>
      </div>
    );
  }

  const previewExample = calculateAwardPoints(liveRule.valeur > 0 ? liveRule : { mode: ruleMode, valeur: 1 }, 20);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-brass">
            {t('proSpace.badge')}
          </p>
          <h2 className="text-xl font-bold text-chartrons-bordeaux">
            {selectedShop
              ? t('proSpace.titleWithShop', { shop: selectedShop.nomCommerce })
              : t('proSpace.title')}
          </h2>
          <p className="text-xs text-chartrons-warm-gray mt-1">{t('proSpace.subtitle')}</p>
        </div>
        <PageHelp page="pro" />
      </div>

      <div className="rounded-2xl border border-chartrons-brass/35 bg-gradient-to-br from-chartrons-beige/80 to-white p-4 shadow-card">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chartrons-brass">
          {t('proSpace.offer.kicker')}
        </p>
        <p className="text-sm font-semibold text-chartrons-olive-dark mt-1 leading-snug">
          {t('proSpace.offer.banner')}
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="mt-3 w-full sm:w-auto"
          onClick={() => setOfferOpen(true)}
        >
          {t('proSpace.offer.learnMore')}
        </Button>
      </div>

      {showShopSelector && (
        <Select
          label={t('proSpace.shop')}
          value={selectedShop?.id ?? ''}
          onChange={(event) => setSelectedId(event.target.value)}
          options={myShops.map((shop) => ({ value: shop.id, label: shop.nomCommerce }))}
        />
      )}

      <Card>
        <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.rule.title')}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('proSpace.rule.subtitle')}</p>

        <div className="mt-4 space-y-2">
          {RULE_MODES.map((mode) => {
            const active = ruleMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setRuleMode(mode)}
                className={`w-full text-left p-3 rounded-xl border transition-colors ${
                  active
                    ? 'border-chartrons-green bg-chartrons-green/8'
                    : 'border-chartrons-beige hover:border-chartrons-green/40'
                }`}
              >
                <p className="text-sm font-semibold text-chartrons-olive-dark">
                  {t(`proSpace.rule.modes.${mode}.label`)}
                </p>
                <p className="text-xs text-chartrons-warm-gray mt-0.5">
                  {t(`proSpace.rule.modes.${mode}.hint`)}
                </p>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <Input
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            label={t(`proSpace.rule.valueLabel.${ruleMode}`)}
            value={ruleValue}
            onChange={(event) => setRuleValue(event.target.value)}
          />
          <p className="text-xs text-chartrons-olive-dark mt-2">
            {t(`proSpace.rule.preview.${ruleMode}`, { points: previewExample || '—' })}
          </p>
        </div>

        <Button className="w-full mt-4" disabled={savingRule} onClick={handleSaveRule}>
          {savingRule ? t('common.loading') : t('proSpace.rule.save')}
        </Button>
      </Card>

      <Card>
        <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.boost.title')}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{t('proSpace.boost.subtitle')}</p>
        {myPosts[0] ? (
          <p className="text-sm font-medium text-chartrons-olive-dark mt-3">
            {t('proSpace.boost.target', { title: myPosts[0].titre })}
          </p>
        ) : (
          <p className="text-sm text-chartrons-warm-gray mt-3">{t('proSpace.boost.noPost')}</p>
        )}
        <Button
          variant="gold"
          className="w-full mt-4"
          disabled={boosting || myPosts.length === 0}
          onClick={handleBoost}
        >
          {boosting ? t('common.loading') : t('proSpace.boost.cta')}
        </Button>
      </Card>

      <Card className="!p-0 overflow-hidden">
        <div className="bg-chartrons-gold/15 p-4 border-b border-chartrons-gold/20">
          <h3 className="font-bold text-chartrons-green-dark">{t('proSpace.award.title')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-1">{t('proSpace.award.subtitle')}</p>
        </div>

        <div className="p-4 space-y-4">
          <div
            className={`relative aspect-video rounded-2xl border-2 overflow-hidden transition-colors ${
              scanning
                ? 'border-chartrons-green bg-chartrons-green/5'
                : 'border-chartrons-gold/30 bg-chartrons-green-dark/5'
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center">
              {scanning ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto border-4 border-chartrons-green/20 border-t-chartrons-green rounded-full animate-spin mb-3" />
                  <p className="text-sm font-medium text-chartrons-green">{t('proSpace.award.scanning')}</p>
                </div>
              ) : (
                <div className="text-center p-4">
                  <span className="text-4xl block mb-2">📷</span>
                  <p className="text-sm text-chartrons-warm-gray">{t('proSpace.award.scanHint')}</p>
                </div>
              )}
            </div>
            {!scanning && (
              <>
                <div className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-chartrons-green rounded-tl-lg" />
                <div className="absolute top-3 right-3 w-8 h-8 border-t-2 border-r-2 border-chartrons-green rounded-tr-lg" />
                <div className="absolute bottom-3 left-3 w-8 h-8 border-b-2 border-l-2 border-chartrons-green rounded-bl-lg" />
                <div className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-chartrons-green rounded-br-lg" />
                <div className="absolute inset-x-8 top-1/2 h-0.5 bg-chartrons-green/40 animate-pulse" />
              </>
            )}
          </div>

          <Button variant="gold" className="w-full" disabled={scanning} onClick={simulateScan}>
            {scanning ? t('proSpace.award.scanning') : t('proSpace.award.scan')}
          </Button>

          <Input
            label={t('proSpace.award.clientId')}
            value={clientToken}
            onChange={(event) => {
              setClientToken(event.target.value);
              setAwardResult(null);
              setAwardError(null);
            }}
            placeholder={t('proSpace.award.clientPlaceholder')}
            autoComplete="off"
          />

          {identifiedClient ? (
            <div className="p-3 rounded-xl bg-chartrons-green/10 border border-chartrons-green/20">
              <p className="text-sm font-semibold text-chartrons-green-dark">{identifiedClient.nom}</p>
              <p className="text-xs text-chartrons-warm-gray">
                {t('proSpace.award.clientFound', { points: identifiedClient.pointsFidelite })}
              </p>
            </div>
          ) : clientToken.trim() ? (
            <p className="text-xs text-chartrons-brick">{t('proSpace.award.clientUnknown')}</p>
          ) : (
            <p className="text-xs text-chartrons-warm-gray">{t('proSpace.award.identifyFirst')}</p>
          )}

          {ruleMode === FideliteRegleMode.ChiffreAffaires ? (
            <Input
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              label={t('proSpace.award.amount')}
              value={montant}
              onChange={(event) => setMontant(event.target.value)}
              placeholder={t('proSpace.award.amountPlaceholder')}
            />
          ) : (
            <div className="p-3 rounded-xl bg-chartrons-beige/50 border border-chartrons-beige">
              <p className="text-sm text-chartrons-olive-dark">
                {t(
                  ruleMode === FideliteRegleMode.Visite
                    ? 'proSpace.award.visitHint'
                    : 'proSpace.award.forfaitHint',
                  { points: liveRule.valeur || 0 },
                )}
              </p>
            </div>
          )}

          {identifiedClient && previewPoints > 0 && (
            <p className="text-sm font-medium text-chartrons-olive-dark text-center">
              {t('proSpace.award.preview', { points: previewPoints, name: identifiedClient.nom })}
            </p>
          )}

          <Button className="w-full" variant="bordeaux" disabled={!canCredit} onClick={handleCredit}>
            {crediting ? t('common.loading') : t('proSpace.award.credit')}
          </Button>

          {awardResult && (
            <div className="p-3 rounded-xl bg-chartrons-green/10 border border-chartrons-green/20 text-center space-y-1">
              <Badge variant="green">+{awardResult.pointsGagnes} pts</Badge>
              <p className="text-sm font-medium text-chartrons-green-dark">
                {t('proSpace.award.success', {
                  points: awardResult.pointsGagnes,
                  name: awardResult.clientNom,
                })}
              </p>
              {awardResult.vipUnlocked && (
                <p className="text-xs text-chartrons-olive-dark">
                  🎉 {t('fidelite.vipUnlocked', { offer: awardResult.vipUnlocked })}
                </p>
              )}
            </div>
          )}

          {awardError && <p className="text-xs text-chartrons-brick text-center">{awardError}</p>}
        </div>
      </Card>

      <Card>
        <h4 className="text-sm font-semibold text-chartrons-green-dark mb-3">
          {t('proSpace.award.history')}
        </h4>
        {history.length === 0 ? (
          <p className="text-xs text-chartrons-warm-gray">{t('proSpace.award.noHistory')}</p>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto">
            {history.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-2 py-2 border-b border-chartrons-gold/10 last:border-0"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-chartrons-green-dark truncate">{entry.clientNom}</p>
                  <p className="text-[10px] text-chartrons-warm-gray">
                    {new Date(entry.date).toLocaleDateString(locale, {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <span className="text-sm font-bold text-chartrons-gold shrink-0">+{entry.pointsGagnes}</span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title={t('proSpace.offer.modalTitle')}>
        <div className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('proSpace.offer.modalIntro')}</p>
          <ul className="space-y-2">
            {offerFeatureList.map((feature) => (
              <li
                key={feature}
                className="flex gap-2 text-sm text-chartrons-olive-dark rounded-xl bg-chartrons-beige/50 border border-chartrons-beige px-3 py-2"
              >
                <span aria-hidden>✦</span>
                <span>{feature}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm font-semibold text-chartrons-bordeaux bg-chartrons-beige/70 rounded-xl px-3 py-2">
            {t('proSpace.offer.price')}
          </p>
          <Button variant="bordeaux" className="w-full" onClick={() => setOfferOpen(false)}>
            {t('proSpace.offer.close')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
