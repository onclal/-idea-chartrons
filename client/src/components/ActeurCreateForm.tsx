import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActeurLocalCategory, DIRECTORY_CATEGORIES } from '@idea-chartrons/shared';
import { Button, Input, Modal, Select, Textarea } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

interface ActeurCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export function ActeurCreateForm({ open, onClose, onCreated }: ActeurCreateFormProps) {
  const { t } = useTranslation();
  const { currentUserId } = useAuth();
  const { showToast } = useToast();
  const [nomCommerce, setNomCommerce] = useState('');
  const [description, setDescription] = useState('');
  const [adresse, setAdresse] = useState('');
  const [telephone, setTelephone] = useState('');
  const [categorie, setCategorie] = useState<ActeurLocalCategory>(ActeurLocalCategory.CommercesArtisanat);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [activerFidelite, setActiverFidelite] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setNomCommerce('');
    setDescription('');
    setAdresse('');
    setTelephone('');
    setCategorie(ActeurLocalCategory.CommercesArtisanat);
    setPhotoPreview(null);
    setActiverFidelite(false);
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
      await api.createActeur({
        userId: currentUserId,
        nomCommerce: nomCommerce.trim(),
        categorie,
        description: description.trim(),
        adresse: adresse.trim(),
        telephone: telephone.trim() || null,
        photos: photoPreview ? [photoPreview] : [],
        offreVip: null,
        pointsRequisVip: 0,
        activerFidelite,
      });
      reset();
      onCreated();
      onClose();
      showToast(t('toast.acteurPublished'));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('acteurs.create.title')}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('acteurs.create.hint')}</p>

        <Input
          label={t('acteurs.create.nom')}
          value={nomCommerce}
          onChange={(e) => setNomCommerce(e.target.value)}
          required
          placeholder={t('acteurs.create.nomPlaceholder')}
        />

        <Select
          label={t('acteurs.create.categorie')}
          value={categorie}
          onChange={(e) => setCategorie(e.target.value as ActeurLocalCategory)}
          options={DIRECTORY_CATEGORIES.map((cat) => ({
            value: cat,
            label: t(`acteurs.categories.${cat}`),
          }))}
        />

        <Textarea
          label={t('posts.create.description')}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          rows={3}
          placeholder={t('acteurs.create.descriptionPlaceholder')}
        />

        <Input
          label={t('adminSpace.fields.address')}
          value={adresse}
          onChange={(e) => setAdresse(e.target.value)}
          required
          placeholder={t('acteurs.create.adressePlaceholder')}
        />

        <Input
          label={t('common.phone')}
          type="tel"
          value={telephone}
          onChange={(e) => setTelephone(e.target.value)}
          placeholder={t('common.phonePlaceholder')}
        />

        <div className="space-y-2">
          <label className="block text-xs font-semibold text-chartrons-warm-gray uppercase tracking-wide">
            {t('posts.create.photo')}
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-xl border-2 border-dashed border-chartrons-beige bg-white cursor-pointer hover:border-chartrons-bordeaux/40 transition-colors overflow-hidden">
            {photoPreview ? (
              <img src={photoPreview} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="text-center p-4">
                <span className="text-2xl block mb-1" aria-hidden>
                  📷
                </span>
                <span className="text-xs text-chartrons-warm-gray">{t('posts.create.photoHint')}</span>
              </div>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </label>
        </div>

        <label className="flex items-start gap-3 p-3 rounded-xl bg-chartrons-beige/50 cursor-pointer">
          <input
            type="checkbox"
            checked={activerFidelite}
            onChange={(e) => setActiverFidelite(e.target.checked)}
            className="mt-1 w-4 h-4 accent-chartrons-bordeaux"
          />
          <span>
            <span className="block text-sm font-medium text-chartrons-olive-dark">
              {t('acteurs.create.activateFidelite')}
            </span>
            <span className="block text-xs text-chartrons-warm-gray mt-0.5">
              {t('acteurs.create.activateFideliteHint')}
            </span>
          </span>
        </label>

        {error && <p className="text-xs text-chartrons-brick">{error}</p>}

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="bordeaux" className="flex-1" disabled={submitting}>
            {submitting ? t('common.loading') : t('acteurs.create.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
