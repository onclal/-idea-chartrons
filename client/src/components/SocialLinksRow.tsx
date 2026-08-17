import { useTranslation } from 'react-i18next';
import { hasSocialLinks, type CommerceSocialLinks } from '@idea-chartrons/shared';

interface SocialLinksRowProps {
  links?: CommerceSocialLinks | null;
}

const ICONS = {
  instagram: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-2.2C12.3 3 11 4.5 11 6.8V8.5H9v2.5h2V21h3.2v-10h2.2l.6-2.5h-2.5z" />
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
      <path d="M12 3.2A8.7 8.7 0 0 0 4.8 16.3L3.5 20.5l4.3-1.3A8.7 8.7 0 1 0 12 3.2zm4.9 12.3c-.2.6-1.2 1.1-1.7 1.1-.4 0-.9.2-3-.8-2.5-1.2-4.1-3.6-4.2-3.8-.1-.2-1-1.3-1-2.5s.6-1.8.9-2c.2-.2.5-.3.7-.3h.5c.2 0 .4 0 .6.5.2.6.7 2 .8 2.1.1.2.1.3 0 .5-.1.2-.2.3-.3.5l-.4.5c-.1.1-.3.3-.1.6.2.3.8 1.3 1.7 2.1 1.2 1 2.2 1.3 2.5 1.5.3.1.5.1.7-.1l.9-1.2c.2-.2.4-.2.6-.1.2.1 1.6.8 1.9.9.3.1.5.2.6.3.1.2.1.8-.1 1.4z" />
    </svg>
  ),
  website: (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.4 2.6 3.6 5.5 3.6 8.5S14.4 17.9 12 20.5C9.6 17.9 8.4 15 8.4 12S9.6 6.1 12 3.5z" />
    </svg>
  ),
} as const;

export function SocialLinksRow({ links }: SocialLinksRowProps) {
  const { t } = useTranslation();
  if (!hasSocialLinks(links)) return null;

  const items = [
    { key: 'instagram' as const, href: links?.instagram, label: t('acteurs.social.instagram') },
    { key: 'facebook' as const, href: links?.facebook, label: t('acteurs.social.facebook') },
    { key: 'whatsapp' as const, href: links?.whatsapp, label: t('acteurs.social.whatsapp') },
    { key: 'website' as const, href: links?.website, label: t('acteurs.social.website') },
  ].filter((item) => item.href);

  return (
    <div className="flex flex-wrap gap-2 mt-3" onClick={(event) => event.stopPropagation()}>
      {items.map((item) => (
        <a
          key={item.key}
          href={item.href!}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={item.label}
          title={item.label}
          className="touch-target w-11 h-11 rounded-full border border-chartrons-beige bg-white text-chartrons-olive-dark hover:border-chartrons-bordeaux/40 hover:text-chartrons-bordeaux hover:bg-chartrons-bordeaux/5 transition-colors inline-flex items-center justify-center"
        >
          {ICONS[item.key]}
        </a>
      ))}
    </div>
  );
}
