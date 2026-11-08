import { z } from "zod";

/** Version of the format. Bumped on breaking changes. */
export const SPEC_VERSION = 1;

// ─── Library elements ────────────────────────────────────────────────────────

/**
 * Categories of concepts. A concept id is `<category>.<name>`, e.g. `person.child`.
 * `idea` holds abstract concepts (care, school…), often used as badges.
 */
export const CATEGORIES = ["person", "action", "object", "place", "idea"] as const;
export const Category = z.enum(CATEGORIES);
export type Category = z.infer<typeof Category>;

/**
 * What a library element is:
 * - concept: a base drawing (child, eat, apple…). Any concept can also be used as a badge.
 * - frame:   a container changing the category of a concept (place, moment…), id `frame.<name>`.
 * - mark:    a small sign drawn for a modifier (very, big…), id `mark.<name>`.
 */
export const ElementKind = z.enum(["concept", "frame", "mark"]);
export type ElementKind = z.infer<typeof ElementKind>;

/** Licenses accepted in the library: all compatible with redistribution under CC BY-SA 4.0. */
export const ALLOWED_LICENSES = ["CC-BY-SA-4.0", "CC-BY-4.0", "CC0-1.0"] as const;

export const Source = z.object({
  name: z.string().describe("Project or person the drawing comes from, e.g. `Parlomino`, `OpenMoji`."),
  author: z.string().optional(),
  url: z.string().optional(),
  license: z.enum(ALLOWED_LICENSES),
  modified: z.boolean().default(false).describe("True if adapted from the original."),
});
export type Source = z.output<typeof Source>;

/** Human labels per language (BCP 47 code → words, preferred first). */
export const Labels = z.record(z.string(), z.array(z.string()).min(1));
export type Labels = z.infer<typeof Labels>;

/**
 * Extra word forms per language, used by search only and never displayed:
 * irregular plurals and conjugations (e.g. fr "boit", "bu" for "boire"; en "ate" for "eat").
 * Regular forms (plurals in -s, French verbs in -er…) are handled by the engine.
 */
export const Forms = z.record(z.string(), z.array(z.string()).min(1));
export type Forms = z.infer<typeof Forms>;

export const Box = z.object({ x: z.number(), y: z.number(), size: z.number().positive() });
export type Box = z.infer<typeof Box>;

export const ElementId = z.string().regex(/^[a-z]+\.[a-z0-9-]+$/, "must look like `<prefix>.<name>`, e.g. `person.child`");

export const ElementDef = z.object({
  id: ElementId,
  kind: ElementKind,
  category: Category.optional().describe("Concepts only."),
  labels: Labels,
  forms: Forms.optional(),
  tags: z.array(z.string()).default([]),
  source: Source,
  inner: Box.optional().describe("Frames only: where the concept is drawn, in the 100×100 box."),
  /** Inner SVG markup, drawn in a 100×100 box. */
  svg: z.string(),
});
export type ElementDef = z.output<typeof ElementDef>;

// ─── Grammar: modifiers and zones ────────────────────────────────────────────

/**
 * Every modifier lives in a fixed zone of the pictogram. A zone holds at most one modifier,
 * which keeps the system simple to learn and guarantees there is never a graphic collision.
 *
 *   ┌──────────────────────────┐
 *   │ indicator         badge  │   indicator: very, little
 *   │                          │   badge:     any concept, e.g. `idea.care`
 *   │         concept          │   concept:   plural (drawn twice)
 *   │                          │
 *   │                    size  │   size:      big, small
 *   └──────────────────────────┘   overlay:   negation (bar across the concept)
 *                                  frame:     the whole outline, e.g. `frame.place`
 */
export const MODIFIERS = {
  plural: { zone: "concept", labels: { en: "several", fr: "plusieurs" } },
  negation: { zone: "overlay", labels: { en: "not", fr: "pas" } },
  very: { zone: "indicator", labels: { en: "very", fr: "très" } },
  little: { zone: "indicator", labels: { en: "a little", fr: "un peu" } },
  big: { zone: "size", labels: { en: "big", fr: "grand" } },
  small: { zone: "size", labels: { en: "small", fr: "petit" } },
} as const satisfies Record<string, { zone: string; labels: Record<string, string> }>;

export type Modifier = keyof typeof MODIFIERS;
export const Modifier = z.enum(Object.keys(MODIFIERS) as [Modifier, ...Modifier[]]);
export type Zone = (typeof MODIFIERS)[Modifier]["zone"];

// ─── Pictogram and phrase ────────────────────────────────────────────────────

/**
 * Reference to a concept (`person.child`) or to a lexicon entry (`lex.doctor`).
 * Existence is checked against a library by `@parlomino/core`, which suggests corrections.
 */
export const ConceptRef = ElementId;

export const Picto = z
  .object({
    concept: ConceptRef.describe("The base drawing: a concept like `object.apple`, or a lexicon entry like `lex.doctor`."),
    badge: ConceptRef.optional().describe("A concept drawn small in the top-right corner, e.g. person + `idea.care` = doctor."),
    frame: ElementId.optional().describe("A frame changing the category, e.g. `frame.place` around `action.eat` = kitchen."),
    modifiers: z.array(Modifier).default([]).describe("At most one modifier per zone."),
  })
  .strict()
  .describe("One pictogram: a concept, optionally with a badge, a frame and modifiers.");
export type Picto = z.output<typeof Picto>;
export type PictoInput = z.input<typeof Picto>;

export const Tense = z.enum(["past", "future"]);
export type Tense = z.infer<typeof Tense>;

export const Phrase = z
  .object({
    phrase: z.array(Picto).min(1).max(12).describe("Pictograms in reading order, one per word or idea."),
    tense: Tense.optional().describe("Time of the whole phrase. Omit for present."),
    question: z.boolean().default(false),
  })
  .strict()
  .describe("A sentence: a sequence of pictograms, with tense and question marks for the whole phrase.");
export type Phrase = z.output<typeof Phrase>;
export type PhraseInput = z.input<typeof Phrase>;

// ─── Lexicon ─────────────────────────────────────────────────────────────────

/**
 * A named, reusable combination (e.g. `lex.doctor` = person + badge care).
 * If a dedicated drawing is made later, the entry points to it and its id stays the same.
 */
export const LexiconEntry = z.object({
  id: z.string().regex(/^lex\.[a-z0-9-]+$/, "must look like `lex.<name>`"),
  labels: Labels,
  forms: Forms.optional(),
  picto: Picto,
});
export type LexiconEntry = z.output<typeof LexiconEntry>;

// ─── JSON Schemas (for the API, the MCP, other languages) ────────────────────

export function jsonSchemas() {
  return {
    picto: z.toJSONSchema(Picto, { io: "input" }),
    phrase: z.toJSONSchema(Phrase, { io: "input" }),
  };
}
