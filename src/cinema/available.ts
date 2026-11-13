/** Explorers that have a cinema-mode film (kept tiny so pages can check without loading 3D code). */
export const CINEMA_ARTIFACTS = new Set([
  'apollo-11-descent-stage',
  'opportunity',
  'spirit',
  'phoenix',
  'sojourner',
  'pioneer-10',
]);

/**
 * Human-recorded narration. List a language here once its files are in
 * public/audio/narration/<artifact>/<lang>-<chapter>.mp3 (chapters numbered from 1).
 * Without recordings, the film falls back to the device's best text-to-speech voice.
 * See docs/RECORDING_GUIDE.md.
 */
export const RECORDED_NARRATION: Record<string, ('en' | 'bn')[]> = {
  opportunity: [],
};

export const narrationUrl = (artifactId: string, lang: 'en' | 'bn', chapter: number) =>
  `${import.meta.env.BASE_URL}audio/narration/${artifactId}/${lang}-${chapter + 1}.mp3`;
