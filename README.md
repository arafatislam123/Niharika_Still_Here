# STILL HERE

**Letters from the machines we left behind.**

STILL HERE is a mobile-first, interactive web story for learners aged 8–16. Six machines that humanity left on the Moon, on Mars, and in deep space each write a letter to a young explorer. Each letter sits beside a fact box built only from cited NASA sources, and a zoomable map of real NASA imagery shows where each machine is now.

The core idea: **"abandoned" is the wrong word.** Every machine is labeled as one of:

| Status      | Label                | Meaning                                       |
| ----------- | -------------------- | --------------------------------------------- |
| `active`    | Still working        | Still producing science or being used         |
| `traveling` | Still traveling      | Still moving through space and returning data |
| `silent`    | Silent on the surface| Contact ended; hardware remains in place      |
| `historic`  | Historic site        | Left intentionally; now a heritage artifact   |

> Built for the **2026 NASA Space Apps Challenge** (theme: *The Next Frontier*), challenge: *Abandoned but not Forgotten: Storytelling about NASA's Discarded Equipment on the Moon and Mars*.
>
> This is an independent student/community project. **No NASA endorsement is implied.**

**Status:** Pre-hackathon baseline (spec v1.0). Content and assets are being prepared; code is written during the event.

---

## The cast

| # | Machine                                  | World      | Status      | Why it's "still here"                                  |
| - | ---------------------------------------- | ---------- | ----------- | ------------------------------------------------------ |
| 1 | Apollo Lunar Roving Vehicle (Apollo 15)  | Moon       | `historic`  | Carried astronauts farther than walking allowed        |
| 2 | Apollo laser retroreflectors             | Moon       | `active`    | Still used to measure the Earth–Moon distance          |
| 3 | Spirit                                   | Mars       | `silent`    | Planned for 90 sols; its stuck wheel found silica-rich soil |
| 4 | Opportunity                              | Mars       | `silent`    | Planned for 90 sols; ran for about 14 years            |
| 5 | Ingenuity                                | Mars       | `silent`    | Planned for 5 flights; flew 72                         |
| 6 | Voyager 1                                | Deep space | `traveling` | First human-made object in interstellar space          |

Every claim above must be verified against NASA sources before it ships (see the Fact Register in `docs/`).

Each machine's story follows five beats: **Built → Journey → Discovery → Last signal → Still here**, with a *Quick read* (grade 3–5) and *Go deeper* (grade 6–8) version of each.

## Features

- **Ghost Map**: Moon / Mars / Deep space switcher; zoomable NASA Trek imagery with real-coordinate markers, a local fallback basemap, and a keyboard-friendly list view.
- **Machine pages**: five-beat scrolling story, a clearly labeled *Imagined letter*, and a fact box where every fact links to its source.
- **Mission Clock**: guess the machine's real lifetime with a slider, then reveal expected vs actual ("It lasted about N times longer than planned").
- **Look closer**: lazy-loaded 3D model with hotspots via `<model-viewer>`, plus an AR button on supported devices.
- **Narration**: optional audio for each letter with WebVTT captions and a visible transcript. Never autoplays.
- **Finale**: Apollo → Mars rovers → Artemis timeline, and the question *"What should we protect, and what will we leave behind next?"*
- **Teacher sheets**: one printable PDF per machine plus a combined teacher pack.
- **Sources & Data / About pages**: every dataset, image, and model with credit and license.

## Tech stack

| Layer      | Choice                                                    |
| ---------- | --------------------------------------------------------- |
| Framework  | React + TypeScript on Vite                                |
| Routing    | React Router                                              |
| Styling    | Tailwind CSS (or CSS Modules) + design tokens             |
| Map        | Leaflet / react-leaflet with NASA Trek WMTS tiles; `CRS.Simple` fallback |
| 3D / AR    | `@google/model-viewer`                                    |
| Animation  | CSS + light Framer Motion                                 |
| Audio      | Native `<audio>` + WebVTT                                 |
| Validation | Zod (or JSON Schema) at build time                        |
| Offline    | `vite-plugin-pwa` (Workbox)                               |
| Hosting    | Vercel / Netlify / GitHub Pages (static, HTTPS)           |
| Quality    | ESLint, Prettier, Lighthouse CI, axe                      |

Fully static: no backend, no accounts, no cookies, no trackers, no API keys.

## Project structure

```
still-here/
├─ src/
│  ├─ app/          routes: Landing, Map, Machine, Finale, Sources, About
│  ├─ components/   StatusBadge, BeatSection, Letter, FactBox, MissionClock,
│  │                GhostMap, ModelViewerPanel, AudioPlayer, ReadingToggle, SiteCloseup
│  ├─ content/      machines/*.json, sites.json, sources.json, strings.en.json, assets.json
│  ├─ lib/          schema.ts, loadContent.ts, i18n.ts, a11y.ts
│  └─ styles/       tokens.css, global.css
├─ public/          models/ images/ audio/ captions/ teacher/
├─ scripts/         validate-content.ts, optimize-assets.ts
├─ docs/            spec, fact register, QA checklist
└─ vite.config.ts
```

