/**
 * AI Space Explorer: "If This Rover Could Talk".
 *
 * Version 1 is a grounded retriever: it NEVER writes new facts. It finds the verified facts that
 * best match a question and returns them (the UI shows them word for word, in English or
 * Bengali, with their NASA sources). If nothing matches, it says it does not know.
 *
 * Bengali questions are supported by mapping Bengali word stems to English keywords before
 * matching, so both languages use the same verified fact base.
 *
 * The planned Python RAG + LLM service (POST /ai/ask) can replace `askLocal` behind the same
 * `askExplorer` function: set VITE_AI_API_URL and it will be called first, with this retriever
 * as the offline fallback.
 */
import { artifacts, getArtifact } from '../data/artifacts';
import type { Artifact, Fact, FactTopic } from '../data/types';

export type SuggestionKey = 'q.why' | 'q.discover' | 'q.power' | 'q.stop' | 'q.where' | 'q.long';

export interface ExplorerAnswer {
  /** The artifact whose voice answers (the persona). */
  speakerId: string;
  /** Which artifact the facts are about (may differ from the speaker). */
  aboutId: string;
  /** Topic of the best match; the UI turns it into a short, fact-free lead-in. */
  topic?: FactTopic;
  facts: Fact[];
  known: boolean;
  suggestions: SuggestionKey[];
}

/** Suggested questions: the key is shown (translated); the English text is what gets matched. */
export const SUGGESTED_QUESTIONS: { key: SuggestionKey; en: string }[] = [
  { key: 'q.why', en: 'Why were you sent?' },
  { key: 'q.discover', en: 'What did you discover?' },
  { key: 'q.power', en: 'How did you get your power?' },
  { key: 'q.stop', en: 'Why did you stop communicating?' },
  { key: 'q.where', en: 'Where are you now?' },
  { key: 'q.long', en: 'How long did you work?' },
];

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

/**
 * Bengali word stems → English keywords. Stems (not whole words) so that inflected forms
 * such as থামলে / থেমে / থামা all match.
 */
