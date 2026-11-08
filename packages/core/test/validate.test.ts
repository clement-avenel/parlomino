import { describe, expect, it } from "vitest";
import { validate, validatePhrase, validatePicto } from "@parlomino/core";
import { defaultLibrary } from "@parlomino/library";

describe("validatePicto", () => {
  it("accepts a concept with a badge, a frame and modifiers", () => {
    expect(validatePicto({ concept: "person.adult", badge: "idea.care", modifiers: ["plural"] }).ok).toBe(true);
    expect(validatePicto({ concept: "action.eat", frame: "frame.place", modifiers: ["negation"] }).ok).toBe(true);
  });

  it.each([
    ["object.aple", "object.apple"],     // typo
    ["food.apple", "object.apple"],      // wrong prefix
    ["object.pomme", "object.apple"],    // French label instead of id
    ["person.doctor", "lex.doctor"],     // exists in the lexicon
    ["lex.medecin", "lex.doctor"],       // lexicon entry by its label, without accent
  ])("suggests %s → %s", (concept, suggestion) => {
    expect(validatePicto({ concept })).toMatchObject({ ok: false, issues: [{ code: "unknown_element", suggestion }] });
  });

  it("gives no suggestion when nothing is close", () => {
    const r = validatePicto({ concept: "object.helicopter" });
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.issues[0]?.suggestion).toBeUndefined();
  });

  it("rejects an element of the wrong kind", () => {
    expect(validatePicto({ concept: "frame.place" })).toMatchObject({ ok: false, issues: [{ path: "concept", code: "wrong_kind" }] });
    expect(validatePicto({ concept: "object.apple", frame: "idea.care" })).toMatchObject({ ok: false, issues: [{ path: "frame", code: "wrong_kind" }] });
    expect(validatePicto({ concept: "object.apple", badge: "lex.doctor" })).toMatchObject({ ok: false, issues: [{ path: "badge", code: "wrong_kind" }] });
  });

  it("allows only one modifier per zone", () => {
    expect(validatePicto({ concept: "object.ball", modifiers: ["very", "little"] })).toMatchObject({
      ok: false,
      issues: [{ code: "zone_conflict" }],
    });
    expect(validatePicto({ concept: "object.ball", modifiers: ["big", "small"] })).toMatchObject({ ok: false });
    expect(validatePicto({ concept: "object.ball", modifiers: ["big", "plural"] })).toMatchObject({ ok: false, issues: [{ code: "zone_conflict" }] });
    expect(validatePicto({ concept: "object.ball", modifiers: ["very", "big", "negation"] }).ok).toBe(true);
  });

  it("rejects duplicate modifiers", () => {
    expect(validatePicto({ concept: "object.ball", modifiers: ["plural", "plural"] })).toMatchObject({
      ok: false,
      issues: [{ code: "duplicate_modifier" }],
    });
  });

  it("expands lexicon entries and lets modifiers be added", () => {
    const r = validatePicto({ concept: "lex.doctor", modifiers: ["plural"] });
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.resolved.concept.id).toBe("person.adult");
      expect(r.resolved.badge?.id).toBe("idea.care");
      expect(r.resolved.modifiers).toEqual(["plural"]);
    }
  });

  it("refuses to override what a lexicon entry defines", () => {
    expect(validatePicto({ concept: "lex.doctor", badge: "idea.school" })).toMatchObject({
      ok: false,
      issues: [{ path: "badge", code: "lexicon_conflict" }],
    });
  });

  it("validates every lexicon entry of the default library", () => {
    for (const entry of defaultLibrary.lexicon) expect(validatePicto({ concept: entry.id }).ok, entry.id).toBe(true);
  });
});

describe("validatePhrase", () => {
  it("reports issues with the position in the phrase", () => {
    const r = validatePhrase({ phrase: [{ concept: "person.child" }, { concept: "action.eet" }] });
    expect(r).toMatchObject({ ok: false, issues: [{ path: "phrase.1.concept", suggestion: "action.eat" }] });
  });

  it("reports shape errors with a path", () => {
    expect(validatePhrase({ phrase: [{ concept: "action.eat" }], tense: "yesterday" })).toMatchObject({
      ok: false,
      issues: [{ path: "tense", code: "invalid_shape" }],
    });
  });
});

describe("validate", () => {
  it("dispatches on the presence of a phrase", () => {
    expect(validate({ phrase: [{ concept: "action.eat" }] }).ok).toBe(true);
    expect(validate({ concept: "action.eat" }).ok).toBe(true);
  });
});

describe("suggestions from word forms", () => {
  it("suggests a concept from an irregular form", () => {
    expect(validatePicto({ concept: "action.drank" })).toMatchObject({ ok: false, issues: [{ suggestion: "action.drink" }] });
  });
});
