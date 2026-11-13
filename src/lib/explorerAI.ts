/**
 * AI Space Explorer: "If This Rover Could Talk".
 *
 * Version 1 is a grounded retriever: it NEVER writes new facts. It finds the verified facts that
 * best match a question and returns them word for word, with their NASA sources. If nothing
 * matches, it says it does not know instead of guessing.
 *
 * The planned Python RAG + LLM service (POST /ai/ask) can replace `askLocal` behind the same
 * `askExplorer` function: set VITE_AI_API_URL and it will be called first, with this retriever
 * as the offline fallback.
 */
import { artifacts, getArtifact } from '../data/artifacts';
import type { Artifact, Fact, FactTopic } from '../data/types';

export interface ExplorerAnswer {
  /** The artifact whose voice answers (the persona). */
  speakerId: string;
  /** Short first-person lead-in. Contains no facts of its own. */
  intro: string;
  facts: Fact[];
  /** Which artifact the facts are about (may differ from the speaker). */
  aboutId: string;
  known: boolean;
  suggestions: string[];
}

const STOPWORDS = new Set(
  'a an the is are was were be been do does did you your yours i me my we our to of in on at for and or it its this that with from about by as what'.split(
    ' ',
  ),
);

const INTENTS: { topic: FactTopic; patterns: RegExp[] }[] = [
  {
    topic: 'purpose',
    patterns: [/\bwhy\b.*\b(sent|send|go|built|made)\b/, /\b(purpose|job|goal|mission)\b/],
  },
  {
    topic: 'how-it-worked',
    patterns: [/\bhow\b.*\b(work|power|move|drive|charge)/, /\b(power|energy|battery|solar)\b/],
  },
  { topic: 'discovery', patterns: [/\b(discover|found|find|learn)/, /\bscience\b/] },
  {
    topic: 'ending',
    patterns: [/\b(stop|stopped|end|ended|die|died|silent|last|lost|goodbye|communicat)/],
  },
  { topic: 'status', patterns: [/\b(now|today|currently|still)\b/, /\bwhere are you\b/] },
  { topic: 'numbers', patterns: [/\bhow (long|far|many|much|big)\b/] },
  { topic: 'legacy', patterns: [/\b(important|matter|legacy|future|remember)\b/] },
  { topic: 'identity', patterns: [/\b(who|what) are you\b/, /\bname\b/, /\btell me about\b/] },
  { topic: 'journey', patterns: [/\bwhen\b/, /\b(land|landed|launch|arrive)/] },
];

const INTROS: Record<FactTopic, string> = {
  identity: 'Let me introduce myself!',
  purpose: 'Here is why I was sent on my journey.',
  journey: 'Here is how my journey went.',
  'how-it-worked': 'Here is how I worked.',
  discovery: 'Ooh, my favourite topic: discoveries!',
  ending: 'This part of my story is a little sad, but it is important.',
  status: 'Here is where I am now.',
  legacy: 'Here is why my mission still matters.',
  numbers: 'Let me give you the numbers.',
};

export const SUGGESTED_QUESTIONS = [
  'Why were you sent?',
  'What did you discover?',
  'How did you get your power?',
  'Why did you stop communicating?',
  'Where are you now?',
  'How long did you work?',
];

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[’']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function detectTopics(q: string): Set<FactTopic> {
  return new Set(INTENTS.filter((i) => i.patterns.some((p) => p.test(q))).map((i) => i.topic));
}

/** Finds an artifact named in the question, e.g. asking Spirit about "opportunity". */
function mentionedArtifact(q: string, speaker: Artifact): Artifact | undefined {
  return artifacts.find((a) => {
    if (a.id === speaker.id) return false;
    const names = [a.shortName, a.name, a.id.replace(/-/g, ' ')].map(normalize);
    return names.some((n) => q.includes(n));
  });
}

export function scoreFact(fact: Fact, q: string, tokens: string[], topics: Set<FactTopic>): number {
  let score = 0;
  for (const raw of fact.keywords) {
    const kw = normalize(raw);
    if (kw.includes(' ')) {
      if (q.includes(kw)) score += 3;
    } else if (
      !STOPWORDS.has(kw) &&
      tokens.some((t) => t.startsWith(kw) || (t.length > 3 && kw.startsWith(t)))
    ) {
      score += 2;
    }
  }
  if (topics.has(fact.topic)) score += 2;
  return score;
}

export function askLocal(speakerId: string, question: string): ExplorerAnswer {
  const speaker = getArtifact(speakerId) ?? artifacts[0];
  const q = normalize(question);
  const tokens = q.split(' ').filter((t) => t && !STOPWORDS.has(t));
  const topics = detectTopics(q);
  const about = mentionedArtifact(q, speaker) ?? speaker;

  const ranked = about.facts
    .map((fact) => ({ fact, score: scoreFact(fact, q, tokens, topics) }))
    .filter((r) => r.score >= 3)
    .sort((a, b) => b.score - a.score);

  if (ranked.length === 0) {
    return {
      speakerId: speaker.id,
      aboutId: about.id,
      intro:
        'Hmm, I don’t have that in my NASA records, so I won’t guess. A real explorer only shares what the evidence shows! Try one of these questions instead:',
      facts: [],
      known: false,
      suggestions: SUGGESTED_QUESTIONS.slice(0, 4),
    };
  }

  const top = ranked[0];
  const picked = ranked.filter((r, i) => i === 0 || (i < 2 && r.score >= top.score - 1));
  const intro =
    about.id !== speaker.id
      ? `That’s about my fellow explorer ${about.shortName}! Here is what NASA’s records say:`
      : `Hello Explorer! ${INTROS[top.fact.topic]} Here is what NASA’s records say:`;

  return {
    speakerId: speaker.id,
    aboutId: about.id,
    intro,
    facts: picked.map((r) => r.fact),
    known: true,
    suggestions: SUGGESTED_QUESTIONS.filter(
      (s) => !detectTopics(normalize(s)).has(top.fact.topic),
    ).slice(0, 3),
  };
}

/** Calls the AI service if configured, otherwise (or on any failure) answers locally. */
export async function askExplorer(speakerId: string, question: string): Promise<ExplorerAnswer> {
  const endpoint = import.meta.env.VITE_AI_API_URL as string | undefined;
  if (endpoint) {
    try {
      const res = await fetch(`${endpoint.replace(/\/$/, '')}/ai/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artifact_id: speakerId, question }),
      });
      if (res.ok) return (await res.json()) as ExplorerAnswer;
    } catch {
      /* fall through to the offline retriever */
    }
  }
  return askLocal(speakerId, question);
}
