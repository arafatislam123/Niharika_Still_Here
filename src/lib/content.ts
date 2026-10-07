/**
 * Content access (§7.1). The manifest and registries are bundled; full machine files are
 * separate chunks loaded per route. Imported JSON is cast, not parsed: the build-time validator
 * already guarantees it matches the schema.
 */
import manifest from 'virtual:machine-manifest';
import type { LoaderFunctionArgs } from 'react-router-dom';
import sitesJson from '../content/sites.json';
import sourcesJson from '../content/sources.json';
import { DEFAULT_LOCALE, getStoredLocale } from './i18n';
import type { Machine, ManifestEntry, Site, Source, World } from './schema';

export const sites = sitesJson as unknown as Site[];
export const sources = sourcesJson as unknown as Source[];

const sourceById = new Map(sources.map((source) => [source.id, source]));
export const getSource = (id: string) => sourceById.get(id);

export const machinesFor = (locale: string): ManifestEntry[] =>
  manifest[locale] ?? manifest[DEFAULT_LOCALE] ?? [];

export const sitesFor = (world: World) => sites.filter((site) => site.world === world);

export const machinesAtSite = (locale: string, siteId: string) =>
  machinesFor(locale).filter((machine) => machine.siteIds.includes(siteId));

export function neighbors(locale: string, id: string) {
  const list = machinesFor(locale);
  const index = list.findIndex((machine) => machine.id === id);
  return {
    prev: index > 0 ? list[index - 1] : undefined,
    next: index >= 0 && index < list.length - 1 ? list[index + 1] : undefined,
  };
}

const machineLoaders = import.meta.glob<Machine>('../content/*/machines/*.json', {
  import: 'default',
});

export class NotFoundError extends Error {}

export function loadMachine(locale: string, id: string): Promise<Machine> {
  const load =
    machineLoaders[`../content/${locale}/machines/${id}.json`] ??
    machineLoaders[`../content/${DEFAULT_LOCALE}/machines/${id}.json`];
  return load ? load() : Promise.reject(new NotFoundError(id));
}

/** Route loader shared by the machine page and the printable teacher sheet. */
export async function machineLoader({ params }: LoaderFunctionArgs): Promise<Machine> {
  try {
    return await loadMachine(getStoredLocale(), params.id ?? '');
  } catch (error) {
    if (error instanceof NotFoundError) throw new Response('Not found', { status: 404 });
    throw error;
  }
}

/** URL for a file in public/ (content stores paths without a leading slash). */
export const publicUrl = (path: string) => `${import.meta.env.BASE_URL}${path}`;
