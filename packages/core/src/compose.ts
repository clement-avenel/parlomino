import { MODIFIERS, type Box, type ElementDef, type Modifier, type Phrase, type Picto } from "@parlomino/spec";
import { defaultLibrary, palette, type Library, type PaletteColor } from "@parlomino/library";
import { themes, type Theme, type ThemeName } from "./themes.ts";
import { isPhrase, validatePhrase, validatePicto, type ResolvedPicto, type ValidationIssue } from "./validate.ts";

export interface ComposeOptions {
  library?: Library;
  theme?: ThemeName | Theme;
  /** Multiplies every stroke width: >1 gives bolder outlines for low vision or small sizes. */
  strokeScale?: number;
  /** Rendered height in px (and width for a single pictogram). The drawing itself is resolution-independent. */
  size?: number;
  /** Language of the accessible labels. */
  lang?: string;
}

export type PictoResult =
  | { ok: true; svg: string; label: string; picto: Picto }
  | { ok: false; issues: ValidationIssue[] };

export type PhraseResult =
  | { ok: true; svg: string; label: string; phrase: Phrase; pictos: { svg: string; label: string }[] }
  | { ok: false; issues: ValidationIssue[] };

// ─── Geometry (100×100 box). See the zone diagram in @parlomino/spec. ────────

const CONCEPT_BOX: Box = { x: 8, y: 8, size: 84 };
/** Concept box when a corner zone is used, leaving room for the corner discs. */
const COMPACT_BOX: Box = { x: 14, y: 16, size: 72 };
const CORNERS = {
  indicator: { cx: 17, cy: 17 },
  badge: { cx: 83, cy: 17 },
  size: { cx: 83, cy: 83 },
} as const;
const DISC_RADIUS = 15;

const CELL = 100;
const GAP = 8;
const SIDE_MARK_WIDTH = 40;

interface Ctx {
  library: Library;
  theme: Theme;
  strokeScale: number;
  lang: string;
}

export function composePicto(input: unknown, options: ComposeOptions = {}): PictoResult {
  const ctx = context(options);
  const result = validatePicto(input, ctx.library);
  if (!result.ok) return result;
  const label = pictoLabel(result.resolved, ctx.lang);
  const body = `<rect width="100" height="100" fill="${ctx.theme.background}"/>${pictoBody(result.resolved, ctx)}`;
  return { ok: true, svg: svgRoot(100, 100, options.size, label, body), label, picto: result.picto };
}

export function composePhrase(input: unknown, options: ComposeOptions = {}): PhraseResult {
  const ctx = context(options);
  const result = validatePhrase(input, ctx.library);
  if (!result.ok) return result;
  const { phrase, resolved } = result;
  const { theme, strokeScale } = ctx;

  const parts: string[] = [];
  let x = 0;
  if (phrase.tense) {
    const arrow = phrase.tense === "past" ? "M32 50 H8 M18 38 L8 50 L18 62" : "M8 50 H32 M22 38 L32 50 L22 62";
    parts.push(`<g transform="translate(${x} 0)">${mark(arrow, theme, strokeScale)}</g>`);
    x += SIDE_MARK_WIDTH + GAP;
  }
  const pictos = resolved.map((r) => {
    const label = pictoLabel(r, ctx.lang);
    const body = pictoBody(r, ctx);
    parts.push(
      `<g transform="translate(${x} 0)"><rect x="1" y="1" width="98" height="98" rx="10" fill="${theme.background}" stroke="${theme.card}" stroke-width="2"/>${body}</g>`,
    );
    x += CELL + GAP;
    const standalone = `<rect width="100" height="100" fill="${theme.background}"/>${body}`;
    return { svg: svgRoot(100, 100, ctx.size, label, standalone), label };
  });
  if (phrase.question) {
    parts.push(`<g transform="translate(${x} 0)">${questionMark(theme, strokeScale)}</g>`);
    x += SIDE_MARK_WIDTH + GAP;
  }

  const width = x - GAP;
  const label = phraseLabel(phrase, pictos.map((p) => p.label), ctx.lang);
  const height = options.size;
  const svg = svgRoot(width, 100, height && (height * width) / 100, label, parts.join(""), height);
  return { ok: true, svg, label, phrase, pictos };
}

