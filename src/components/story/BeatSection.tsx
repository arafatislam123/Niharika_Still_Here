import { useRef } from 'react';
import { useRevealOnScroll } from '../../lib/a11y';
import { usePrefs, useT } from '../../lib/prefs';
import type { Beat } from '../../lib/schema';
import { RichText } from './RichText';

export function BeatSection({ beat, index }: { beat: Beat; index: number }) {
  const t = useT();
  const { readingMode, reducedMotion } = usePrefs();
  const ref = useRef<HTMLElement>(null);
  const visible = useRevealOnScroll(ref, reducedMotion);
  const headingId = `beat-${beat.key}-heading`;

  return (
    <section
      id={`beat-${beat.key}`}
      ref={ref}
      data-beat={beat.key}
      aria-labelledby={headingId}
      className={`beat ${visible ? 'is-visible' : ''}`}
    >
      <p className="kicker">
        {t('beat.kicker', { n: index + 1, name: t(`beat.${beat.key}`) })}
      </p>
      <h2 id={headingId}>{beat.title}</h2>
      <div className="prose-body">
        <RichText text={beat[readingMode]} />
      </div>
    </section>
  );
}
