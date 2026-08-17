import { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card } from '../components/ui';
import { PageHelp } from '../components/PageHelp';
import { DirectionsButton } from '../components/DirectionsButton';
import { CallButton } from '../components/CallButton';
import { CivicReporting } from '../components/CivicReporting';
import { EmergencySafety } from '../components/EmergencySafety';
import { PhoneLink } from '../components/PhoneLink';
import {
  BULKY_WASTE,
  COMPOSTERS,
  COVERED_PARKINGS,
  EMERGENCY_ARTISANS,
  EMERGENCY_NUMBERS,
  HEALTH_PLACES,
  PARKING_RULES,
  PAWS_PLACES,
  PAYBYPHONE_URL,
  WASTE_SCHEDULE,
  WELCOME_KIT_SECTIONS,
  WORK_CAFES,
  downloadWelcomeKit,
} from '../data/pratique';
import { loc } from '../lib/locale';
import { toTelHref } from '../lib/phone';

function Section({
  id,
  index,
  title,
  hint,
  children,
}: {
  id: string;
  index: number;
  title: string;
  hint: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="space-y-3">
      <div>
        <p className="text-[11px] font-bold uppercase tracking-wider text-chartrons-brass">
          {index < 10 ? `0${index}` : index}
        </p>
        <h3 className="text-lg font-bold text-chartrons-bordeaux">{title}</h3>
        <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{hint}</p>
      </div>
      {children}
    </section>
  );
}

