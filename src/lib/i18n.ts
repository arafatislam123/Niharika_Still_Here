/** Locale data and the non-React half of i18n. The `useT` hook lives in prefs.tsx. */
import type { Glossary } from './schema';
import { readSession } from './storage';

type Strings = Record<string, string>;
export type Vars = Record<string, string | number>;

const stringFiles = import.meta.glob<Strings>('../content/*/strings.json', {
  eager: true,
  import: 'default',
});
const glossaryFiles = import.meta.glob<Glossary>('../content/*/glossary.json', {
  eager: true,
  import: 'default',
});

export const DEFAULT_LOCALE = 'en';
export const LOCALES = Object.keys(stringFiles).map((file) => file.split('/')[2]);

const stringsFor = (locale: string): Strings | undefined =>
  stringFiles[`../content/${locale}/strings.json`];

export function translate(locale: string, key: string, vars?: Vars): string {
  const template = stringsFor(locale)?.[key] ?? stringsFor(DEFAULT_LOCALE)?.[key];
  if (template === undefined) {
    if (import.meta.env.DEV) console.warn(`[i18n] missing string "${key}"`);
    return key;
  }
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in vars ? String(vars[name]) : match,
  );
}

export const glossaryFor = (locale: string): Glossary =>
  glossaryFiles[`../content/${locale}/glossary.json`] ??
  glossaryFiles[`../content/${DEFAULT_LOCALE}/glossary.json`] ??
  {};

export function getStoredLocale(): string {
  const stored = readSession('locale');
  return stored && LOCALES.includes(stored) ? stored : DEFAULT_LOCALE;
}

export const formatNumber = (locale: string, value: number, maxFractionDigits = 1) =>
  new Intl.NumberFormat(locale, { maximumFractionDigits: maxFractionDigits }).format(value);
