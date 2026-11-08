// Imports the concepts listed in sources/openmoji.mjs from the OpenMoji package (CC BY-SA 4.0),
// adapted to the Parlomino style: palette colors only, ink outlines, thicker strokes, 100×100 canvas.
// Writes elements/<prefix>/<name>.svg and elements.openmoji.json. Run: npm run import:openmoji
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { OPENMOJI, RECOLOR } from "../sources/openmoji.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const omDir = dirname(require.resolve("openmoji/package.json"));
const data = JSON.parse(readFileSync(join(omDir, "data", "openmoji.json"), "utf8"));
const byAnnotation = new Map(data.filter((e) => !e.skintone).map((e) => [e.annotation, e]));

// OpenMoji colors → Parlomino palette (see src/index.ts). Shades collapse into one flat color:
// simpler drawings, and themes can recolor everything.
const COLORS = {
  "#000000": "#1F2937", // ink
  "#ffffff": "#FFFFFF", // paper
  "#fcea2b": "#F2C14E", "#f1b31c": "#F2C14E", // yellow
  "#f4aa41": "#F4AA41", "#e27022": "#F4AA41", // orange
  "#ea5a47": "#E46B4A", "#d22f27": "#E46B4A", "#781e32": "#E46B4A", // red
  "#a57939": "#A57939", // brown
  "#6a462f": "#6B4F3A", "#352318": "#6B4F3A", // hair
  "#92d3f5": "#7EC8E3", // water
  "#61b2e4": "#4F86C6", "#1e50a0": "#4F86C6", // blue
  "#b1cc33": "#6BAF5B", "#5c9e31": "#6BAF5B", "#186648": "#6BAF5B", // green
  "#fadcbc": "#F5C9A0", "#debb90": "#F5C9A0", "#c19a65": "#F5C9A0", // skin
  "#ffa7c0": "#F7A8C0", "#e67a94": "#F7A8C0", // pink
  "#b399c8": "#9F86C0", "#8967aa": "#9F86C0", // purple
  "#d0cfce": "#D0CFCE", // light gray
  "#9b9b9a": "#9B9B9A", // gray
  "#3f3f3f": "#3F3F3F", // dark gray
};
const STROKE_FACTOR = 1.35;
// A few OpenMoji drawings touch the edge of the canvas: shrink them around the center.
const SHRINK = { "object.money": 0.88, "object.glasses": 0.9 };
const transform = (id) => (SHRINK[id] ? `translate(${50 * (1 - SHRINK[id])} ${50 * (1 - SHRINK[id])}) scale(${((100 / 72) * SHRINK[id]).toFixed(4)})` : `scale(${(100 / 72).toFixed(4)})`); // OpenMoji lines are thinner than Parlomino's
const SCALE = 100 / 72;

function hex6(c) {
  const h = c.toLowerCase();
  return h.length === 4 ? `#${h[1]}${h[1]}${h[2]}${h[2]}${h[3]}${h[3]}` : h;
}

/**
 * Moves a group's fill onto the shapes inside it that have none, so that every shape declares its
 * own color (and only truly uncolored shapes get the default ink below).
 */
function inheritGroupFills(svg) {
  const open = /<g\b([^>]*?)\sfill="([^"]+)"([^>]*)>/;
  for (let m = open.exec(svg); m; m = open.exec(svg)) {
    let depth = 0;
    const tags = /<g\b[^>]*?(\/?)>|<\/g>/g;
    tags.lastIndex = m.index;
    let end = svg.length;
    for (let t = tags.exec(svg); t; t = tags.exec(svg)) {
      if (t[0] === "</g>") depth--;
      else if (!t[1]) depth++;
      if (depth === 0) { end = t.index; break; }
    }
    const start = m.index + m[0].length;
    const body = svg.slice(start, end).replace(/<(path|circle|ellipse|rect|polygon|polyline)\b(?![^>]*\bfill=)/g, `<$1 fill="${m[2]}"`);
    svg = svg.slice(0, m.index) + `<g${m[1]}${m[3]}>` + body + svg.slice(end);
  }
  return svg;
}

function adapt(svg, file) {
  const inner = svg.match(/<svg\b[^>]*>([\s\S]*)<\/svg>/)?.[1];
  if (!inner) throw new Error(`${file}: no <svg> root`);
  if (/style=|<image|<text|url\(/.test(inner)) throw new Error(`${file}: unsupported markup`);
  return inheritGroupFills(inner)
    // Fill layers (color, skin, hair and their shadows) sit under the line layer.
    .replace(/<g id="(color|skin|skin-shadow|hair|hair-shadow)">/g, '<g data-layer="color">')
    .replace(/<g id="line">/g, '<g data-layer="line">')
    .replace(/\s+id="[^"]*"/g, "")
    .replace(/<title>[\s\S]*?<\/title>/g, "")
    .replace(/(fill|stroke)="(#[0-9a-fA-F]{3,6})"/g, (_, attr, color) => {
      const mapped = COLORS[hex6(color)];
      if (!mapped) throw new Error(`${file}: color ${color} has no palette mapping`);
      return `${attr}="${mapped}"`;
    })
    // SVG fills shapes in black by default: make it explicit (ink), so that themes can recolor it.
    .replace(/<(path|circle|ellipse|rect|polygon|polyline)\b(?![^>]*\bfill=)/g, '<$1 fill="#1F2937"')
    .replace(/stroke-width="([\d.]+)"/g, (_, w) => `stroke-width="${Math.round(Number(w) * STROKE_FACTOR * 100) / 100}"`)
    .replace(/>\s+</g, "><")
    .trim();
}

const manifest = [];
const seen = new Set();
for (const [id, annotation, en, fr, tags, forms] of OPENMOJI) {
  if (seen.has(id)) throw new Error(`duplicate id ${id}`);
  seen.add(id);
  const entry = byAnnotation.get(annotation);
  if (!entry) throw new Error(`${id}: OpenMoji has no "${annotation}"`);
  const file = join(omDir, "color", "svg", `${entry.hexcode}.svg`);
  let body = adapt(readFileSync(file, "utf8"), `${annotation} (${entry.hexcode})`);
  for (const [from, to] of Object.entries(RECOLOR[id] ?? {})) body = body.replaceAll(`fill="${from}"`, `fill="${to}"`);
  const [prefix, name] = id.split(".");
  mkdirSync(join(root, "elements", prefix), { recursive: true });
  writeFileSync(
    join(root, "elements", prefix, `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <!-- Adapted from OpenMoji "${annotation}" (${entry.hexcode}) by ${entry.openmoji_author}, CC BY-SA 4.0 -->\n  <g transform="${transform(id)}">${body}</g>\n</svg>\n`,
  );
  manifest.push({
    id,
    kind: "concept",
    category: prefix,
    labels: { en, fr },
    ...(forms && { forms }),
    tags,
    source: {
      name: "OpenMoji",
      author: entry.openmoji_author,
      url: `https://openmoji.org/library/emoji-${entry.hexcode}/`,
      license: "CC-BY-SA-4.0",
      modified: true,
    },
  });
}
writeFileSync(join(root, "elements.openmoji.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`openmoji: ${manifest.length} concepts imported`);
