/**
 * NASA Image and Video Library API (https://images.nasa.gov/docs/images.nasa.gov_api_docs.pdf).
 * Public, CORS-enabled and needs no API key.
 */

export interface NasaImage {
  nasaId: string;
  title: string;
  description: string;
  date: string;
  center?: string;
  thumbnail: string;
  pageUrl: string;
}

interface ApiItem {
  data?: {
    nasa_id: string;
    title: string;
    description?: string;
    date_created?: string;
    center?: string;
  }[];
  links?: { href: string; rel?: string; render?: string }[];
}

const API = 'https://images-api.nasa.gov/search';
const cache = new Map<string, Promise<NasaImage[]>>();

/** Strips HTML tags and trims long NASA captions to something a child will actually read. */
export function cleanDescription(text: string, max = 220): string {
  const plain = text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (plain.length <= max) return plain;
  const cut = plain.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`;
}

export function parseSearch(json: unknown): NasaImage[] {
  const items = (json as { collection?: { items?: ApiItem[] } })?.collection?.items ?? [];
  return items.flatMap((item) => {
    const data = item.data?.[0];
    const images = (item.links ?? []).filter((l) => !l.render || l.render === 'image');
    // Prefer the small preview thumbnail over the much larger "medium" rendition.
    const thumb = (images.find((l) => l.rel === 'preview') ?? images[0])?.href;
    if (!data || !thumb) return [];
    return [
      {
        nasaId: data.nasa_id,
        title: data.title,
        description: cleanDescription(data.description ?? ''),
        date: data.date_created?.slice(0, 10) ?? '',
        center: data.center,
        thumbnail: thumb.replace(/^http:/, 'https:'),
        pageUrl: `https://images.nasa.gov/details/${encodeURIComponent(data.nasa_id)}`,
      },
    ];
  });
}

export function searchNasaImages(query: string, count = 8): Promise<NasaImage[]> {
  const key = `${query}|${count}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const url = `${API}?${new URLSearchParams({ q: query, media_type: 'image', page_size: String(count) })}`;
  const request = fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`NASA Image API returned ${res.status}`);
      return res.json();
    })
    .then((json) => parseSearch(json).slice(0, count));

  // Drop failures from the cache so a later visit can retry.
  request.catch(() => cache.delete(key));
  cache.set(key, request);
  return request;
}
