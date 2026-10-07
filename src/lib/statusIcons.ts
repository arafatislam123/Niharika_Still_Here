/**
 * Status icons as SVG markup, shared by React (StatusIcon) and Leaflet marker HTML.
 * Status is never shown by color alone (NFR-A11Y-4): every icon has a distinct shape.
 */
import type { Status } from './schema';

const STROKE = 'fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"';

const PATHS: Record<Status, string> = {
  // solid dot + signal arcs
  active: `<circle cx="8" cy="12" r="4" fill="currentColor"/><path d="M15 8a6 6 0 0 1 0 8M18.5 5a10 10 0 0 1 0 14" ${STROKE}/>`,
  // arrow
  traveling: `<path d="M3 12h16M13 6l6 6-6 6" ${STROKE}/>`,
  // hollow dot + crescent moon
  silent: `<circle cx="8" cy="14" r="4" ${STROKE}/><path d="M17.5 3a6 6 0 1 0 4.5 9.5A5 5 0 0 1 17.5 3z" fill="currentColor"/>`,
  // flag
  historic: `<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" ${STROKE}/>`,
};

export function statusSvg(status: Status, size = 20): string {
  return `<svg class="status-icon status-${status}" width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${PATHS[status]}</svg>`;
}

export const statusIconPaths = (status: Status) => PATHS[status];
