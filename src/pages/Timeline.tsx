import { useState } from 'react';
import { Link } from 'react-router-dom';
import { getArtifact } from '../data/artifacts';
import { legacy, timeline } from '../data/worlds';
import { PageHeader, SourceLink } from '../components/ui';

const FILTERS = [
  { id: 'all', label: 'Everything' },
  { id: 'moon', label: 'Moon' },
  { id: 'mars', label: 'Mars' },
  { id: 'space', label: 'Deep space & planets' },
] as const;

const WORLD_DOT: Record<string, string> = {
  moon: 'bg-moon',
  mars: 'bg-mars',
  'deep-space': 'bg-deep',
  jupiter: 'bg-amber-300',
  venus: 'bg-yellow-200',
  earth: 'bg-sky-400',
};

export default function Timeline() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]['id']>('all');
  const events = timeline.filter((e) =>
    filter === 'all'
      ? true
      : filter === 'space'
        ? !['moon', 'mars'].includes(e.world)
        : e.world === filter,
  );

  return (
    <>
      <PageHeader eyebrow="Historical timeline" title="60 years of exploring">
        From the first planetary flyby to the return to the Moon. Our six forgotten explorers are
        highlighted. Tap one to read its story.
      </PageHeader>
      <div className="container">
        <div role="group" aria-label="Filter timeline" className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={`chip px-4 py-2 text-sm ${filter === f.id ? 'border-accent bg-accent text-space' : 'hover:border-accent'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        <ol className="relative mt-8 border-l-2 border-line pl-6 md:pl-10">
          {events.map((e) => {
            const artifact = e.artifactId ? getArtifact(e.artifactId) : undefined;
            return (
              <li key={`${e.date}-${e.title}`} className="relative mb-6">
                <span
                  aria-hidden
                  className={`absolute -left-[33px] top-4 h-4 w-4 rounded-full ring-4 ring-space md:-left-[49px] ${WORLD_DOT[e.world]}`}
                />
                <div className={`card ${artifact ? 'border-accent/50' : ''}`}>
                  <p className="text-sm font-bold text-accent">{e.date}</p>
                  <h2 className="mt-1 text-xl font-bold">{e.title}</h2>
                  <p className="mt-1 text-muted">{e.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <SourceLink sourceId={e.sourceId} compact />
                    {artifact && (
                      <Link
                        to={`/artifacts/${artifact.id}`}
                        className="chip border-accent/60 text-accent hover:bg-accent hover:text-space"
                      >
                        {artifact.icon} Read {artifact.shortName}’s story →
                      </Link>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>

        <section className="mt-14" aria-labelledby="legacy">
          <p className="eyebrow">Legacy of Discovery</p>
          <h2 id="legacy" className="mt-2 font-display text-3xl font-bold">
            Each mission opens the door for the next
          </h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2">
            {legacy.map((l) => (
              <li key={l.from + l.to} className="card">
                <p className="flex flex-wrap items-center gap-2 font-bold">
                  <span>{l.from}</span>
                  <span className="text-accent" aria-label="led to">
                    ➜
                  </span>
                  <span>{l.to}</span>
                </p>
                <p className="mt-2 text-muted">{l.text}</p>
                <div className="mt-3">
                  <SourceLink sourceId={l.sourceId} compact />
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
