import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  buildConciergeSystemPrompt,
  CONCIERGE_MAX_RESULTS,
  CHARTRONS_SUBCATEGORIES,
  CHARTRONS_SUBCATEGORY_ICONS,
  CHARTRONS_SUBCATEGORY_LABELS,
  CIVIC_SUBCATEGORIES,
  REPORT_SUBCATEGORY_LABELS,
  SAFETY_SUBCATEGORIES,
} from '@idea-chartrons/shared';
import { AdminPageHeader } from './AdminPageHeader';
import { Badge, Button, Card, Select, Textarea } from '../ui';
import { useToast } from '../../context/ToastContext';
import { formatDateTime } from '../../lib/format';
import { loc } from '../../lib/locale';
import {
  DEFAULT_CONCIERGE_SETTINGS,
  loadConciergeSettings,
  loadConciergeUsage,
  resetConciergeUsage,
  saveConciergeSettings,
  type ConciergeSettings,
  type ConciergeUsage,
} from '../../lib/conciergeSettings';

/**
 * Réglages du concierge IA : consignes système, garde-fous et métriques d'usage.
 * Le prompt de base est en lecture seule ; l'admin ajoute des consignes par-dessus.
 */
export function AdminConciergeSettings() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [settings, setSettings] = useState<ConciergeSettings>(DEFAULT_CONCIERGE_SETTINGS);
  const [usage, setUsage] = useState<ConciergeUsage>(loadConciergeUsage);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    setSettings(loadConciergeSettings());
  }, []);

  const handleSave = () => {
    setSettings(saveConciergeSettings(settings));
    showToast(t('adminSpace.ai.saved'));
  };

  const handleResetUsage = () => {
    setUsage(resetConciergeUsage());
    showToast(t('adminSpace.ai.usageReset'));
  };

  const usageCards = [
    { key: 'questions', value: usage.questions },
    { key: 'openai', value: usage.openaiReplies },
    { key: 'local', value: usage.localReplies },
    { key: 'offTopic', value: usage.offTopic },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader title={t('adminSpace.ai.title')} subtitle={t('adminSpace.ai.subtitle')} />

      <section className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {usageCards.map((card) => (
          <Card key={card.key} className="text-center !p-4">
            <p className="text-2xl font-bold text-chartrons-bordeaux">{card.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
              {t(`adminSpace.ai.usage.${card.key}`)}
            </p>
          </Card>
        ))}
      </section>

      <Card className="!p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.ai.usageTitle')}</h3>
            <p className="text-xs text-chartrons-warm-gray mt-1">
              {usage.lastAskedAt
                ? t('adminSpace.ai.lastAsked', {
                    date: formatDateTime(usage.lastAskedAt, i18n.language),
                  })
                : t('adminSpace.ai.neverAsked')}
            </p>
          </div>
          <Button type="button" variant="secondary" size="sm" onClick={handleResetUsage}>
            {t('adminSpace.ai.resetUsage')}
          </Button>
        </div>
        <p className="text-xs text-chartrons-warm-gray leading-relaxed">
          {t('adminSpace.ai.usageHint')}
        </p>
      </Card>

      <Card className="!p-4 space-y-4">
        <div>
          <h3 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.ai.rulesTitle')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">
            {t('adminSpace.ai.rulesHint')}
          </p>
        </div>

        <Textarea
          label={t('adminSpace.ai.extraInstructions')}
          value={settings.extraInstructions}
          rows={5}
          maxLength={1200}
          placeholder={t('adminSpace.ai.extraPlaceholder')}
          onChange={(event) =>
            setSettings((current) => ({ ...current, extraInstructions: event.target.value }))
          }
        />

        <label className="flex items-start gap-3 p-3 rounded-xl bg-chartrons-beige/50 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.blockOffTopic}
            onChange={(event) =>
              setSettings((current) => ({ ...current, blockOffTopic: event.target.checked }))
            }
            className="mt-1 w-4 h-4 accent-chartrons-bordeaux"
          />
          <span>
            <span className="block text-sm font-medium text-chartrons-olive-dark">
              {t('adminSpace.ai.blockOffTopic')}
            </span>
            <span className="block text-xs text-chartrons-warm-gray mt-0.5">
              {t('adminSpace.ai.blockOffTopicHint')}
            </span>
          </span>
        </label>

        <label className="flex items-start gap-3 p-3 rounded-xl bg-chartrons-beige/50 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emergencyNumbers}
            onChange={(event) =>
              setSettings((current) => ({ ...current, emergencyNumbers: event.target.checked }))
            }
            className="mt-1 w-4 h-4 accent-chartrons-bordeaux"
          />
          <span>
            <span className="block text-sm font-medium text-chartrons-olive-dark">
              {t('adminSpace.ai.emergencyNumbers')}
            </span>
            <span className="block text-xs text-chartrons-warm-gray mt-0.5">
              {t('adminSpace.ai.emergencyNumbersHint')}
            </span>
          </span>
        </label>

        <Select
          label={t('adminSpace.ai.maxResults')}
          value={String(settings.maxResults)}
          onChange={(event) =>
            setSettings((current) => ({ ...current, maxResults: Number(event.target.value) }))
          }
          options={Array.from({ length: CONCIERGE_MAX_RESULTS }, (_, index) => ({
            value: String(index + 1),
            label: String(index + 1),
          }))}
        />

        <Button type="button" variant="bordeaux" className="w-full sm:w-auto" onClick={handleSave}>
          {t('adminSpace.ai.save')}
        </Button>
      </Card>

      <Card className="!p-4 space-y-3">
        <div>
          <h3 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.ai.taxonomyTitle')}</h3>
          <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">
            {t('adminSpace.ai.taxonomyHint')}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {CHARTRONS_SUBCATEGORIES.map((subcategory) => (
            <Badge key={subcategory} variant="olive" icon={CHARTRONS_SUBCATEGORY_ICONS[subcategory]}>
              {loc(i18n.language, CHARTRONS_SUBCATEGORY_LABELS[subcategory])}
            </Badge>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          {CIVIC_SUBCATEGORIES.map((id) => (
            <Badge key={id} variant="green">
              {loc(i18n.language, REPORT_SUBCATEGORY_LABELS[id])}
            </Badge>
          ))}
          {SAFETY_SUBCATEGORIES.map((id) => (
            <Badge key={id} variant="brick">
              {loc(i18n.language, REPORT_SUBCATEGORY_LABELS[id])}
            </Badge>
          ))}
        </div>
      </Card>

      <Card className="!p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold text-chartrons-bordeaux">{t('adminSpace.ai.promptTitle')}</h3>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setShowPrompt((open) => !open)}
          >
            {showPrompt ? t('adminSpace.ai.hidePrompt') : t('adminSpace.ai.showPrompt')}
          </Button>
        </div>
        <p className="text-xs text-chartrons-warm-gray leading-relaxed">
          {t('adminSpace.ai.promptHint')}
        </p>
        {showPrompt && (
          <pre className="text-[11px] leading-relaxed text-chartrons-olive-dark whitespace-pre-wrap rounded-xl bg-chartrons-stone/70 border border-chartrons-beige p-3 max-h-72 overflow-y-auto">
            {buildConciergeSystemPrompt()}
          </pre>
        )}
      </Card>
    </div>
  );
}
