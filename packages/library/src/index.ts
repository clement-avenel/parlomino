import type { ElementDef, ElementKind, LexiconEntry } from "@parlomino/spec";
import { elements, lexicon } from "./generated.ts";

/**
 * The drawing palette. Element SVGs may only use these colors (enforced by tests):
 * themes recolor pictograms by mapping each palette color to another one.
 */
export const palette = {
  ink: "#1F2937",
  paper: "#FFFFFF",
  skin: "#F5C9A0",
  hair: "#6B4F3A",
  blue: "#4F86C6",
  green: "#6BAF5B",
  red: "#E46B4A",
  yellow: "#F2C14E",
  water: "#7EC8E3",
  orange: "#F4AA41",
  pink: "#F7A8C0",
  purple: "#9F86C0",
  brown: "#A57939",
  lightGray: "#D0CFCE",
  gray: "#9B9B9A",
  darkGray: "#3F3F3F",
} as const;
export type PaletteColor = keyof typeof palette;

/**
 * Languages every element and lexicon entry must be labeled in (enforced by tests).
 * Other languages are welcome and optional; labels fall back to English.
 */
export const REQUIRED_LANGUAGES = ["en", "fr"] as const;

export interface Library {
  readonly elements: readonly ElementDef[];
  readonly lexicon: readonly LexiconEntry[];
  get(id: string): ElementDef | undefined;
  entry(id: string): LexiconEntry | undefined;
  ofKind(kind: ElementKind): readonly ElementDef[];
}

export function createLibrary(defs: readonly ElementDef[], entries: readonly LexiconEntry[] = []): Library {
  const byId = new Map(defs.map((d) => [d.id, d]));
  if (byId.size !== defs.length) throw new Error("duplicate element ids in library");
  const entriesById = new Map(entries.map((e) => [e.id, e]));
  if (entriesById.size !== entries.length) throw new Error("duplicate lexicon ids in library");
  const byKind = new Map<ElementKind, ElementDef[]>();
  for (const d of defs) byKind.set(d.kind, [...(byKind.get(d.kind) ?? []), d]);
  return {
    elements: defs,
    lexicon: entries,
    get: (id) => byId.get(id),
    entry: (id) => entriesById.get(id),
    ofKind: (kind) => byKind.get(kind) ?? [],
  };
}

export const defaultLibrary: Library = createLibrary(elements, lexicon);
