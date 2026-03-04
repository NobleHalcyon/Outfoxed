import { selectAdaptiveTarget } from "../adaptive";

describe("adaptive selection", () => {
  test("never repeats the same target consecutively when alternatives exist", () => {
    const itemIds = ["a", "b", "c"];
    const itemStats = {
      a: { shown: 2, correct: 1, avgTimeMs: 1200, timeouts: 0, lastSeenAt: 1 },
      b: { shown: 2, correct: 2, avgTimeMs: 800, timeouts: 0, lastSeenAt: 1 },
      c: { shown: 0, correct: 0, avgTimeMs: 0, timeouts: 0, lastSeenAt: 1 },
    };

    let lastTarget = "a";
    let recentTargets: string[] = ["a"];
    for (let i = 0; i < 40; i += 1) {
      const next = selectAdaptiveTarget({
        itemIds,
        itemStats,
        recentTargets,
        lastTargetId: lastTarget,
        streak: 0,
      });
      expect(next).not.toBe(lastTarget);
      recentTargets = [...recentTargets, next].slice(-10);
      lastTarget = next;
    }
  });
});
