interface EmailLinkProps {
  email: string | null | undefined;
  className?: string;
}

export function EmailLink({ email, className = '' }: EmailLinkProps) {
  const trimmed = email?.trim() ?? '';
  if (!trimmed.includes('@')) return null;

  return (
    <a
      href={`mailto:${trimmed}`}
      className={`inline-flex items-center gap-1.5 text-sm font-semibold text-chartrons-bordeaux hover:underline touch-target ${className}`}
      onClick={(event) => event.stopPropagation()}
    >
      ✉️ {trimmed}
    </a>
  );
}
