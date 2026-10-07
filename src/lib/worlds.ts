/**
 * Ghost Map world config (§8.1). Tile templates follow NASA Trek's WMTS REST pattern.
 * TODO(frontend lead, before Nov 14): confirm layer ids and max zoom against each Trek
 * WMTSCapabilities document, and replace the placeholder SVG basemaps with Trek global mosaics
 * (4096x2048 WebP, recorded in assets.json).
 */
export interface WorldConfig {
  tileUrl: string;
  maxZoom: number;
  fallback: string;
  attribution: string;
}

export const WORLD_CONFIG = {
  moon: {
    tileUrl:
      'https://trek.nasa.gov/tiles/Moon/EQ/LRO_WAC_Mosaic_Global_303ppd_v02/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZoom: 7,
    fallback: 'basemaps/moon.svg',
    attribution: 'NASA/GSFC/Arizona State University (LRO WAC) via NASA Moon Trek',
  },
  mars: {
    tileUrl:
      'https://trek.nasa.gov/tiles/Mars/EQ/Mars_Viking_MDIM21_ClrMosaic_global_232m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg',
    maxZoom: 7,
    fallback: 'basemaps/mars.svg',
    attribution: 'NASA/JPL/USGS (Viking MDIM 2.1) via NASA Mars Trek',
  },
} as const satisfies Record<'moon' | 'mars', WorldConfig>;

/** Tile failure rule: fall back after this many errors (if errors outnumber loads)... */
export const TILE_ERROR_LIMIT = 4;
/** ...or when no tile has loaded within this time. */
export const TILE_TIMEOUT_MS = 6000;
