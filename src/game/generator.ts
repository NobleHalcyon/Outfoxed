import {
  BOLD_FOREGROUNDS,
  COLOR_TOKENS,
  DEFAULT_WORD_LIST,
  DIGITS,
  LETTERS,
  PASTEL_BACKGROUNDS,
  SHAPES,
  SHAPE_LABELS,
  getDifficultyForTopic,
} from "./datasets";
import { hasSufficientContrast } from "./contrast";
import { DifficultyLevel, PromptData, RoundDefinition, RoundOption, ShapeId, TopicId } from "./types";

export interface GenerateRoundParams {
  topic: TopicId;
  timeoutMs: number;
  difficulty?: DifficultyLevel;
  wordList?: string[];
  targetItemId?: string;
  rng?: () => number;
}

const QUANTITIES = ["1", "2", "3", "4", "5", "6"];

const LOW_NON_COLOR_TOPICS: TopicId[] = ["letters", "numbers_text", "shapes"];

function randomOf<T>(items: T[], rng: () => number): T {
  return items[Math.floor(rng() * items.length)];
}

function makeRoundId(rng: () => number): string {
  return `${Date.now()}-${Math.floor(rng() * 1_000_000)}`;
}

function sanitizeWords(wordList?: string[]): string[] {
  const input = wordList?.length ? wordList : DEFAULT_WORD_LIST;
  const normalized = input
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length > 0)
    .filter((word, index, all) => all.indexOf(word) === index);
  return normalized.length > 0 ? normalized : DEFAULT_WORD_LIST;
}

export function getItemsForTopic(topic: TopicId, wordList?: string[]): string[] {
  switch (topic) {
    case "letters":
    case "alpha_colors":
    case "letter_shape_colors":
      return LETTERS;
    case "numbers_text":
    case "numbers_colors":
      return DIGITS;
    case "shapes":
    case "shapes_colors":
      return SHAPES;
    case "colors":
      return COLOR_TOKENS.map((entry) => entry.name.toLowerCase());
    case "quantities":
      return QUANTITIES;
    case "simple_words":
      return sanitizeWords(wordList);
    default:
      return LETTERS;
  }
}

function pickFourUnique(targetItemId: string, pool: string[], rng: () => number): string[] {
  const deduped = pool.filter((item, index, all) => all.indexOf(item) === index);
  if (!deduped.includes(targetItemId)) {
    throw new Error(`Target item ${targetItemId} does not exist in pool.`);
  }

  const candidates = deduped.filter((item) => item !== targetItemId);
  const chosen = [targetItemId];
  while (chosen.length < 4 && candidates.length > 0) {
    const index = Math.floor(rng() * candidates.length);
    chosen.push(candidates[index]);
    candidates.splice(index, 1);
  }

  // Fallback for tiny custom word lists. Keep unique option keys by supplementing defaults.
  if (chosen.length < 4) {
    for (const fallback of DEFAULT_WORD_LIST) {
      if (!chosen.includes(fallback)) {
        chosen.push(fallback);
      }
      if (chosen.length === 4) {
        break;
      }
    }
  }

  if (chosen.length !== 4) {
    throw new Error(`Topic ${targetItemId} did not provide enough unique options.`);
  }

  for (let i = chosen.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [chosen[i], chosen[j]] = [chosen[j], chosen[i]];
  }
  return chosen;
}

function pickContrastingFgBg(rng: () => number): { backgroundColor: string; foregroundColor: string } {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const backgroundColor = randomOf(PASTEL_BACKGROUNDS, rng).hex;
    const foregroundColor = randomOf(BOLD_FOREGROUNDS, rng).hex;
    if (hasSufficientContrast(foregroundColor, backgroundColor, 3)) {
      return { backgroundColor, foregroundColor };
    }
  }
  return { backgroundColor: "#E6F4FF", foregroundColor: "#12355B" };
}

function pickTextColorForBackground(backgroundColor: string, rng: () => number): string {
  const candidates = ["#111111", "#FFFFFF", ...BOLD_FOREGROUNDS.map((entry) => entry.hex)];
  for (const candidate of candidates.sort(() => rng() - 0.5)) {
    if (hasSufficientContrast(candidate, backgroundColor, 3)) {
      return candidate;
    }
  }
  return "#111111";
}

function pickShapeColorForBackground(backgroundColor: string, rng: () => number): string {
  const shuffled = [...BOLD_FOREGROUNDS].sort(() => rng() - 0.5);
  for (const entry of shuffled) {
    if (hasSufficientContrast(entry.hex, backgroundColor, 3)) {
      return entry.hex;
    }
  }
  return "#12355B";
}