export function PratiquePage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('pratique.title')}</h2>
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('pratique.subtitle')}</p>
        </div>
        <PageHelp page="pratique" />
      </div>

      <Section id="kit" index={1} title={t('pratique.kit.title')} hint={t('pratique.kit.hint')}>
        <Card className="!p-4 space-y-3">
          {WELCOME_KIT_SECTIONS.map((section) => (
            <div key={section.title.fr}>
              <p className="text-sm font-semibold text-chartrons-olive-dark">{loc(lang, section.title)}</p>
              <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{loc(lang, section.body)}</p>
            </div>
          ))}
          <Button type="button" variant="bordeaux" className="w-full" onClick={() => downloadWelcomeKit(lang)}>
            {t('pratique.kit.download')}
          </Button>
        </Card>
      </Section>

      <Section id="tri" index={2} title={t('pratique.waste.title')} hint={t('pratique.waste.hint')}>
        {WASTE_SCHEDULE.map((item) => (
          <Card key={item.id} className="!p-4">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, item.title)}</p>
            <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{loc(lang, item.hint)}</p>
          </Card>
        ))}
        <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
          {t('pratique.waste.compost')}
        </p>
        {COMPOSTERS.map((place) => (
          <Card key={place.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
            <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
            {place.adresse && <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>}
            {place.latitude != null && place.longitude != null && (
              <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
            )}
          </Card>
        ))}
        <Card className="!p-4 space-y-2">
          <p className="font-semibold text-chartrons-olive-dark">{t('pratique.waste.bulkySteps')}</p>
          <p className="text-sm text-chartrons-warm-gray leading-relaxed">{loc(lang, BULKY_WASTE.hint)}</p>
          <PhoneLink phone={BULKY_WASTE.phone} />
          <a
            href={BULKY_WASTE.href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-xl bg-white text-chartrons-olive-dark border border-chartrons-beige text-sm font-medium shadow-sm hover:bg-chartrons-stone"
          >
            {t('pratique.waste.bulkyCta')}
          </a>
        </Card>
      </Section>

      <Section id="parking" index={3} title={t('pratique.parking.title')} hint={t('pratique.parking.hint')}>
        {PARKING_RULES.map((rule) => (
          <Card key={rule.title.fr} className="!p-4">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, rule.title)}</p>
            <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{loc(lang, rule.hint)}</p>
          </Card>
        ))}
        <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
          {t('pratique.parking.covered')}
        </p>
        {COVERED_PARKINGS.map((place) => (
          <Card key={place.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
            <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
            {place.adresse && <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>}
            {place.latitude != null && place.longitude != null && (
              <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
            )}
          </Card>
        ))}
        <a
          href={PAYBYPHONE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center gap-2 w-full min-h-[44px] px-4 py-3 rounded-xl bg-chartrons-green text-white text-sm font-semibold shadow-sm hover:bg-chartrons-green-light"
        >
          {t('pratique.parking.payCta')}
        </a>
      </Section>

      <Section id="quotidien" index={4} title={t('pratique.daily.title')} hint={t('pratique.daily.hint')}>
        <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
          {t('pratique.daily.wifi')}
        </p>
        {WORK_CAFES.map((place) => (
          <Card key={place.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
            <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
            {place.adresse && <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>}
            {place.latitude != null && place.longitude != null && (
              <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
            )}
          </Card>
        ))}
        <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
          {t('pratique.daily.paws')}
        </p>
        {PAWS_PLACES.map((place) => (
          <Card key={place.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
            <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
            {place.adresse && <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>}
            <PhoneLink phone={place.phone} />
            {place.latitude != null && place.longitude != null && (
              <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
            )}
          </Card>
        ))}
      </Section>

      <Section id="sante" index={5} title={t('pratique.health.title')} hint={t('pratique.health.hint')}>
        <p className="text-xs font-bold uppercase tracking-wide text-chartrons-warm-gray">
          {t('pratique.health.numbers')}
        </p>
        <div className="flex flex-wrap gap-2">
          {EMERGENCY_NUMBERS.map((item) => (
            <a key={item.phone} href={toTelHref(item.phone)}>
              <Badge variant="bordeaux" icon="📞">
                {loc(lang, item.label)} {item.phone}
              </Badge>
            </a>
          ))}
        </div>
        {HEALTH_PLACES.map((place) => (
          <Card key={place.id} className="!p-4 space-y-2">
            <p className="font-semibold text-chartrons-olive-dark">{loc(lang, place.title)}</p>
            <p className="text-sm text-chartrons-warm-gray">{loc(lang, place.hint)}</p>
            {place.adresse && <p className="text-xs text-chartrons-warm-gray">📍 {place.adresse}</p>}
            <PhoneLink phone={place.phone} />
            <div className="flex flex-wrap gap-2">
              {place.latitude != null && place.longitude != null && (
                <DirectionsButton latitude={place.latitude} longitude={place.longitude} />
              )}
              {place.href && (
                <a
                  href={place.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center min-h-[36px] px-3 py-2 rounded-xl bg-white text-chartrons-olive-dark border border-chartrons-beige text-xs font-medium shadow-sm hover:bg-chartrons-stone"
                >
                  {t('pratique.health.open')}
                </a>
              )}
            </div>
          </Card>
        ))}
      </Section>

      <Section id="artisans" index={6} title={t('pratique.artisans.title')} hint={t('pratique.artisans.hint')}>
        {EMERGENCY_ARTISANS.map((artisan) => (
          <Card key={artisan.id} className="!p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-chartrons-olive-dark">{loc(lang, artisan.name)}</p>
                <p className="text-sm text-chartrons-warm-gray mt-1">{loc(lang, artisan.hint)}</p>
                <p className="text-xs text-chartrons-warm-gray mt-2">📍 {artisan.adresse}</p>
              </div>
              <Badge variant="brick">{loc(lang, artisan.trade)}</Badge>
            </div>
            <CallButton phone={artisan.phone} className="w-full" />
          </Card>
        ))}
      </Section>

      <Section id="signalements" index={7} title={t('pratique.civic.title')} hint={t('pratique.civic.hint')}>
        <CivicReporting />
      </Section>

      <Section id="urgences" index={8} title={t('pratique.safety.title')} hint={t('pratique.safety.hint')}>
        <EmergencySafety />
      </Section>
    </div>
  );
}
