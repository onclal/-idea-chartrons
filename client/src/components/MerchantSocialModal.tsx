import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_MERCHANT_PIN,
  emailsMatch,
  isVipMerchant,
  normalizePinCode,
  normalizeSocialLinks,
  normalizeSocialUrl,
  normalizeWhatsAppLink,
  pinCodesMatch,
  type ActeurLocal,
} from '@idea-chartrons/shared';
import { Button, Input, Modal } from './ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

type Step = 'pin' | 'forgot' | 'edit' | 'paywall';

interface MerchantSocialModalProps {
  open: boolean;
  onClose: () => void;
  acteur: ActeurLocal;
  onSaved: (acteur: ActeurLocal) => void;
}

export function MerchantSocialModal({ open, onClose, acteur, onSaved }: MerchantSocialModalProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const vip = isVipMerchant(acteur);
  const [step, setStep] = useState<Step>('pin');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [resetError, setResetError] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [website, setWebsite] = useState('');
  const [formError, setFormError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setStep('pin');
    setPin('');
    setPinError('');
    setEmail('');
    setEmailError('');
    setEmailVerified(false);
    setNewPin('');
    setConfirmPin('');
    setResetError('');
    setInstagram(acteur.socialLinks?.instagram ?? '');
    setFacebook(acteur.socialLinks?.facebook ?? '');
    setWhatsapp(acteur.socialLinks?.whatsapp ?? '');
    setWebsite(acteur.socialLinks?.website ?? '');
    setFormError('');
    setSaving(false);
    // Reset the flow when the modal opens, not when the listing is saved mid-session.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, acteur.id]);

  const title =
    step === 'edit'
      ? t('acteurs.owner.editTitle')
      : step === 'forgot'
        ? t('acteurs.owner.forgotTitle')
        : step === 'paywall'
          ? t('acteurs.owner.paywall.title')
          : t('acteurs.owner.pinTitle');

  const goToEdit = () => {
    setInstagram(acteur.socialLinks?.instagram ?? '');
    setFacebook(acteur.socialLinks?.facebook ?? '');
    setWhatsapp(acteur.socialLinks?.whatsapp ?? '');
    setWebsite(acteur.socialLinks?.website ?? '');
    setFormError('');
    setStep('edit');
  };

  const goToUnlocked = () => {
    if (vip) {
      goToEdit();
      return;
    }
    setStep('paywall');
  };

  const handlePinSubmit = (event: FormEvent) => {
    event.preventDefault();
    const given = normalizePinCode(pin);
    const unlocked =
      given === DEFAULT_MERCHANT_PIN || pinCodesMatch(acteur.pinCode, pin);
    if (!unlocked) {
      setPinError(t('acteurs.owner.pinError'));
      return;
    }
    setPinError('');
    goToUnlocked();
  };

  const handleEmailCheck = (event: FormEvent) => {
    event.preventDefault();
    if (!emailsMatch(acteur.merchantEmail, email)) {
      setEmailError(t('acteurs.owner.emailError'));
      setEmailVerified(false);
      return;
    }
    setEmailError('');
    setEmailVerified(true);
    showToast(t('acteurs.owner.emailSent'));
  };

  const handleResetPin = async (event: FormEvent) => {
    event.preventDefault();
    if (!emailVerified) {
      setResetError(t('acteurs.owner.emailFirst'));
      return;
    }
    const next = normalizePinCode(newPin);
    if (!next) {
      setResetError(t('acteurs.owner.pinFormat'));
      return;
    }
    if (next !== normalizePinCode(confirmPin)) {
      setResetError(t('acteurs.owner.pinMismatch'));
      return;
    }
    setResetError('');
    setSaving(true);
    try {
      const updated = await api.updateActeur(acteur.id, { pinCode: next });
      onSaved(updated);
      showToast(t('acteurs.owner.pinUpdated'));
      goToUnlocked();
    } catch (err) {
      setResetError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveLinks = async (event: FormEvent) => {
    event.preventDefault();
    if (instagram.trim() && !normalizeSocialUrl(instagram)) {
      setFormError(t('acteurs.owner.invalidUrl', { network: t('acteurs.social.instagram') }));
      return;
    }
    if (facebook.trim() && !normalizeSocialUrl(facebook)) {
      setFormError(t('acteurs.owner.invalidUrl', { network: t('acteurs.social.facebook') }));
      return;
    }
    if (whatsapp.trim() && !normalizeWhatsAppLink(whatsapp)) {
      setFormError(t('acteurs.owner.invalidUrl', { network: t('acteurs.social.whatsapp') }));
      return;
    }
    if (website.trim() && !normalizeSocialUrl(website)) {
      setFormError(t('acteurs.owner.invalidUrl', { network: t('acteurs.social.website') }));
      return;
    }

    setFormError('');
    setSaving(true);
    try {
      const updated = await api.updateActeur(acteur.id, {
        socialLinks: normalizeSocialLinks({ instagram, facebook, whatsapp, website }),
      });
      onSaved(updated);
      showToast(t('acteurs.owner.saved'));
      onClose();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('common.error'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      {step === 'pin' && (
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark/80">{t('acteurs.owner.pinHint', { name: acteur.nomCommerce })}</p>
          <Input
            label={t('acteurs.owner.pinLabel')}
            value={pin}
            onChange={(event) => {
              setPin(event.target.value.replace(/\D/g, '').slice(0, 4));
              setPinError('');
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={4}
            placeholder="••••"
            className="tracking-[0.6em] text-center text-xl font-semibold"
          />
          {pinError ? <p className="text-sm text-chartrons-brick">{pinError}</p> : null}
          <p className="text-xs text-chartrons-olive-dark/70">{t('acteurs.owner.demoHint')}</p>
          <Button type="submit" variant="bordeaux" className="w-full">
            {t('acteurs.owner.unlock')}
          </Button>
          <button
            type="button"
            className="w-full text-sm font-semibold text-chartrons-green cursor-pointer underline underline-offset-2 hover:text-chartrons-green-light"
            onClick={() => {
              setStep('forgot');
              setEmailVerified(false);
              setEmailError('');
              setResetError('');
            }}
          >
            {t('acteurs.owner.forgotLink')}
          </button>
        </form>
      )}

      {step === 'forgot' && (
        <div className="space-y-5">
          <form onSubmit={handleEmailCheck} className="space-y-4">
            <p className="text-sm text-chartrons-olive-dark/80">{t('acteurs.owner.forgotHint')}</p>
            <Input
              label={t('acteurs.owner.emailLabel')}
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setEmailError('');
                setEmailVerified(false);
              }}
              autoComplete="email"
              placeholder="commerce@chartrons.fr"
            />
            {emailError ? <p className="text-sm text-chartrons-brick">{emailError}</p> : null}
            {emailVerified ? (
              <p className="text-sm text-chartrons-olive-dark bg-chartrons-green/10 rounded-xl px-3 py-2">
                {t('acteurs.owner.emailSent')}
              </p>
            ) : null}
            <Button type="submit" variant="secondary" className="w-full">
              {t('acteurs.owner.verifyEmail')}
            </Button>
          </form>

          <form onSubmit={handleResetPin} className="space-y-4 pt-2 border-t border-chartrons-beige">
            <p className="text-sm text-chartrons-olive-dark/80">{t('acteurs.owner.newPinHint')}</p>
            <Input
              label={t('acteurs.owner.newPin')}
              value={newPin}
              onChange={(event) => setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="tracking-[0.6em] text-center text-xl font-semibold"
            />
            <Input
              label={t('acteurs.owner.confirmPin')}
              value={confirmPin}
              onChange={(event) => setConfirmPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
              inputMode="numeric"
              maxLength={4}
              placeholder="••••"
              className="tracking-[0.6em] text-center text-xl font-semibold"
            />
            {resetError ? <p className="text-sm text-chartrons-brick">{resetError}</p> : null}
            <Button type="submit" variant="bordeaux" className="w-full" disabled={saving || !emailVerified}>
              {saving ? t('common.loading') : t('acteurs.owner.resetPin')}
            </Button>
            <button
              type="button"
              className="w-full text-sm font-medium text-chartrons-olive-dark cursor-pointer underline underline-offset-2 hover:text-chartrons-green"
              onClick={() => setStep('pin')}
            >
              {t('acteurs.owner.backToPin')}
            </button>
          </form>
        </div>
      )}

      {step === 'edit' && (
        <form onSubmit={handleSaveLinks} className="space-y-4">
          <p className="text-sm text-chartrons-olive-dark/80">{t('acteurs.owner.editHint')}</p>
          <Input
            label={t('acteurs.social.instagram')}
            value={instagram}
            onChange={(event) => setInstagram(event.target.value)}
            placeholder="https://instagram.com/mon_commerce"
            inputMode="url"
          />
          <Input
            label={t('acteurs.social.facebook')}
            value={facebook}
            onChange={(event) => setFacebook(event.target.value)}
            placeholder="https://facebook.com/mon_commerce"
            inputMode="url"
          />
          <Input
            label={t('acteurs.social.whatsapp')}
            value={whatsapp}
            onChange={(event) => setWhatsapp(event.target.value)}
            placeholder="https://api.whatsapp.com/send?phone=33…"
          />
          <Input
            label={t('acteurs.social.website')}
            value={website}
            onChange={(event) => setWebsite(event.target.value)}
            placeholder="https://mon-commerce.fr"
            inputMode="url"
          />
          {formError ? <p className="text-sm text-chartrons-brick">{formError}</p> : null}
          <Button type="submit" variant="bordeaux" className="w-full" disabled={saving}>
            {saving ? t('common.loading') : t('acteurs.owner.save')}
          </Button>
        </form>
      )}

      {step === 'paywall' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-chartrons-green/20 bg-gradient-to-br from-chartrons-beige/90 to-white p-4">
            <p className="text-sm text-chartrons-olive-dark/85 leading-relaxed">
              {t('acteurs.owner.paywall.subtitle')}
            </p>
          </div>
          <ul className="space-y-2.5">
            {(t('acteurs.owner.paywall.features', { returnObjects: true }) as string[]).map((feature) => (
              <li
                key={feature}
                className="flex items-start gap-2.5 text-sm text-chartrons-olive-dark bg-white border border-chartrons-beige rounded-xl px-3 py-2.5"
              >
                <span className="leading-snug">{feature}</span>
              </li>
            ))}
          </ul>
          <Button
            type="button"
            variant="primary"
            className="w-full"
            onClick={() => {
              onClose();
              navigate('/pro');
            }}
          >
            {t('acteurs.owner.paywall.cta')}
          </Button>
          <Button type="button" variant="secondary" className="w-full" onClick={onClose}>
            {t('acteurs.owner.paywall.later')}
          </Button>
        </div>
      )}
    </Modal>
  );
}
