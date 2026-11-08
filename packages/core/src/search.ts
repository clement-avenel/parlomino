import type { Picto } from "@parlomino/spec";
import { defaultLibrary, type Library } from "@parlomino/library";
import { cleanQuery, conjugates, normalize, queryVariants } from "./text.ts";

export interface SearchOptions {
  library?: Library;
  lang?: string;
  limit?: number;
}

export interface SearchResult {
  /** Concept or lexicon entry id, usable as `concept` in a pictogram. */
  id: string;
  label: string;
  /** Ready-to-compose pictogram. */
  picto: Picto;
  source: "concept" | "lexicon";
}

// Scores, best first.
const EXACT = 5;
const INFLECTED = 4; // plural, conjugation or listed irregular form
const PREFIX = 3;
const CONTAINS = 2;
const TAG = 1;

/**
 * Finds concepts and lexicon entries by word, in a given language. Ignores accents, case,
 * leading articles ("la cuisine"), plurals ("pommes") and conjugations ("mangeons", "boit", "ate").
 */
export function search(query: string, options: SearchOptions = {}): SearchResult[] {
  const library = options.library ?? defaultLibrary;
  const lang = options.lang ?? "en";
  const q = cleanQuery(query, lang);
  if (!q) return [];
  const variants = queryVariants(q, lang);

  const candidates = [
    ...library.ofKind("concept").map((e) => ({ ...e, source: "concept" as const })),
    ...library.lexicon.map((e) => ({ ...e, tags: [] as string[], source: "lexicon" as const })),
  ];

  const scored: (SearchResult & { score: number })[] = [];
  for (const c of candidates) {
    const labels = c.labels[lang] ?? c.labels.en ?? [];
    const forms = (c.forms?.[lang] ?? []).map(normalize);
    let score = 0;
    for (const label of labels.map(normalize)) {
      if (label === q) score = Math.max(score, EXACT);
      else if (variants.includes(label) || queryVariants(label, lang).includes(q) || conjugates(label, q, lang)) {
        score = Math.max(score, INFLECTED);
      } else if (label.startsWith(q)) score = Math.max(score, PREFIX);
      else if (label.includes(q)) score = Math.max(score, CONTAINS);
    }
    if (score < INFLECTED && variants.some((v) => forms.includes(v))) score = INFLECTED;
    if (!score && c.tags.some((t) => normalize(t).startsWith(q))) score = TAG;
    if (score) {
      scored.push({ id: c.id, label: labels[0] ?? c.id, picto: { concept: c.id, modifiers: [] }, source: c.source, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.label.length - b.label.length)
    .slice(0, options.limit ?? 10)
    .map(({ score: _, ...result }) => result);
}
