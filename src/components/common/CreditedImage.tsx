import type { ReactNode } from 'react';
import { publicUrl } from '../../lib/content';
import { useT } from '../../lib/prefs';

/** Every image carries a visible credit line (FR-SRC-2). `overlay` is for hotspot buttons. */
export function CreditedImage({
  src,
  alt,
  credit,
  width,
  height,
  overlay,
  eager = false,
}: {
  src: string;
  alt: string;
  credit: string;
  width?: number;
  height?: number;
  overlay?: ReactNode;
  eager?: boolean;
}) {
  const t = useT();
  return (
    <figure className="credited-image">
      <div className="relative">
        <img
          src={publicUrl(src)}
          alt={alt}
          width={width}
          height={height}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          className="w-full h-auto rounded-xl"
        />
        {overlay}
      </div>
      <figcaption className="credit">{t('common.credit', { credit })}</figcaption>
    </figure>
  );
}
