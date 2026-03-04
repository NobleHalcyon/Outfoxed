import { DifficultyLevel, ShapeId, TopicId, TopicMeta } from "./types";

export interface NamedColor {
  name: string;
  hex: string;
}

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
export const DIGITS = "0123456789".split("");

export const SHAPES: ShapeId[] = [
  "circle",
  "square",
  "triangle",
  "star",
  "heart",
  "hexagon",
  "octagon",
  "diamond",
];

export const SHAPE_LABELS: Record<ShapeId, string> = {
  circle: "Circle",
  square: "Square",
  triangle: "Triangle",
  star: "Star",
  heart: "Heart",
  hexagon: "Hexagon",
  octagon: "Octagon",
  diamond: "Diamond",
};

export const DEFAULT_WORD_LIST = ["dog", "cat", "sun", "car", "hat", "mom", "dad"];

export const PASTEL_BACKGROUNDS: NamedColor[] = [
  { name: "Mint", hex: "#DFF7EA" },
  { name: "Sky", hex: "#DDEFFF" },
  { name: "Peach", hex: "#FFE9D6" },
  { name: "Lemon", hex: "#FFF6C9" },
  { name: "Lilac", hex: "#F0E3FF" },
  { name: "Rose", hex: "#FFE3EC" },
  { name: "Ice", hex: "#E6FBFF" },
  { name: "Sand", hex: "#F9EED9" },
];

export const BOLD_FOREGROUNDS: NamedColor[] = [
  { name: "Navy", hex: "#12355B" },
  { name: "Cobalt", hex: "#1A4D9C" },
  { name: "Forest", hex: "#1E5F32" },
  { name: "Berry", hex: "#7E1F5C" },
  { name: "Brick", hex: "#8B2E24" },
  { name: "Teal", hex: "#16697A" },
  { name: "Plum", hex: "#5B2A86" },
  { name: "Slate", hex: "#36454F" },
];

export const COLOR_TOKENS: NamedColor[] = [
  { name: "Red", hex: "#E63946" },
  { name: "Orange", hex: "#F77F00" },
  { name: "Yellow", hex: "#F4D35E" },
  { name: "Green", hex: "#2A9D8F" },
  { name: "Blue", hex: "#3A86FF" },
  { name: "Purple", hex: "#8338EC" },
  { name: "Pink", hex: "#FF4D8D" },
  { name: "Brown", hex: "#8D6E63" },
];

export const LOW_TOPICS: TopicId[] = ["letters", "colors", "numbers_text", "shapes"];
export const MODERATE_TOPICS: TopicId[] = ["alpha_colors", "numbers_colors", "shapes_colors", "quantities"];
export const HIGH_TOPICS: TopicId[] = ["letter_shape_colors", "simple_words"];
export const ALL_TOPICS: TopicId[] = [...LOW_TOPICS, ...MODERATE_TOPICS, ...HIGH_TOPICS];

export const TOPIC_META: TopicMeta[] = [
  { id: "letters", label: "Letters", difficulty: 0 },
  { id: "colors", label: "Colors", difficulty: 0 },
  { id: "numbers_text", label: "Numbers", difficulty: 0 },
  { id: "shapes", label: "Shapes", difficulty: 0 },
  { id: "alpha_colors", label: "Alpha + Colors", difficulty: 1 },
  { id: "numbers_colors", label: "Numbers + Colors", difficulty: 1 },
  { id: "shapes_colors", label: "Shapes + Colors", difficulty: 1 },
  { id: "quantities", label: "Quantities", difficulty: 1 },
  { id: "letter_shape_colors", label: "Letter + Shape + Colors", difficulty: 2 },
  { id: "simple_words", label: "Simple Words", difficulty: 2 },
];

export function getDifficultyForTopic(topic: TopicId): DifficultyLevel {
  return TOPIC_META.find((entry) => entry.id === topic)?.difficulty ?? 0;
}

export function topicsForDifficulty(level: DifficultyLevel): TopicId[] {
  if (level === 0) {
    return LOW_TOPICS;
  }
  if (level === 1) {
    return MODERATE_TOPICS;
  }
  return HIGH_TOPICS;
}
