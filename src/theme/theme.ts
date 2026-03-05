export interface ThemePreset {
  id: string;
  label: string;
  backgroundColor: string;
}

export const APP_ACCENT_COLOR = "#1A4D9C";
export const DEFAULT_BACKGROUND = "#EEF1F4";
export const DEFAULT_THEME_ID = "soft-gray";

export const BACKGROUND_PRESETS: ThemePreset[] = [
  { id: "soft-gray", label: "Soft Gray", backgroundColor: "#EEF1F4" },
  { id: "mint", label: "Mint", backgroundColor: "#EAF7EF" },
  { id: "sky", label: "Sky", backgroundColor: "#EAF2FF" },
  { id: "peach", label: "Peach", backgroundColor: "#FFF1E8" },
  { id: "lemon", label: "Lemon", backgroundColor: "#FFF8D9" },
  { id: "sand", label: "Sand", backgroundColor: "#F6EEDC" },
];

export function resolveBackgroundColor(themeId?: string): string {
  return BACKGROUND_PRESETS.find((preset) => preset.id === themeId)?.backgroundColor ?? DEFAULT_BACKGROUND;
}