export type ComposeResult = PictoResult | PhraseResult;

/** Composes a phrase (an object with a `phrase` key) or a single pictogram. */
export function compose(input: unknown, options: ComposeOptions = {}): ComposeResult {
  return isPhrase(input) ? composePhrase(input, options) : composePicto(input, options);
}

// ─── Pictogram body ──────────────────────────────────────────────────────────

function pictoBody(p: ResolvedPicto, ctx: Ctx): string {
  const { theme, strokeScale } = ctx;
  const has = (m: Modifier) => p.modifiers.includes(m);
  const zoneModifier = (zone: string) => p.modifiers.find((m) => MODIFIERS[m].zone === zone);
  const indicator = zoneModifier("indicator");
  const size = zoneModifier("size");
  const parts: string[] = [];

  let box: Box;
  if (p.frame) {
    parts.push(place(drawing(p.frame, ctx), { x: 0, y: 0, size: 100 }));
    box = p.frame.inner!;
  } else {
    box = p.badge || indicator || size ? COMPACT_BOX : CONCEPT_BOX;
  }
  const negationBox = box;

  if (size === "small") box = { x: box.x + box.size * 0.2, y: box.y + box.size * 0.4, size: box.size * 0.6 };

  const concept = drawing(p.concept, ctx);
  if (has("plural")) {
    const s = box.size * 0.8;
    parts.push(place(concept, { x: box.x + box.size - s, y: box.y, size: s }));
    parts.push(place(concept, { x: box.x, y: box.y + box.size - s, size: s }));
  } else {
    parts.push(place(concept, box));
  }

  if (has("negation")) {
    const pad = negationBox.size * 0.04;
    const { x, y, size: s } = negationBox;
    const bar = `M${r(x + pad)} ${r(y + pad)} L${r(x + s - pad)} ${r(y + s - pad)}`;
    parts.push(stroke(bar, theme.halo, 11 * strokeScale), stroke(bar, theme.negation, 6 * strokeScale));
  }

  if (indicator) parts.push(disc(CORNERS.indicator, markDrawing(indicator, ctx), ctx));
  if (size) parts.push(disc(CORNERS.size, markDrawing(size, ctx), ctx));
  if (p.badge) parts.push(disc(CORNERS.badge, drawing(p.badge, ctx), ctx));

  return parts.join("");
}

function disc(center: { cx: number; cy: number }, inner: string, { theme, strokeScale }: Ctx): string {
  const inset = DISC_RADIUS * 0.72;
  return (
    `<circle cx="${center.cx}" cy="${center.cy}" r="${DISC_RADIUS}" fill="${theme.halo}" stroke="${theme.mark}" stroke-width="${r(2 * strokeScale)}"/>` +
    place(inner, { x: center.cx - inset, y: center.cy - inset, size: inset * 2 })
  );
}

function markDrawing(modifier: Modifier, ctx: Ctx): string {
  const element = ctx.library.get(`mark.${modifier}`);
  if (!element) throw new Error(`library has no "mark.${modifier}" drawing`);
  return drawing(element, ctx);
}

function questionMark(theme: Theme, strokeScale: number): string {
  return (
    mark("M11 36 Q11 22 20 22 Q30 22 30 32 Q30 40 20 46 V56", theme, strokeScale) +
    `<circle cx="20" cy="68" r="${r(4 * strokeScale)}" fill="${theme.mark}"/>`
  );
}

// ─── Labels ──────────────────────────────────────────────────────────────────

function word(labels: Record<string, string[]>, lang: string): string {
  return (labels[lang] ?? labels.en ?? Object.values(labels)[0] ?? ["?"])[0]!;
}

