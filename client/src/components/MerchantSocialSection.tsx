import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hasSocialLinks, isVipMerchant, type ActeurLocal } from '@idea-chartrons/shared';
import { Button } from './ui';
import { SocialLinksRow } from './SocialLinksRow';
import { MerchantSocialModal } from './MerchantSocialModal';

interface MerchantSocialSectionProps {
  acteur: ActeurLocal;
  onUpdated: (acteur: ActeurLocal) => void;
}

export function MerchantSocialSection({ acteur, onUpdated }: MerchantSocialSectionProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const showOwner = acteur.isMerchant !== false;
  const showSocials = isVipMerchant(acteur) && hasSocialLinks(acteur.socialLinks);
  if (!showOwner && !showSocials) return null;

  return (
    <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
      {showSocials ? <SocialLinksRow links={acteur.socialLinks} /> : null}
      {showOwner && (
        <>
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="w-full cursor-pointer font-semibold text-chartrons-olive-dark bg-white border-chartrons-sand hover:bg-chartrons-beige hover:border-chartrons-olive/40 hover:text-chartrons-green-dark"
            onClick={() => setOpen(true)}
          >
            {t('acteurs.owner.cta')}
          </Button>
          <MerchantSocialModal
            open={open}
            onClose={() => setOpen(false)}
            acteur={acteur}
            onSaved={onUpdated}
          />
        </>
      )}
    </div>
  );
}
