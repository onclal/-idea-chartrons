import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CivicReportChannel,
  CivicReportStatus,
  REPORT_SUBCATEGORY_LABELS,
  type CivicReport,
} from '@idea-chartrons/shared';
import { AdminPageHeader } from './AdminPageHeader';
import { Badge, Button, Card, EmptyState, Loading, Select } from '../ui';
import { useToast } from '../../context/ToastContext';
import { api } from '../../lib/api';
import { ALLO_MAIRIE_PHONE } from '../../data/civic';
import { formatDateTime } from '../../lib/format';
import { loc } from '../../lib/locale';
import { toTelHref } from '../../lib/phone';

type ChannelFilter = 'all' | CivicReportChannel;

const STATUS_VARIANT: Record<CivicReportStatus, 'brass' | 'olive' | 'green' | 'stone'> = {
  [CivicReportStatus.Nouveau]: 'brass',
  [CivicReportStatus.Valide]: 'olive',
  [CivicReportStatus.Transmis]: 'green',
  [CivicReportStatus.Rejete]: 'stone',
};

const NEXT_STATUSES: CivicReportStatus[] = [
  CivicReportStatus.Nouveau,
  CivicReportStatus.Valide,
  CivicReportStatus.Transmis,
  CivicReportStatus.Rejete,
];

/**
 * Revue des signalements habitants avant transmission à la Mairie
 * ou à la Police Municipale. Les signalements sont anonymes par conception.
 */
export function AdminCivicReports() {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const [reports, setReports] = useState<CivicReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api
      .getCivicReports()
      .then(setReports)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = useMemo(
    () => reports.filter((report) => channelFilter === 'all' || report.channel === channelFilter),
    [reports, channelFilter],
  );

  const handleStatus = async (report: CivicReport, statut: CivicReportStatus) => {
    setBusyId(report.id);
    try {
      const updated = await api.setCivicReportStatus(report.id, statut);
      setReports((list) => list.map((item) => (item.id === updated.id ? updated : item)));
      showToast(t('adminSpace.reports.statusSaved'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (report: CivicReport) => {
    if (!window.confirm(t('adminSpace.reports.deleteConfirm'))) return;
    setBusyId(report.id);
    try {
      await api.deleteCivicReport(report.id);
      setReports((list) => list.filter((item) => item.id !== report.id));
      showToast(t('admin.deleteSuccess'));
    } catch (err) {
      showToast(err instanceof Error ? err.message : t('common.error'), 'error');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <Loading message={t('common.loading')} />;

  const counters = [
    { key: 'total', value: reports.length },
    {
      key: 'nouveau',
      value: reports.filter((r) => r.statut === CivicReportStatus.Nouveau).length,
    },
    {
      key: 'transmis',
      value: reports.filter((r) => r.statut === CivicReportStatus.Transmis).length,
    },
  ];

  return (
    <div className="space-y-5">
      <AdminPageHeader
        title={t('adminSpace.reports.title')}
        subtitle={t('adminSpace.reports.subtitle')}
        action={
          <a
            href={toTelHref(ALLO_MAIRIE_PHONE)}
            className="inline-flex items-center justify-center min-h-[44px] px-4 rounded-xl bg-chartrons-bordeaux text-white text-sm font-semibold shadow-sm hover:bg-chartrons-bordeaux-light"
          >
            📞 {ALLO_MAIRIE_PHONE}
          </a>
        }
      />

      <section className="grid grid-cols-3 gap-3">
        {counters.map((counter) => (
          <Card key={counter.key} className="text-center !p-4">
            <p className="text-2xl font-bold text-chartrons-bordeaux">{counter.value}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-chartrons-warm-gray mt-1">
              {t(`adminSpace.reports.counters.${counter.key}`)}
            </p>
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap gap-2">
        {(['all', CivicReportChannel.Mairie, CivicReportChannel.Police] as ChannelFilter[]).map(
          (value) => (
            <button
              key={value}
              type="button"
              onClick={() => setChannelFilter(value)}
              aria-pressed={channelFilter === value}
              className={`min-h-[40px] px-4 rounded-full text-xs font-semibold border transition-colors ${
                channelFilter === value
                  ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
                  : 'bg-white text-chartrons-olive-dark border-chartrons-beige hover:bg-chartrons-stone'
              }`}
            >
              {value === 'all' ? t('adminSpace.reports.filters.all') : t(`civic.routedTo.${value}`)}
            </button>
          ),
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📮" message={t('adminSpace.reports.empty')} />
      ) : (
        <div className="space-y-3">
          {filtered.map((report) => (
            <Card key={report.id} className="!p-4 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-chartrons-olive-dark">
                    {loc(i18n.language, REPORT_SUBCATEGORY_LABELS[report.subcategoryId])}
                  </p>
                  <p className="text-xs text-chartrons-warm-gray">
                    {report.lieu} · {formatDateTime(report.createdAt, i18n.language)}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge variant={report.channel === CivicReportChannel.Police ? 'brick' : 'green'}>
                    {t(`civic.routedTo.${report.channel}`)}
                  </Badge>
                  <Badge variant={STATUS_VARIANT[report.statut]}>
                    {t(`adminSpace.reports.status.${report.statut}`)}
                  </Badge>
                </div>
              </div>

              {report.details && (
                <p className="text-sm text-chartrons-olive-dark leading-relaxed whitespace-pre-wrap rounded-xl bg-chartrons-stone/60 border border-chartrons-beige p-3">
                  {report.details}
                </p>
              )}

              <div className="flex flex-col sm:flex-row sm:items-end gap-2">
                <div className="flex-1">
                  <Select
                    label={t('adminSpace.reports.changeStatus')}
                    value={report.statut}
                    disabled={busyId === report.id}
                    onChange={(event) =>
                      handleStatus(report, event.target.value as CivicReportStatus)
                    }
                    options={NEXT_STATUSES.map((statut) => ({
                      value: statut,
                      label: t(`adminSpace.reports.status.${statut}`),
                    }))}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={busyId === report.id}
                  onClick={() => handleDelete(report)}
                >
                  {t('common.delete')}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
