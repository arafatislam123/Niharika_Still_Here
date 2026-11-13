import { useState } from 'react';
import { quizzes } from '../data/quizzes';
import type { Quiz } from '../data/types';
import { PageHeader, SourceLink } from '../components/ui';
import { localizeQuiz, useLang } from '../i18n';
import type { StringKey } from '../i18n/strings';
import { BADGES, recordQuiz, resetProgress, useProgress } from '../lib/progress';

function QuizRunner({ quiz: raw, onExit }: { quiz: Quiz; onExit: () => void }) {
  const { t, lang, n } = useLang();
  const quiz = localizeQuiz(raw, lang);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = quiz.questions[index];
  const total = quiz.questions.length;

  if (finished) {
    const perfect = score === total;
    return (
      <div className="card text-center" role="status">
        <p className="text-5xl" aria-hidden>
          {perfect ? '🏆' : score >= total / 2 ? '🌟' : '🚀'}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold">
          {t('learn.result', { score: n(score), total: n(total) })}
        </h2>
        <p className="mt-2 text-muted">{perfect ? t('learn.perfect') : t('learn.try')}</p>
        <div className="mt-5 flex justify-center gap-2">
          <button
            type="button"
            className="btn-primary"
            onClick={() => {
              setIndex(0);
              setPicked(null);
              setScore(0);
              setFinished(false);
            }}
          >
            {t('learn.again')}
          </button>
          <button type="button" className="btn-ghost" onClick={onExit}>
            {t('learn.all')}
          </button>
        </div>
      </div>
    );
  }

  const choose = (i: number) => {
    if (picked !== null) return;
    setPicked(i);
    if (i === q.answer) setScore((s) => s + 1);
  };
  const next = () => {
    if (index === total - 1) {
      recordQuiz(quiz.id, score, total);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>{t('learn.questionOf', { n: n(index + 1), total: n(total) })}</span>
        <span>{t('learn.score', { score: n(score) })}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-raised">
        <div
          className="h-2 rounded-full bg-accent transition-all"
          style={{ width: `${(index / total) * 100}%` }}
        />
      </div>
      <h2 className="mt-5 font-display text-2xl font-bold">{q.question}</h2>
      <div className="mt-4 grid gap-2">
        {q.options.map((o, i) => {
          const state =
            picked === null
              ? 'hover:border-accent'
              : i === q.answer
                ? 'border-emerald-400 bg-emerald-900/40'
                : i === picked
                  ? 'border-red-400 bg-red-900/30'
                  : 'opacity-60';
          return (
            <button
              key={o}
              type="button"
              disabled={picked !== null}
              onClick={() => choose(i)}
              className={`btn-ghost justify-start text-left ${state}`}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-4 rounded-xl bg-raised/70 p-4" role="status">
          <p className="font-bold">{picked === q.answer ? t('learn.correct') : t('learn.wrong')}</p>
          <p className="mt-1">{q.explanation}</p>
          <div className="mt-2">
            <SourceLink sourceId={q.sourceId} compact />
          </div>
          <button type="button" className="btn-primary mt-4" onClick={next}>
            {index === total - 1 ? t('learn.seeScore') : t('learn.nextQ')}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const { t, lang, n } = useLang();
  const progress = useProgress();
  const [active, setActive] = useState<Quiz | null>(null);
  const earned = BADGES.filter((b) => b.earned(progress)).length;

  return (
    <>
      <PageHeader eyebrow={t('learn.eyebrow')} title={t('learn.title')}>
        {t('learn.lead')}
      </PageHeader>
      <div className="container grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="quizzes">
          <h2 id="quizzes" className="sr-only">
            {t('learn.quizzes')}
          </h2>
          {active ? (
            <QuizRunner key={lang} quiz={active} onExit={() => setActive(null)} />
          ) : (
            <ul className="grid gap-4">
              {quizzes.map((raw) => {
                const quiz = localizeQuiz(raw, lang);
                const best = progress.quizScores[quiz.id];
                return (
                  <li
                    key={quiz.id}
                    className="card flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="eyebrow">{t(`learn.difficulty.${quiz.difficulty}`)}</p>
                      <h3 className="mt-1 text-xl font-bold">{quiz.title}</h3>
                      <p className="text-muted">{quiz.description}</p>
                      {best && (
                        <p className="mt-1 text-sm text-accent">
                          {t('learn.best', { score: n(best.score), total: n(best.total) })}
                        </p>
                      )}
                    </div>
                    <button type="button" className="btn-primary" onClick={() => setActive(raw)}>
                      {t('learn.start')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="grid content-start gap-6">
          <section className="card" aria-labelledby="badges">
            <h2 id="badges" className="font-display text-xl font-bold">
              {t('learn.badges', { n: n(earned), total: n(BADGES.length) })}
            </h2>
            <ul className="mt-4 grid grid-cols-2 gap-3">
              {BADGES.map((b) => {
                const has = b.earned(progress);
                return (
                  <li
                    key={b.id}
                    className={`rounded-xl border p-3 text-center ${has ? 'border-accent bg-raised' : 'border-line opacity-50'}`}
                  >
                    <p className={`text-3xl ${has ? '' : 'grayscale'}`} aria-hidden>
                      {b.icon}
                    </p>
                    <p className="mt-1 text-sm font-bold">{t(`badge.${b.id}.name` as StringKey)}</p>
                    <p className="text-xs text-muted">{t(`badge.${b.id}.desc` as StringKey)}</p>
                    <p className="sr-only">{has ? t('learn.earned') : t('learn.notEarned')}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card text-sm">
            <h2 className="font-display text-xl font-bold">{t('learn.progress')}</h2>
            <ul className="mt-3 grid gap-1">
              <li>{t('learn.p.stories', { n: n(progress.storiesRead.length) })}</li>
              <li>{t('learn.p.signals', { n: n(progress.lastSignalsSeen.length) })}</li>
              <li>{t('learn.p.questions', { n: n(progress.questionsAsked) })}</li>
              <li>{t('learn.p.missions', { n: n(progress.gameMissions.length) })}</li>
            </ul>
            <button
              type="button"
              className="mt-4 text-xs text-muted underline hover:text-ink"
              onClick={() => confirm(t('learn.resetConfirm')) && resetProgress()}
            >
              {t('learn.reset')}
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
