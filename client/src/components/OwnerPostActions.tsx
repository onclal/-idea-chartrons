import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PostAnnonce } from '@idea-chartrons/shared';
import { Button } from './ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface OwnerPostActionsProps {
  post: PostAnnonce;
  onEdit?: () => void;
  onDeleted: () => void;
  layout?: 'stack' | 'row';
}

export function OwnerPostActions({
  post,
  onEdit,
  onDeleted,
  layout = 'stack',
}: OwnerPostActionsProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm(t('posts.deleteMineConfirm', { title: post.titre }))) return;
    setDeleting(true);
    try {
      await api.deletePost(post.id);
      showToast(t('toast.postDeleted'));
      onDeleted();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={layout === 'row' ? 'flex gap-2' : 'space-y-2'}>
      {onEdit && (
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={layout === 'row' ? 'flex-1' : 'w-full'}
          onClick={onEdit}
        >
          {t('posts.edit.button')}
        </Button>
      )}
      <Button
        type="button"
        variant="ghost"
        size="md"
        disabled={deleting}
        className={`${layout === 'row' ? 'flex-1' : 'w-full'} border border-chartrons-brick/30 text-chartrons-brick hover:bg-chartrons-brick/5`}
        onClick={handleDelete}
      >
        {deleting ? t('common.loading') : t('posts.deleteMine')}
      </Button>
    </div>
  );
}
