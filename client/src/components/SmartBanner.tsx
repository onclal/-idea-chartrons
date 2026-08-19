import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConfort } from '../context/ConfortContext';
import {
  SMART_BANNER_ROTATION_MS,
  SMART_BANNERS_EVENT,
  bannerIcon,
  bannersForDisplay,
  dismissSmartBannerStrip,
  isAlertBanner,
  resolveBannerCta,
  resolveBannerTitle,
  type SmartBanner,
} from '../lib/smartBanners';

function isExternalUrl(url: string): boolean {
  return /^(https?:|mailto:|tel:)/i.test(url);
}

function BannerMessage({
  banner,
  lang,
  phase,
}: {
  banner: SmartBanner;
  lang: string;
  phase: 'in' | 'out';
}) {
  const title = resolveBannerTitle(banner, lang);
  const cta = resolveBannerCta(banner, lang);
  const icon = bannerIcon(banner.iconName);
  const className = `min-w-0 flex-1 flex items-center gap-2 h-full transition-[opacity,transform] duration-300 ease-out ${
    phase === 'out' ? '-translate-x-5 opacity-0' : 'translate-x-0 opacity-100'
  }`;

  const inner = (
    <>
      <span
        className="shrink-0 w-5 h-5 rounded-md bg-white/80 flex items-center justify-center text-[11px] leading-none shadow-sm"
        aria-hidden
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold tracking-tight">{title}</span>
      {cta ? (
        <span className="shrink-0 text-[11px] font-bold uppercase tracking-wide opacity-80 underline underline-offset-2">
          {cta}
        </span>
      ) : null}
    </>
  );

  if (isExternalUrl(banner.ctaUrl)) {
    return (
      <a href={banner.ctaUrl} className={className}>
        {inner}
      </a>
    );
  }

  return (
    <Link to={banner.ctaUrl || '/'} className={className}>
      {inner}
    </Link>
  );
}

export function SmartBanner() {
  const { t, i18n } = useTranslation();
  const { isConfortMode } = useConfort();
  const [pack, setPack] = useState(() => bannersForDisplay());
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<'in' | 'out'>('in');
  const fadeTimer = useRef<number | null>(null);

  useEffect(() => {
    const refresh = () => {
      setPack(bannersForDisplay());
      setIndex(0);
      setPhase('in');
    };
    window.addEventListener(SMART_BANNERS_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener(SMART_BANNERS_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, []);

  const visible = pack.banners.filter((banner) => (isConfortMode ? isAlertBanner(banner) : true));
  const current = visible.length > 0 ? visible[index % visible.length] : undefined;

  useEffect(() => {
    if (visible.length <= 1) return undefined;
    const timer = window.setInterval(() => {
      setPhase('out');
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
      fadeTimer.current = window.setTimeout(() => {
        setIndex((prev) => (prev + 1) % visible.length);
        setPhase('in');
      }, 280);
    }, SMART_BANNER_ROTATION_MS);
    return () => {
      window.clearInterval(timer);
      if (fadeTimer.current) window.clearTimeout(fadeTimer.current);
    };
  }, [visible.length]);

  if (!current) return null;

  const emergency = pack.emergency || isAlertBanner(current);

  return (
    <div
      role={emergency ? 'alert' : 'status'}
      className={`h-9 max-h-9 overflow-hidden border-t ${
        emergency
          ? 'bg-amber-50 text-chartrons-olive-dark border-chartrons-brass/40'
          : 'bg-chartrons-sand/95 text-chartrons-olive-dark border-white/10'
      }`}
    >
      <div className="max-w-lg mx-auto h-9 px-2 pl-3 flex items-center gap-1">
        <BannerMessage banner={current} lang={i18n.language} phase={phase} />
        <button
          type="button"
          onClick={dismissSmartBannerStrip}
          className="shrink-0 w-9 h-9 flex items-center justify-center text-chartrons-warm-gray hover:text-chartrons-olive-dark"
          aria-label={t('smartBanner.dismissAria')}
        >
          <span aria-hidden className="text-sm leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}
