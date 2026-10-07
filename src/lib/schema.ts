/**
 * Content schemas (docs/SYSTEM_DESIGN.md §5). Imported by the app (types only) and by
 * scripts/validate-content.ts (runtime checks), so there is exactly one definition.
 *
 * No `.default()` anywhere: the JSON on disk must already match the output type, because the
 * app casts imported JSON to these types without parsing it at runtime.
 */
import { z } from 'zod';

export const STATUSES = ['active', 'traveling', 'silent', 'historic'] as const;
export const TAGS = ['heritage', 'in-use', 'out-of-contact'] as const;
export const WORLDS = ['moon', 'mars', 'deep-space'] as const;
export const BEAT_KEYS = ['built', 'journey', 'discovery', 'last-signal', 'still-here'] as const;

const Slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'must be lowercase-kebab-case');
const SourceId = z.string().regex(/^src-[a-z0-9-]+$/, 'must start with "src-"');
const PublicPath = z
  .string()
  .regex(
    /^[\w-]+(?:\/[\w.-]+)*\.[a-z0-9]+$/i,
    'must be a file path relative to public/ (no leading slash)',
  );
const Text = z.string().trim().min(1, 'must not be empty');
const IsoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'must be YYYY-MM-DD');
const Fraction = z.number().min(0).max(1);

export const StatusSchema = z.enum(STATUSES);
export const TagSchema = z.enum(TAGS);
export const WorldSchema = z.enum(WORLDS);

// ---------------------------------------------------------------------------------------------
// Registries: sources.json, assets.json, sites.json
// ---------------------------------------------------------------------------------------------

export const SourceSchema = z.object({
  id: SourceId,
  title: Text,
  publisher: Text,
  url: z.string().url(),
  retrieved: IsoDate,
  license: Text,
  /** Filled by the second person in the two-person fact check (spec 10.3). */
  verified: z.object({ by: Text, on: IsoDate, note: z.string().optional() }).optional(),
});

export const AssetSchema = z.object({
  file: PublicPath,
  /** Source URL, or "original" for work made by the team. */
  source: z.union([z.string().url(), z.literal('original')]),
  credit: Text,
  license: Text,
  retrieved: IsoDate,
  usedIn: z.array(Text).min(1),
});

export const ImageSchema = z.object({
  src: PublicPath,
  alt: Text,
  credit: Text,
  sourceId: SourceId,
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
});

/** A hotspot on a flat image; x/y are fractions of the image width/height. */
export const HotspotSchema = z.object({
  id: Slug,
  label: Text,
  text: Text,
  x: Fraction,
  y: Fraction,
});

/** 3D hotspot. Keeps x/y too, so the static fallback image shows the same hotspots. */
export const ModelHotspotSchema = HotspotSchema.extend({
  position: Text, // model-viewer data-position, e.g. "0m 1m 0m"
  normal: Text,
});

/**
 * Coordinates live only on sites (§5.1). Stored as planetocentric latitude and east-positive
 * longitude in -180..180 (§5.2); `sourceCoords` keeps the value exactly as published.
 */
export const SiteSchema = z.object({
  id: Slug,
  name: Text,
  world: z.enum(['moon', 'mars']),
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
  sourceCoords: z.object({ value: Text, system: Text }),
  sourceId: SourceId,
  mission: Text,
  year: z.number().int().min(1957).max(2100),
  /** Shown only with the "humanity's footprint" toggle. */
  minor: z.boolean().optional(),
  /** Coordinates not yet taken from a source. Fails `validate --strict`. */
  placeholder: z.boolean().optional(),
  closeup: z
    .object({ image: ImageSchema, hotspots: z.array(HotspotSchema).min(2).max(4) })
    .optional(),
});

// ---------------------------------------------------------------------------------------------
// Mission Clock (§5.3)
// ---------------------------------------------------------------------------------------------

const LifetimeClockSchema = z.object({
  kind: z.literal('lifetime'),
  unit: z.enum(['sols', 'flights', 'days', 'years']),
  expected: z.number().positive(),
  actual: z.discriminatedUnion('type', [
    z.object({ type: z.literal('fixed'), value: z.number().positive() }),
    z.object({ type: z.literal('ongoing'), start: IsoDate }),
  ]),
  /** One rule for every machine, shown next to the clock. */
  rule: z.literal('until-last-contact'),
  sliderMax: z.number().positive(),
  why: Text,
  sourceId: SourceId,
});

const StatClockSchema = z.object({
  kind: z.literal('stat'),
  label: Text,
  value: z.number(),
  unit: Text,
  guess: z.object({ min: z.number(), max: z.number() }).optional(),
  why: Text,
  sourceId: SourceId,
});

const LiveClockSchema = z.object({
  kind: z.literal('live'),
  quantity: z.literal('distance-from-earth'),
  valueAtEpoch: z.number().positive(),
  unit: z.literal('km'),
  /** Change per second (km/s), from the source. Values are extrapolated linearly from asOf. */
  ratePerSecond: z.number(),
  asOf: z.string().datetime(),
  why: Text,
  sourceId: SourceId,
});

export const ClockSchema = z.discriminatedUnion('kind', [
  LifetimeClockSchema,
  StatClockSchema,
  LiveClockSchema,
]);

// ---------------------------------------------------------------------------------------------
// Machine file: content/<locale>/machines/<id>.json
// ---------------------------------------------------------------------------------------------