function pickLetterOverShapeStyle(
  rng: () => number,
): { backgroundColor: string; foregroundColor: string; shapeColor: string } {
  for (let attempt = 0; attempt < 100; attempt += 1) {
    const backgroundColor = randomOf(PASTEL_BACKGROUNDS, rng).hex;
    const shapeColor = randomOf(BOLD_FOREGROUNDS, rng).hex;
    const foregroundColor = randomOf(BOLD_FOREGROUNDS, rng).hex;
    if (shapeColor === foregroundColor) {
      continue;
    }
    if (
      hasSufficientContrast(shapeColor, backgroundColor, 3) &&
      hasSufficientContrast(foregroundColor, shapeColor, 3)
    ) {
      return { backgroundColor, foregroundColor, shapeColor };
    }
  }

  return {
    backgroundColor: "#DDEFFF",
    foregroundColor: "#FFFFFF",
    shapeColor: "#1A4D9C",
  };
}

function colorHexById(itemId: string): string {
  return COLOR_TOKENS.find((entry) => entry.name.toLowerCase() === itemId)?.hex ?? "#3A86FF";
}

function buildTextOption(
  topic: TopicId,
  itemId: string,
  style: { backgroundColor: string; foregroundColor: string; shapeColor?: string },
): RoundOption {
  return {
    optionKey: `${topic}:${itemId}`,
    itemId,
    kind: "text",
    label: itemId,
    text: itemId.toUpperCase(),
    style,
    contrastPairs: [{ fgHex: style.foregroundColor, bgHex: style.backgroundColor }],
    styleSignature: `${style.backgroundColor}|${style.foregroundColor}|${style.shapeColor ?? "none"}`,
  };
}

function buildShapeOption(
  topic: TopicId,
  itemId: ShapeId,
  style: { backgroundColor: string; foregroundColor: string; shapeColor?: string },
): RoundOption {
  const shapeColor = style.shapeColor ?? style.foregroundColor;
  return {
    optionKey: `${topic}:${itemId}`,
    itemId,
    kind: "shape",
    label: SHAPE_LABELS[itemId],
    shape: itemId,
    style: { ...style, shapeColor },
    contrastPairs: [{ fgHex: shapeColor, bgHex: style.backgroundColor }],
    styleSignature: `${style.backgroundColor}|${style.foregroundColor}|${shapeColor}`,
  };
}

function buildRoundOptions(
  topic: TopicId,
  optionItems: string[],
  rng: () => number,
): { options: RoundOption[]; correctDecorators: Partial<RoundOption> } {
  const invariantStyle = LOW_NON_COLOR_TOPICS.includes(topic) ? pickContrastingFgBg(rng) : undefined;
  const quantityShape = randomOf(SHAPES, rng);
  const quantityStyle = pickContrastingFgBg(rng);

  const options = optionItems.map((itemId) => {
    switch (topic) {
      case "letters":
        return buildTextOption(topic, itemId, invariantStyle ?? pickContrastingFgBg(rng));
      case "numbers_text":
        return buildTextOption(topic, itemId, invariantStyle ?? pickContrastingFgBg(rng));
      case "shapes":
        return buildShapeOption(
          topic,
          itemId as ShapeId,
          invariantStyle ?? { ...pickContrastingFgBg(rng), shapeColor: pickContrastingFgBg(rng).foregroundColor },
        );
      case "colors": {
        const swatchColor = colorHexById(itemId);
        const foregroundColor = pickTextColorForBackground(swatchColor, rng);
        return {
          optionKey: `${topic}:${itemId}`,
          itemId,
          kind: "color",
          label: itemId,
          text: itemId[0].toUpperCase() + itemId.slice(1),
          style: {
            backgroundColor: swatchColor,
            foregroundColor,
          },
          contrastPairs: [{ fgHex: foregroundColor, bgHex: swatchColor }],
          styleSignature: `${swatchColor}|${foregroundColor}|none`,
        } satisfies RoundOption;
      }
      case "alpha_colors":
        return buildTextOption(topic, itemId, pickContrastingFgBg(rng));
      case "numbers_colors":
        return buildTextOption(topic, itemId, pickContrastingFgBg(rng));
      case "shapes_colors":
        return (() => {
          const style = pickContrastingFgBg(rng);
          const shapeColor = pickShapeColorForBackground(style.backgroundColor, rng);
          return buildShapeOption(topic, itemId as ShapeId, { ...style, shapeColor });
        })();
      case "quantities": {
        const quantity = Number(itemId);
        const style = quantityStyle;
        return {
          optionKey: `${topic}:${itemId}`,
          itemId,
          kind: "quantity",
          label: itemId,
          quantity,
          shape: quantityShape,
          style: { ...style, shapeColor: style.foregroundColor },
          contrastPairs: [{ fgHex: style.foregroundColor, bgHex: style.backgroundColor }],
          styleSignature: `${style.backgroundColor}|${style.foregroundColor}|${style.foregroundColor}`,
        } satisfies RoundOption;
      }
      case "letter_shape_colors": {
        const style = pickLetterOverShapeStyle(rng);
        const shape = randomOf(SHAPES, rng);
        return {
          optionKey: `${topic}:${itemId}`,
          itemId,
          kind: "letter_shape",
          label: itemId,
          shapeLetter: itemId,
          shape,
          style,
          contrastPairs: [
            { fgHex: style.shapeColor ?? style.foregroundColor, bgHex: style.backgroundColor },
            { fgHex: style.foregroundColor, bgHex: style.shapeColor ?? style.backgroundColor },
          ],
          styleSignature: `${style.backgroundColor}|${style.foregroundColor}|${style.shapeColor ?? "none"}`,
        } satisfies RoundOption;
      }
      case "simple_words": {
        const style = pickContrastingFgBg(rng);
        const letterColors = itemId.split("").map(() => randomOf(BOLD_FOREGROUNDS, rng).hex);
        const adjusted = letterColors.map((color) =>
          hasSufficientContrast(color, style.backgroundColor, 3)
            ? color
            : pickTextColorForBackground(style.backgroundColor, rng),
        );
        return {
          optionKey: `${topic}:${itemId}`,
          itemId,
          kind: "word",
          label: itemId,
          text: itemId,
          letterColors: adjusted,
          style,
          contrastPairs: adjusted.map((color) => ({ fgHex: color, bgHex: style.backgroundColor })),
          styleSignature: `${style.backgroundColor}|${style.foregroundColor}|none`,
        } satisfies RoundOption;
      }
      default:
        return buildTextOption(topic, itemId, pickContrastingFgBg(rng));
    }
  });

  return { options, correctDecorators: {} };
}

