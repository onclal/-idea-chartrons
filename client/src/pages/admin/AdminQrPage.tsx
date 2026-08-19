import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ActeurLocal } from '@idea-chartrons/shared';
import { AdminPageHeader } from '../../components/admin/AdminPageHeader';
import { QRCodeGenerator } from '../../components/QRCodeGenerator';
import { Card, Loading } from '../../components/ui';
import { api } from '../../lib/api';

export function AdminQrPage() {
  const { t } = useTranslation();
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getActeurs()
      .then(setActeurs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="animate-fade-in">
      <AdminPageHeader title={t('adminSpace.nav.qr')} subtitle={t('adminSpace.pages.qrSub')} />
      <Card className="!p-4 sm:!p-6">
        <QRCodeGenerator acteurs={acteurs} />
      </Card>
    </div>
  );
}