const BN_TERMS: [string, string][] = [
  // artifacts
  ['অপরচুনিটি', 'opportunity'],
  ['স্পিরিট', 'spirit'],
  ['ফিনিক্স', 'phoenix'],
  ['সোজার্নার', 'sojourner'],
  ['পাইওনিয়ার', 'pioneer 10'],
  ['ঈগল', 'eagle'],
  ['লুনার মডিউল', 'lunar module'],
  // who / what
  ['তুমি কে', 'who are you'],
  ['কে তুমি', 'who are you'],
  ['পরিচয়', 'who are you'],
  ['তোমার নাম', 'name'],
  ['নাম কেন', 'why called name'],
  ['নামকরণ', 'named name'],
  ['অংশ', 'parts'],
  // why / purpose
  ['কেন পাঠা', 'why sent'],
  ['পাঠানো', 'sent'],
  ['উদ্দেশ্য', 'purpose'],
  ['লক্ষ্য', 'goal'],
  ['কেন', 'why'],
  // ending
  ['যোগাযোগ বন্ধ', 'why did you stop communicating'],
  ['থাম', 'stop'],
  ['থেমে', 'stop'],
  ['বন্ধ', 'stop'],
  ['শেষ', 'last end'],
  ['নিশ্চুপ', 'silent'],
  ['চুপ', 'silent'],
  ['যোগাযোগ', 'communicate contact'],
  ['সংকেত', 'signal'],
  ['বার্তা', 'message'],
  ['মারা', 'die'],
  // how it worked
  ['শক্তি', 'power energy'],
  ['বিদ্যুৎ', 'electricity'],
  ['সৌর', 'solar'],
  ['ব্যাটারি', 'battery'],
  ['সূর্য', 'sun'],
  ['কীভাবে কাজ', 'how did you work'],
  ['কিভাবে কাজ', 'how did you work'],
  ['চাকা', 'wheel'],
  ['ভাঙা', 'broken'],
  ['হাত', 'arm'],
  ['খুঁড়', 'dig'],
  ['বেলচা', 'scoop'],
  // discovery
  ['আবিষ্কার', 'discover'],
  ['খুঁজে পে', 'found'],
  ['কী পেয়ে', 'found'],
  ['বিজ্ঞান', 'science'],
  ['পানি', 'water'],
  ['জল', 'water'],
  ['বরফ', 'ice'],
  ['পাথর', 'rocks'],
  ['মাটি', 'soil'],
  ['নমুনা', 'samples'],
  ['ব্লুবেরি', 'blueberries'],
  ['হেমাটাইট', 'hematite'],
  ['জিপসাম', 'gypsum'],
  ['সিলিকা', 'silica'],
  ['কার্বনেট', 'carbonate'],
  ['লবণ', 'salt'],
  ['তুষার', 'snow'],
  ['মেঘ', 'clouds'],
  ['বৃহস্পতি', 'jupiter'],
  ['গ্রহাণু', 'asteroid'],
  ['ছবি', 'images'],
  ['প্রথম', 'first'],
  // status / where
  ['কোথায়', 'where are you'],
  ['এখন', 'now'],
  ['আজ', 'today'],
  ['রোহিণী', 'aldebaran'],
  ['অলডেবারান', 'aldebaran'],
  // numbers
  ['কতদিন', 'how long'],
  ['কত দিন', 'how long'],
  ['কত বছর', 'how long years'],
  ['কতক্ষণ', 'how long'],
  ['কত সময়', 'how long'],
  ['কত দূর', 'how far'],
  ['কতদূর', 'how far'],
  ['দূরত্ব', 'distance'],
  ['রেকর্ড', 'record'],
  ['পরিকল্পনা', 'planned'],
  ['বড়', 'size big'],
  // journey
  ['কখন', 'when'],
  ['অবতরণ', 'landed'],
  ['নেমে', 'landed'],
  ['নামল', 'landed'],
  ['উৎক্ষেপ', 'launch'],
  ['এয়ারব্যাগ', 'airbags'],
  // legacy & misc
  ['গুরুত্ব', 'important'],
  ['ভবিষ্যৎ', 'future'],
  ['মনে রাখ', 'remember'],
  ['রেখে', 'left behind'],
  ['ফেলে', 'left behind'],
  ['জ্বালানি', 'fuel'],
  ['ফলক', 'plaque'],
  ['লেজার', 'laser'],
  ['আয়না', 'mirror'],
  ['নভোচারী', 'astronaut'],
  ['আর্মস্ট্রং', 'armstrong'],
  ['হাঁট', 'walk'],
  ['যমজ', 'twin'],
  ['আটকে', 'stuck'],
  ['বালি', 'sand'],
  ['ধুলো', 'dust'],
  ['ধুলি', 'dust'],
  ['ঝড়', 'storm'],
  ['শীত', 'winter'],
];

export const hasBengali = (text: string) => /[ঀ-৿]/.test(text);

/** Turns a Bengali question into English keywords the retriever understands. */
export function bengaliToKeywords(question: string): string {
  const found: string[] = [];
  for (const [stem, english] of BN_TERMS) if (question.includes(stem)) found.push(english);
  const latin = question.match(/[A-Za-z0-9]+/g) ?? [];
  return [...found, ...latin].join(' ');
}

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
  const q = normalize(hasBengali(question) ? bengaliToKeywords(question) : question);
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
      facts: [],
      known: false,
      suggestions: SUGGESTED_QUESTIONS.slice(0, 4).map((s) => s.key),
    };
  }

  const top = ranked[0];
  const picked = ranked.filter((r, i) => i === 0 || (i < 2 && r.score >= top.score - 1));
  return {
    speakerId: speaker.id,
    aboutId: about.id,
    topic: top.fact.topic,
    facts: picked.map((r) => r.fact),
    known: true,
    suggestions: SUGGESTED_QUESTIONS.filter(
      (s) => !detectTopics(normalize(s.en)).has(top.fact.topic),
    )
      .slice(0, 3)
      .map((s) => s.key),
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
