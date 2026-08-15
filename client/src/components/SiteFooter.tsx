import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export function SiteFooter() {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const showFaqCta = pathname !== '/faq';

  return (
    <footer className="mt-10 pt-6 pb-3 border-t border-chartrons-beige space-y-4">
      {showFaqCta && (
        <Link
          to="/faq"
          className="flex items-center justify-between gap-3 min-h-[52px] px-4 py-3 rounded-2xl bg-chartrons-bordeaux text-white shadow-card"
        >
          <span className="text-sm font-semibold">{t('footer.faqCta')}</span>
          <span aria-hidden className="text-lg">→</span>
        </Link>
      )}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 text-center">
        <p className="text-[11px] text-chartrons-warm-gray leading-relaxed">
          {t('footer.copyright')}
        </p>
        <span className="hidden sm:inline text-chartrons-sand" aria-hidden>
          ·
        </span>
        <div className="flex items-center justify-center gap-1">
          <Link
            to="/faq"
            className="inline-flex items-center justify-center min-h-[44px] px-3 text-xs font-semibold text-chartrons-bordeaux hover:underline"
          >
            {t('footer.faq')}
          </Link>
          <span className="text-chartrons-sand" aria-hidden>
            ·
          </span>
          <Link
            to="/cgv"
            className="inline-flex items-center justify-center min-h-[44px] px-3 text-xs font-semibold text-chartrons-bordeaux hover:underline"
          >
            {t('footer.cgv')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
