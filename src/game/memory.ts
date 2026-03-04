export type MemoryPhase = "preview" | "choice" | "hint";

export interface MemoryConfig {
  enabled: boolean;
  previewMs: number;
  helpMs: number;
  hintMs: number;
}

export interface MemoryPhaseState {
  phase: MemoryPhase;
  roundStartedAt: number;
  phaseStartedAt: number;
  hintShown: boolean;
}

export function createMemoryPhaseState(now: number, enabled: boolean): MemoryPhaseState {
  return {
    phase: enabled ? "preview" : "choice",
    roundStartedAt: now,
    phaseStartedAt: now,
    hintShown: false,
  };
}

export function isOptionsInteractive(state: MemoryPhaseState): boolean {
  return state.phase !== "preview";
}

export function isPromptHidden(state: MemoryPhaseState, memoryEnabled: boolean): boolean {
  if (!memoryEnabled) {
    return false;
  }
  return state.phase === "choice";
}

export function advanceMemoryPhase(
  state: MemoryPhaseState,
  now: number,
  config: MemoryConfig,
): MemoryPhaseState {
  if (!config.enabled) {
    return state.phase === "choice" ? state : { ...state, phase: "choice", phaseStartedAt: now };
  }

  if (state.phase === "preview" && now - state.roundStartedAt >= config.previewMs) {
    return {
      ...state,
      phase: "choice",
      phaseStartedAt: now,
    };
  }

  if (state.phase === "choice" && !state.hintShown && now - state.roundStartedAt >= config.helpMs) {
    return {
      ...state,
      phase: "hint",
      phaseStartedAt: now,
      hintShown: true,
    };
  }

  if (state.phase === "hint" && now - state.phaseStartedAt >= config.hintMs) {
    return {
      ...state,
      phase: "choice",
      phaseStartedAt: now,
    };
  }

  return state;
}
