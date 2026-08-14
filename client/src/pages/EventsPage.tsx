import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { EventType, type AgendaEvenement } from '@idea-chartrons/shared';
import { Badge, Button, Card, EmptyState, Loading } from '../components/ui';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { api } from '../lib/api';

const EVENT_FILTERS = ['all', ...Object.values(EventType)] as const;
type EventFilter = (typeof EVENT_FILTERS)[number];

function formatDate(dateStr: string, locale: string) {
  return new Date(dateStr).toLocaleDateString(locale === 'fr' ? 'fr-FR' : 'en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function generateIcs(event: AgendaEvenement): string {
  const formatIcsDate = (d: string) => new Date(d).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//IDEA CHARTRONS//FR',
    'BEGIN:VEVENT',
    `UID:${event.id}@idea-chartrons.fr`,
    `DTSTART:${formatIcsDate(event.dateDebut)}`,
    `DTEND:${formatIcsDate(event.dateFin)}`,
    `SUMMARY:${event.titre}`,
    `DESCRIPTION:${event.description.replace(/\n/g, '\\n')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

function addToCalendar(event: AgendaEvenement) {
  const ics = generateIcs(event);
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.titre.replace(/\s+/g, '-').toLowerCase()}.ics`;
  link.click();
  URL.revokeObjectURL(url);
}

function isUpcoming(event: AgendaEvenement): boolean {
  return new Date(event.dateFin).getTime() >= Date.now();
}

function isUpcomingBrocante(event: AgendaEvenement): boolean {
  if (event.type !== EventType.Brocante) return false;
  const start = new Date(event.dateDebut);
  const now = new Date();
  const inSevenDays = new Date(now.getTime() + 7 * 86400000);
  return start >= now && start <= inSevenDays;
}

export function EventsPage() {
  const { t, i18n } = useTranslation();
  const { query } = useSearch();
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<EventFilter>('all');

  const { showToast } = useToast();

  useEffect(() => {
    api.getEvents()
      .then(setEvents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filteredEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => {
        const matchesType = typeFilter === 'all' || e.type === typeFilter;
        const matchesQuery =
          matchesSearch(e.titre, query) || matchesSearch(e.description, query);
        return matchesType && matchesQuery;
      })
      .sort((a, b) => {
        const aUpcoming = new Date(a.dateDebut).getTime() >= now;
        const bUpcoming = new Date(b.dateDebut).getTime() >= now;
        if (aUpcoming && !bUpcoming) return -1;
        if (!aUpcoming && bUpcoming) return 1;
        return new Date(a.dateDebut).getTime() - new Date(b.dateDebut).getTime();
      });
  }, [events, query, typeFilter]);

  const handleAddToCalendar = (event: AgendaEvenement) => {
    addToCalendar(event);
    setAddedIds((prev) => new Set(prev).add(event.id));
    showToast(t('toast.eventAdded'));
  };

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('events.title')}</h2>
        <p className="text-sm text-chartrons-warm-gray mt-1">{t('events.subtitle')}</p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {EVENT_FILTERS.map((ft) => (
          <button
            key={ft}
            onClick={() => setTypeFilter(ft)}
            className={`shrink-0 touch-target px-4 py-2 rounded-full text-xs font-semibold border transition-all ${
              typeFilter === ft
                ? 'bg-chartrons-bordeaux text-white border-chartrons-bordeaux'
                : 'bg-white text-chartrons-olive-dark border-chartrons-beige'
            }`}
          >
            {ft === 'all' ? t('events.filters.all') : t(`events.types.${ft}`)}
          </button>
        ))}
      </div>

      {filteredEvents.length === 0 ? (
        <EmptyState
          icon={query ? '🔍' : '📅'}
          title={query ? t('search.noResultsTitle') : t('events.emptyTitle')}
          message={query ? t('search.noResultsHint') : t('events.emptyHint')}
        />
      ) : (
        <div className="space-y-3">
          {filteredEvents.map((event) => {
            const upcoming = isUpcoming(event);
            const brocanteSoon = isUpcomingBrocante(event);
            return (
              <Card
                key={event.id}
                className={`!p-0 overflow-hidden ${!upcoming ? 'opacity-60' : ''}`}
              >
                {event.image && (
                  <div className="relative">
                    <img src={event.image} alt="" className="w-full h-40 object-cover" />
                    {brocanteSoon && (
                      <div className="absolute top-3 left-3">
                        <Badge variant="brocante" icon="🎪">{t('badges.brocante')}</Badge>
                      </div>
                    )}
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-chartrons-olive-dark text-base">{event.titre}</h3>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <Badge variant={event.type === EventType.Brocante ? 'brocante' : 'brick'}>
                        {t(`events.types.${event.type}`)}
                      </Badge>
                      {!upcoming && <Badge variant="stone">{t('events.past')}</Badge>}
                    </div>
                  </div>
                  {!event.image && brocanteSoon && (
                    <Badge variant="brocante" icon="🎪" className="mb-2">{t('badges.brocante')}</Badge>
                  )}
                  <p className="text-sm text-chartrons-warm-gray mb-2 leading-relaxed">{event.description}</p>
                  <p className="text-xs font-semibold text-chartrons-bordeaux mb-3">
                    🕐 {formatDate(event.dateDebut, i18n.language)}
                    {event.dateFin !== event.dateDebut && (
                      <> → {formatDate(event.dateFin, i18n.language)}</>
                    )}
                  </p>
                  {upcoming && (
                    <Button
                      variant={addedIds.has(event.id) ? 'secondary' : 'bordeaux'}
                      size="md"
                      className="w-full"
                      onClick={() => handleAddToCalendar(event)}
                    >
                      {addedIds.has(event.id) ? `✓ ${t('events.added')}` : `📅 ${t('events.addToCalendar')}`}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
