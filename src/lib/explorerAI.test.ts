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
