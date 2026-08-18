interface ConciergeBeretLoaderProps {
  size?: 'sm' | 'md';
  label?: string;
}

export function ConciergeBeretLoader({ size = 'md', label }: ConciergeBeretLoaderProps) {
  const compact = size === 'sm';
  return (
    <div className={`inline-flex items-center gap-2 ${compact ? '' : 'flex-col'}`} role="status" aria-live="polite">
      <span className={`concierge-beret ${compact ? 'concierge-beret-sm' : ''}`} aria-hidden>
        <span className="concierge-beret-hat" />
        <span className="concierge-beret-pompom" />
        <span className="concierge-beret-face">
          <span className="concierge-beret-eye left" />
          <span className="concierge-beret-eye right" />
        </span>
      </span>
      {label && (
        <span className={`text-chartrons-warm-gray ${compact ? 'sr-only' : 'text-sm font-medium'}`}>{label}</span>
      )}
    </div>
  );
}
