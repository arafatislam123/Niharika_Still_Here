/** Global preferences (§7.2): reading mode, locale, reduced motion. Map world lives in the URL. */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import { LOCALES, getStoredLocale, translate, type Vars } from './i18n';
import { readSession, writeSession } from './storage';

export type ReadingMode = 'quick' | 'deep';

interface Prefs {
  readingMode: ReadingMode;
  setReadingMode: (mode: ReadingMode) => void;
  locale: string;
  setLocale: (locale: string) => void;
  reducedMotion: boolean;
}

const PrefsContext = createContext<Prefs | null>(null);

const REDUCED_MOTION = '(prefers-reduced-motion: reduce)';

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener('change', onChange);
  return () => query.removeEventListener('change', onChange);
}

function useReducedMotion(): boolean {
  return useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [readingMode, setMode] = useState<ReadingMode>(() =>
    readSession('readingMode') === 'deep' ? 'deep' : 'quick',
  );
  const [locale, setLocaleState] = useState(getStoredLocale);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<Prefs>(
    () => ({
      readingMode,
      setReadingMode: (mode) => {
        writeSession('readingMode', mode);
        setMode(mode);
      },
      locale,
      setLocale: (next) => {
        if (!LOCALES.includes(next)) return;
        writeSession('locale', next);
        setLocaleState(next);
      },
      reducedMotion,
    }),
    [readingMode, locale, reducedMotion],
  );

  return <PrefsContext.Provider value={value}>{children}</PrefsContext.Provider>;
}

export function usePrefs(): Prefs {
  const prefs = useContext(PrefsContext);
  if (!prefs) throw new Error('usePrefs must be used inside <PrefsProvider>');
  return prefs;
}

/** `t('key', { name: 'Spirit' })` in the current locale, falling back to English. */
export function useT() {
  const { locale } = usePrefs();
  return useCallback((key: string, vars?: Vars) => translate(locale, key, vars), [locale]);
}
