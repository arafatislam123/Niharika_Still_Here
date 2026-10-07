import { useEffect, useState } from 'react';
import { useT } from '../../lib/prefs';
import type { Beat } from '../../lib/schema';

/** Sticky beat progress (FR-MCH-2). Each dot is a 44px link to its section. */
export function ProgressDots({ beats }: { beats: Beat[] }) {
  const t = useT();
  const [active, setActive] = useState(beats[0]?.key);

  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const key = (entry.target as HTMLElement).dataset.beat;
          if (entry.isIntersecting && key) setActive(key as Beat['key']);
        }
      },
      { rootMargin: '-45% 0px -50% 0px' },
    );
    for (const beat of beats) {
      const el = document.getElementById(`beat-${beat.key}`);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [beats]);

  return (
    <nav aria-label={t('beat.progress')} className="progress-dots">
      <ol>
        {beats.map((beat, i) => (
          <li key={beat.key}>
            <a
              href={`#beat-${beat.key}`}
              className="dot"
              aria-current={active === beat.key ? 'step' : undefined}
            >
              <span className="sr-only">
                {t('beat.kicker', { n: i + 1, name: t(`beat.${beat.key}`) })}
              </span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}
