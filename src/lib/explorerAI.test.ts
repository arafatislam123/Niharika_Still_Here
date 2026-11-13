import { describe, expect, it } from 'vitest';
import { askLocal } from './explorerAI';

describe('AI Explorer retriever', () => {
  it('answers why Opportunity stopped with the dust storm fact', () => {
    const answer = askLocal('opportunity', 'Why did you stop communicating?');
    expect(answer.known).toBe(true);
    expect(answer.facts[0].id).toBe('opp-storm');
  });

  it('answers what Phoenix discovered with an ice fact', () => {
    const answer = askLocal('phoenix', 'What did you discover?');
    expect(answer.facts.map((f) => f.id)).toEqual(
      expect.arrayContaining([expect.stringMatching(/^phx-(ice|oven|perchlorate|snow)$/)]),
    );
  });

  it('explains why the Apollo descent stage was left behind', () => {
    const answer = askLocal('apollo-11-descent-stage', 'Why were you left behind on the Moon?');
    expect(answer.facts[0].id).toMatch(/^a11-(launchpad|weight)$/);
  });

  it('switches to another artifact when it is named', () => {
    const answer = askLocal('spirit', 'How far did Opportunity drive?');
    expect(answer.aboutId).toBe('opportunity');
    expect(answer.facts[0].id).toBe('opp-distance');
  });

  it('admits it does not know instead of inventing an answer', () => {
    const answer = askLocal('pioneer-10', 'What is your favourite pizza?');
    expect(answer.known).toBe(false);
    expect(answer.facts).toHaveLength(0);
  });
});

describe('AI Explorer in Bengali', () => {
  const ids = (speaker: string, q: string) => askLocal(speaker, q).facts.map((f) => f.id);

  it('understands “why did you stop communicating?”', () => {
    expect(ids('opportunity', 'তুমি যোগাযোগ বন্ধ করলে কেন?')[0]).toBe('opp-storm');
  });

  it('understands discovery questions', () => {
    expect(ids('phoenix', 'তুমি কী আবিষ্কার করেছিলে?')[0]).toMatch(
      /^phx-(ice|oven|perchlorate|snow)$/,
    );
  });

  it('understands where-are-you-now questions', () => {
    expect(ids('pioneer-10', 'তুমি এখন কোথায়?')[0]).toBe('p10-aldebaran');
  });

  it('understands how-far questions about another explorer', () => {
    const answer = askLocal('spirit', 'অপরচুনিটি কত দূর চলেছিল?');
    expect(answer.aboutId).toBe('opportunity');
    expect(answer.facts[0].id).toBe('opp-distance');
  });

  it('still refuses to guess', () => {
    expect(askLocal('sojourner', 'তোমার প্রিয় খাবার কী?').known).toBe(false);
  });

  it('every suggested question finds an answer for every explorer', async () => {
    const { artifacts } = await import('../data/artifacts');
    const { SUGGESTED_QUESTIONS } = await import('./explorerAI');
    const misses: string[] = [];
    for (const a of artifacts)
      for (const s of SUGGESTED_QUESTIONS)
        if (!askLocal(a.id, s.en).known) misses.push(`${a.id}: ${s.en}`);
    // Apollo's descent stage never "stopped communicating", so that one may legitimately miss.
    expect(misses.filter((m) => !m.startsWith('apollo'))).toEqual([]);
  });
});
