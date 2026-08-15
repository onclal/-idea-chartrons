import { useEffect, useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, Input, Modal, Textarea } from './ui';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ADMIN_CONTACT_EMAIL } from '../lib/contact';

interface ContactFormProps {
  open: boolean;
  onClose: () => void;
  context?: string;
}

export function ContactForm({ open, onClose, context }: ContactFormProps) {
  const { t } = useTranslation();
  const { currentUser } = useAuth();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName(currentUser?.nom ?? '');
    setEmail(currentUser?.email ?? '');
    setMessage('');
    setError('');
  }, [open, currentUser]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('contact.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('contact.invalidEmail'));
      return;
    }

    setSending(true);
    setError('');
    try {
      await api.sendContact({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
        context: context ?? t('contact.defaultContext'),
      });
      showToast(t('contact.success', { email: ADMIN_CONTACT_EMAIL }));
      onClose();
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={t('contact.title')}>
      <form
        name="contact"
        onSubmit={handleSubmit}
        className="space-y-4"
        {...{ netlify: 'true', 'netlify-honeypot': 'bot-field' }}
      >
        <p className="hidden" aria-hidden="true">
          <label>
            Don’t fill this out:{' '}
            <input type="text" name="bot-field" tabIndex={-1} autoComplete="off" />
          </label>
        </p>
        {context && (
          <p className="text-xs text-chartrons-warm-gray bg-chartrons-beige/60 rounded-xl px-3 py-2">
            {context}
          </p>
        )}
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('contact.intro')}</p>
        <Input
          label={t('contact.name')}
          name="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
          required
        />
        <Input
          label={t('contact.email')}
          name="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Textarea
          label={t('contact.message')}
          name="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          required
          placeholder={t('contact.placeholder')}
        />
        {error && (
          <p className="text-sm text-chartrons-brick" role="alert">
            {error}
          </p>
        )}
        <div className="flex flex-col-reverse sm:flex-row gap-2 pt-1">
          <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" variant="bordeaux" className="flex-1" disabled={sending}>
            {sending ? t('contact.sending') : t('contact.submit')}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
