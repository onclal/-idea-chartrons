import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PostStatus,
  PostType,
  defaultAntiGaspiExpiry,
  validateAntiGaspiExpiry,
} from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { rememberOwnedPost } from '../lib/guestCarnet';
import { toDatetimeLocal } from '../lib/format';

interface AntiGaspiCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function AntiGaspiCreateForm({ open, onClose, onCreated }: AntiGaspiCreateFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [commerceNom, setCommerceNom] = useState('');
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [prix, setPrix] = useState('');
  const [telephone, setTelephone] = useState('');
  const [expiresLocal, setExpiresLocal] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setCommerceNom('');
    setTitre('');
    setDescription('');
    setPrix('');
    setTelephone('');
    setExpiresLocal(toDatetimeLocal(defaultAntiGaspiExpiry()));
    setPhotoPreview(null);
    setError(null);
  }, [open]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const expiresAt = expiresLocal ? new Date(expiresLocal).toISOString() : '';
    const expiryError = validateAntiGaspiExpiry(expiresAt);
    if (expiryError) {
      setError(t(`antigaspi.create.expiryError.${expiryError}`));
      return;
    }
    if (!telephone.trim()) {
      setError(t('antigaspi.create.phoneRequired'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createPost({
        titre: titre.trim(),
        description: description.trim(),
        type: PostType.AntiGaspi,
        prix: Number(prix) || 0,
        photos: photoPreview ? [photoPreview] : [],
        telephone: telephone.trim(),
        auteurNom: commerceNom.trim() || null,
        commerceNom: commerceNom.trim() || null,
        expiresAt,
        statut: PostStatus.EnAttente,
      });
      rememberOwnedPost(created.id);
      showToast(t('toast.postPending'));
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('antigaspi.create.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-chartrons-olive-dark leading-relaxed rounded-xl border border-chartrons-beige bg-chartrons-beige/40 px-3 py-2">
          {t('antigaspi.create.hint')}
        </p>
        <Input
          label={t('antigaspi.create.commerce')}
          value={commerceNom}
          onChange={(e) => setCommerceNom(e.target.value)}
          required
          placeholder={t('antigaspi.create.commercePlaceholder')}
        />
        <Input
          label={t('antigaspi.create.titre')}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          required
          placeholder={t('antigaspi.create.titrePlaceholder')}
        />
        <Textarea
          label={t('posts.create.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder={t('antigaspi.create.descriptionPlaceholder')}
        />
        <Input
          label={t('posts.create.prix')}
          type="number"
          min="0"
          step="0.5"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          required
          placeholder="3.50"
        />
        <Input
          label={t('antigaspi.create.expires')}
          type="datetime-local"
          value={expiresLocal}
          onChange={(e) => setExpiresLocal(e.target.value)}
          required
        />
        <Input
          label={t('common.phone')}
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          required
          placeholder={t('common.phonePlaceholder')}
        />
        <div className="space-y-2">
          <label className="block text-xs font-medium text-chartrons-warm-gray">
            {t('posts.create.photo')}
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-chartrons-gold/30 bg-white cursor-pointer hover:border-chartrons-green/40 transition-colors overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-chartrons-warm-gray px-4 text-center">{t('posts.create.photoHint')}</span>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>
        {error && <p className="text-sm text-chartrons-brick">{error}</p>}
        <Button type="submit" variant="bordeaux" className="w-full" disabled={submitting}>
          {submitting ? t('common.loading') : t('antigaspi.create.submit')}
        </Button>
      </form>
    </Modal>
  );
}
