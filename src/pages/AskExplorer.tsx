import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { artifacts, getArtifact } from '../data/artifacts';
import { PageHeader, SourceLink } from '../components/ui';
import { askExplorer, SUGGESTED_QUESTIONS, type ExplorerAnswer } from '../lib/explorerAI';
import { countQuestion } from '../lib/progress';

interface Message {
  id: number;
  role: 'user' | 'explorer';
  text?: string;
  answer?: ExplorerAnswer;
}

export default function AskExplorer() {
  const [params, setParams] = useSearchParams();
  const speaker = getArtifact(params.get('artifact') ?? '') ?? getArtifact('opportunity')!;
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => setMessages([]), [speaker.id]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: q }]);
    const answer = await askExplorer(speaker.id, q);
    countQuestion();
    setMessages((m) => [...m, { id: nextId.current++, role: 'explorer', answer }]);
    setBusy(false);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  return (
    <>
      <PageHeader
        eyebrow="AI Explorer · If This Rover Could Talk"
        title={`Ask ${speaker.shortName}`}
      >
        Choose an explorer and ask it about its mission. It answers only with facts from NASA
        records, and shows you where each one comes from.
      </PageHeader>

      <div className="container grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">Talk to…</h2>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {artifacts.map((a) => (
              <li key={a.id}>
                <button
                  type="button"
                  aria-pressed={a.id === speaker.id}
                  onClick={() => setParams({ artifact: a.id }, { replace: true })}
                  className={`flex w-full items-center gap-2 rounded-xl border p-3 text-left text-sm font-semibold transition ${
                    a.id === speaker.id
                      ? 'border-accent bg-raised'
                      : 'border-line bg-surface hover:border-accent/60'
                  }`}
                >
                  <span className="text-xl" aria-hidden>
                    {a.icon}
                  </span>
                  {a.shortName}
                </button>
              </li>
            ))}
          </ul>
          <div className="mt-4 rounded-xl border border-dashed border-line p-3 text-xs text-muted">
            <strong className="text-ink">How it works:</strong> this version finds the matching
            facts in our checked NASA knowledge base and shows them word for word. It never makes up
            discoveries. If it does not know, it says so.
          </div>
        </aside>

        <section
          className="card flex min-h-[520px] flex-col p-0"
          aria-label={`Chat with ${speaker.shortName}`}
        >
          <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            <ExplorerBubble icon={speaker.icon} name={speaker.shortName}>
              <p>
                Hello Explorer! I’m {speaker.shortName}. {speaker.statusNote} What would you like to
                know about my mission?
              </p>
            </ExplorerBubble>
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 font-semibold text-space">
                    {m.text}
                  </p>
                </div>
              ) : (
                <ExplorerBubble key={m.id} icon={speaker.icon} name={speaker.shortName}>
                  <p>{m.answer!.intro}</p>
                  {m.answer!.facts.length > 0 && (
                    <ul className="mt-3 grid gap-2">
                      {m.answer!.facts.map((f) => (
                        <li key={f.id} className="rounded-xl bg-space/60 p-3">
                          <p>{f.text}</p>
                          <div className="mt-2 flex flex-wrap gap-2">
                            <SourceLink sourceId={f.sourceId} compact />
                            {f.verification === 'needs-review' && (
                              <span className="chip border-amber-400/50 text-amber-200">
                                ⚠ Being double-checked
                              </span>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {m.answer!.suggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        className="chip hover:border-accent"
                        onClick={() => void ask(s)}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </ExplorerBubble>
              ),
            )}
            {busy && (
              <p className="text-sm text-muted">{speaker.shortName} is checking its records…</p>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              {SUGGESTED_QUESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="chip hover:border-accent"
                  onClick={() => void ask(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
            <label htmlFor="question" className="sr-only">
              Your question for {speaker.shortName}
            </label>
            <input
              id="question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder={`Ask ${speaker.shortName} a question…`}
              className="min-h-11 flex-1 rounded-full border border-line bg-space px-4 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
              Ask
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

function ExplorerBubble({
  icon,
  name,
  children,
}: {
  icon: string;
  name: string;
  children: ReactNode;
}) {
  return (
    <div className="flex gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xl"
        aria-hidden
      >
        {icon}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-raised/70 px-4 py-3">
        <p className="sr-only">{name} says:</p>
        {children}
      </div>
    </div>
  );
}
