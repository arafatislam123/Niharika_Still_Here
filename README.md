# Forgotten Explorers

**Their missions ended. Their stories live on.**

🌐 **Live site: https://arafatislam123.github.io/Niharika_Still_Here/**

An interactive space museum for learners aged 8–16 about NASA's retired, silent and left-behind
exploration hardware. Kids spin a 3D solar system, visit the Moon, Mars and deep space, read or
listen to each explorer's story, ask it questions, and play a Mars rover game. Every fact links
to a NASA source.

> Built for the **2026 NASA Space Apps Challenge**: *Abandoned but not Forgotten*.
> Independent student project. **No NASA endorsement is implied.**

## Features (v0.2, first version)

| Feature | What it does | Where |
| --- | --- | --- |
| **3D Solar System** | Three.js scene; click the Moon, Mars or Pioneer 10. Labels are real buttons (keyboard friendly). | `/`, `/explore` |
| **Mission Memory Map** | Moon / Mars globe with pins at real landing coordinates; deep-space distance ruler. | `/explore/:world` |
| **Story Engine** | Four chapters per explorer, in 3 modes: **Read**, **Listen** (browser speech), **Explore Facts** (sourced facts + live NASA photos). | `/artifacts/:id` |
| **The Last Signal** | Step-by-step timeline of each mission's final days. | `/artifacts/:id` |
| **Mission clock** | Planned vs actual lifetime (e.g. Opportunity: 90 sols → ~5,111). | `/artifacts/:id` |
| **AI Explorer** | “If This Rover Could Talk”: answers only from verified facts, with source links; says “I don’t know” instead of guessing. | `/ask` |
| **Mission Game** | 3 missions: Explore Mars, Find the Water Evidence, Save the Mission (dust storm + solar power). | `/game` |
| **Timeline + Legacy** | 1962–2022 missions and how each led to the next. | `/timeline` |
| **Quiz & badges** | 2 quizzes, 8 badges, progress saved in the browser (no accounts). | `/learn` |
| **Sources** | Every NASA source and the fact-check status. | `/sources` |

### The six explorers

| Explorer | World | Status |
| --- | --- | --- |
| Apollo 11 Lunar Module descent stage | Moon | Mission Completed |
| Opportunity | Mars | Lost Contact |
| Spirit | Mars | Lost Contact |
| Phoenix | Mars | Mission Completed |
| Sojourner | Mars | Lost Contact |
| Pioneer 10 | Deep space | Lost Contact |

Statuses use six values (`active`, `inactive`, `mission-completed`, `lost-contact`,
`partially-operational`, `unknown`) because a mission ending, losing contact and hardware
breaking are different things.

## NASA data used

- **NASA Image and Video Library API** (`images-api.nasa.gov`): live photos on every story page.
  Public, no API key needed.
- **Curated knowledge base** (`src/data/`): facts written from NASA Science, NASA JPL, NASA.gov
  and the NSSDC catalog, each with its source URL and a `verified` / `needs-review` flag.
  NASA has no single live API for historical hardware, so we curate the facts ourselves and add
  media from the API.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # content-integrity + AI retriever + API parser tests
npm run build      # typecheck + production build into dist/
```

Node 20+. No backend: it is a static site.

**Deployment:** every push to `main` builds and publishes to GitHub Pages
(`.github/workflows/deploy-pages.yml`). One-time setup: repo **Settings → Pages → Source:
GitHub Actions**. A Netlify config (`netlify.toml`) is also included as an alternative.

## Project structure

```
src/
├─ data/         artifacts.ts (6 explorers, facts, stories, last signals), sources.ts,
│                worlds.ts (worlds, timeline, legacy), quizzes.ts, types.ts
├─ three/        SolarSystem.tsx, PlanetGlobe.tsx, textures.ts (procedural, no image files)
├─ games/        RoverGame.tsx, missions.ts
├─ lib/          explorerAI.ts (grounded retriever), nasaImages.ts (NASA API client),
│                narration.ts (speech), progress.ts (badges, localStorage)
├─ components/   Layout, NasaGallery, shared UI (StatusBadge, SourceLink, FactCard…)
└─ pages/        Home, Explore, WorldPage, Artifacts, ArtifactPage, AskExplorer,
                 GamePage, Timeline, Learn, Sources
```

`src/data/types.ts` mirrors the planned database tables (planets, missions, artifacts, stories,
media, scientific_discoveries, quizzes, questions), so the content can move into a backend later
without changing shape.

## The AI Explorer and the planned backend

v1 runs fully in the browser. `askExplorer()` in `src/lib/explorerAI.ts` scores the verified
facts against the question and returns the best ones **word for word** with their sources. It
never generates new claims.

To plug in the planned **Python FastAPI + RAG + LLM** service, set `VITE_AI_API_URL`. The app
then calls `POST {VITE_AI_API_URL}/ai/ask` with `{ artifact_id, question }` and expects the
`ExplorerAnswer` shape back. The local retriever stays as the offline fallback. Add the service
origin to `connect-src` in `netlify.toml`.

Next steps from the roadmap: Laravel/PostgreSQL API for content, pgvector retrieval, user
accounts for badges across devices, more artifacts (e.g. Viking landers, Apollo LRVs).

## Accuracy rules

1. Every fact has a NASA `sourceId`. CI fails if one is missing (`src/data/content.test.ts`).
2. Facts start as `needs-review` and show a “being double-checked” label until a second team
   member confirms them. See [docs/FACT_CHECK.md](docs/FACT_CHECK.md).
3. First-person stories are labelled **imagined voice**. The game is labelled a **simplified
   simulation**. 3D surfaces are labelled **artistic, not to scale**.

## Team workflow

Work on a feature branch and open a Pull Request into `main`. CI runs lint, typecheck, tests
and build on every PR.
