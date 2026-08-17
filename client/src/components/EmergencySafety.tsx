import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from './ui';
import { DirectionsButton } from './DirectionsButton';
import {
  downloadSafetySheet,
  EMERGENCY_BAR,
  EVACUATION_STEPS,
  GATHERING_POINTS,
  PCS_NOTICE,
  RISK_ALERTS,
} from '../data/securite';
import { loc } from '../lib/locale';
import { toTelHref } from '../lib/phone';

export function EmergencySafety() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const vitalContacts = EMERGENCY_BAR.filter((contact) => contact.priority === 'vital');
  const localContacts = EMERGENCY_BAR.filter((contact) => contact.priority === 'local');

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-chartrons-brick/30 bg-gradient-to-br from-chartrons-brick/10 to-white p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-chartrons-brick">
            {t('safety.bar.kicker')}
          </p>
          <Badge variant="brick" icon="⚡">
            {t('safety.bar.oneTap')}
          </Badge>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {vitalContacts.map((contact) => (
            <a
              key={contact.id}
              href={toTelHref(contact.number)}
              className="flex flex-col items-center justify-center gap-1 min-h-[72px] px-2 py-3 rounded-xl bg-white border border-chartrons-beige shadow-sm hover:bg-chartrons-stone active:scale-[0.97] transition-all"
            >
              <span aria-hidden className="text-xl">
                {contact.icon}
              </span>
              <span className="text-lg font-bold text-chartrons-bordeaux leading-none">{contact.number}</span>
              <span className="text-[10px] font-semibold text-chartrons-warm-gray text-center leading-tight">
                {loc(lang, contact.label)}
              </span>
            </a>
          ))}
        </div>
        <div className="space-y-2">
          {localContacts.map((contact) => (
            <a
              key={contact.id}
              href={toTelHref(contact.number)}
              className="flex items-center gap-3 min-h-[52px] px-3 py-2 rounded-xl bg-white border border-chartrons-beige shadow-sm hover:bg-chartrons-stone"
            >
              <span aria-hidden className="text-lg">
                {contact.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-chartrons-olive-dark leading-snug">
                  {loc(lang, contact.label)}
                </span>
                <span className="block text-xs text-chartrons-warm-gray leading-snug">
                  {loc(lang, contact.hint)}
                </span>
              </span>
              <span className="shrink-0 text-sm font-bold text-chartrons-bordeaux">{contact.number}</span>
            </a>
          ))}
        </div>
        <p className="text-xs text-chartrons-warm-gray leading-relaxed">{t('safety.bar.hint')}</p>
      </div>

      <div className="space-y-3">
        <h4 className="text-base font-bold text-chartrons-bordeaux">{t('safety.risks.title')}</h4>
        {RISK_ALERTS.map((alert) => (
          <Card key={alert.id} className="!p-4 space-y-2">
            <div className="flex items-start gap-3">
              <span aria-hidden className="text-xl">
                {alert.icon}
              </span>
              <p className="font-semibold text-chartrons-olive-dark leading-snug">{loc(lang, alert.title)}</p>
            </div>
            <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, alert.body)}</p>
            {alert.href && alert.hrefLabel && (
              <a
                href={alert.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center min-h-[40px] px-3 rounded-xl bg-white border border-chartrons-beige text-xs font-semibold text-chartrons-olive-dark hover:bg-chartrons-stone"
              >
                {loc(lang, alert.hrefLabel)} →
              </a>
            )}
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h4 className="text-base font-bold text-chartrons-bordeaux">{t('safety.evacuation.title')}</h4>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('safety.evacuation.hint')}</p>
        <ol className="space-y-2">
          {EVACUATION_STEPS.map((step) => (
            <li key={step.id} className="rounded-2xl bg-white border border-chartrons-beige shadow-card p-4">
              <p className="font-semibold text-chartrons-olive-dark leading-snug">{loc(lang, step.title)}</p>
              <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{loc(lang, step.body)}</p>
            </li>
          ))}
        </ol>
      </div>

      <div className="space-y-3">
        <h4 className="text-base font-bold text-chartrons-bordeaux">{t('safety.gathering.title')}</h4>
        {GATHERING_POINTS.map((point) => (
          <Card key={point.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, point.name)}</p>
            <p className="text-xs text-chartrons-warm-gray">📍 {point.adresse}</p>
            <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, point.hint)}</p>
            <DirectionsButton latitude={point.latitude} longitude={point.longitude} />
          </Card>
        ))}
      </div>

      <Card className="!p-4 space-y-3 bg-gradient-to-br from-chartrons-beige/70 to-white">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">
          <span aria-hidden className="mr-1">
            📋
          </span>
          {loc(lang, PCS_NOTICE)}
        </p>
        <Button type="button" variant="bordeaux" className="w-full" onClick={() => downloadSafetySheet(lang)}>
          {t('safety.download')}
        </Button>
      </Card>
    </section>
  );
}
