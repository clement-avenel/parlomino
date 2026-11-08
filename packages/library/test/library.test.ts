import { describe, expect, it } from "vitest";
import { ALLOWED_LICENSES, ElementDef, LexiconEntry, MODIFIERS } from "@parlomino/spec";
import { REQUIRED_LANGUAGES, defaultLibrary, palette } from "@parlomino/library";

const allowed = new Set(Object.values(palette).map((h) => h.toUpperCase()));

/**
 * Simplicity budget, per kind of element: a ceiling against clutter, not a measure of quality.
 * Whether a pictogram is understood is checked by visual review and by tests with children.
 * - strokes: number of shapes and sub-paths (every `M` in a path starts a new stroke)
 * - colors: palette colors besides ink and paper
 * - outline: typical width of the ink outlines (their median), so drawings stay visible when small.
 *   Small details such as eyes may be thinner.
 */
const BUDGET = {
  concept: { strokes: 60, colors: 8, outline: 2.5 },
  frame: { strokes: 6, colors: 1, outline: 4 },
  mark: { strokes: 4, colors: 1, outline: 8 },
} as const;

function complexity(svg: string) {
  const shapes = svg.match(/<(path|circle|ellipse|rect|polygon|line|polyline)\b[^>]*>/g) ?? [];
  const strokes = shapes.reduce((n, s) => n + Math.max(1, (s.match(/\bd="([^"]*)"/)?.[1]?.match(/[Mm]/g) ?? []).length), 0);
  const hexes = new Set((svg.match(/#[0-9a-fA-F]{6}\b/g) ?? []).map((h) => h.toUpperCase()));
  hexes.delete(palette.ink);
  hexes.delete(palette.paper);
  // Imported drawings are wrapped in a scale transform: widths are measured in the 100×100 canvas.
  const scale = Number(svg.match(/^<g transform="scale\(([\d.]+)\)">/)?.[1] ?? 1);
  const ink = shapes
    .filter((s) => s.includes(`stroke="${palette.ink}"`))
    .map((s) => Number(s.match(/stroke-width="([\d.]+)"/)?.[1] ?? 0) * scale)
    .sort((a, b) => a - b);
  return { strokes, colors: hexes.size, outline: ink[Math.floor(ink.length / 2)] ?? 0 };
}

/**
 * Shapes that must carry their own outline. Imported drawings have a color layer (flat fills)
 * under a line layer (ink outlines): in high contrast, fills turn black and the line layer
 * draws the shapes, so the color layer is exempt as long as a line layer exists.
 */
function outlinedShapes(svg: string): string[] {
  let visible = svg;
  for (let start = visible.indexOf('<g data-layer="color">'); start >= 0; start = visible.indexOf('<g data-layer="color">')) {
    // Remove the whole group, including nested groups.
    let depth = 0;
    const tags = /<g\b[^>]*?(\/?)>|<\/g>/g;
    tags.lastIndex = start;
    let end = visible.length;
    for (let m = tags.exec(visible); m; m = tags.exec(visible)) {
      if (m[0] === "</g>") depth--;
      else if (!m[1]) depth++;
      if (depth === 0) {
        end = m.index + m[0].length;
        break;
      }
    }
    visible = visible.slice(0, start) + visible.slice(end);
  }
  return visible.match(/<(path|circle|ellipse|rect|polygon|polyline|line)\b[^>]*>/g) ?? [];
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
    if (element.svg.includes('data-layer="color"')) expect(element.svg).toContain('data-layer="line"');
    // A shape needs an outline, unless it is filled with ink itself (eyes, dots): ink stays visible in every theme.
    for (const shape of outlinedShapes(element.svg)) expect(shape, shape).toMatch(new RegExp(`stroke="|fill="${palette.ink}"`));
  });

  it.each(REQUIRED_LANGUAGES)("has labels in %s", (lang) => {
    expect(element.labels[lang]?.length).toBeGreaterThan(0);
  });

  it("declares a source with a license compatible with CC BY-SA 4.0", () => {
    expect(ALLOWED_LICENSES).toContain(element.source.license);
  });

  it("credits the author of adapted drawings, links the original and says it was modified", () => {
    if (element.source.name === "Parlomino") return;
    expect(element.source.author, "author").toBeTruthy();
    expect(element.source.url, "url").toMatch(/^https:\/\//);
    expect(element.source.modified, "modified").toBe(true);
  });

  it("does not use ids, text, scripts or external references", () => {
    expect(element.svg).not.toMatch(/\bid=|<text|<script|href=|url\(/);
  });

  it("stays within the simplicity budget of its kind", () => {
    const budget = BUDGET[element.kind];
    const c = complexity(element.svg);
    expect(c.strokes, "too many strokes").toBeLessThanOrEqual(budget.strokes);
    expect(c.colors, "too many colors").toBeLessThanOrEqual(budget.colors);
    expect(c.outline, "outline too thin").toBeGreaterThanOrEqual(budget.outline);
  });
});

describe("library", () => {
  it("has a mark for every modifier drawn in a corner zone, and no unused mark", () => {
    const cornerModifiers = Object.entries(MODIFIERS).filter(([, m]) => m.zone === "indicator").map(([name]) => `mark.${name}`);
    expect(defaultLibrary.ofKind("mark").map((e) => e.id).sort()).toEqual(cornerModifiers.sort());
  });

  it("has well-formed lexicon entries labeled in every required language", () => {
    for (const entry of defaultLibrary.lexicon) {
      expect(LexiconEntry.safeParse(entry).success, entry.id).toBe(true);
      for (const lang of REQUIRED_LANGUAGES) expect(entry.labels[lang]?.length, `${entry.id} ${lang}`).toBeGreaterThan(0);
    }
  });
});
