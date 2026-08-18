import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { PostVerificationChannel } from '@idea-chartrons/shared';
import { Button, Input, Modal } from './ui';
import { OtpPinInput } from './OtpPinInput';
import { useToast } from '../context/ToastContext';
import { confirmPostOtp, startPostVerification } from '../lib/postVerification';

interface OtpVerifyModalProps {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
  defaultPhone?: string;
  defaultEmail?: string;
}

const DISPATCH_MS = 700;

export function OtpVerifyModal({
  open,
  onClose,
  onVerified,
  defaultPhone = '',
  defaultEmail = '',
}: OtpVerifyModalProps) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [channel, setChannel] = useState<PostVerificationChannel>('sms');
  const [telephone, setTelephone] = useState(defaultPhone);
  const [email, setEmail] = useState(defaultEmail);
  const [code, setCode] = useState('');
  const [hint, setHint] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setChannel('sms');
    setTelephone(defaultPhone);
    setEmail(defaultEmail);
    setCode('');
    setHint(null);
    setSending(false);
    setError(null);
  }, [open, defaultPhone, defaultEmail]);

  const handleSend = () => {
    const target = channel === 'sms' ? telephone.trim() : email.trim();
    if (!target) {
      setError(t('posts.create.otp.missingTarget'));
      return;
    }
    setSending(true);
    setError(null);
    window.setTimeout(() => {
      const verification = startPostVerification(channel, target);
      setHint(verification.code);
      setCode('');
      setSending(false);
      showToast(t('posts.create.otp.sent'));
    }, DISPATCH_MS);
  };

  const handleConfirm = () => {
    const next = confirmPostOtp(code);
    if (next?.status === 'verified') {
      setError(null);
      showToast(t('posts.create.otp.verified'));
      onVerified();
      return;
    }
    if (next?.status === 'blocked' || next?.status === 'expired') {
      setError(t(`posts.create.otp.${next.status}`));
      return;
    }
    setError(t('posts.create.otp.invalid'));
  };

  const targetPreview = channel === 'sms' ? telephone.trim() : email.trim();

  return (
    <Modal open={open} onClose={onClose} title={t('posts.create.otp.modalTitle')} nested>
      <div className="space-y-4">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('posts.create.otp.hint')}</p>
        <div className="grid grid-cols-2 gap-2">
          {(['sms', 'email'] as const).map((nextChannel) => (
            <button
              key={nextChannel}
              type="button"
              onClick={() => setChannel(nextChannel)}
              className={`px-3 py-2 rounded-xl text-xs font-medium border transition-colors ${
                channel === nextChannel
                  ? 'bg-chartrons-green text-white border-chartrons-green'
                  : 'bg-white text-chartrons-green-dark border-chartrons-gold/20'
              }`}
            >
              {t(`posts.create.otp.channel.${nextChannel}`)}
            </button>
          ))}
        </div>
        {channel === 'sms' ? (
          <Input
            label={t('common.phone')}
            type="tel"
            value={telephone}
            onChange={(event) => setTelephone(event.target.value)}
            placeholder={t('common.phonePlaceholder')}
          />
        ) : (
          <Input
            label={t('contact.email')}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="prenom@email.fr"
          />
        )}
        <Button type="button" variant="secondary" className="w-full" disabled={sending} onClick={handleSend}>
          {sending ? t('posts.create.otp.dispatching') : t('posts.create.otp.send')}
        </Button>
        {hint && (
          <div className="rounded-xl border border-chartrons-gold/30 bg-chartrons-beige/40 px-3 py-2 space-y-1">
            {targetPreview ? (
              <p className="text-xs text-chartrons-olive-dark">
                {t('posts.create.otp.sentTo', { target: targetPreview })}
              </p>
            ) : null}
            <p className="text-xs text-chartrons-warm-gray">{t('posts.create.otp.demoCode', { code: hint })}</p>
          </div>
        )}
        <p id="otp-verify-code-label" className="text-xs font-medium text-chartrons-warm-gray">
          {t('posts.create.otp.code')}
        </p>
        <OtpPinInput value={code} onChange={setCode} labelledBy="otp-verify-code-label" />
        {error && <p className="text-xs text-chartrons-brick">{error}</p>}
        <Button type="button" className="w-full" onClick={handleConfirm}>
          {t('posts.create.otp.confirm')}
        </Button>
      </div>
    </Modal>
  );
}