export const BeatSchema = z.object({
  key: z.enum(BEAT_KEYS),
  title: Text,
  quick: Text,
  deep: Text,
});

export const LetterSchema = z.object({
  quick: Text,
  deep: Text,
  audio: z
    .object({
      src: PublicPath,
      captions: PublicPath,
      /** Which letter version the recording reads; the validator checks caption parity. */
      narrates: z.enum(['quick', 'deep']),
    })
    .optional(),
});

export const FactSchema = z.object({
  id: z.string().regex(/^f\d+$/, 'fact ids look like f1, f2, ...'),
  text: Text,
  sourceId: SourceId,
});

export const ModelSchema = z.object({
  glb: PublicPath,
  poster: PublicPath,
  fallbackImage: PublicPath,
  alt: Text,
  credit: Text,
  sourceId: SourceId,
  hotspots: z.array(ModelHotspotSchema).min(3).max(5),
});

export const TeacherSchema = z.object({
  questions: z.array(Text).length(3),
  activity: Text,
  /** Glossary slugs. */
  vocabulary: z.array(Slug).min(1),
});

export const MachineSchema = z
  .object({
    id: Slug,
    order: z.number().int().positive(),
    name: Text,
    world: WorldSchema,
    years: z.object({ start: z.number().int(), end: z.number().int().nullable() }),
    status: StatusSchema,
    tags: z.array(TagSchema),
    /** Every tag that makes a claim points at the fact that backs it. */
    tagFactIds: z.record(z.string(), z.string()),
    hook: Text,
    /** One learning objective (what a learner can explain afterwards). */
    objective: Text,
    siteIds: z.array(Slug),
    primarySiteId: Slug.optional(),
    clock: ClockSchema,
    beats: z
      .array(BeatSchema)
      .length(5)
      .refine((beats) => beats.every((beat, i) => beat.key === BEAT_KEYS[i]), {
        message: `beats must be in order: ${BEAT_KEYS.join(', ')}`,
      }),
    letter: LetterSchema,
    facts: z.array(FactSchema).min(1),
    model: ModelSchema.optional(),
    images: z.array(ImageSchema),
    teacher: TeacherSchema.optional(),
    teacherSheet: PublicPath.optional(),
  })
  .superRefine((m, ctx) => {
    const factIds = new Set<string>();
    for (const fact of m.facts) {
      if (factIds.has(fact.id)) ctx.addIssue({ code: 'custom', message: `duplicate fact id ${fact.id}` });
      factIds.add(fact.id);
    }
    for (const tag of m.tags) {
      const factId = m.tagFactIds[tag];
      if (!factId) ctx.addIssue({ code: 'custom', path: ['tagFactIds'], message: `tag "${tag}" needs a fact` });
      else if (!factIds.has(factId))
        ctx.addIssue({ code: 'custom', path: ['tagFactIds', tag], message: `unknown fact id ${factId}` });
    }
    if (m.world === 'deep-space' && m.siteIds.length > 0)
      ctx.addIssue({ code: 'custom', path: ['siteIds'], message: 'deep-space machines have no sites' });
    if (m.world !== 'deep-space' && m.siteIds.length === 0)
      ctx.addIssue({ code: 'custom', path: ['siteIds'], message: 'needs at least one site' });
    if (m.primarySiteId && !m.siteIds.includes(m.primarySiteId))
      ctx.addIssue({ code: 'custom', path: ['primarySiteId'], message: 'must be one of siteIds' });
    if (m.clock.kind === 'lifetime' && m.clock.actual.type === 'ongoing' && m.clock.unit === 'flights')
      ctx.addIssue({ code: 'custom', path: ['clock'], message: 'a flight count cannot be ongoing' });
  });

// ---------------------------------------------------------------------------------------------
// Per-locale UI strings and glossary
// ---------------------------------------------------------------------------------------------

export const StringsSchema = z.record(z.string(), z.string());
export const GlossarySchema = z.record(Slug, z.object({ term: Text, definition: Text }));

// ---------------------------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------------------------

export type Status = z.output<typeof StatusSchema>;
export type Tag = z.output<typeof TagSchema>;
export type World = z.output<typeof WorldSchema>;
export type Source = z.output<typeof SourceSchema>;
export type Asset = z.output<typeof AssetSchema>;
export type Image = z.output<typeof ImageSchema>;
export type Hotspot = z.output<typeof HotspotSchema>;
export type Site = z.output<typeof SiteSchema>;
export type Clock = z.output<typeof ClockSchema>;
export type LifetimeClock = Extract<Clock, { kind: 'lifetime' }>;
export type StatClock = Extract<Clock, { kind: 'stat' }>;
export type LiveClock = Extract<Clock, { kind: 'live' }>;
export type Beat = z.output<typeof BeatSchema>;
export type Letter = z.output<typeof LetterSchema>;
export type Fact = z.output<typeof FactSchema>;
export type Model = z.output<typeof ModelSchema>;
export type Machine = z.output<typeof MachineSchema>;
export type Glossary = z.output<typeof GlossarySchema>;

/** Fields copied into `virtual:machine-manifest` (see vite.config.ts). */
export const MANIFEST_FIELDS = [
  'id',
  'order',
  'name',
  'world',
  'years',
  'status',
  'tags',
  'hook',
  'siteIds',
  'primarySiteId',
] as const;
export type ManifestEntry = Pick<Machine, (typeof MANIFEST_FIELDS)[number]>;
