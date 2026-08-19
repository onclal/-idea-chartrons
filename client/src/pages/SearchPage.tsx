import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LOCAL_RELAIS_PHONE, STATIC_MAP_POIS, isActiveAntiGaspiOffer, isCommunityEvent, isFleaMarketEvent, isResidentFeedPost, type ActeurLocal, type AgendaEvenement, type PostAnnonce } from '@idea-chartrons/shared';
import { Badge, Card, EmptyState, Loading } from '../components/ui';
import { PhoneLink } from '../components/PhoneLink';
import { DistanceBadge } from '../components/DistanceBadge';
import { matchesSearch, useSearch } from '../context/SearchContext';
import { api } from '../lib/api';

export function SearchPage() {
  const { t } = useTranslation();
  const { query, setQuery } = useSearch();
  const [params] = useSearchParams();
  const [posts, setPosts] = useState<PostAnnonce[]>([]);
  const [acteurs, setActeurs] = useState<ActeurLocal[]>([]);
  const [events, setEvents] = useState<AgendaEvenement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fromUrl = params.get('q') ?? '';
    if (fromUrl) setQuery(fromUrl);
  }, [params, setQuery]);

  useEffect(() => {
    setLoading(true);
    Promise.all([api.getPosts(), api.getActeurs(), api.getEvents()])
      .then(([postsData, acteursData, eventsData]) => {
        setPosts(postsData);
        setActeurs(acteursData);
        setEvents(eventsData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const q = query.trim();

  const matchedPosts = useMemo(
    () =>
      q
        ? posts.filter(
            (post) =>
              isResidentFeedPost(post) &&
              (matchesSearch(post.titre, q) ||
                matchesSearch(post.description, q) ||
                matchesSearch(post.telephone ?? '', q)),
          )
        : [],
    [posts, q],
  );

  const matchedAntiGaspi = useMemo(
    () =>
      q
        ? posts.filter(
            (post) =>
              isActiveAntiGaspiOffer(post) &&
              (matchesSearch(post.titre, q) ||
                matchesSearch(post.description, q) ||
                matchesSearch(post.commerceNom ?? '', q) ||
                matchesSearch(post.auteurNom ?? '', q)),
          )
        : [],
    [posts, q],
  );

  const matchedActeurs = useMemo(
    () =>
      q
        ? acteurs.filter(
            (acteur) =>
              matchesSearch(acteur.nomCommerce, q) ||
              matchesSearch(acteur.description, q) ||
              matchesSearch(acteur.adresse, q) ||
              matchesSearch(acteur.telephone ?? '', q) ||
              matchesSearch(acteur.specialite ?? '', q),
          )
        : [],
    [acteurs, q],
  );

  const matchedEvents = useMemo(
    () =>
      q
        ? events.filter(
            (event) =>
              (isCommunityEvent(event) || isFleaMarketEvent(event)) &&
              (matchesSearch(event.titre, q) ||
                matchesSearch(event.description, q) ||
                matchesSearch(event.lieu ?? '', q)),
          )
        : [],
    [events, q],
  );

  const matchedPois = useMemo(
    () =>
      q
        ? STATIC_MAP_POIS.filter((poi) => {
            const haystack = `${t(poi.titleKey)} ${t(poi.descriptionKey)} ${poi.adresse} ${poi.telephone ?? LOCAL_RELAIS_PHONE}`;
            return matchesSearch(haystack, q);
          })
        : [],
    [q, t],
  );

  const total =
    matchedPosts.length +
    matchedAntiGaspi.length +
    matchedActeurs.length +
    matchedEvents.length +
    matchedPois.length;

  if (loading) return <Loading message={t('common.loading')} />;

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h2 className="text-xl font-bold text-chartrons-bordeaux">{t('search.title')}</h2>
        {q ? (
          <p className="text-sm text-chartrons-warm-gray mt-1">
            {t('search.results', { count: total, query: q })}
          </p>
        ) : (
          <p className="text-sm text-chartrons-warm-gray mt-1">{t('search.emptyHint')}</p>
        )}
      </div>

      {!q ? (
        <EmptyState icon="🔍" title={t('search.title')} message={t('search.emptyHint')} />
      ) : total === 0 ? (
        <EmptyState icon="🔍" title={t('search.noResultsTitle')} message={t('search.noResultsHint')} />
      ) : (
        <>
          {matchedPosts.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('search.sectionPosts')}
              </h3>
              {matchedPosts.map((post) => (
                <Link key={post.id} to="/posts">
                  <Card className="!p-4 hover:shadow-card-hover">
                    <p className="font-semibold text-chartrons-olive-dark">{post.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1 line-clamp-2">{post.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="brick">{t(`posts.types.${post.type}`)}</Badge>
                      <PhoneLink phone={post.telephone} />
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {matchedAntiGaspi.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('antigaspi.title')}
              </h3>
              {matchedAntiGaspi.map((post) => (
                <Link key={post.id} to="/anti-gaspi">
                  <Card className="!p-4 hover:shadow-card-hover">
                    <p className="font-semibold text-chartrons-olive-dark">{post.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1 line-clamp-2">{post.description}</p>
                    <div className="mt-2">
                      <Badge variant="olive" icon="♻️">
                        {t('antigaspi.badge')}
                      </Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {matchedActeurs.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('search.sectionActeurs')}
              </h3>
              {matchedActeurs.map((acteur) => (
                <Link key={acteur.id} to="/acteurs">
                  <Card className="!p-4 hover:shadow-card-hover">
                    <p className="font-semibold text-chartrons-olive-dark">{acteur.nomCommerce}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1 line-clamp-2">{acteur.description}</p>
                    <DistanceBadge latitude={acteur.latitude} longitude={acteur.longitude} className="mt-1" />
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <Badge variant="olive">{t(`acteurs.categories.${acteur.categorie}`)}</Badge>
                      <PhoneLink phone={acteur.telephone} />
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {matchedEvents.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('search.sectionEvents')}
              </h3>
              {matchedEvents.map((event) => (
                <Link key={event.id} to={isFleaMarketEvent(event) ? '/brocanteurs' : '/events'}>
                  <Card className="!p-4 hover:shadow-card-hover">
                    <p className="font-semibold text-chartrons-olive-dark">{event.titre}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1 line-clamp-2">{event.description}</p>
                    {event.lieu && (
                      <p className="text-xs text-chartrons-warm-gray mt-1">📍 {event.lieu}</p>
                    )}
                    <div className="mt-2">
                      <Badge variant="brick">{t(`events.types.${event.type}`)}</Badge>
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}

          {matchedPois.length > 0 && (
            <section className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-chartrons-olive">
                {t('search.sectionMap')}
              </h3>
              {matchedPois.map((poi) => (
                <Link key={poi.id} to={poi.href}>
                  <Card className="!p-4 hover:shadow-card-hover">
                    <p className="font-semibold text-chartrons-olive-dark">{t(poi.titleKey)}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1">{t(poi.descriptionKey)}</p>
                    <p className="text-xs text-chartrons-warm-gray mt-1">📍 {poi.adresse}</p>
                    <div className="mt-2">
                      <PhoneLink phone={poi.telephone ?? (poi.kind === 'relais' ? LOCAL_RELAIS_PHONE : null)} />
                    </div>
                  </Card>
                </Link>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
