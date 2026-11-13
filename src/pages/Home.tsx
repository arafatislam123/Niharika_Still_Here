import { lazy, Suspense } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { artifacts, artifactsIn } from '../data/artifacts';
import { worlds } from '../data/worlds';
import { ArtifactCard } from '../components/ui';

const SolarSystem = lazy(() => import('../three/SolarSystem'));

const FEATURES = [
  {
    to: '/explore',
    icon: '🪐',
    title: '3D Explorer',
    text: 'Spin the solar system and visit the places our machines rest.',
  },
  {
    to: '/artifacts',
    icon: '📖',
    title: 'Story Engine',
    text: 'Read or listen to each explorer tell its own true story.',
  },
  {
    to: '/ask',
    icon: '💬',
    title: 'AI Explorer',
    text: 'Ask a rover a question. Every answer shows its NASA source.',
  },
  {
    to: '/game',
    icon: '🎮',
    title: 'Mission Game',
    text: 'Drive a rover on Mars, collect samples and survive a dust storm.',
  },
];

export default function Home() {
  const navigate = useNavigate();

  return (
    <>
      <section className="container grid items-center gap-8 pb-10 pt-10 lg:grid-cols-[1fr_1.4fr] lg:pt-16">
        <div>
          <p className="eyebrow">A journey through space history</p>
          <h1 className="mt-3 font-display text-4xl font-bold leading-tight md:text-6xl">
            Their missions ended.
            <br />
            <span className="text-accent">Their stories live on.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted">
            Meet the forgotten explorers of our solar system: the landers, rovers and spacecraft
            NASA sent out, which are still out there today. Every fact comes from NASA records.
          </p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/explore" className="btn-primary">
              Explore the universe →
            </Link>
            <Link to="/artifacts/opportunity" className="btn-ghost">
              Meet Opportunity
            </Link>
          </div>
        </div>
        <Suspense
          fallback={<div className="h-[60vh] min-h-[380px] animate-pulse rounded-3xl bg-surface" />}
        >
          <SolarSystem onSelect={(w) => navigate(`/explore/${w}`)} />
        </Suspense>
      </section>

      <section className="container py-10" aria-labelledby="destinations">
        <h2 id="destinations" className="font-display text-3xl font-bold">
          Choose your destination
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {worlds.map((w) => (
            <Link
              key={w.id}
              to={`/explore/${w.id}`}
              className="card group relative overflow-hidden transition hover:-translate-y-1 hover:border-accent"
            >
              <div
                aria-hidden
                className="absolute -right-10 -top-10 h-40 w-40 rounded-full opacity-80 blur-[1px]"
                style={{
                  background: `radial-gradient(circle at 35% 35%, white, ${w.color} 45%, #000 100%)`,
                }}
              />
              <p className="eyebrow">
                {artifactsIn(w.id).length}{' '}
                {artifactsIn(w.id).length === 1 ? 'explorer' : 'explorers'}
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold group-hover:text-accent">
                {w.name}
              </h3>
              <p className="mt-2 max-w-[75%] text-muted">{w.tagline}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="container py-10" aria-labelledby="features">
        <h2 id="features" className="font-display text-3xl font-bold">
          Four ways to explore
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <li key={f.to}>
              <Link to={f.to} className="card block h-full transition hover:border-accent">
                <span className="text-3xl" aria-hidden>
                  {f.icon}
                </span>
                <h3 className="mt-3 text-lg font-bold">{f.title}</h3>
                <p className="mt-1 text-muted">{f.text}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container py-10" aria-labelledby="explorers">
        <div className="flex items-end justify-between gap-4">
          <h2 id="explorers" className="font-display text-3xl font-bold">
            Meet the explorers
          </h2>
          <Link to="/artifacts" className="text-sm font-semibold text-accent">
            See all →
          </Link>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {artifacts.map((a) => (
            <ArtifactCard key={a.id} artifact={a} />
          ))}
        </div>
      </section>

      <section className="container py-10">
        <blockquote className="card text-center">
          <p className="font-display text-2xl md:text-3xl">
            “When a space mission ends, its journey does not disappear. Its discoveries remain, and
            its machines become part of our history.”
          </p>
        </blockquote>
      </section>
    </>
  );
}
