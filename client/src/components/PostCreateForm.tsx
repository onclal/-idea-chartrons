import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostType } from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface PostCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const POST_TYPES = [
  PostType.Don,
  PostType.Vente,
  PostType.ServiceAide,
  PostType.PetitBoulot,
] as const;

export function PostCreateForm({ open, onClose, onCreated }: PostCreateFormProps) {
  const { t } = useTranslation();
  const { currentUserId } = useAuth();
  const { showToast } = useToast();
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PostType>(PostType.Don);
  const [prix, setPrix] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setTitre('');
    setDescription('');
    setType(PostType.Don);
    setPrix('');
    setPhotoPreview(null);
    setError(null);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await api.createPost({
        titre,
        description,
        type,
        prix: type === PostType.Vente || type === PostType.PetitBoulot ? Number(prix) || 0 : null,
        photos: photoPreview ? [photoPreview] : [],
        auteurId: currentUserId,
      });
      reset();
      onCreated();
      onClose();
      showToast(t('toast.postPublished'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('posts.create.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label={t('posts.create.titre')}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          placeholder={t('posts.create.titrePlaceholder')}
        />

        <Textarea
          label={t('posts.create.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder={t('posts.create.descriptionPlaceholder')}
        />

        <div className="space-y-1">
          <label className="block text-xs font-medium text-chartrons-warm-gray">
            {t('posts.create.type')}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {POST_TYPES.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setType(pt)}
                className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                  type === pt
                    ? 'bg-chartrons-green text-white border-chartrons-green'
                    : 'bg-white text-chartrons-green-dark border-chartrons-gold/20 hover:border-chartrons-green/30'
                }`}
              >
                {t(`posts.types.${pt}`)}
              </button>
            ))}
          </div>
        </div>

        {(type === PostType.Vente || type === PostType.PetitBoulot) && (
          <Input
            label={t('posts.create.prix')}
            type="number"
            min="0"
            step="1"
            value={prix}
            onChange={(e) => setPrix(e.target.value)}
            placeholder="0"
          />
        )}

        <div className="space-y-2">
          <label className="block text-xs font-medium text-chartrons-warm-gray">
            {t('posts.create.photo')}
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-chartrons-gold/30 bg-white cursor-pointer hover:border-chartrons-green/40 transition-colors overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <span className="text-2xl block mb-1">📷</span>
                <span className="text-xs text-chartrons-warm-gray">{t('posts.create.photoHint')}</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        {error && <p className="text-xs text-chartrons-green-dark">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" className="flex-1" disabled={submitting}>
            {submitting ? t('common.loading') : t('posts.create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
