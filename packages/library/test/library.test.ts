import { describe, expect, it } from "vitest";
import { ALLOWED_LICENSES, ElementDef, LexiconEntry, MODIFIERS } from "@parlomino/spec";
import { REQUIRED_LANGUAGES, defaultLibrary, palette } from "@parlomino/library";

const allowed = new Set(Object.values(palette).map((h) => h.toUpperCase()));

/**
 * Simplicity budget, per kind of element. A rough but automatic proxy for "a child understands it at a glance":
 * - strokes: number of shapes and sub-paths (every `M` in a path starts a new stroke)
 * - colors: palette colors besides ink and paper
 * - minStroke: thinnest outline, so the drawing stays visible when small (marks are shown at ~1/4 size)
 */
const BUDGET = {
  concept: { strokes: 7, colors: 3, minStroke: 4 },
  frame: { strokes: 6, colors: 1, minStroke: 4 },
  mark: { strokes: 4, colors: 1, minStroke: 8 },
} as const;

function complexity(svg: string) {
  const shapes = svg.match(/<(path|circle|ellipse|rect|polygon|line|polyline)\b[^>]*>/g) ?? [];
  const strokes = shapes.reduce((n, s) => n + Math.max(1, (s.match(/\bd="([^"]*)"/)?.[1]?.match(/[Mm]/g) ?? []).length), 0);
  const hexes = new Set((svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toUpperCase()));
  hexes.delete(palette.ink);
  hexes.delete(palette.paper);
  const widths = [...svg.matchAll(/stroke-width="([\d.]+)"/g)].map((m) => Number(m[1]));
  return { strokes, colors: hexes.size, minStroke: Math.min(...widths) };
}

describe.each(defaultLibrary.elements.map((e) => [e.id, e] as const))("%s", (_, element) => {
  it("matches the element schema", () => {
    expect(ElementDef.safeParse(element).success).toBe(true);
  });

  it("only uses palette colors (so themes can recolor it)", () => {
    const colors = element.svg.match(/#[0-9a-fA-F]{3,8}\b/g) ?? [];
    expect(colors.filter((c) => !allowed.has(c.toUpperCase()))).toEqual([]);
  });

  it("outlines every shape (so it survives the high-contrast theme)", () => {
    const shapes = element.svg.match(/<(path|circle|ellipse|rect|polygon)\b[^>]*>/g) ?? [];
    for (const shape of shapes) expect(shape, shape).toMatch(/stroke="/);
  });

  it.each(REQUIRED_LANGUAGES)("has labels in %s", (lang) => {
    expect(element.labels[lang]?.length).toBeGreaterThan(0);
  });

  it("declares a source with a license compatible with CC BY-SA 4.0", () => {
    expect(ALLOWED_LICENSES).toContain(element.source.license);
  });

  it("does not use ids, text, scripts or external references", () => {
    expect(element.svg).not.toMatch(/\bid=|<text|<script|href=|url\(/);
  });

  it("stays within the simplicity budget of its kind", () => {
    const budget = BUDGET[element.kind];
    const c = complexity(element.svg);
    expect(c.strokes, "too many strokes").toBeLessThanOrEqual(budget.strokes);
    expect(c.colors, "too many colors").toBeLessThanOrEqual(budget.colors);
    expect(c.minStroke, "outline too thin").toBeGreaterThanOrEqual(budget.minStroke);
  });
});

describe("library", () => {
  it("has a mark for every modifier drawn in a corner zone", () => {
    for (const [name, m] of Object.entries(MODIFIERS)) {
      if (m.zone === "indicator" || m.zone === "size") expect(defaultLibrary.get(`mark.${name}`), name).toBeDefined();
    }
  });

  it("has well-formed lexicon entries labeled in every required language", () => {
    for (const entry of defaultLibrary.lexicon) {
      expect(LexiconEntry.safeParse(entry).success, entry.id).toBe(true);
      for (const lang of REQUIRED_LANGUAGES) expect(entry.labels[lang]?.length, `${entry.id} ${lang}`).toBeGreaterThan(0);
    }
  });
});
