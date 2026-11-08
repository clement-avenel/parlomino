import { palette, type PaletteColor } from "@parlomino/library";

export interface Theme {
  background: string;
  /** Replacement for each palette color used in element drawings. */
  colors: Record<PaletteColor, string>;
  /** Marks drawn by the engine: corner discs, tense arrows, question mark. */
  mark: string;
  negation: string;
  /** Halo drawn under marks so they stay readable over any drawing. */
  halo: string;
  /** Border of each pictogram card in a phrase. */
  card: string;
  /** Dashed reference outline used by big and small. */
  ghost: string;
}

export const themes = {
  default: {
    background: palette.paper,
    colors: { ...palette },
    mark: palette.ink,
    negation: "#D62828",
    halo: palette.paper,
    card: "#D1D5DB",
    ghost: "#9CA3AF",
  },
  /** For low vision: yellow outlines on black, no color-only information. */
  "high-contrast": {
    background: "#000000",
    colors: Object.fromEntries(
      Object.keys(palette).map((k) => [k, k === "ink" ? "#FFE600" : "#000000"]),
    ) as Record<PaletteColor, string>,
    mark: "#FFE600",
    negation: "#FFFFFF",
    halo: "#000000",
    card: "#FFE600",
    ghost: "#BFBFBF",
  },
} satisfies Record<string, Theme>;

export type ThemeName = keyof typeof themes;
