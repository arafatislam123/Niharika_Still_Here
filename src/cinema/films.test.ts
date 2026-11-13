import { describe, expect, it } from 'vitest';
import { artifacts } from '../data/artifacts';
import { CINEMA_ARTIFACTS } from './available';
import { FILMS } from './films';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
const numbers = (text: string) =>
  (text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d))).match(/\d+/g) ?? []).sort();

describe('cinema films', () => {
  it('every explorer marked as having a film has one, with one scene per story chapter', () => {
    for (const id of CINEMA_ARTIFACTS) {
      const film = FILMS[id];
      const artifact = artifacts.find((a) => a.id === id)!;
      expect(film, id).toBeTruthy();
      expect(film.chapters).toHaveLength(artifact.chapters.length);
    }
  });

  it('captions are in order and say the same numbers in English and Bengali', () => {
    for (const [id, film] of Object.entries(FILMS)) {
      for (const chapter of film.chapters) {
        const ats = chapter.captions.map((c) => c.at);
        expect(
          [...ats].sort((a, b) => a - b),
          id,
        ).toEqual(ats);
        for (const caption of chapter.captions) {
          if ('special' in caption) continue;
          expect(numbers(caption.bn), `${id}: ${caption.en}`).toEqual(numbers(caption.en));
        }
      }
    }
  });
});