function buildPrompt(topic: TopicId, correctOption: RoundOption): PromptData {
  switch (topic) {
    case "letters":
      return {
        title: "Tap this letter",
        kind: "text",
        text: correctOption.text,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
    case "numbers_text":
      return {
        title: "Tap this number",
        kind: "text",
        text: correctOption.text,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
    case "shapes":
      return {
        title: "Tap this shape",
        kind: "shape",
        shape: correctOption.shape,
        text: correctOption.label,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
        shapeColor: correctOption.style.shapeColor,
      };
    case "colors":
      return {
        title: "Find this color",
        subtitle: correctOption.text,
        kind: "color",
        swatchColor: correctOption.style.backgroundColor,
        text: correctOption.text,
        backgroundColor: "#FFFFFF",
        foregroundColor: "#12355B",
      };
    case "alpha_colors":
      return {
        title: "Match this letter",
        kind: "text",
        text: correctOption.text,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
    case "numbers_colors":
      return {
        title: "Match this number",
        kind: "text",
        text: correctOption.text,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
    case "shapes_colors":
      return {
        title: "Match this shape",
        kind: "shape",
        shape: correctOption.shape,
        text: correctOption.label,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
        shapeColor: correctOption.style.shapeColor,
      };
    case "quantities":
      return {
        title: "Find this amount",
        kind: "quantity",
        quantity: correctOption.quantity,
        shape: correctOption.shape,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
        shapeColor: correctOption.style.shapeColor,
      };
    case "letter_shape_colors":
      return {
        title: "Match this combo",
        kind: "letter_shape",
        shape: correctOption.shape,
        shapeLetter: correctOption.shapeLetter,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
        shapeColor: correctOption.style.shapeColor,
      };
    case "simple_words":
      return {
        title: "Find this word",
        kind: "word",
        text: correctOption.text,
        letterColors: correctOption.letterColors,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
    default:
      return {
        title: "Match this",
        kind: "text",
        text: correctOption.text,
        backgroundColor: correctOption.style.backgroundColor,
        foregroundColor: correctOption.style.foregroundColor,
      };
  }
}

export function isLowNonColorTopic(topic: TopicId): boolean {
  return LOW_NON_COLOR_TOPICS.includes(topic);
}

export function generateRound({
  topic,
  timeoutMs,
  difficulty = getDifficultyForTopic(topic),
  wordList,
  targetItemId,
  rng = Math.random,
}: GenerateRoundParams): RoundDefinition {
  const items = getItemsForTopic(topic, wordList);
  const target = targetItemId && items.includes(targetItemId) ? targetItemId : randomOf(items, rng);
  const optionItems = pickFourUnique(target, items, rng);
  const { options } = buildRoundOptions(topic, optionItems, rng);
  const correctOption = options.find((option) => option.itemId === target);

  if (!correctOption) {
    throw new Error("Generated round did not include the correct option.");
  }

  return {
    id: makeRoundId(rng),
    topic,
    difficulty,
    targetItemId: target,
    options,
    correctOptionKey: correctOption.optionKey,
    prompt: buildPrompt(topic, correctOption),
    timeoutMs,
  };
}
