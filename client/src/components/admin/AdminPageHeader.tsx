import type { ReactNode } from 'react';

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}

export function AdminPageHeader({ title, subtitle, action }: AdminPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between mb-5 lg:mb-7">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold text-chartrons-bordeaux tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-chartrons-warm-gray mt-1 leading-relaxed">{subtitle}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
