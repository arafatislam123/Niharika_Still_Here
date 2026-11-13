/** Content integrity: the "every fact has a source" rule, enforced in CI. */
import { describe, expect, it } from 'vitest';
import { artifacts } from './artifacts';
import { quizzes } from './quizzes';
import { sources } from './sources';
import { legacy, timeline } from './worlds';

const sourceIds = new Set(sources.map((s) => s.id));
const artifactIds = new Set(artifacts.map((a) => a.id));

describe('content', () => {
  it('has unique artifact ids', () => {
    expect(artifactIds.size).toBe(artifacts.length);
  });

  it.each(artifacts)('$name: every fact, chapter and signal is sourced', (artifact) => {
    const factIds = new Set(artifact.facts.map((f) => f.id));
    expect(factIds.size).toBe(artifact.facts.length);
    for (const f of artifact.facts) expect(sourceIds).toContain(f.sourceId);
    for (const c of artifact.chapters) {
      expect(c.factIds.length).toBeGreaterThan(0);
      for (const id of c.factIds) expect(factIds).toContain(id);
    }
    for (const e of artifact.lastSignal ?? []) expect(sourceIds).toContain(e.sourceId);
  });

  it('timeline, legacy and quizzes point at real sources and artifacts', () => {
    for (const e of timeline) {
      expect(sourceIds).toContain(e.sourceId);
      if (e.artifactId) expect(artifactIds).toContain(e.artifactId);
    }
    for (const l of legacy) expect(sourceIds).toContain(l.sourceId);
    for (const quiz of quizzes) {
      for (const q of quiz.questions) {
        expect(sourceIds).toContain(q.sourceId);
        expect(q.answer).toBeLessThan(q.options.length);
      }
    }
  });

  it('every source is an https link', () => {
    for (const s of sources) expect(s.url).toMatch(/^https:\/\//);
  });
});
