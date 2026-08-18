import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PostType, type PostAnnonce } from '@idea-chartrons/shared';
import { Button, Input, Modal, Textarea } from './ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { rememberOwnedPost } from '../lib/guestCarnet';
import { OtpPinInput } from './OtpPinInput';
import {
  confirmPostOtp,
  needsFirstPostOtp,
  startPostVerification,
} from '../lib/postVerification';

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
  PostType.OffrePro,
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
  const [otpChannel, setOtpChannel] = useState<'email' | 'sms'>('sms');
  const [otpCode, setOtpCode] = useState('');
  const [otpHint, setOtpHint] = useState<string | null>(null);
  const [otpVerified, setOtpVerified] = useState(() => !needsFirstPostOtp());
  const [auteurNom, setAuteurNom] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (post) {
      setTitre(post.titre);
      setDescription(post.description);
      setType(post.type);
      setPrix(post.prix != null ? String(post.prix) : '');
      setTelephone(post.telephone ?? '');
      setEmail('');
      setOtpCode('');
      setOtpHint(null);
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
    setOtpCode('');
    setOtpHint(null);
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

  const handleSendOtp = () => {
    const target = otpChannel === 'sms' ? telephone.trim() : email.trim();
    if (!target) {
      setError(t('posts.create.otp.missingTarget'));
      return;
    }
    const verification = startPostVerification(otpChannel, target);
    setOtpHint(verification.code);
    setOtpCode('');
    setError(null);
    showToast(t('posts.create.otp.sent'));
  };

  const handleConfirmOtp = () => {
    const next = confirmPostOtp(otpCode);
    if (next?.status === 'verified') {
      setOtpVerified(true);
      setOtpHint(null);
      setError(null);
      showToast(t('posts.create.otp.verified'));
      return;
    }
    if (next?.status === 'blocked' || next?.status === 'expired') {
      setError(t(`posts.create.otp.${next.status}`));
      return;
    }
    setError(t('posts.create.otp.invalid'));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requireOtp) {
      setError(t('posts.create.otp.required'));
      return;
    }
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
        const created = await api.createPost(payload);
        // Le droit d'édition reste dans ce navigateur : aucun compte n'est créé.
        rememberOwnedPost(created.id);
        showToast(t('toast.postPublished'));
      }
      onCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
          <div className="space-y-3 rounded-xl border border-chartrons-gold/30 bg-chartrons-beige/40 p-3">
            <p className="text-xs text-chartrons-olive-dark leading-relaxed">{t('posts.create.otp.hint')}</p>
            <div className="grid grid-cols-2 gap-2">
              {(['sms', 'email'] as const).map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setOtpChannel(channel)}
                  className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                    otpChannel === channel
                      ? 'bg-chartrons-green text-white border-chartrons-green'
                      : 'bg-white text-chartrons-green-dark border-chartrons-gold/20'
                  }`}
                >
                  {t(`posts.create.otp.channel.${channel}`)}
                </button>
              ))}
            </div>
            {otpChannel === 'email' && (
              <Input
                label={t('contact.email')}
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="prenom@email.fr"
              />
            )}
            <Button type="button" variant="secondary" className="w-full" onClick={handleSendOtp}>
              {t('posts.create.otp.send')}
            </Button>
            {otpHint && (
              <p className="text-xs text-chartrons-warm-gray">
                {t('posts.create.otp.demoCode', { code: otpHint })}
              </p>
            )}
            <p id="post-otp-code-label" className="text-xs font-medium text-chartrons-warm-gray">
              {t('posts.create.otp.code')}
            </p>
            <OtpPinInput value={otpCode} onChange={setOtpCode} labelledBy="post-otp-code-label" />
            <Button type="button" className="w-full" onClick={handleConfirmOtp}>
              {t('posts.create.otp.confirm')}
            </Button>
          </div>
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
  );
}
