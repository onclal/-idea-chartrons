import { hasPublicSocialLinks, publicSocialLinks, type ActeurLocal } from '@idea-chartrons/shared';
import { SocialLinksRow } from './SocialLinksRow';

interface MerchantSocialSectionProps {
  acteur: ActeurLocal;
  onUpdated?: (acteur: ActeurLocal) => void;
}

/**
 * Réseaux publics pour tous ; le site web n’est cliquable qu’en Premium Pro.
 */
export function MerchantSocialSection({ acteur }: MerchantSocialSectionProps) {
  const links = publicSocialLinks(acteur.socialLinks, false);
  if (!hasPublicSocialLinks(links)) return null;
  return (
    <div className="mt-3" onClick={(event) => event.stopPropagation()}>
      <SocialLinksRow links={links} />
    </div>
  );
}
