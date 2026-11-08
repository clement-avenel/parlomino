import { MODIFIERS, Phrase, Picto, type ElementDef, type ElementKind, type LexiconEntry, type Modifier } from "@parlomino/spec";
import { defaultLibrary, type Library } from "@parlomino/library";
import { normalize } from "./text.ts";

export type IssueCode =
  | "invalid_shape"
  | "unknown_element"
  | "wrong_kind"
  | "duplicate_modifier"
  | "zone_conflict"
  | "lexicon_conflict";

export interface ValidationIssue {
  path: string;
  code: IssueCode;
  message: string;
  /** A likely fix, so that a human or an LLM can correct itself. */
  suggestion?: string;
}

/** A pictogram with every reference resolved and lexicon entries expanded. */
export interface ResolvedPicto {
  concept: ElementDef;
  badge?: ElementDef;
  frame?: ElementDef;
  modifiers: Modifier[];
  /** The lexicon entry used, if `concept` referred to one (e.g. `lex.doctor`). */
  entry?: LexiconEntry;
}

export type PictoValidation =
  | { ok: true; picto: Picto; resolved: ResolvedPicto }
  | { ok: false; issues: ValidationIssue[] };

export type PhraseValidation =
  | { ok: true; phrase: Phrase; resolved: ResolvedPicto[] }
  | { ok: false; issues: ValidationIssue[] };

export function validatePicto(input: unknown, library: Library = defaultLibrary): PictoValidation {
  const parsed = Picto.safeParse(input);
  if (!parsed.success) return { ok: false, issues: shapeIssues(parsed.error.issues) };
  const { issues, resolved } = resolvePicto(parsed.data, library, "");
  return resolved && !issues.length ? { ok: true, picto: parsed.data, resolved } : { ok: false, issues };
}

export function validatePhrase(input: unknown, library: Library = defaultLibrary): PhraseValidation {
  const parsed = Phrase.safeParse(input);
  if (!parsed.success) return { ok: false, issues: shapeIssues(parsed.error.issues) };
  const issues: ValidationIssue[] = [];
  const resolved: ResolvedPicto[] = [];
  parsed.data.phrase.forEach((picto, i) => {
    const r = resolvePicto(picto, library, `phrase.${i}.`);
    issues.push(...r.issues);
    if (r.resolved) resolved.push(r.resolved);
  });
  return issues.length ? { ok: false, issues } : { ok: true, phrase: parsed.data, resolved };
}

/** Validates a phrase (an object with a `phrase` key) or a single pictogram. */
export function validate(input: unknown, library: Library = defaultLibrary): PictoValidation | PhraseValidation {
  return isPhrase(input) ? validatePhrase(input, library) : validatePicto(input, library);
}

export function isPhrase(input: unknown): boolean {
  return typeof input === "object" && input !== null && "phrase" in input;
}

function resolvePicto(p: Picto, library: Library, path: string): { issues: ValidationIssue[]; resolved?: ResolvedPicto } {
  const issues: ValidationIssue[] = [];
  let concept: ElementDef | undefined;
  let entry: LexiconEntry | undefined;
  let badgeId = p.badge;
  let frameId = p.frame;
  let modifiers = p.modifiers;

  if (p.concept.startsWith("lex.")) {
    entry = library.entry(p.concept);
    if (!entry) {
      issues.push(unknown(`${path}concept`, p.concept, conceptCandidates(library)));
    } else {
      concept = library.get(entry.picto.concept);
      for (const key of ["badge", "frame"] as const) {
        if (p[key] && entry.picto[key]) {
          issues.push({
            path: `${path}${key}`,
            code: "lexicon_conflict",
            message: `"${entry.id}" already has a ${key} ("${entry.picto[key]}")`,
          });
        }
      }
      badgeId ??= entry.picto.badge;
      frameId ??= entry.picto.frame;
      modifiers = [...new Set([...entry.picto.modifiers, ...p.modifiers])];
    }
  } else {
    concept = expectKind(`${path}concept`, p.concept, "concept", library, issues, conceptCandidates(library));
  }

  const badge = badgeId
    ? expectKind(`${path}badge`, badgeId, "concept", library, issues, library.ofKind("concept"))
    : undefined;
  const frame = frameId
    ? expectKind(`${path}frame`, frameId, "frame", library, issues, library.ofKind("frame"))
    : undefined;

  const seen = new Set<Modifier>();
  const zones = new Map<string, Modifier>();
  for (const m of p.modifiers) {
    if (seen.has(m)) issues.push({ path: `${path}modifiers`, code: "duplicate_modifier", message: `"${m}" is listed twice` });
    seen.add(m);
  }
  for (const m of new Set(modifiers)) {
    const zone = MODIFIERS[m].zone;
    const other = zones.get(zone);
    if (other) {
      issues.push({
        path: `${path}modifiers`,
        code: "zone_conflict",
        message: `"${other}" and "${m}" both use the ${zone} zone: keep only one`,
      });
    }
    zones.set(zone, m);
  }

  if (issues.length || !concept) return { issues };
  return {
    issues,
    resolved: {
      concept,
      modifiers,
      ...(badge && { badge }),
      ...(frame && { frame }),
      ...(entry && { entry }),
    },
  };
}

