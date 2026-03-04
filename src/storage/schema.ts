import { DEFAULT_WORD_LIST } from "../game/datasets";
import { createInitialProgressionState, ProgressionState } from "../game/progression";
import { DifficultyLevel, ItemLearningStat, TopicId, TopicLearningStat } from "../game/types";

export interface KidSettings {
  soundEnabled: boolean;
  showTimer: boolean;
  timeoutMs: number;
  showHud: boolean;
  memoryMode: boolean;
  previewMs: number;
  helpMs: number;
  hintMs: number;
  adaptivePracticeEnabled: boolean;
  startingDifficultyLevel: DifficultyLevel;
  wordList: string[];
}

export interface KidLearningStats {
  items: Record<string, ItemLearningStat>;
  topics: Partial<Record<TopicId, TopicLearningStat>>;
  progression: ProgressionState;
  recentTargets: string[];
  recentTopics: TopicId[];
  lastTargetId?: string;
}

export interface KidProfile {
  id: string;
  name: string;
  createdAt: number;
  settings: KidSettings;
  stats: KidLearningStats;
}

export interface ProfilesStore {
  activeProfileId: string;
  profiles: KidProfile[];
}

export const STORAGE_KEY = "outfoxed_profiles_v1";

export function createDefaultSettings(): KidSettings {
  return {
    soundEnabled: true,
    showTimer: true,
    timeoutMs: 12_000,
    showHud: true,
    memoryMode: false,
    previewMs: 1_500,
    helpMs: 6_000,
    hintMs: 800,
    adaptivePracticeEnabled: true,
    startingDifficultyLevel: 0,
    wordList: [...DEFAULT_WORD_LIST],
  };
}

export function createEmptyLearningStats(startingDifficulty: DifficultyLevel): KidLearningStats {
  return {
    items: {},
    topics: {},
    progression: createInitialProgressionState(startingDifficulty),
    recentTargets: [],
    recentTopics: [],
  };
}

function makeKidId(): string {
  return `kid-${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
}

export function createKidProfile(name: string): KidProfile {
  const settings = createDefaultSettings();
  return {
    id: makeKidId(),
    name: name.trim() || "Kid",
    createdAt: Date.now(),
    settings,
    stats: createEmptyLearningStats(settings.startingDifficultyLevel),
  };
}

export function createDefaultStore(): ProfilesStore {
  const firstKid = createKidProfile("Kid 1");
  return {
    activeProfileId: firstKid.id,
    profiles: [firstKid],
  };
}
