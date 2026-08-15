import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ContactForm } from '../components/ContactForm';
import { Button } from '../components/ui';

const FAQ_TABS = ['relais', 'posts', 'association', 'technique'] as const;
type FaqTab = (typeof FAQ_TABS)[number];

interface FaqItem {
  q: string;
  a: string;
}

export function FaqPage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<FaqTab>('relais');
  const [openIndex, setOpenIndex] = useState(0);
  const [contactOpen, setContactOpen] = useState(false);

  const items = useMemo(() => {
    const raw = t(`faq.sections.${tab}.items`, { returnObjects: true });
    return Array.isArray(raw) ? (raw as FaqItem[]) : [];
  }, [t, tab]);

  const handleTab = (next: FaqTab) => {
    setTab(next);
    setOpenIndex(0);
  };

  return (
    <div className="animate-fade-in space-y-5">
      <header>
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-brass mb-2">
          {t('faq.kicker')}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-chartrons-bordeaux leading-tight">
          {t('faq.title')}
        </h1>
        <p className="text-sm text-chartrons-warm-gray mt-2 leading-relaxed">{t('faq.subtitle')}</p>
      </header>

      <div
        className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1"
        role="tablist"
        aria-label={t('faq.title')}
      >
        {FAQ_TABS.map((key) => {
          const active = tab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => handleTab(key)}
              className={`shrink-0 touch-target px-3.5 py-2.5 rounded-full text-xs font-semibold border transition-all ${
                active
                  ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux shadow-sm'
                  : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
              }`}
            >
              {t(`faq.sections.${key}.label`)}
            </button>
          );
        })}
      </div>

      <div className="space-y-2" role="tabpanel">
        {items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div
              key={item.q}
              className="rounded-2xl border border-chartrons-beige bg-white/90 shadow-card overflow-hidden"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(open ? -1 : index)}
                className="w-full flex items-center gap-3 px-4 py-3.5 min-h-[52px] text-left"
                aria-expanded={open}
              >
                <span className="flex-1 text-sm font-semibold text-chartrons-olive-dark leading-snug">
                  {item.q}
                </span>
                <span
                  className="shrink-0 w-8 h-8 rounded-full bg-chartrons-beige text-chartrons-bordeaux flex items-center justify-center text-lg font-bold"
                  aria-hidden
                >
                  {open ? '−' : '+'}
                </span>
              </button>
              {open && (
                <div className="px-4 pb-4 pt-0">
                  <p className="text-sm text-chartrons-warm-gray leading-relaxed">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl bg-gradient-to-br from-chartrons-bordeaux to-chartrons-olive-dark p-4 sm:p-5 text-white">
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
