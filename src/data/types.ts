/**
 * Content model for Forgotten Explorers.
 *
 * Mirrors the planned PostgreSQL schema (planets, missions, artifacts, stories, media,
 * scientific_discoveries, quizzes, questions) so this static data can later be moved into the
 * Laravel API without changing its shape.
 */

export type WorldId = 'moon' | 'mars' | 'deep-space';

/**
 * Status is deliberately richer than active/inactive: a mission ending, losing contact and
 * hardware breaking are different events.
 */
export type ArtifactStatus =
  | 'active'
  | 'inactive'
  | 'mission-completed'
  | 'lost-contact'
  | 'partially-operational'
  | 'unknown';

/** `verified` = checked against the cited NASA page; `needs-review` = shown with a warning. */
export type Verification = 'verified' | 'needs-review';

export interface Source {
  id: string;
  title: string;
  publisher: string;
  url: string;
}

export interface Fact {
  id: string;
  text: string;
  sourceId: string;
  verification: Verification;
  /** Words a question might use to reach this fact (used by the AI Explorer retriever). */
  keywords: string[];
  topic: FactTopic;
}

export type FactTopic =
  | 'identity'
  | 'purpose'
  | 'journey'
  | 'how-it-worked'
  | 'discovery'
  | 'ending'
  | 'status'
  | 'legacy'
  | 'numbers';

export interface StoryChapter {
  title: string;
  /** First-person, imagined narration. Always labelled as imagined in the UI. */
  text: string;
  /** Facts that back up this chapter, shown in "Explore Facts" mode. */
  factIds: string[];
}

export interface LastSignalEvent {
  date: string; // human-readable, e.g. "10 June 2018"
  title: string;
  text: string;
  sourceId: string;
  verification: Verification;
}

export interface Artifact {
  id: string;
  name: string;
  shortName: string;
  world: WorldId;
  mission: string;
  type: 'lander' | 'rover' | 'spacecraft' | 'lander stage';
  missionPeriod: string;
  status: ArtifactStatus;
  /** One line explaining the status, because "lost contact" is not the whole story. */
  statusNote: string;
  tagline: string;
  location: {
    name: string;
    /** Planetocentric latitude, east-positive longitude. Absent for deep space. */
    lat?: number;
    lon?: number;
    description: string;
  };
  /** Emoji used as a small, friendly icon. */
  icon: string;
  color: string;
  /** Search term for the NASA Image and Video Library. */
  imageQuery: string;
  plannedLife?: { value: number; unit: string; actual: number; note: string };
  chapters: StoryChapter[];
  facts: Fact[];
  lastSignal?: LastSignalEvent[];
  whyItMatters: string;
}

export interface World {
  id: WorldId;
  name: string;
  tagline: string;
  description: string;
  color: string;
}

export interface TimelineEvent {
  year: number;
  date: string;
  title: string;
  text: string;
  world: WorldId | 'earth' | 'venus' | 'jupiter';
  artifactId?: string;
  sourceId: string;
}

export interface LegacyLink {
  from: string;
  to: string;
  text: string;
  sourceId: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  sourceId: string;
  artifactId?: string;
}

export interface Quiz {
  id: string;
  title: string;
  difficulty: 'easy' | 'medium' | 'hard';
  description: string;
  questions: QuizQuestion[];
}
