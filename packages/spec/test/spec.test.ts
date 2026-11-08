import { describe, expect, it } from "vitest";
import { MODIFIERS, Phrase, Picto, jsonSchemas } from "@parlomino/spec";

describe("spec", () => {
  it("fills defaults", () => {
    expect(Picto.parse({ concept: "object.apple" })).toEqual({ concept: "object.apple", modifiers: [] });
    expect(Phrase.parse({ phrase: [{ concept: "action.eat" }] })).toEqual({
      phrase: [{ concept: "action.eat", modifiers: [] }],
      question: false,
    });
  });

  it("rejects unknown keys, malformed refs and empty phrases", () => {
    expect(Picto.safeParse({ concept: "object.apple", colour: "red" }).success).toBe(false);
    expect(Picto.safeParse({ concept: "apple" }).success).toBe(false);
    expect(Phrase.safeParse({ phrase: [] }).success).toBe(false);
  });

  it("puts every modifier in a known zone", () => {
    const zones = new Set(["concept", "overlay", "indicator"]);
    for (const [name, m] of Object.entries(MODIFIERS)) expect(zones, name).toContain(m.zone);
  });

  it("exports JSON Schemas usable as API or MCP inputs", () => {
    const { picto, phrase } = jsonSchemas();
    expect(Object.keys(picto.properties ?? {})).toEqual(["concept", "badge", "frame", "modifiers"]);
    expect(Object.keys(phrase.properties ?? {})).toEqual(["phrase", "tense", "question"]);
  });
});
