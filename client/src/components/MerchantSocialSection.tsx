import { hasSocialLinks, isVipMerchant, type ActeurLocal } from '@idea-chartrons/shared';
import { SocialLinksRow } from './SocialLinksRow';

interface MerchantSocialSectionProps {
  acteur: ActeurLocal;
  onUpdated?: (acteur: ActeurLocal) => void;
}

/**
 * Affiche uniquement les réseaux publics. Toute modification passe par le
 * panneau admin : aucun code PIN ni compte commerçant côté visiteur.
 */
export function MerchantSocialSection({ acteur }: MerchantSocialSectionProps) {
  if (!isVipMerchant(acteur) || !hasSocialLinks(acteur.socialLinks)) return null;
  return (
    <div className="mt-3" onClick={(event) => event.stopPropagation()}>
      <SocialLinksRow links={acteur.socialLinks} />
    </div>
  );
}
