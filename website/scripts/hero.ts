// Generates src/assets/hero.svg, the illustration of the home page: four pictograms composed by the engine.
// Run by `npm run site` before the Astro build.
import { writeFileSync } from "node:fs";
import { composePicto } from "@parlomino/core";
import type { PictoInput } from "@parlomino/spec";

const pictos: PictoInput[] = [
  { concept: "lex.doctor" },
  { concept: "lex.kitchen" },
  { concept: "object.apple", modifiers: ["plural"] },
  { concept: "person.me" },
];
const CARD = 200, GAP = 24, PAD = 12;
const cards = pictos.map((p, i) => {
  const r = composePicto(p);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  const x = (i % 2) * (CARD + GAP) + PAD, y = Math.floor(i / 2) * (CARD + GAP) + PAD;
  const inner = r.svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "").replace(/<title>.*?<\/title>/, "");
  return `<rect x="${x}" y="${y + 4}" width="${CARD}" height="${CARD}" rx="28" fill="#1F2937" opacity="0.12"/>` +
    `<rect x="${x}" y="${y}" width="${CARD}" height="${CARD}" rx="28" fill="#fff" stroke="#1F2937" stroke-width="3"/>` +
    `<svg x="${x + 20}" y="${y + 20}" width="${CARD - 40}" height="${CARD - 40}" viewBox="0 0 100 100">${inner}</svg>`;
});
const size = 2 * CARD + GAP + 2 * PAD;
writeFileSync(
  new URL("../src/assets/hero.svg", import.meta.url),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size + 4}" width="${size}" height="${size + 4}" role="img" aria-label="doctor, kitchen, apples, me">${cards.join("")}</svg>\n`,
);
console.log("website: src/assets/hero.svg generated");