type Candidate = { id: string; labels: Record<string, string[]>; forms?: Record<string, string[]> | undefined };

function conceptCandidates(library: Library): Candidate[] {
  return [...library.ofKind("concept"), ...library.lexicon];
}

function expectKind(
  path: string,
  id: string,
  kind: ElementKind,
  library: Library,
  issues: ValidationIssue[],
  candidates: readonly Candidate[],
): ElementDef | undefined {
  const element = library.get(id);
  if (!element) {
    issues.push(
      // Lexicon entries are only valid as `concept`, which is resolved before reaching here.
      id.startsWith("lex.")
        ? { path, code: "wrong_kind", message: `"${id}" is a lexicon entry; only a simple ${kind} is allowed here` }
        : unknown(path, id, candidates),
    );
    return undefined;
  }
  if (element.kind !== kind) {
    const where = element.kind === "concept" ? "concept or badge" : element.kind;
    issues.push({ path, code: "wrong_kind", message: `"${id}" is a ${element.kind} (use it as ${where}), not a ${kind}` });
    return undefined;
  }
  return element;
}

function unknown(path: string, id: string, candidates: readonly Candidate[]): ValidationIssue {
  const suggestion = closest(id, candidates);
  return { path, code: "unknown_element", message: `unknown element "${id}"`, ...(suggestion && { suggestion }) };
}

/**
 * Closest candidate, comparing the name part of the id with candidate names and labels
 * in every language: `object.aple` → `object.apple`, `object.pomme` → `object.apple`,
 * `person.doctor` → `lex.doctor`.
 */
function closest(id: string, candidates: readonly Candidate[]): string | undefined {
  const [prefix, ...rest] = id.split(".");
  const name = normalize(rest.join(".") || id);
  let best: string | undefined;
  let bestDistance = Infinity;
  let bestRank = Infinity;
  for (const c of candidates) {
    // Ties are broken by what is most likely meant: same prefix first, then the id itself,
    // then labels, then inflected forms (so "object.aple" gives "object.apple", not "allé").
    const samePrefix = c.id.startsWith(`${prefix}.`) ? 0 : 3;
    const names: [string, number][] = [
      [c.id.split(".").pop() ?? c.id, 0],
      ...Object.values(c.labels).flat().map((n): [string, number] => [n, 1]),
      ...Object.values(c.forms ?? {}).flat().map((n): [string, number] => [n, 2]),
    ];
    for (const [n, kind] of names) {
      const d = levenshtein(name, normalize(n));
      const rank = samePrefix + kind;
      if (d < bestDistance || (d === bestDistance && rank < bestRank)) [best, bestDistance, bestRank] = [c.id, d, rank];
    }
  }
  return bestDistance <= Math.max(2, Math.floor(name.length / 3)) ? best : undefined;
}

function levenshtein(a: string, b: string): number {
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const row = [i];
    for (let j = 1; j <= b.length; j++) {
      row[j] = Math.min(prev[j]! + 1, row[j - 1]! + 1, prev[j - 1]! + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = row;
  }
  return prev[b.length]!;
}

function shapeIssues(issues: { path: PropertyKey[]; message: string }[]): ValidationIssue[] {
  return issues.map((i) => ({ path: i.path.map(String).join(".") || "(root)", code: "invalid_shape", message: i.message }));
}
