import { topicsForDifficulty } from "./datasets";
import { DifficultyLevel, TopicId } from "./types";

export interface ProgressionState {
  difficultyLevel: DifficultyLevel;
  streak: number;
  noClearStreak: number;
  score: number;
}

const SCORE_BY_LEVEL: Record<DifficultyLevel, number> = {
  0: 1,
  1: 2,
  2: 3,
};

export function createInitialProgressionState(startingDifficultyLevel: DifficultyLevel): ProgressionState {
  return {
    difficultyLevel: startingDifficultyLevel,
    streak: 0,
    noClearStreak: 0,
    score: 0,
  };
}

export function applyCorrectToProgression(state: ProgressionState): ProgressionState {
  const next: ProgressionState = {
    ...state,
    streak: state.streak + 1,
    noClearStreak: 0,
    score: state.score + SCORE_BY_LEVEL[state.difficultyLevel],
  };

  if (next.difficultyLevel === 0 && next.streak >= 6 && next.score >= 10) {
    next.difficultyLevel = 1;
  } else if (next.difficultyLevel === 1 && next.streak >= 8 && next.score >= 25) {
    next.difficultyLevel = 2;
  }

  return next;
}

export function applyNoClearToProgression(state: ProgressionState): ProgressionState {
  const noClear = state.noClearStreak + 1;
  if (noClear >= 3) {
    return {
      ...state,
      streak: 0,
      noClearStreak: 0,
      difficultyLevel: Math.max(0, state.difficultyLevel - 1) as DifficultyLevel,
    };
  }
  return {
    ...state,
    streak: 0,
    noClearStreak: noClear,
  };
}

export interface PickProgressionTopicParams {
  difficultyLevel: DifficultyLevel;
  recentTopics: TopicId[];
  rng?: () => number;
}

export function pickProgressionTopic({
  difficultyLevel,
  recentTopics,
  rng = Math.random,
}: PickProgressionTopicParams): TopicId {
  const available = topicsForDifficulty(difficultyLevel);
  const last = recentTopics[recentTopics.length - 1];
  const secondLast = recentTopics[recentTopics.length - 2];
  const limitedPool =
    available.length > 1 && last && secondLast && last === secondLast
      ? available.filter((topic) => topic !== last)
      : available;
  const pool = limitedPool.length > 0 ? limitedPool : available;
  return pool[Math.floor(rng() * pool.length)];
}
