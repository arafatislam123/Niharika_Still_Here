import { useState } from 'react';
import type { Hotspot } from '../../lib/schema';
import { CreditedImage } from './CreditedImage';

/**
 * A flat image with numbered hotspot buttons. Used by site close-ups (FR-MAP-7) and by the
 * 3D viewer's static fallback (FR-3D-4), so both share the same hotspot data.
 */
export function HotspotImage({
  src,
  alt,
  credit,
  width,
  height,
  hotspots,
}: {
  src: string;
  alt: string;
  credit: string;
  width?: number;
  height?: number;
  hotspots: Hotspot[];
}) {
  const [active, setActive] = useState<string | null>(null);
  const current = hotspots.find((h) => h.id === active);

  return (
    <div>
      <CreditedImage
        src={src}
        alt={alt}
        credit={credit}
        width={width}
        height={height}
        overlay={hotspots.map((hotspot, i) => (
          <button
            key={hotspot.id}
            type="button"
            className="hotspot-pin"
            style={{ left: `${hotspot.x * 100}%`, top: `${hotspot.y * 100}%` }}
            aria-pressed={active === hotspot.id}
            aria-label={hotspot.label}
            onClick={() => setActive(hotspot.id)}
          >
            {i + 1}
          </button>
        ))}
      />
      <p aria-live="polite" className="hotspot-text">
        {current && (
          <>
            <strong>{current.label}</strong> {current.text}
          </>
        )}
      </p>
    </div>
  );
}
