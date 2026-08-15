import type { ReactNode } from 'react';

export interface AdminColumn<T> {
  header: string;
  className?: string;
  render: (item: T) => ReactNode;
}

interface AdminDataTableProps<T extends { id: string }> {
  items: T[];
  columns: AdminColumn<T>[];
  mobileCard: (item: T) => ReactNode;
  empty: ReactNode;
}

export function AdminDataTable<T extends { id: string }>({
  items,
  columns,
  mobileCard,
  empty,
}: AdminDataTableProps<T>) {
  if (items.length === 0) return <>{empty}</>;

  return (
    <>
      <div className="lg:hidden space-y-3">{items.map((item) => mobileCard(item))}</div>
      <div className="hidden lg:block overflow-x-auto rounded-2xl border border-chartrons-beige bg-white/90 shadow-card">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-chartrons-beige bg-chartrons-beige/50">
              {columns.map((col) => (
                <th
                  key={col.header}
                  className={`px-4 py-3.5 font-semibold text-chartrons-warm-gray uppercase tracking-wide text-[11px] whitespace-nowrap ${col.className ?? ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-chartrons-beige/60 last:border-0 hover:bg-chartrons-stone/80 transition-colors"
              >
                {columns.map((col) => (
                  <td key={col.header} className={`px-4 py-3.5 align-middle ${col.className ?? ''}`}>
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
