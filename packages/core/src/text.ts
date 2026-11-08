// Language-aware text matching for search. Deliberately small and rule-based:
// it covers what users actually type (articles, plurals, regular conjugations),
// while irregular forms are listed as data in the library (`forms`).

/** Lowercase, without accents or surrounding spaces. */
export function normalize(s: string): string {
  return s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
}

interface LanguageRules {
  /** Words dropped at the start of a query: articles, determiners, possessives. */
  determiners: Set<string>;
  /** Forms a single word may be reduced to: singulars, verb stems… */
  reductions(word: string): string[];
  /** True if `word` is a conjugation of the verb `label` (already normalized). */
  conjugates?(label: string, word: string): boolean;
}

// Endings of French verbs in -er (accents removed), after the stem: mang|er → mang|eons.
const FR_ER_ENDINGS = new Set([
  "e", "es", "ent", "ons", "ez", "er", "ai", "as", "a", "ais", "ait", "aient", "ions", "iez",
  "erai", "eras", "era", "erons", "erez", "eront", "erais", "erait", "eraient", "ant", "ames", "erent",
  "ee", "ees",
]);

const RULES: Record<string, LanguageRules> = {
  fr: {
    determiners: new Set([
      "le", "la", "les", "l", "un", "une", "des", "du", "de", "d", "au", "aux",
      "mon", "ma", "mes", "ton", "ta", "tes", "son", "sa", "ses", "notre", "nos", "votre", "vos", "leur", "leurs",
      "ce", "cet", "cette", "ces", "quelques",
    ]),
    reductions: (w) => (w.length > 3 && /[sx]$/.test(w) ? [w.slice(0, -1)] : []),
    conjugates(label, word) {
      if (!label.endsWith("er") || label.includes(" ")) return false;
      const stem = label.slice(0, -2);
      if (stem.length < 3 || !word.startsWith(stem)) return false;
      const ending = word.slice(stem.length);
      // -ger and -cer verbs keep an "e" before a/o: mangeons, mangeait.
      const softened = /[gc]$/.test(stem) && ending.startsWith("e") ? ending.slice(1) : undefined;
      return FR_ER_ENDINGS.has(ending) || (softened !== undefined && FR_ER_ENDINGS.has(softened));
    },
  },
  en: {
    determiners: new Set(["the", "a", "an", "some", "my", "your", "his", "her", "its", "our", "their", "this", "that", "these", "those"]),
    reductions(w) {
      if (w.length <= 3) return [];
      const out: string[] = [];
      if (w.endsWith("ies")) out.push(`${w.slice(0, -3)}y`);
      if (w.endsWith("es")) out.push(w.slice(0, -2));
      if (w.endsWith("s") && !w.endsWith("ss")) out.push(w.slice(0, -1));
      if (w.endsWith("ing") && w.length > 5) out.push(w.slice(0, -3), `${w.slice(0, -3)}e`);
      if (w.endsWith("ed") && w.length > 4) out.push(w.slice(0, -2), w.slice(0, -1));
      return out;
    },
  },
};

/** Splits a query into words, dropping leading articles and determiners: "de l'eau" → "eau". */
export function cleanQuery(query: string, lang: string): string {
  const words = normalize(query).split(/[\s'’]+/).filter(Boolean);
  const determiners = RULES[lang]?.determiners;
  while (determiners && words.length > 1 && determiners.has(words[0]!)) words.shift();
  return words.join(" ");
}

/** The query and the forms it may be reduced to ("pommes" → "pommes", "pomme"). */
export function queryVariants(query: string, lang: string): string[] {
  const rules = RULES[lang];
  return rules && !query.includes(" ") ? [query, ...rules.reductions(query)] : [query];
}

export function conjugates(label: string, word: string, lang: string): boolean {
  return RULES[lang]?.conjugates?.(label, word) ?? false;
}
