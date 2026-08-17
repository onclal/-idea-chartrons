import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { hasSocialLinks, type ActeurLocal } from '@idea-chartrons/shared';
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
  if (!showOwner && !hasSocialLinks(acteur.socialLinks)) return null;

  return (
    <div className="mt-3 space-y-2" onClick={(event) => event.stopPropagation()}>
      <SocialLinksRow links={acteur.socialLinks} />
      {showOwner && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full border border-chartrons-beige text-chartrons-olive-dark"
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
