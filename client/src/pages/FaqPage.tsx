import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ContactForm } from '../components/ContactForm';
import { Button } from '../components/ui';
import { FAQ_AUDIENCES, FAQ_PAGE, type FaqAudienceId } from '../data/faqData';
import { loc } from '../lib/locale';
import { FaqComparisonTable } from '../components/FaqComparisonTable';

export function FaqPage() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [tab, setTab] = useState<FaqAudienceId>('habitants');
  const [openId, setOpenId] = useState<string>(FAQ_AUDIENCES[0].items[0].id);
  const [contactOpen, setContactOpen] = useState(false);

  const audience = useMemo(
    () => FAQ_AUDIENCES.find((section) => section.id === tab) ?? FAQ_AUDIENCES[0],
    [tab],
  );

  const handleTab = (next: FaqAudienceId) => {
    setTab(next);
    const nextAudience = FAQ_AUDIENCES.find((section) => section.id === next);
    setOpenId(nextAudience?.items[0]?.id ?? '');
  };

  const isMerchantTab = audience.id === 'commercants';
  const isServicesTab = audience.id === 'services';
  const panelAccent = isMerchantTab
    ? 'border-chartrons-brass/40 bg-gradient-to-br from-chartrons-brass/12 to-white'
    : isServicesTab
      ? 'border-chartrons-brick/30 bg-gradient-to-br from-chartrons-brick/10 to-white'
      : 'border-chartrons-green/20 bg-gradient-to-br from-chartrons-green/8 to-white';
  const ctaAccent = isMerchantTab
    ? 'bg-chartrons-brass text-chartrons-green-dark hover:bg-chartrons-gold'
    : isServicesTab
      ? 'bg-chartrons-brick text-white hover:bg-chartrons-brick-light'
      : 'bg-chartrons-green text-white hover:bg-chartrons-green-light';

  return (
    <div className="animate-fade-in space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-brass mb-2">
          {loc(lang, FAQ_PAGE.kicker)}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-chartrons-green-dark leading-tight">
          {loc(lang, FAQ_PAGE.title)}
        </h1>
        <p className="text-sm text-chartrons-warm-gray mt-2 leading-relaxed">
          {loc(lang, FAQ_PAGE.subtitle)}
        </p>
      </header>

      <FaqComparisonTable />

      <div
        className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-1 rounded-2xl bg-chartrons-beige/60 border border-chartrons-beige"
        role="tablist"
        aria-label={loc(lang, FAQ_PAGE.title)}
      >
        {FAQ_AUDIENCES.map((section) => {
          const active = tab === section.id;
          return (
            <button
              key={section.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTab(section.id)}
              className={`flex items-center justify-center gap-2 min-h-[52px] px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                active
                  ? section.id === 'commercants'
                    ? 'bg-chartrons-green text-white shadow-card'
                    : section.id === 'services'
                      ? 'bg-chartrons-brick text-white shadow-card'
                      : 'bg-chartrons-green-dark text-white shadow-card'
                  : 'bg-transparent text-chartrons-olive-dark hover:bg-white/80'
              }`}
            >
              <span aria-hidden>{section.icon}</span>
              {loc(lang, section.label)}
            </button>
          );
        })}
      </div>

      <section
        className={`rounded-2xl border p-4 sm:p-5 ${panelAccent}`}
        role="tabpanel"
        aria-labelledby={`faq-audience-${audience.id}`}
      >
        <p
          id={`faq-audience-${audience.id}`}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-green"
        >
          <span aria-hidden className="mr-1.5">
            {audience.icon}
          </span>
          {loc(lang, audience.kicker)}
        </p>
        <p className="text-sm text-chartrons-olive-dark mt-2 leading-relaxed">
          {loc(lang, audience.intro)}
        </p>
      </section>

      <div className="space-y-2">
        {audience.items.map((item) => {
          const open = openId === item.id;
          const panelId = `faq-panel-${item.id}`;
          const buttonId = `faq-button-${item.id}`;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border bg-white/95 shadow-card overflow-hidden transition-colors ${
                open ? 'border-chartrons-green/35' : 'border-chartrons-beige'
              }`}
            >
              <button
                id={buttonId}
                type="button"
                onClick={() => setOpenId(open ? '' : item.id)}
                className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[52px] text-left"
                aria-expanded={open}
                aria-controls={panelId}
              >
                <span className="flex-1 text-sm font-semibold text-chartrons-olive-dark leading-snug">
                  {loc(lang, item.q)}
                </span>
                <span
                  className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-lg font-bold transition-colors ${
                    open
                      ? 'bg-chartrons-green text-white'
                      : 'bg-chartrons-beige text-chartrons-green'
                  }`}
                  aria-hidden
                >
                  {open ? '−' : '+'}
                </span>
              </button>
              <div
                id={panelId}
                role="region"
                aria-labelledby={buttonId}
                className={`grid transition-[grid-template-rows] duration-200 ease-out ${
                  open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                }`}
              >
                <div className="overflow-hidden">
                  <p className="px-4 pb-4 text-sm text-chartrons-warm-gray leading-relaxed">
                    {loc(lang, item.a)}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Link
        to={audience.cta.to}
        className={`flex items-center justify-center min-h-[52px] px-4 rounded-2xl text-sm font-semibold shadow-card transition-colors ${ctaAccent}`}
      >
        {loc(lang, audience.cta.label)}
      </Link>

      <div className="rounded-2xl bg-gradient-to-br from-chartrons-green to-chartrons-green-dark p-4 sm:p-5 text-white">
        <p className="font-semibold">{t('faq.stillStuck')}</p>
        <p className="text-sm text-white/80 mt-1 leading-relaxed">{t('faq.stillStuckHint')}</p>
        <Button
          variant="gold"
          className="w-full sm:w-auto mt-4"
          onClick={() => setContactOpen(true)}
        >
          {t('contact.association')}
        </Button>
      </div>

      <ContactForm open={contactOpen} onClose={() => setContactOpen(false)} context={t('faq.title')} />
    </div>
  );
}
