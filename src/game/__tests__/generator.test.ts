import { hasSufficientContrast } from "../contrast";
import { ALL_TOPICS } from "../datasets";
import { generateRound, isLowNonColorTopic } from "../generator";
import { TopicId } from "../types";

describe("round generator invariants", () => {
  test("returns exactly four options", () => {
    const round = generateRound({ topic: "letters", timeoutMs: 12000 });
    expect(round.options).toHaveLength(4);
  });

  test("correct option is included", () => {
    const round = generateRound({ topic: "numbers_text", timeoutMs: 12000 });
    const correctIncluded = round.options.some((option) => option.optionKey === round.correctOptionKey);
    expect(correctIncluded).toBe(true);
  });

  test("options are unique by optionKey", () => {
    const round = generateRound({ topic: "simple_words", timeoutMs: 12000, wordList: ["dog", "cat", "sun", "car"] });
    const keys = round.options.map((option) => option.optionKey);
    expect(new Set(keys).size).toBe(4);
  });

  test("low non-color topics enforce style invariance across options", () => {
    const topics: TopicId[] = ["letters", "numbers_text", "shapes"];
    for (const topic of topics) {
      expect(isLowNonColorTopic(topic)).toBe(true);
      const round = generateRound({ topic, timeoutMs: 12000 });
      const signatures = round.options.map((option) => option.styleSignature);
      expect(new Set(signatures).size).toBe(1);
    }
  });

  test("contrast rule always passes for rendered foreground/background pairs", () => {
    for (const topic of ALL_TOPICS) {
      for (let i = 0; i < 50; i += 1) {
        const round = generateRound({ topic, timeoutMs: 12000 });
        for (const option of round.options) {
          for (const pair of option.contrastPairs) {
            expect(hasSufficientContrast(pair.fgHex, pair.bgHex, 3)).toBe(true);
          }
        }
      }
    }
  });
});
