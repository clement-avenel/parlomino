// Performance budget: composing 1000 pictograms must take < 10 ms (median).
// Run: npm run bench. Exits non-zero if the budget is exceeded, so CI catches regressions.
import { composePhrase, composePicto, type ComposeOptions } from "@parlomino/core";
import { defaultLibrary } from "@parlomino/library";
import { MODIFIERS, type Modifier, type PictoInput } from "@parlomino/spec";

const BUDGET_MS = 10;
const RUNS = 50;

let seed = 42; // fixed seed: comparable runs
const rand = () => (seed = (seed * 1103515245 + 12345) % 2 ** 31) / 2 ** 31;
const pick = <T,>(xs: readonly T[]) => xs[Math.floor(rand() * xs.length)]!;

const concepts = [...defaultLibrary.ofKind("concept"), ...defaultLibrary.lexicon].map((e) => e.id);
const badges = defaultLibrary.ofKind("concept").map((e) => e.id);
const frames = defaultLibrary.ofKind("frame").map((e) => e.id);
const byZone = (zone: string) => (Object.keys(MODIFIERS) as Modifier[]).filter((m) => MODIFIERS[m].zone === zone);

const randomPicto = (): PictoInput => {
  const concept = pick(concepts);
  const isEntry = concept.startsWith("lex.");
  const modifiers = ["concept", "overlay", "indicator"].flatMap((z) => (rand() < 0.3 ? [pick(byZone(z))] : []));
  return {
    concept,
    ...(!isEntry && rand() < 0.3 && { badge: pick(badges) }),
    ...(!isEntry && rand() < 0.2 && { frame: pick(frames) }),
    modifiers,
  };
};
const pictos = Array.from({ length: 1000 }, randomPicto);
const phrases = Array.from({ length: 250 }, () => ({ phrase: [randomPicto(), randomPicto(), randomPicto(), randomPicto()], tense: "past" as const }));

function measure(name: string, fn: () => void): boolean {
  for (let i = 0; i < 5; i++) fn(); // warm-up
  const times: number[] = [];
  for (let run = 0; run < RUNS; run++) {
    const start = performance.now();
    fn();
    times.push(performance.now() - start);
  }
  times.sort((a, b) => a - b);
  const median = times[Math.floor(RUNS / 2)]!;
  const ok = median < BUDGET_MS;
  console.log(`${ok ? "✓" : "✗"} ${name}: median ${median.toFixed(2)} ms, p95 ${times[Math.floor(RUNS * 0.95)]!.toFixed(2)} ms (budget ${BUDGET_MS} ms)`);
  return ok;
}

const hc: ComposeOptions = { theme: "high-contrast", strokeScale: 1.5 };
const results = [
  measure("1000 pictograms, default theme", () => pictos.forEach((p) => composePicto(p))),
  measure("1000 pictograms, high contrast + bold", () => pictos.forEach((p) => composePicto(p, hc))),
  measure("250 phrases of 4 pictograms (1000 pictograms)", () => phrases.forEach((p) => composePhrase(p))),
];
process.exit(results.every(Boolean) ? 0 : 1);
