import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { getSource } from '../data/sources';
import type { Artifact, ArtifactStatus, Fact } from '../data/types';

export const STATUS_LABELS: Record<ArtifactStatus, { label: string; className: string }> = {
  active: { label: 'Active', className: 'border-emerald-400/60 text-emerald-300' },
  inactive: { label: 'Inactive', className: 'border-slate-400/60 text-slate-300' },
  'mission-completed': { label: 'Mission Completed', className: 'border-sky-400/60 text-sky-300' },
  'lost-contact': { label: 'Lost Contact', className: 'border-amber-400/60 text-amber-300' },
  'partially-operational': {
    label: 'Partially Operational',
    className: 'border-lime-400/60 text-lime-300',
  },
  unknown: { label: 'Unknown', className: 'border-slate-400/60 text-slate-300' },
};

export function StatusBadge({ status }: { status: ArtifactStatus }) {
  const s = STATUS_LABELS[status];
  return <span className={`chip ${s.className}`}>● {s.label}</span>;
}

export function SourceLink({ sourceId, compact }: { sourceId: string; compact?: boolean }) {
  const source = getSource(sourceId);
  return (
    <a
      href={source.url}
      target="_blank"
      rel="noreferrer"
      className="chip border-deep/40 text-deep hover:border-deep"
      title={source.title}
    >
      <span aria-hidden>🔗</span>
      {compact ? source.publisher : `${source.publisher}: ${source.title}`}
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  );
}

export function FactCard({ fact }: { fact: Fact }) {
  return (
    <li className="rounded-xl border border-line bg-raised/60 p-4">
      <p className="leading-relaxed">{fact.text}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <SourceLink sourceId={fact.sourceId} compact />
        {fact.verification === 'needs-review' && (
          <span
            className="chip border-amber-400/50 text-amber-200"
            title="A team member still has to check this fact against the source."
          >
            ⚠ Being double-checked
          </span>
        )}
      </div>
    </li>
  );
}

export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <header className="container pb-6 pt-10 md:pt-14">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-2 font-display text-3xl font-bold md:text-5xl">{title}</h1>
      {children && <div className="mt-4 max-w-2xl text-lg text-muted">{children}</div>}
    </header>
  );
}

export function ArtifactCard({ artifact }: { artifact: Artifact }) {
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
      <span className="text-sm font-semibold text-accent">Read the story →</span>
    </Link>
  );
}
