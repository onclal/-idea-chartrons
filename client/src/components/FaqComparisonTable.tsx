import { useTranslation } from 'react-i18next';
import { FAQ_COMPARISON } from '../data/faqData';
import { loc } from '../lib/locale';

export function FaqComparisonTable() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return (
    <section className="rounded-2xl border border-chartrons-beige overflow-hidden bg-white shadow-card">
      <div className="px-4 py-3 bg-gradient-to-r from-chartrons-beige/80 to-white">
        <h3 className="text-base font-bold text-chartrons-green-dark">{loc(lang, FAQ_COMPARISON.title)}</h3>
        <p className="text-xs text-chartrons-warm-gray mt-1 leading-relaxed">{loc(lang, FAQ_COMPARISON.subtitle)}</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[320px] text-sm">
          <thead>
            <tr className="border-t border-chartrons-beige">
              <th className="text-left px-3 py-2.5 font-semibold text-chartrons-olive-dark">{' '}</th>
              <th className="text-left px-3 py-2.5 font-semibold text-chartrons-olive-dark">
                {loc(lang, FAQ_COMPARISON.freeHeader)}
              </th>
              <th className="text-left px-3 py-2.5 font-semibold text-chartrons-green">
                {loc(lang, FAQ_COMPARISON.premiumHeader)}
              </th>
            </tr>
          </thead>
          <tbody>
            {FAQ_COMPARISON.rows.map((row) => (
              <tr key={row.id} className="border-t border-chartrons-beige/80">
                <td className="px-3 py-2.5 font-medium text-chartrons-olive-dark">{loc(lang, row.feature)}</td>
                <td className="px-3 py-2.5 text-chartrons-warm-gray">{loc(lang, row.free)}</td>
                <td className="px-3 py-2.5 text-chartrons-green-dark font-medium">{loc(lang, row.premium)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
