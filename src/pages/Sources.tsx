import { artifacts } from '../data/artifacts';
import { sources } from '../data/sources';
import { PageHeader } from '../components/ui';

export default function Sources() {
  const facts = artifacts.flatMap((a) => a.facts);
  const pending = facts.filter((f) => f.verification === 'needs-review').length;

  return (
    <>
      <PageHeader eyebrow="Sources & credits" title="Where our facts come from">
        Historical accuracy matters more than anything else on this site. Every fact links to a NASA
        page. Facts marked “being double-checked” are still waiting for a second team member to
        confirm them against the source.
      </PageHeader>
      <div className="container grid gap-8">
        <section className="card">
          <h2 className="font-display text-xl font-bold">Fact check status</h2>
          <p className="mt-2">
            {facts.length - pending} of {facts.length} facts verified · {pending} being
            double-checked.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold">NASA sources</h2>
          <ul className="mt-4 grid gap-2">
            {sources.map((s) => (
              <li key={s.id} className="rounded-xl border border-line bg-surface p-4">
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold text-deep underline"
                >
                  {s.title}
                </a>
                <p className="text-sm text-muted">{s.publisher}</p>
              </li>
            ))}
          </ul>
        </section>
        <section className="card text-sm text-muted">
          <h2 className="font-display text-xl font-bold text-ink">Data, images & credits</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            <li>
              Photos are loaded live from the{' '}
              <a
                className="underline"
                href="https://images.nasa.gov/"
                target="_blank"
                rel="noreferrer"
              >
                NASA Image and Video Library
              </a>{' '}
              via its public API. Each photo links to its NASA record with full credit. NASA images
              are generally not copyrighted, but NASA must be credited and its logos may not imply
              endorsement.
            </li>
            <li>
              Planet surfaces in the 3D scenes are artistic, computer-generated textures, not real
              maps. Distances and sizes are not to scale.
            </li>
            <li>Artifact pins use published landing or final-location coordinates.</li>
            <li>
              The explorers’ first-person stories are imagined narration based on the cited facts.
            </li>
            <li>
              The Mars Explorer game is a simplified educational simulation, not real rover physics.
            </li>
            <li>
              This is an independent NASA Space Apps Challenge project. No NASA endorsement is
              implied.
            </li>
          </ul>
        </section>
      </div>
    </>
  );
}
