import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostStatus, PostType, type PostAnnonce } from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';
import { EnhanceWithAiButton } from './EnhanceWithAiButton';
import { OtpVerifyModal } from './OtpVerifyModal';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { rememberOwnedPost } from '../lib/guestCarnet';
import { needsFirstPostOtp } from '../lib/postVerification';

interface PostCreateFormProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
  post?: PostAnnonce | null;
}

const POST_TYPES = [
  PostType.Don,
  PostType.Vente,
  PostType.ServiceAide,
  PostType.PetitBoulot,
] as const;

export function PostCreateForm({ open, onClose, onCreated, post = null }: PostCreateFormProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const editing = Boolean(post);
  const [titre, setTitre] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<PostType>(PostType.Don);
  const [prix, setPrix] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [otpVerified, setOtpVerified] = useState(() => !needsFirstPostOtp());
  const [otpOpen, setOtpOpen] = useState(false);
  const [auteurNom, setAuteurNom] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setOtpOpen(false);
    if (post) {
      setTitre(post.titre);
      setDescription(post.description);
      setType(post.type);
      setPrix(post.prix != null ? String(post.prix) : '');
      setTelephone(post.telephone ?? '');
      setEmail('');
      setOtpVerified(true);
      setAuteurNom(post.auteurNom ?? '');
      setPhotoPreview(post.photos[0] ?? null);
      setError(null);
      return;
    }
    setTitre('');
    setDescription('');
    setType(PostType.Don);
    setPrix('');
    setTelephone('');
    setEmail('');
    setOtpVerified(!needsFirstPostOtp());
    setAuteurNom('');
    setPhotoPreview(null);
    setError(null);
  }, [open, post]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const requireOtp = !editing && !otpVerified;

  const publish = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        titre: titre.trim(),
        description: description.trim(),
        type,
        prix:
          type === PostType.Vente || type === PostType.PetitBoulot || type === PostType.OffrePro
            ? Number(prix) || 0
            : null,
        photos: photoPreview ? [photoPreview] : [],
        telephone: telephone.trim() || null,
        auteurNom: auteurNom.trim() || null,
      };
      if (post) {
        await api.updatePost(post.id, payload);
        showToast(t('toast.postUpdated'));
      } else {
        const created = await api.createPost({ ...payload, statut: PostStatus.EnAttente });
        rememberOwnedPost(created.id);
        showToast(t('toast.postPending'));
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireOtp) {
      setOtpOpen(true);
      return;
    }
    await publish();
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={editing ? t('posts.edit.title') : t('posts.create.title')}>
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

          <EnhanceWithAiButton
            title={titre}
            description={description}
            kind="post"
            postType={type}
            onEnhanced={(next) => {
              if (next.title) setTitre(next.title);
              if (next.description) setDescription(next.description);
            }}
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

          {(type === PostType.Vente || type === PostType.PetitBoulot || type === PostType.OffrePro) && (
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

          <Input
            label={t('common.phone')}
            type="tel"
            value={telephone}
            onChange={(e) => setTelephone(e.target.value)}
            placeholder={t('common.phonePlaceholder')}
          />

          {requireOtp && (
            <p className="text-xs text-chartrons-olive-dark leading-relaxed rounded-xl border border-chartrons-gold/30 bg-chartrons-beige/40 px-3 py-2">
              {t('posts.create.otp.hint')}
            </p>
          )}

          <Input
            label={t('posts.create.auteurNom')}
            value={auteurNom}
            onChange={(e) => setAuteurNom(e.target.value)}
            maxLength={40}
            placeholder={t('posts.create.auteurNomPlaceholder')}
            hint={t('posts.create.auteurNomHint')}
          />

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
              {submitting ? t('common.loading') : editing ? t('posts.edit.submit') : t('posts.create.submit')}
            </Button>
          </div>
        </form>
      </Modal>

      <OtpVerifyModal
        open={otpOpen}
        defaultPhone={telephone}
        defaultEmail={email}
        onClose={() => setOtpOpen(false)}
        onVerified={() => {
          setOtpVerified(true);
          setOtpOpen(false);
          void publish();
        }}
      />
    </>
  );
}
