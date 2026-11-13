import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSearchParams } from 'react-router-dom';
import { artifacts, getArtifact } from '../data/artifacts';
import { PageHeader, ReviewBadge, SourceLink } from '../components/ui';
import { localizeArtifact, useLang } from '../i18n';
import {
  askExplorer,
  SUGGESTED_QUESTIONS,
  type ExplorerAnswer,
  type SuggestionKey,
} from '../lib/explorerAI';
import { countQuestion } from '../lib/progress';

interface Message {
  id: number;
  role: 'user' | 'explorer';
  /** User text, or the suggestion key when a suggestion chip was used (so it re-translates). */
  text?: string;
  suggestion?: SuggestionKey;
  answer?: ExplorerAnswer;
}

const englishFor = (key: SuggestionKey) => SUGGESTED_QUESTIONS.find((s) => s.key === key)!.en;

export default function AskExplorer() {
  const { t, lang } = useLang();
  const [params, setParams] = useSearchParams();
  const rawSpeaker = getArtifact(params.get('artifact') ?? '') ?? getArtifact('opportunity')!;
  const speaker = localizeArtifact(rawSpeaker, lang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);

  useEffect(() => setMessages([]), [speaker.id]);
  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  async function ask(question: string, suggestion?: SuggestionKey) {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: q, suggestion }]);
    // Suggestions are matched in English; typed questions may be English or Bengali.
    const answer = await askExplorer(speaker.id, suggestion ? englishFor(suggestion) : q);
    countQuestion();
    setMessages((m) => [...m, { id: nextId.current++, role: 'explorer', answer }]);
    setBusy(false);
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void ask(input);
  };

  const suggestionChip = (key: SuggestionKey) => (
    <button
      key={key}
      type="button"
      className="chip hover:border-accent"
      onClick={() => void ask(t(key), key)}
    >
      {t(key)}
    </button>
  );

  return (
    <>
      <PageHeader
        icon="💬"
        tip={t('tip.ask')}
        eyebrow={t('ask.eyebrow')}
        title={t('ask.title', { name: speaker.shortName })}
      >
        {t('ask.lead')}
      </PageHeader>

      <div className="container grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wider text-muted">
            {t('ask.talkTo')}
          </h2>
          <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1">
            {artifacts.map((raw) => {
              const a = localizeArtifact(raw, lang);
              return (
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
              );
            })}
          </ul>
          <p className="mt-4 rounded-xl border border-dashed border-line p-3 text-xs text-muted">
            {t('ask.how')}
          </p>
        </aside>

        <section
          className="card flex min-h-[520px] flex-col p-0"
          aria-label={t('ask.chatLabel', { name: speaker.shortName })}
        >
          <div ref={logRef} className="flex-1 space-y-4 overflow-y-auto p-5" aria-live="polite">
            <ExplorerBubble icon={speaker.icon} name={speaker.shortName}>
              <p>{t('ask.greeting', { name: speaker.shortName, status: speaker.statusNote })}</p>
            </ExplorerBubble>
            {messages.map((m) =>
              m.role === 'user' ? (
                <div key={m.id} className="flex justify-end">
                  <p className="max-w-[80%] rounded-2xl rounded-br-sm bg-accent px-4 py-2 font-semibold text-space">
                    {m.suggestion ? t(m.suggestion) : m.text}
                  </p>
                </div>
              ) : (
                <AnswerBubble
                  key={m.id}
                  answer={m.answer!}
                  speakerIcon={speaker.icon}
                  speakerName={speaker.shortName}
                >
                  {m.answer!.suggestions.map(suggestionChip)}
                </AnswerBubble>
              ),
            )}
            {busy && (
              <p className="text-sm text-muted">{t('ask.checking', { name: speaker.shortName })}</p>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2 border-t border-line px-5 py-3">
              {SUGGESTED_QUESTIONS.map((s) => suggestionChip(s.key))}
            </div>
          )}

          <form onSubmit={onSubmit} className="flex gap-2 border-t border-line p-3">
            <label htmlFor="question" className="sr-only">
              {t('ask.inputLabel', { name: speaker.shortName })}
            </label>
            <input
              id="question"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={200}
              placeholder={t('ask.placeholder', { name: speaker.shortName })}
              className="min-h-11 min-w-0 flex-1 rounded-full border border-line bg-space px-4 text-ink placeholder:text-muted focus:border-accent focus:outline-none"
            />
            <button type="submit" className="btn-primary" disabled={busy || !input.trim()}>
              {t('ask.send')}
            </button>
          </form>
        </section>
      </div>
    </>
  );
}

/** Renders an answer in the current language: facts are looked up by id in the localized artifact. */
function AnswerBubble({
  answer,
  speakerIcon,
  speakerName,
  children,
}: {
  answer: ExplorerAnswer;
  speakerIcon: string;
  speakerName: string;
  children: ReactNode;
}) {
  const { t, lang } = useLang();
  const about = localizeArtifact(getArtifact(answer.aboutId)!, lang);
  const facts = answer.facts.map((f) => about.facts.find((x) => x.id === f.id) ?? f);
  const intro = !answer.known
    ? t('ask.unknown')
    : answer.aboutId !== answer.speakerId
      ? t('ask.other', { name: about.shortName })
      : `${t('ask.hello')} ${answer.topic ? t(`intro.${answer.topic}`) : ''} ${t('ask.records')}`;

  return (
    <ExplorerBubble icon={speakerIcon} name={speakerName}>
      <p>{intro}</p>
      {facts.length > 0 && (
        <ul className="mt-3 grid gap-2">
          {facts.map((f) => (
            <li key={f.id} className="rounded-xl bg-space/60 p-3">
              <p>{f.text}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                <SourceLink sourceId={f.sourceId} compact />
                {f.verification === 'needs-review' && <ReviewBadge />}
              </div>
            </li>
          ))}
        </ul>
      )}
      <div className="mt-3 flex flex-wrap gap-2">{children}</div>
    </ExplorerBubble>
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
  const { t } = useLang();
  return (
    <div className="flex gap-3">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-raised text-xl"
        aria-hidden
      >
        {icon}
      </span>
      <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-line bg-raised/70 px-4 py-3">
        <p className="sr-only">{t('ask.says', { name })}</p>
        {children}
      </div>
    </div>
  );
}
