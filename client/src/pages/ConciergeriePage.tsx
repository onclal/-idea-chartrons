import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AIConcierge } from '../components/AIConcierge';
import { Button, Card, Input, Textarea } from '../components/ui';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';
import { ADMIN_CONTACT_EMAIL } from '../lib/contact';
import { downloadWelcomeKit } from '../data/pratique';

export function ConciergeriePage() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [listings, setListings] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) {
      setError(t('contact.required'));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError(t('contact.invalidEmail'));
      return;
    }

    const details = [
      company.trim() && `${t('conciergerie.form.company')}: ${company.trim()}`,
      phone.trim() && `${t('common.phone')}: ${phone.trim()}`,
      listings.trim() && `${t('conciergerie.form.listings')}: ${listings.trim()}`,
      '',
      message.trim(),
    ]
      .filter((line): line is string => typeof line === 'string')
      .join('\n');

    setSending(true);
    setError('');
    try {
      await api.sendContact({
        name: name.trim(),
        email: email.trim(),
        message: details,
        context: t('conciergerie.form.context'),
      });
      showToast(t('contact.success', { email: ADMIN_CONTACT_EMAIL }));
      setMessage('');
      setCompany('');
      setPhone('');
      setListings('');
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('conciergerie.title')}</h2>
        <p className="text-sm text-chartrons-warm-gray mt-1">{t('conciergerie.subtitle')}</p>
      </div>

      <AIConcierge />

      <Card className="!p-4 bg-gradient-to-br from-chartrons-beige/70 to-white space-y-3">
        <p className="text-sm text-chartrons-olive-dark leading-relaxed">{t('conciergerie.intro')}</p>
        <ul className="space-y-1.5 text-sm text-chartrons-olive-dark">
          <li>• {t('conciergerie.services.kit')}</li>
          <li>• {t('conciergerie.services.welcome')}</li>
          <li>• {t('conciergerie.services.local')}</li>
        </ul>
        <Button
          type="button"
          variant="bordeaux"
          className="w-full"
          onClick={() => downloadWelcomeKit(i18n.language)}
        >
          {t('conciergerie.kitCta')}
        </Button>
        <Link
          to="/pratique#kit"
          className="inline-flex items-center justify-center w-full min-h-[44px] text-sm font-semibold text-chartrons-bordeaux hover:underline"
        >
          {t('conciergerie.kitLink')} →
        </Link>
      </Card>

      <section className="space-y-3">
        <h3 className="text-lg font-bold text-chartrons-bordeaux">{t('conciergerie.form.title')}</h3>
        <p className="text-sm text-chartrons-warm-gray leading-relaxed">{t('conciergerie.form.hint')}</p>
        <Card className="!p-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={t('contact.name')}
              name="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              required
            />
            <Input
              label={t('conciergerie.form.company')}
              name="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder={t('conciergerie.form.companyPlaceholder')}
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
            <Input
              label={t('common.phone')}
              name="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={t('common.phonePlaceholder')}
            />
            <Input
              label={t('conciergerie.form.listings')}
              name="listings"
              value={listings}
              onChange={(e) => setListings(e.target.value)}
              placeholder={t('conciergerie.form.listingsPlaceholder')}
            />
            <Textarea
              label={t('conciergerie.form.need')}
              name="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              required
              placeholder={t('conciergerie.form.placeholder')}
            />
            {error && (
              <p className="text-sm text-chartrons-brick" role="alert">
                {error}
              </p>
            )}
            <Button type="submit" variant="bordeaux" className="w-full" disabled={sending}>
              {sending ? t('contact.sending') : t('conciergerie.form.submit')}
            </Button>
          </form>
        </Card>
      </section>
    </div>
  );
}
