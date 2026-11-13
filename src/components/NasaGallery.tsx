import { useEffect, useState } from 'react';
import { useLang } from '../i18n';
import { searchNasaImages, type NasaImage } from '../lib/nasaImages';

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'ready'; images: NasaImage[] };

/** Live photos from the NASA Image and Video Library for one search term. */
export default function NasaGallery({ query, count = 6 }: { query: string; count?: number }) {
  const { t } = useLang();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setState({ kind: 'loading' });
    searchNasaImages(query, count)
      .then((images) => alive && setState({ kind: 'ready', images }))
      .catch(() => alive && setState({ kind: 'error' }));
    return () => {
      alive = false;
    };
  }, [query, count, attempt]);

  if (state.kind === 'loading') {
    return (
      <div
        className="grid grid-cols-2 gap-3 md:grid-cols-3"
        aria-busy="true"
        aria-label={t('gallery.loading')}
      >
        {Array.from({ length: count }, (_, i) => (
          <div key={i} className="aspect-[4/3] animate-pulse rounded-xl bg-raised" />
        ))}
      </div>
    );
  }

  if (state.kind === 'error' || state.images.length === 0) {
    return (
      <div className="rounded-xl border border-line bg-raised/50 p-4 text-muted">
        <p>{state.kind === 'error' ? t('gallery.error') : t('gallery.empty')}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {state.kind === 'error' && (
            <button
              type="button"
              className="btn-ghost min-h-9 py-1 text-sm"
              onClick={() => setAttempt((a) => a + 1)}
            >
              {t('gallery.retry')}
            </button>
          )}
          <a
            className="btn-ghost min-h-9 py-1 text-sm"
            href={`https://images.nasa.gov/search?q=${encodeURIComponent(query)}`}
            target="_blank"
            rel="noreferrer"
          >
            {t('gallery.search')}
          </a>
        </div>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-2 gap-3 md:grid-cols-3" lang="en">
      {state.images.map((img) => (
        <li key={img.nasaId}>
          <a
            href={img.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="group block overflow-hidden rounded-xl border border-line bg-raised hover:border-accent"
          >
            <img
              src={img.thumbnail}
              alt={img.description || img.title}
              loading="lazy"
              className="aspect-[4/3] w-full object-cover transition group-hover:scale-105"
            />
            <div className="p-2 text-xs">
              <p className="line-clamp-2 font-semibold">{img.title}</p>
              <p className="mt-1 text-muted">
                NASA{img.center ? ` / ${img.center}` : ''}
                {img.date ? ` · ${img.date.slice(0, 4)}` : ''}
              </p>
            </div>
          </a>
        </li>
      ))}
    </ul>
  );
}
