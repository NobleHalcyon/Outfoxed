import { ItemLearningStat } from "./types";

const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

export interface AdaptivePickParams {
  itemIds: string[];
  itemStats: Record<string, ItemLearningStat | undefined>;
  recentTargets: string[];
  lastTargetId?: string;
  streak: number;
  rng?: () => number;
}

function pickWeighted(weights: Array<{ itemId: string; weight: number }>, rng: () => number): string {
  const total = weights.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return weights[Math.floor(rng() * weights.length)].itemId;
  }

  let roll = rng() * total;
  for (const entry of weights) {
    roll -= entry.weight;
    if (roll <= 0) {
      return entry.itemId;
    }
  }

  return weights[weights.length - 1].itemId;
}

export function selectAdaptiveTarget({
  itemIds,
  itemStats,
  recentTargets,
  lastTargetId,
  streak,
  rng = Math.random,
}: AdaptivePickParams): string {
  if (itemIds.length === 0) {
    throw new Error("Cannot pick target from an empty item pool.");
  }

  const filtered = itemIds.filter((itemId) => itemId !== lastTargetId);
  const pool = filtered.length > 0 ? filtered : itemIds;
  const recentFive = new Set(recentTargets.slice(-5));

  const weights = pool.map((itemId) => {
    const stat = itemStats[itemId];
    const shown = stat?.shown ?? 0;
    const correct = stat?.correct ?? 0;
    const timeouts = stat?.timeouts ?? 0;
    const accuracy = correct / Math.max(1, shown);
    const need = clamp(1 - accuracy, 0, 1);
    const timeoutRate = timeouts / Math.max(1, shown);

    let weight = 1;
    weight += need * 3;
    weight += timeoutRate * 2;
    if (shown === 0) {
      weight += 1;
    }
    if (streak >= 10 && shown === 0) {
      weight += 0.75;
    }
    if (recentFive.has(itemId)) {
      weight *= 0.25;
    }
    return { itemId, weight };
  });

  return pickWeighted(weights, rng);
}
