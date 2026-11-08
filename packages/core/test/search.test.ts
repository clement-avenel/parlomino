import { describe, expect, it } from "vitest";
import { composePicto, search } from "@parlomino/core";

const first = (query: string, lang?: string) => search(query, lang ? { lang } : {})[0]?.id;

describe("search", () => {
  it("finds concepts and lexicon entries", () => {
    expect(search("doctor")[0]).toMatchObject({ id: "lex.doctor", source: "lexicon" });
    expect(search("apple")[0]).toMatchObject({ id: "object.apple", source: "concept" });
  });

  // What French-speaking users actually type.
  it.each([
    ["pomme", "object.apple"],
    ["Pomme", "object.apple"],
    ["pommes", "object.apple"],        // plural
    ["les pommes", "object.apple"],    // article + plural
    ["ballons", "object.ball"],
    ["eau", "object.water"],
    ["de l'eau", "object.water"],      // elided article
    ["la cuisine", "lex.kitchen"],
    ["l'école", "idea.school"],
    ["un médecin", "lex.doctor"],
    ["médecins", "lex.doctor"],
    ["medecin", "lex.doctor"],         // missing accent
    ["docteur", "lex.doctor"],         // synonym
    ["maîtresse", "lex.teacher"],
    ["mange", "action.eat"],           // -er verb
    ["mangé", "action.eat"],
    ["mangeons", "action.eat"],        // -ger verb keeps its "e"
    ["mangeait", "action.eat"],
    ["boit", "action.drink"],          // irregular, from `forms`
    ["bu", "action.drink"],
    ["dort", "action.sleep"],
    ["enfants", "person.child"],
  ])("fr: %s → %s", (query, id) => {
    expect(first(query, "fr")).toBe(id);
  });

  it.each([
    ["apples", "object.apple"],
    ["the kitchen", "lex.kitchen"],
    ["a doctor", "lex.doctor"],
    ["doctors", "lex.doctor"],
    ["children", "person.child"],
    ["eating", "action.eat"],
    ["ate", "action.eat"],
    ["drank", "action.drink"],
    ["slept", "action.sleep"],
  ])("en: %s → %s", (query, id) => {
    expect(first(query)).toBe(id);
  });

  it("does not take a word for a conjugation when it is not one", () => {
    expect(search("mangue", { lang: "fr" })).toEqual([]);
  });

  it("ranks exact matches before inflections and prefixes", () => {
    expect(search("école", { lang: "fr" }).map((r) => r.id).slice(0, 2)).toEqual(["idea.school", "lex.school"]);
  });

  it("keeps an article when it is the whole query", () => {
    expect(() => search("la", { lang: "fr" })).not.toThrow();
  });

  it("searches in the requested language only", () => {
    expect(first("cuisine", "fr")).toBe("lex.kitchen");
    expect(search("cuisine")).toEqual([]);
  });

  it("matches tags", () => {
    expect(search("fruit").map((r) => r.id)).toContain("object.apple");
  });

  it("returns pictograms ready to compose", () => {
    for (const r of search("e")) expect(composePicto(r.picto).ok, r.id).toBe(true);
  });

  it("returns nothing for an empty query", () => {
    expect(search("  ")).toEqual([]);
  });
});
