import { artifacts } from '../data/artifacts';
import { sources } from '../data/sources';
import { PageHeader } from '../components/ui';
import { useLang } from '../i18n';

const CREDITS = [
  'sources.c1',
  'sources.c2',
  'sources.c3',
  'sources.c4',
  'sources.c5',
  'sources.c6',
  'sources.c7',
] as const;

export default function Sources() {
  const { t, n } = useLang();
  const facts = artifacts.flatMap((a) => a.facts);
  const pending = facts.filter((f) => f.verification === 'needs-review').length;

  return (
    <>
      <PageHeader icon="🔗" eyebrow={t('sources.eyebrow')} title={t('sources.title')}>
        {t('sources.lead')}
      </PageHeader>
      <div className="container grid gap-8">
        <section className="card">
          <h2 className="font-display text-xl font-bold">{t('sources.status')}</h2>
          <p className="mt-2">
            {t('sources.statusText', {
              ok: n(facts.length - pending),
              total: n(facts.length),
              pending: n(pending),
            })}
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl font-bold">{t('sources.list')}</h2>
          <ul className="mt-4 grid gap-2" lang="en">
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
          <h2 className="font-display text-xl font-bold text-ink">{t('sources.credits')}</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5">
            {CREDITS.map((key) => (
              <li key={key}>{t(key)}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
