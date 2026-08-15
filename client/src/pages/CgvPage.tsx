import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui';

export function CgvPage() {
  const { t } = useTranslation();
  const articles = t('legal.articles', { returnObjects: true });
  const articleList = Array.isArray(articles)
    ? (articles as Array<{ title: string; body: string }>)
    : [];

  return (
    <article className="animate-fade-in pb-4">
      <header className="mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-chartrons-brass mb-2">
          {t('legal.kicker')}
        </p>
        <h1 className="text-2xl sm:text-3xl font-bold text-chartrons-bordeaux leading-tight">
          {t('legal.title')}
        </h1>
        <p className="text-sm text-chartrons-warm-gray mt-2 leading-relaxed">{t('legal.updated')}</p>
      </header>

      <p className="text-sm sm:text-base text-chartrons-olive-dark leading-relaxed mb-6">
        {t('legal.intro')}
      </p>

      <div className="space-y-6">
        {articleList.map((article, index) => (
          <section
            key={article.title}
            className="rounded-2xl bg-white/80 border border-chartrons-beige p-4 sm:p-5 shadow-card"
          >
            <h2 className="text-base sm:text-lg font-bold text-chartrons-bordeaux mb-2">
              {t('legal.article', { n: index + 1 })} — {article.title}
            </h2>
            <p className="text-sm text-chartrons-olive-dark leading-relaxed whitespace-pre-line">
              {article.body}
            </p>
          </section>
        ))}
      </div>

      <p className="text-xs text-chartrons-warm-gray mt-6 leading-relaxed">{t('legal.disclaimer')}</p>

      <Link to="/" className="inline-flex mt-6">
        <Button variant="secondary">{t('common.back')}</Button>
      </Link>
    </article>
  );
}
