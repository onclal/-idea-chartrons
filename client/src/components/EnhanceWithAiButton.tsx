import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { EnhanceDraftKind, PostType } from '@idea-chartrons/shared';
import { Button } from './ui';
import { ConciergeBeretLoader } from './ConciergeBeretLoader';
import { useToast } from '../context/ToastContext';
import { enhanceDraftWithConcierge } from '../lib/postEnhance';

interface EnhanceWithAiButtonProps {
  title: string;
  description: string;
  kind?: EnhanceDraftKind;
  postType?: PostType | null;
  onEnhanced: (next: { title: string; description: string }) => void;
}

export function EnhanceWithAiButton({
  title,
  description,
  kind = 'post',
  postType = null,
  onEnhanced,
}: EnhanceWithAiButtonProps) {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const disabled = loading || (!title.trim() && !description.trim());

  const handleEnhance = async () => {
    setLoading(true);
    try {
      const next = await enhanceDraftWithConcierge({
        title,
        description,
        kind,
        postType,
        lang: i18n.language === 'en' ? 'en' : 'fr',
      });
      onEnhanced(next);
      showToast(t('posts.create.enhance.done'));
    } catch {
      showToast(t('posts.create.enhance.error'), 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="gold"
        className="w-full"
        disabled={disabled}
        onClick={() => void handleEnhance()}
      >
        {loading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <ConciergeBeretLoader size="sm" label={t('posts.create.enhance.loading')} />
            {t('posts.create.enhance.loading')}
          </span>
        ) : (
          t('posts.create.enhance.button')
        )}
      </Button>
      <p className="text-[11px] text-chartrons-warm-gray leading-relaxed">{t('posts.create.enhance.hint')}</p>
    </div>
  );
}
