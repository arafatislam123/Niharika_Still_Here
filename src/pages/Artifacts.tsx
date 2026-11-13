import { useState } from 'react';
import { artifacts } from '../data/artifacts';
import { worlds } from '../data/worlds';
import type { WorldId } from '../data/types';
import { ArtifactCard, PageHeader } from '../components/ui';

export default function Artifacts() {
  const [filter, setFilter] = useState<WorldId | 'all'>('all');
  const shown = filter === 'all' ? artifacts : artifacts.filter((a) => a.world === filter);

  return (
    <>
      <PageHeader eyebrow="Artifact catalogue" title="The forgotten explorers">
        Six machines across the Moon, Mars and deep space. None of them is “just junk”: each one
        finished a mission and taught us something new.
      </PageHeader>
      <div className="container">
        <div role="group" aria-label="Filter by destination" className="flex flex-wrap gap-2">
          {[{ id: 'all' as const, name: 'All' }, ...worlds].map((w) => (
            <button
              key={w.id}
              type="button"
              aria-pressed={filter === w.id}
              onClick={() => setFilter(w.id)}
              className={`chip px-4 py-2 text-sm ${filter === w.id ? 'border-accent bg-accent text-space' : 'hover:border-accent'}`}
            >
              {w.name}
            </button>
          ))}
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((a) => (
            <ArtifactCard key={a.id} artifact={a} />
          ))}
        </div>
      </div>
    </>
  );
}