function modifierWord(m: Modifier, lang: string): string {
  const labels: Record<string, string> = MODIFIERS[m].labels;
  return labels[lang] ?? labels.en!;
}

function pictoLabel(p: ResolvedPicto, lang: string): string {
  let base: string;
  let modifiers = p.modifiers;
  if (p.entry) {
    base = word(p.entry.labels, lang);
    modifiers = modifiers.filter((m) => !p.entry!.picto.modifiers.includes(m));
  } else {
    base = word(p.concept.labels, lang);
    if (p.badge) base += ` + ${word(p.badge.labels, lang)}`;
    if (p.frame) base = `${word(p.frame.labels, lang)} : ${base}`;
  }
  return modifiers.length ? `${base} (${modifiers.map((m) => modifierWord(m, lang)).join(", ")})` : base;
}

const PHRASE_WORDS: Record<string, { past: string; future: string }> = {
  fr: { past: "passé", future: "futur" },
  en: { past: "past", future: "future" },
};

function phraseLabel(phrase: Phrase, labels: string[], lang: string): string {
  const tense = phrase.tense ? `[${(PHRASE_WORDS[lang] ?? PHRASE_WORDS.en!)[phrase.tense]}] ` : "";
  return tense + labels.join(" · ") + (phrase.question ? " ?" : "");
}

// ─── SVG helpers ─────────────────────────────────────────────────────────────

function context(options: ComposeOptions): Ctx & { size?: number } {
  return {
    library: options.library ?? defaultLibrary,
    theme: typeof options.theme === "object" ? options.theme : themes[options.theme ?? "default"],
    strokeScale: options.strokeScale ?? 1,
    lang: options.lang ?? "en",
    ...(options.size !== undefined && { size: options.size }),
  };
}

function svgRoot(width: number, height: number, pxWidth: number | undefined, label: string, body: string, pxHeight = pxWidth): string {
  const size = pxWidth ? ` width="${r(pxWidth)}" height="${r(pxHeight!)}"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"${size} role="img" aria-label="${escapeXml(label)}">` +
    `<title>${escapeXml(label)}</title>${body}</svg>`
  );
}

function place(inner: string, box: Box): string {
  return `<g transform="translate(${r(box.x)} ${r(box.y)}) scale(${r(box.size / 100)})">${inner}</g>`;
}

function stroke(d: string, color: string, width: number): string {
  return `<path d="${d}" fill="none" stroke="${color}" stroke-width="${r(width)}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

function mark(d: string, theme: Theme, strokeScale: number): string {
  return stroke(d, theme.halo, 12 * strokeScale) + stroke(d, theme.mark, 6 * strokeScale);
}

const HEX_TO_PALETTE = new Map(
  Object.entries(palette).map(([name, hex]) => [hex.toUpperCase(), name as PaletteColor]),
);
const drawingCache = new WeakMap<Theme, Map<string, string>>();

/** Recolors and re-strokes an element for a theme. Cached: elements are immutable. */
function drawing(element: ElementDef, { theme, strokeScale }: Ctx): string {
  let cache = drawingCache.get(theme);
  if (!cache) drawingCache.set(theme, (cache = new Map()));
  const key = `${element.id}|${strokeScale}`;
  let out = cache.get(key);
  if (out === undefined) {
    out = element.svg.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => {
      const name = HEX_TO_PALETTE.get(hex.toUpperCase());
      return name ? theme.colors[name] : hex;
    });
    if (strokeScale !== 1) {
      out = out.replace(/stroke-width="([\d.]+)"/g, (_, w: string) => `stroke-width="${r(Number(w) * strokeScale)}"`);
    }
    cache.set(key, out);
  }
  return out;
}

function r(n: number): number {
  return Math.round(n * 100) / 100;
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (ch) => `&#${ch.charCodeAt(0)};`);
}
