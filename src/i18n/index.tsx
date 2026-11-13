/**
 * Language support (English / বাংলা). The chosen language is remembered in this browser only.
 * UI text comes from strings.ts; content translations from content.bn.ts are merged onto the
 * English data by the `localize*` helpers, so ids, sources and verification flags never change.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Artifact, LegacyLink, Quiz, TimelineEvent, World } from '../data/types';
import type { Mission } from '../games/missions';
import { artifactsBn, legacyBn, missionsBn, quizzesBn, timelineBn, worldsBn } from './content.bn';
import { bn, en, type StringKey } from './strings';

export type Lang = 'en' | 'bn';
const KEY = 'forgotten-explorers:lang';

function initialLang(): Lang {
  // A shared link such as ...?lang=bn opens the site straight in that language.
  const fromUrl =
    typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('lang') : null;
  if (fromUrl === 'en' || fromUrl === 'bn') return fromUrl;
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'en' || saved === 'bn') return saved;
  } catch {
    /* storage blocked */
  }
  return typeof navigator !== 'undefined' && navigator.language?.startsWith('bn') ? 'bn' : 'en';
}

type Vars = Record<string, string | number>;

export function translate(lang: Lang, key: StringKey, vars?: Vars): string {
  let s = (lang === 'bn' ? bn : en)[key];
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.replaceAll(`{${k}}`, String(v));
  return s;
}

/** Formats a number with Bengali digits in Bengali mode. */
export const formatNumber = (lang: Lang, n: number, digits = 0) =>
  n.toLocaleString(lang === 'bn' ? 'bn-BD' : 'en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: StringKey, vars?: Vars) => string;
  n: (value: number, digits?: number) => string;
}

const LangContext = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(initialLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(KEY, l);
    } catch {
      /* keep for this visit only */
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.title =
      lang === 'bn' ? 'এখনও এখানে · Still Here' : 'Still Here';
  }, [lang]);

  const value = useMemo<LangValue>(
    () => ({
      lang,
      setLang,
      t: (key, vars) => translate(lang, key, vars),
      n: (value, digits) => formatNumber(lang, value, digits),
    }),
    [lang, setLang],
  );
  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be used inside <LangProvider>');
  return ctx;
}

// ---------------------------------------------------------------------------------------------
// Content localizers: return English data unchanged, or a copy with Bengali text merged in.
// ---------------------------------------------------------------------------------------------

export function localizeArtifact(a: Artifact, lang: Lang): Artifact {
  const tr = lang === 'bn' ? artifactsBn[a.id] : undefined;
  if (!tr) return a;
  return {
    ...a,
    name: tr.name,
    shortName: tr.shortName,
    tagline: tr.tagline,
    statusNote: tr.statusNote,
    whyItMatters: tr.whyItMatters,
    location: { ...a.location, name: tr.location.name, description: tr.location.description },
    plannedLife: a.plannedLife && {
      ...a.plannedLife,
      note: tr.plannedLifeNote ?? a.plannedLife.note,
    },
    chapters: a.chapters.map((c, i) => ({ ...c, ...(tr.chapters[i] ?? {}) })),
    facts: a.facts.map((f) => ({ ...f, text: tr.facts[f.id] ?? f.text })),
    lastSignal: a.lastSignal?.map((e, i) => ({ ...e, ...(tr.lastSignal?.[i] ?? {}) })),
  };
}

export const artifactModelNote = (id: string, lang: Lang) =>
  lang === 'bn' ? artifactsBn[id]?.modelNote : undefined;

export function localizeWorld(w: World, lang: Lang): World {
  const tr = lang === 'bn' ? worldsBn[w.id] : undefined;
  return tr ? { ...w, ...tr } : w;
}

export function localizeTimeline(e: TimelineEvent, lang: Lang): TimelineEvent {
  const tr = lang === 'bn' ? timelineBn[e.title] : undefined;
  return tr ? { ...e, ...tr } : e;
}

export function localizeLegacy(l: LegacyLink, lang: Lang): LegacyLink {
  const tr = lang === 'bn' ? legacyBn[`${l.from}|${l.to}`] : undefined;
  return tr ? { ...l, ...tr } : l;
}

export function localizeQuiz(q: Quiz, lang: Lang): Quiz {
  const tr = lang === 'bn' ? quizzesBn[q.id] : undefined;
  if (!tr) return q;
  return {
    ...q,
    title: tr.title,
    description: tr.description,
    questions: q.questions.map((x) => ({ ...x, ...(tr.questions[x.id] ?? {}) })),
  };
}

export function localizeMission(m: Mission, lang: Lang): Mission {
  const tr = lang === 'bn' ? missionsBn[m.id] : undefined;
  if (!tr) return m;
  return {
    ...m,
    title: tr.title,
    goal: tr.goal,
    instructions: tr.instructions,
    sites: m.sites.map((s) => {
      const st = tr.sites[s.id];
      if (!st) return s;
      return {
        ...s,
        label: st.label,
        card: { ...s.card, ...st.card },
        question: s.question && st.question ? { ...s.question, ...st.question } : s.question,
      };
    }),
  };
}
