import { resolveMediaUrl } from '../lib/media';

interface PlaceCoverProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

/** Photo of a place, or nothing if the URL was a retired generic placeholder. */
export function PlaceCover({ src, alt = '', className = 'w-full h-40 object-cover' }: PlaceCoverProps) {
  const resolved = resolveMediaUrl(src);
  if (!resolved) return null;
  return <img src={resolved} alt={alt} className={className} />;
}

/** Green / beige fallback when a listing has no real photo. */
export function BrandedCover({ className = 'w-full h-28' }: { className?: string }) {
  return (
    <div
      className={`bg-gradient-to-br from-chartrons-green via-chartrons-green-light to-chartrons-beige ${className}`}
      aria-hidden
    />
  );
}
