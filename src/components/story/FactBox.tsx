import { useState } from 'react';
import { getSource } from '../../lib/content';
import { useT } from '../../lib/prefs';
import type { Fact } from '../../lib/schema';
import { ExternalLink } from '../common/ExternalLink';
import { RichText } from './RichText';

const COLLAPSED_COUNT = 3;

/** Verified facts, each with a visible source link (FR-MCH-4). Collapsed to 3 (spec 7.4). */
export function FactBox({ facts }: { facts: Fact[] }) {
  const t = useT();
  const [expanded, setExpanded] = useState(false);
  const shown = expanded ? facts : facts.slice(0, COLLAPSED_COUNT);

  return (
    <aside className="factbox" aria-labelledby="facts-heading">
      <h2 id="facts-heading">{t('facts.heading')}</h2>
      <ul className="space-y-4">
        {shown.map((fact) => {
          const source = getSource(fact.sourceId);
          return (
            <li key={fact.id}>
              <p>
                <RichText text={fact.text} inline />
              </p>
              {source && (
                <ExternalLink href={source.url} className="source-link">
                  {t('facts.source', { publisher: source.publisher, title: source.title })}
                </ExternalLink>
              )}
              {import.meta.env.DEV && !source?.verified && (
                <span className="dev-badge">{t('dev.unverified')}</span>
              )}
            </li>
          );
        })}
      </ul>
      {facts.length > COLLAPSED_COUNT && (
        <button
          type="button"
          className="btn btn-ghost mt-4"
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? t('facts.showFewer') : t('facts.showAll', { count: facts.length })}
        </button>
      )}
    </aside>
  );
}
