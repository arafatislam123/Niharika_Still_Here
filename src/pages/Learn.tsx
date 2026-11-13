import { useState } from 'react';
import { quizzes } from '../data/quizzes';
import type { Quiz } from '../data/types';
import { PageHeader, SourceLink } from '../components/ui';
import { BADGES, recordQuiz, resetProgress, useProgress } from '../lib/progress';

function QuizRunner({ quiz, onExit }: { quiz: Quiz; onExit: () => void }) {
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const q = quiz.questions[index];

  if (finished) {
    const perfect = score === quiz.questions.length;
    return (
      <div className="card text-center" role="status">
        <p className="text-5xl" aria-hidden>
          {perfect ? '🏆' : score >= quiz.questions.length / 2 ? '🌟' : '🚀'}
        </p>
        <h2 className="mt-3 font-display text-3xl font-bold">
          You got {score} out of {quiz.questions.length}!
        </h2>
        <p className="mt-2 text-muted">
          {perfect
            ? 'Perfect score, you earned the Quiz Ace badge!'
            : 'Great try! Read the stories and come back to beat your score.'}
        </p>
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
            Play again
          </button>
          <button type="button" className="btn-ghost" onClick={onExit}>
            All quizzes
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
    if (index === quiz.questions.length - 1) {
      const final = score;
      recordQuiz(quiz.id, final, quiz.questions.length);
      setFinished(true);
    } else {
      setIndex((i) => i + 1);
      setPicked(null);
    }
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between text-sm text-muted">
        <span>
          Question {index + 1} of {quiz.questions.length}
        </span>
        <span>Score: {score}</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-raised">
        <div
          className="h-2 rounded-full bg-accent transition-all"
          style={{ width: `${(index / quiz.questions.length) * 100}%` }}
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
          <p className="font-bold">{picked === q.answer ? '✅ Correct!' : '❌ Not quite.'}</p>
          <p className="mt-1">{q.explanation}</p>
          <div className="mt-2">
            <SourceLink sourceId={q.sourceId} compact />
          </div>
          <button type="button" className="btn-primary mt-4" onClick={next}>
            {index === quiz.questions.length - 1 ? 'See my score' : 'Next question →'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function Learn() {
  const progress = useProgress();
  const [active, setActive] = useState<Quiz | null>(null);
  const earned = BADGES.filter((b) => b.earned(progress)).length;

  return (
    <>
      <PageHeader eyebrow="Learning & achievements" title="Test your knowledge">
        Take a quiz, collect badges and track your journey. Your progress is saved only in this
        browser. No account needed.
      </PageHeader>
      <div className="container grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <section aria-labelledby="quizzes">
          <h2 id="quizzes" className="sr-only">
            Quizzes
          </h2>
          {active ? (
            <QuizRunner quiz={active} onExit={() => setActive(null)} />
          ) : (
            <ul className="grid gap-4">
              {quizzes.map((quiz) => {
                const best = progress.quizScores[quiz.id];
                return (
                  <li
                    key={quiz.id}
                    className="card flex flex-wrap items-center justify-between gap-4"
                  >
                    <div>
                      <p className="eyebrow">{quiz.difficulty}</p>
                      <h3 className="mt-1 text-xl font-bold">{quiz.title}</h3>
                      <p className="text-muted">{quiz.description}</p>
                      {best && (
                        <p className="mt-1 text-sm text-accent">
                          Best score: {best.score}/{best.total}
                        </p>
                      )}
                    </div>
                    <button type="button" className="btn-primary" onClick={() => setActive(quiz)}>
                      Start quiz
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
              Badges ({earned}/{BADGES.length})
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
                    <p className="mt-1 text-sm font-bold">{b.name}</p>
                    <p className="text-xs text-muted">{b.description}</p>
                    <p className="sr-only">{has ? 'Earned' : 'Not earned yet'}</p>
                  </li>
                );
              })}
            </ul>
          </section>
          <section className="card text-sm">
            <h2 className="font-display text-xl font-bold">Your progress</h2>
            <ul className="mt-3 grid gap-1">
              <li>📖 Stories finished: {progress.storiesRead.length}/6</li>
              <li>📡 Last Signals followed: {progress.lastSignalsSeen.length}</li>
              <li>💬 Questions asked: {progress.questionsAsked}</li>
              <li>🎮 Game missions completed: {progress.gameMissions.length}/3</li>
            </ul>
            <button
              type="button"
              className="mt-4 text-xs text-muted underline hover:text-ink"
              onClick={() => confirm('Reset all progress and badges?') && resetProgress()}
            >
              Reset progress
            </button>
          </section>
        </aside>
      </div>
    </>
  );
}