Routes: `/`, `/map`, `/machine/:id`, `/finale`, `/sources`, `/about`. The host needs an SPA fallback so deep links work.

## Getting started

Requires Node.js 18+.

```bash
npm install
npm run dev        # local dev server
npm run validate   # content schema + source checks
npm run build      # production build (runs validation)
npm run preview    # serve the built site locally
```

## Content model

Each machine is one JSON file in `src/content/machines/<id>.json`. **Adding a machine needs only a new JSON file plus its assets; no code changes.**

```json
{
  "id": "ingenuity",
  "name": "Ingenuity",
  "world": "mars",
  "years": "2021–2024",
  "status": "silent",
  "hook": "Built for 5 flights. Flew 72.",
  "coords": { "lat": 0.0, "lng": 0.0, "crs": "mars", "sourceId": "src-ingenuity-site" },
  "clock": { "unit": "flights", "expected": 5, "actual": 72, "sourceId": "src-ingenuity-flights" },
  "beats": [{ "key": "built", "title": "...", "quick": "...", "deep": "..." }],
  "letter": { "quick": "...", "deep": "...", "audio": "audio/ingenuity.mp3", "captions": "captions/ingenuity.vtt" },
  "facts": [{ "id": "f1", "text": "...", "sourceId": "src-ingenuity-flights" }],
  "model": { "glb": "models/ingenuity.glb", "poster": "images/ingenuity-poster.webp", "hotspots": [] },
  "images": [{ "src": "images/ingenuity-site.webp", "alt": "...", "credit": "...", "sourceId": "..." }],
  "teacherSheet": "teacher/ingenuity.pdf"
}
```

Sources live in `src/content/sources.json`:

```json
{ "id": "src-ingenuity-flights", "title": "...", "publisher": "NASA/JPL",
  "url": "https://...", "retrieved": "2026-11-xx", "license": "NASA media usage guidelines" }
```

### The build fails if

1. Any `sourceId` (fact, clock, coords, image) is missing from `sources.json`.
2. Any image lacks `alt` or `credit`.
3. Any machine is missing one of the 5 beats, or a beat lacks `quick` or `deep` text.
4. `status` is not one of `active`, `silent`, `historic`, `traveling`.
5. An asset exceeds its size limit (GLB ≤ 5 MB, hero image ≤ 300 KB, narration mp3 ≤ 1 MB).

## Content rules

- Letters are always labeled **"Imagined letter"** and visually separated from the fact box.
- First person, warm, curious, no melodrama. No invented emotions, "last words", or fake quotes.
- Every number or event in a letter must also appear in the fact box with a source.
- Quick letters are 80–140 words; deep letters are up to 220.
- **Two-person fact check:** one writer adds each fact with a link; a second person opens the link and confirms it. Nothing ships with an unticked item in the Fact Register.

## Quality targets

- WCAG 2.1 AA; full keyboard operation including the map; status never shown by color alone; `prefers-reduced-motion` respected.
- Initial JS/CSS/HTML ≤ 250 KB gzipped; LCP ≤ 2.5 s on throttled 4G.
- Lighthouse mobile: performance ≥ 85, accessibility ≥ 95.
- Map, 3D viewer, and audio are lazy-loaded.
- Demo path works offline (service worker precache, local basemaps).
- Zero uncaught console errors.
- Supported: iOS Safari 15+, Android Chrome, desktop Chrome / Firefox / Edge / Safari.

## Data sources

| Asset                         | Source                          |
| ----------------------------- | ------------------------------- |
| Apollo site orbital imagery   | LRO / LROC                      |
| Mars rover/lander imagery     | MRO / HiRISE                    |
| Basemaps and tiles            | NASA Moon Trek / Mars Trek      |
| 3D models                     | NASA 3D Resources               |
| Mission facts and dates       | NASA / JPL mission pages        |

Every asset is recorded in `src/content/assets.json` with its source URL, credit line, license note, retrieval date, and where it's used. NASA logos are not used as project branding.

## Team

| Role                  | Owner | Responsibilities                                  |
| --------------------- | ----- | ------------------------------------------------- |
| Story & research lead | TBD   | Fact register, letters, beat copy, teacher sheets |
| Frontend lead         | TBD   | Architecture, routing, map, machine page, performance |
| Designer / illustrator| TBD   | Visual identity, icons, badges, poster images     |
| Pitch & QA lead       | TBD   | Accessibility, testing, video, submission         |

## Documentation

The full Software Requirements Specification and Technical Specification (requirements, architecture, QA plan, timeline, and Fact Register) lives in `docs/`.

## License

Code: TBD. Images, models, and recordings belong to their credited sources (mostly NASA, used under NASA media usage guidelines); see the in-app Sources & Data page.
