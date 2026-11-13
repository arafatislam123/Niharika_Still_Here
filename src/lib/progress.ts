/**
 * Learner progress and badges. Stored only in this browser (no accounts), so it can disappear
 * in private windows; every read and write is wrapped so the app still works without storage.
 */
import { useSyncExternalStore } from 'react';

export interface Progress {
  storiesRead: string[];
  lastSignalsSeen: string[];
  quizScores: Record<string, { score: number; total: number }>;
  gameMissions: string[];
  questionsAsked: number;
}

const KEY = 'forgotten-explorers:progress:v1';
const EMPTY: Progress = {
  storiesRead: [],
  lastSignalsSeen: [],
  quizScores: {},
  gameMissions: [],
  questionsAsked: 0,
};

function read(): Progress {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...EMPTY, ...(JSON.parse(raw) as Partial<Progress>) } : EMPTY;
  } catch {
    return EMPTY;
  }
}

let state: Progress = read();
const listeners = new Set<() => void>();

function update(fn: (p: Progress) => Progress) {
  state = fn(state);
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable: keep progress in memory for this visit */
  }
  listeners.forEach((l) => l());
}

const addUnique = (list: string[], id: string) => (list.includes(id) ? list : [...list, id]);

export const markStoryRead = (id: string) =>
  update((p) => ({ ...p, storiesRead: addUnique(p.storiesRead, id) }));
export const markLastSignalSeen = (id: string) =>
  update((p) => ({ ...p, lastSignalsSeen: addUnique(p.lastSignalsSeen, id) }));
export const recordQuiz = (id: string, score: number, total: number) =>
  update((p) => {
    const best = p.quizScores[id];
    if (best && best.score >= score) return p;
    return { ...p, quizScores: { ...p.quizScores, [id]: { score, total } } };
  });
export const completeMission = (id: string) =>
  update((p) => ({ ...p, gameMissions: addUnique(p.gameMissions, id) }));
export const countQuestion = () => update((p) => ({ ...p, questionsAsked: p.questionsAsked + 1 }));
export const resetProgress = () => update(() => EMPTY);

export function useProgress(): Progress {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earned: (p: Progress) => boolean;
}

export const BADGES: Badge[] = [
  {
    id: 'first-story',
    name: 'Story Seeker',
    icon: '📖',
    description: 'Read your first explorer story.',
    earned: (p) => p.storiesRead.length >= 1,
  },
  {
    id: 'all-stories',
    name: 'Keeper of Memories',
    icon: '🏛️',
    description: 'Read the stories of all six explorers.',
    earned: (p) => p.storiesRead.length >= 6,
  },
  {
    id: 'last-signal',
    name: 'Signal Listener',
    icon: '📡',
    description: 'Follow a mission’s Last Signal timeline.',
    earned: (p) => p.lastSignalsSeen.length >= 1,
  },
  {
    id: 'curious',
    name: 'Curious Mind',
    icon: '💬',
    description: 'Ask the AI Explorer 3 questions.',
    earned: (p) => p.questionsAsked >= 3,
  },
  {
    id: 'quiz-ace',
    name: 'Quiz Ace',
    icon: '🏅',
    description: 'Get a perfect score on any quiz.',
    earned: (p) => Object.values(p.quizScores).some((q) => q.score === q.total),
  },
  {
    id: 'rover-driver',
    name: 'Rover Driver',
    icon: '🚙',
    description: 'Complete the Mars Explorer game mission.',
    earned: (p) => p.gameMissions.includes('explore-mars'),
  },
  {
    id: 'water-detective',
    name: 'Water Detective',
    icon: '💧',
    description: 'Complete the Find the Water Evidence mission.',
    earned: (p) => p.gameMissions.includes('find-water'),
  },
  {
    id: 'storm-survivor',
    name: 'Storm Survivor',
    icon: '🌪️',
    description: 'Keep your rover safe through a dust storm.',
    earned: (p) => p.gameMissions.includes('survive-storm'),
  },
];
