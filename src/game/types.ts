export type DifficultyLevel = 0 | 1 | 2;

export type DifficultyBucket = "low" | "moderate" | "high" | "auto";

export type GameMode = "focus" | "progression";

export type TopicId =
  | "letters"
  | "colors"
  | "numbers_text"
  | "shapes"
  | "alpha_colors"
  | "numbers_colors"
  | "shapes_colors"
  | "quantities"
  | "letter_shape_colors"
  | "simple_words";

export type ShapeId =
  | "circle"
  | "square"
  | "triangle"
  | "star"
  | "heart"
  | "hexagon"
  | "octagon"
  | "diamond";

export interface TopicMeta {
  id: TopicId;
  label: string;
  difficulty: DifficultyLevel;
}

export interface ContrastPair {
  fgHex: string;
  bgHex: string;
}

export type OptionKind =
  | "text"
  | "color"
  | "shape"
  | "quantity"
  | "letter_shape"
  | "word";

export interface RoundOption {
  optionKey: string;
  itemId: string;
  kind: OptionKind;
  label: string;
  text?: string;
  shape?: ShapeId;
  quantity?: number;
  shapeLetter?: string;
  style: {
    backgroundColor: string;
    foregroundColor: string;
    shapeColor?: string;
  };
  letterColors?: string[];
  contrastPairs: ContrastPair[];
  styleSignature: string;
}

export interface PromptData {
  title: string;
  subtitle?: string;
  kind: OptionKind;
  text?: string;
  shape?: ShapeId;
  quantity?: number;
  shapeLetter?: string;
  swatchColor?: string;
  backgroundColor: string;
  foregroundColor: string;
  shapeColor?: string;
  letterColors?: string[];
}

export interface RoundDefinition {
  id: string;
  topic: TopicId;
  difficulty: DifficultyLevel;
  targetItemId: string;
  options: RoundOption[];
  correctOptionKey: string;
  prompt: PromptData;
  timeoutMs: number;
}

export interface ItemLearningStat {
  shown: number;
  correct: number;
  avgTimeMs: number;
  timeouts: number;
  lastSeenAt: number;
}

export interface TopicLearningStat {
  shown: number;
  correct: number;
  timeouts: number;
  lastSeenAt: number;
}

export interface FocusSessionConfig {
  mode: "focus";
  bucket: DifficultyBucket;
  topic: TopicId;
}

export interface ProgressionSessionConfig {
  mode: "progression";
}

export type SessionConfig = FocusSessionConfig | ProgressionSessionConfig;
