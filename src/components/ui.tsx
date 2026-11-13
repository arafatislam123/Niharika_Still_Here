import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getSource } from '../data/sources';
import type { Artifact, ArtifactStatus, Fact } from '../data/types';
import { localizeArtifact, useLang } from '../i18n';
import { GuideTip } from './Guide';

const STATUS_CLASS: Record<ArtifactStatus, string> = {
  active: 'border-emerald-400/60 text-emerald-300',
  inactive: 'border-slate-400/60 text-slate-300',
  'mission-completed': 'border-sky-400/60 text-sky-300',
  'lost-contact': 'border-amber-400/60 text-amber-300',
  'partially-operational': 'border-lime-400/60 text-lime-300',
  unknown: 'border-slate-400/60 text-slate-300',
};

export function StatusBadge({ status }: { status: ArtifactStatus }) {
  const { t } = useLang();
  return <span className={`chip ${STATUS_CLASS[status]}`}>● {t(`status.${status}`)}</span>;
}

export function SourceLink({ sourceId, compact }: { sourceId: string; compact?: boolean }) {
  const { t } = useLang();
  const source = getSource(sourceId);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      lang="en"
      className="chip border-deep/40 text-deep hover:border-deep"
      title={source.title}
    >
      <span aria-hidden>🔗</span>
      {compact ? source.publisher : `${source.publisher}: ${source.title}`}
      <span className="sr-only">{t('common.newTab')}</span>
    </a>
  );
}

export function ReviewBadge() {
  const { t } = useLang();
  return (
    <span className="chip border-amber-400/50 text-amber-200" title={t('common.reviewingTitle')}>
      {t('common.reviewing')}
    </span>
  );
}

export function FactCard({ fact }: { fact: Fact }) {
  return (
    <li className="rounded-xl border border-line bg-raised/60 p-4">
      <p className="leading-relaxed">{fact.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceLink sourceId={fact.sourceId} compact />
        {fact.verification === 'needs-review' && <ReviewBadge />}
      </div>
    </li>
  );
}

export function PageHeader({
  eyebrow,
  title,
  icon,
  tip,
  children,
}: {
  eyebrow: string;
  title: string;
  /** A big emoji next to the title, so younger children recognise the page at a glance. */
  icon?: string;
  /** What to do on this page, said by Orbi the guide. */
  tip?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="container pb-6 pt-8 md:pt-12">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 flex items-center gap-3 font-display text-3xl font-extrabold md:text-5xl">
        {icon && (
          <span
            aria-hidden
            className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-raised text-3xl shadow-md md:h-16 md:w-16 md:text-4xl"
          >
            {icon}
          </span>
        )}
        {title}
      </h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-muted">{children}</div>}
      {tip && (
        <div className="mt-5 max-w-2xl">
          <GuideTip>{tip}</GuideTip>
        </div>
      )}
    </header>
  );
}

export function ArtifactCard({ artifact: raw }: { artifact: Artifact }) {
  const { lang, t } = useLang();
  const artifact = localizeArtifact(raw, lang);
  return (
    <Link
      to={`/artifacts/${artifact.id}`}
      className="card group flex h-full flex-col gap-3 transition hover:-translate-y-1 hover:border-accent"
      style={{ borderTopColor: artifact.color, borderTopWidth: 4 }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-4xl" aria-hidden>
          {artifact.icon}
        </span>
        <StatusBadge status={artifact.status} />
      </div>
      <div>
        <h3 className="font-display text-xl font-bold group-hover:text-accent">{artifact.name}</h3>
        <p className="text-sm text-muted">
          {artifact.mission} · {artifact.missionPeriod}
        </p>
      </div>
      <p className="flex-1 italic">“{artifact.tagline}”</p>
      <span className="text-sm font-semibold text-accent">{t('common.readStory')}</span>
    </Link>
  );
}
