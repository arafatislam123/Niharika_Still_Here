/**
 * Translation safety: every Bengali text must exist and must contain exactly the same numbers
 * (dates, distances, counts) as its English source, so translating can never change a fact.
 */
import { describe, expect, it } from 'vitest';
import { artifacts } from '../data/artifacts';
import { quizzes } from '../data/quizzes';
import { legacy, timeline, worlds } from '../data/worlds';
import { MISSIONS } from '../games/missions';
import { artifactsBn, legacyBn, missionsBn, quizzesBn, timelineBn, worldsBn } from './content.bn';

const BN_DIGITS = '০১২৩৪৫৬৭৮৯';
/** All digit groups in a text, with Bengali digits converted, sorted. */
function numbers(text: string): string[] {
  const latin = text.replace(/[০-৯]/g, (d) => String(BN_DIGITS.indexOf(d)));
  return (latin.match(/\d+/g) ?? []).sort();
}

function sameNumbers(en: string, bn: string | undefined, where: string) {
  expect(bn, `missing Bengali for ${where}`).toBeTruthy();
  expect(numbers(bn!), `numbers differ in ${where}\nEN: ${en}\nBN: ${bn}`).toEqual(numbers(en));
}

describe('Bengali translations', () => {
  it.each(artifacts)('$id: every text is translated with matching numbers', (a) => {
    const tr = artifactsBn[a.id];
    expect(tr, `no Bengali entry for ${a.id}`).toBeTruthy();
    sameNumbers(a.statusNote, tr.statusNote, `${a.id} statusNote`);
    sameNumbers(a.location.description, tr.location.description, `${a.id} location`);
    if (a.plannedLife) sameNumbers(a.plannedLife.note, tr.plannedLifeNote, `${a.id} plannedLife`);
    expect(tr.chapters).toHaveLength(a.chapters.length);
    a.chapters.forEach((c, i) => {
      sameNumbers(c.title, tr.chapters[i].title, `${a.id} chapter ${i + 1} title`);
      sameNumbers(c.text, tr.chapters[i].text, `${a.id} chapter ${i + 1}`);
    });
    for (const f of a.facts) sameNumbers(f.text, tr.facts[f.id], `fact ${f.id}`);
    expect(Object.keys(tr.facts).sort()).toEqual(a.facts.map((f) => f.id).sort());
    expect(tr.lastSignal?.length ?? 0).toBe(a.lastSignal?.length ?? 0);
    a.lastSignal?.forEach((e, i) => {
      sameNumbers(e.date, tr.lastSignal![i].date, `${a.id} signal ${i + 1} date`);
      sameNumbers(e.text, tr.lastSignal![i].text, `${a.id} signal ${i + 1}`);
    });
  });

  it('worlds, timeline and legacy are translated', () => {
    for (const w of worlds)
      sameNumbers(w.description, worldsBn[w.id]?.description, `world ${w.id}`);
    for (const e of timeline) {
      const tr = timelineBn[e.title];
      sameNumbers(e.date, tr?.date, `timeline date ${e.title}`);
      sameNumbers(e.text, tr?.text, `timeline ${e.title}`);
    }
    for (const l of legacy) {
      const tr = legacyBn[`${l.from}|${l.to}`];
      sameNumbers(l.from + l.to, tr && tr.from + tr.to, `legacy ${l.from}`);
    }
  });

  it('quizzes and game missions are translated', () => {
    for (const quiz of quizzes) {
      for (const q of quiz.questions) {
        const tr = quizzesBn[quiz.id]?.questions[q.id];
        sameNumbers(q.question, tr?.question, q.id);
        sameNumbers(q.explanation, tr?.explanation, `${q.id} explanation`);
        expect(tr?.options).toHaveLength(q.options.length);
        q.options.forEach((o, i) => sameNumbers(o, tr!.options[i], `${q.id} option ${i}`));
      }
    }
    for (const m of MISSIONS) {
      const tr = missionsBn[m.id];
      sameNumbers(m.goal, tr?.goal, `${m.id} goal`);
      for (const s of m.sites) {
        sameNumbers(s.card.text, tr?.sites[s.id]?.card.text, `${m.id}/${s.id}`);
        if (s.question)
          expect(tr?.sites[s.id]?.question?.options).toHaveLength(s.question.options.length);
      }
    }
  });
});
