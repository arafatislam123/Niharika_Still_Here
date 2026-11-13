import { useState } from 'react';
import { artifacts } from '../data/artifacts';
import { worlds } from '../data/worlds';
import type { WorldId } from '../data/types';
import { ArtifactCard, PageHeader } from '../components/ui';
import { localizeWorld, useLang } from '../i18n';

export default function Artifacts() {
  const { t, lang } = useLang();
  const [filter, setFilter] = useState<WorldId | 'all'>('all');
  const shown = filter === 'all' ? artifacts : artifacts.filter((a) => a.world === filter);
  const filters = [
    { id: 'all' as const, name: t('artifacts.all') },
    ...worlds.map((w) => ({ id: w.id, name: localizeWorld(w, lang).name })),
  ];

  return (
    <>
      <PageHeader
        icon="📖"
        tip={t('tip.artifacts')}
        eyebrow={t('artifacts.eyebrow')}
        title={t('artifacts.title')}
      >
        {t('artifacts.lead')}
      </PageHeader>
      <div className="container">
        <div role="group" aria-label={t('artifacts.filter')} className="flex flex-wrap gap-2">
          {filters.map((w) => (
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
