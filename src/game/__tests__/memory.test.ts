import { advanceMemoryPhase, createMemoryPhaseState, isOptionsInteractive } from "../memory";

describe("memory phase state machine", () => {
  test("preview is non-interactive then transitions to choice", () => {
    const config = { enabled: true, previewMs: 1500, helpMs: 6000, hintMs: 800 };
    const initial = createMemoryPhaseState(0, true);

    expect(initial.phase).toBe("preview");
    expect(isOptionsInteractive(initial)).toBe(false);

    const afterPreview = advanceMemoryPhase(initial, 1500, config);
    expect(afterPreview.phase).toBe("choice");
    expect(isOptionsInteractive(afterPreview)).toBe(true);
  });

  test("hint triggers once at helpMs and returns to choice after hintMs", () => {
    const config = { enabled: true, previewMs: 1000, helpMs: 6000, hintMs: 800 };
    const initial = createMemoryPhaseState(0, true);
    const choice = advanceMemoryPhase(initial, 1000, config);
    const hint = advanceMemoryPhase(choice, 6000, config);

    expect(hint.phase).toBe("hint");
    expect(hint.hintShown).toBe(true);

    const backToChoice = advanceMemoryPhase(hint, 6800, config);
    expect(backToChoice.phase).toBe("choice");
    expect(backToChoice.hintShown).toBe(true);

    const staysChoice = advanceMemoryPhase(backToChoice, 9000, config);
    expect(staysChoice.phase).toBe("choice");
  });
});
