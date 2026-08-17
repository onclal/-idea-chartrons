import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Input, Textarea } from './ui';
import { useToast } from '../context/ToastContext';
import { buildCivicReportText, CIVIC_CHANNELS, CIVIC_REPORT_CATEGORIES } from '../data/civic';
import { loc } from '../lib/locale';
import { toTelHref } from '../lib/phone';

export function CivicReporting() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { showToast } = useToast();
  const [categoryId, setCategoryId] = useState(CIVIC_REPORT_CATEGORIES[0].id);
  const [place, setPlace] = useState('');
  const [details, setDetails] = useState('');

  const category = useMemo(
    () => CIVIC_REPORT_CATEGORIES.find((item) => item.id === categoryId) ?? CIVIC_REPORT_CATEGORIES[0],
    [categoryId],
  );
  const channel = useMemo(
    () => CIVIC_CHANNELS.find((item) => item.id === category.channel) ?? CIVIC_CHANNELS[0],
    [category.channel],
  );

  const reportText = buildCivicReportText(category, lang, place, details);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      showToast(t('civic.copied'));
    } catch {
      showToast(t('civic.copyFailed'), 'error');
    }
  };

  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {CIVIC_CHANNELS.map((item) => (
          <Card
            key={item.id}
            className={`!p-4 space-y-3 ${
              item.id === 'police'
                ? 'bg-gradient-to-br from-chartrons-brick/10 to-white'
                : 'bg-gradient-to-br from-chartrons-green/8 to-white'
            }`}
          >
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-2xl">
                {item.icon}
              </span>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chartrons-brass">
                  {loc(lang, item.kicker)}
                </p>
                <p className="font-semibold text-chartrons-olive-dark leading-snug">
                  {loc(lang, item.title)}
                </p>
              </div>
            </div>
            <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, item.hint)}</p>
            <a
              href={toTelHref(item.phone)}
              className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 rounded-xl bg-chartrons-bordeaux text-white text-sm font-semibold shadow-sm hover:bg-chartrons-bordeaux-light"
            >
              📞 {loc(lang, item.phoneLabel)} — {item.phone}
            </a>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center w-full min-h-[44px] px-4 rounded-xl bg-white border border-chartrons-beige text-sm font-medium text-chartrons-olive-dark hover:bg-chartrons-stone"
            >
              {loc(lang, item.hrefLabel)}
            </a>
            <p className="text-xs text-chartrons-warm-gray leading-relaxed">
              <span aria-hidden className="mr-1">
                ⚠️
              </span>
              {loc(lang, item.note)}
            </p>
          </Card>
        ))}
      </div>

      <Card className="!p-4 space-y-4">
        <div>
          <h4 className="font-semibold text-chartrons-olive-dark">{t('civic.form.title')}</h4>
          <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{t('civic.form.hint')}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-chartrons-olive-dark">
            {t('civic.form.category')}
          </p>
          <div className="flex flex-wrap gap-2">
            {CIVIC_REPORT_CATEGORIES.map((item) => {
              const active = item.id === categoryId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setCategoryId(item.id)}
                  aria-pressed={active}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold border transition-colors ${
                    active
                      ? 'bg-chartrons-green text-white border-chartrons-green'
                      : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:bg-chartrons-stone'
                  }`}
                >
                  <span aria-hidden>{item.icon}</span>
                  {loc(lang, item.label)}
                </button>
              );
            })}
          </div>
          <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, category.hint)}</p>
          <Badge variant={category.channel === 'police' ? 'brick' : 'green'}>
            {t(`civic.routedTo.${category.channel}`)}
          </Badge>
        </div>

        <Input
          label={t('civic.form.place')}
          value={place}
          onChange={(event) => setPlace(event.target.value)}
          placeholder={t('civic.form.placePlaceholder')}
        />
        <Textarea
          label={t('civic.form.details')}
          value={details}
          onChange={(event) => setDetails(event.target.value)}
          rows={3}
          placeholder={t('civic.form.detailsPlaceholder')}
        />

        <div className="rounded-xl bg-chartrons-stone/70 border border-chartrons-beige p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mb-1">
            {t('civic.form.preview')}
          </p>
          <p className="text-xs text-chartrons-olive-dark whitespace-pre-wrap leading-relaxed">{reportText}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="bordeaux" className="flex-1 min-w-[150px]" onClick={handleCopy}>
            {t('civic.form.copy')}
          </Button>
          <a
            href={toTelHref(channel.phone)}
            className="flex-1 min-w-[150px] inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-white border border-chartrons-beige text-sm font-semibold text-chartrons-olive-dark hover:bg-chartrons-stone"
          >
            📞 {t('civic.form.call', { phone: channel.phone })}
          </a>
        </div>
      </Card>
    </section>
  );
}
