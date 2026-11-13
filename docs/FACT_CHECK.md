# Fact-check checklist

Accuracy matters more than any feature. Before the final submission, a **second** team member
(not the author) opens each source and confirms every fact that cites it.

## How to verify a fact

1. Open the fact in `src/data/artifacts.ts` (or `worlds.ts`, `quizzes.ts`, `games/missions.ts`).
2. Open its source from `src/data/sources.ts`.
3. Confirm every number, date and name in the sentence matches the source.
4. If it matches, set `verification` to `'verified'` (or remove the `'needs-review'` argument).
   If not, fix the text or find a better NASA source.
5. Also check that each source URL still loads. NASA reorganises its sites often.

## Currently flagged `needs-review`

| Fact / event | Why it is flagged |
| --- | --- |
| `a11-weight`: leaving the descent stage saved fuel | Engineering reasoning, not stated word for word on the cited page |
| `opp-myth`: “My battery is low…” was a journalist’s paraphrase | Need a NASA/JPL page that says this explicitly |
| Opportunity “30 May 2018: A storm appears” | Confirm the date the storm was first detected |
| Phoenix “Late October 2008: Shorter days” | Confirm the power-saving steps and dates |
| Sojourner “Late 1997: Listening” | Confirm when NASA formally ended Pathfinder operations |
| `p10-legacy`: Pioneer paved the way for Voyager | Cited source should state this directly |
| Pioneer 10 “February 2003: No answer” | Confirm the date of the final contact attempt |

## Also check (marked `verified` by the author, but worth a second look)

- Mission-clock numbers: Opportunity ~5,111 sols, Spirit ~2,210 sols, Sojourner 83 sols,
  Phoenix 5 months, Pioneer 10 ~370 months.
- Coordinates in `artifacts.ts` (`location.lat` / `location.lon`).
- Timeline dates in `worlds.ts`.
