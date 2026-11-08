import { describe, expect, it } from "vitest";
import { compose, composePhrase, composePicto, themes } from "@parlomino/core";
import { palette } from "@parlomino/library";

function picto(input: unknown, options?: Parameters<typeof composePicto>[1]) {
  const r = composePicto(input, options);
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r;
}

const groups = (svg: string) => svg.match(/<g /g)?.length ?? 0;
const discs = (svg: string) => svg.match(/<circle cx="(17|83)" cy="(17|83)" r="15"/g)?.length ?? 0;

describe("composePicto", () => {
  it("renders an accessible square SVG", () => {
    const { svg, label } = picto({ concept: "object.apple" });
    expect(label).toBe("apple");
    expect(svg).toMatch(/^<svg [^>]*viewBox="0 0 100 100"[^>]*role="img" aria-label="apple"/);
    expect(svg).toContain("<title>apple</title>");
  });

  it("draws a badge in a corner disc", () => {
    const { svg, label } = picto({ concept: "person.adult", badge: "idea.care" });
    expect(discs(svg)).toBe(1);
    expect(label).toBe("adult + care");
  });

  it("uses the lexicon label for an entry", () => {
    expect(picto({ concept: "lex.doctor", modifiers: ["plural"] }).label).toBe("doctor (several)");
  });

  it("labels in the requested language, falling back to English", () => {
    expect(picto({ concept: "lex.doctor", modifiers: ["plural"] }, { lang: "fr" }).label).toBe("médecin (plusieurs)");
    expect(picto({ concept: "lex.kitchen" }, { lang: "pt" }).label).toBe("kitchen");
  });

  it("draws the concept inside a frame", () => {
    const { svg, label } = picto({ concept: "action.eat", frame: "frame.place" });
    expect(svg).toContain("translate(24 44) scale(0.46)"); // frame.place inner box
    expect(label).toBe("place : eat");
  });

  it("doubles the concept for a plural", () => {
    expect(groups(picto({ concept: "object.apple", modifiers: ["plural"] }).svg)).toBe(2);
  });

  it("draws one disc per used corner zone", () => {
    const { svg, label } = picto({ concept: "lex.doctor", modifiers: ["very", "small"] });
    expect(discs(svg)).toBe(2);
    expect(label).toBe("doctor (very, small)");
  });

  it.each([
    ["big", true],
    ["small", false],
  ] as const)("compares the concept with a dashed copy of itself for %s", (modifier, solidIsLarger) => {
    const { svg } = picto({ concept: "object.apple", modifiers: [modifier] });
    expect(svg).toContain('stroke-dasharray="7 6"');
    expect(discs(svg)).toBe(0);
    // Two copies: [solid, ghost] for big, [ghost, solid] for small; compare their scales.
    const scales = [...svg.matchAll(/scale\(([\d.]+)\)">(<g stroke-dasharray)?/g)].map((m) => ({ scale: Number(m[1]), ghost: Boolean(m[2]) }));
    const solid = scales.find((s) => !s.ghost)!;
    const ghost = scales.find((s) => s.ghost)!;
    expect(solid.scale > ghost.scale).toBe(solidIsLarger);
  });

  it("bars the concept for a negation", () => {
    expect(picto({ concept: "action.sleep", modifiers: ["negation"] }).svg).toContain(`stroke="${themes.default.negation}"`);
  });

  it("returns validation issues instead of throwing", () => {
    expect(composePicto({ concept: "object.aple" })).toMatchObject({ ok: false });
  });

  it("high-contrast theme leaves no default palette color", () => {
    const { svg } = picto({ concept: "lex.doctor", modifiers: ["very"] }, { theme: "high-contrast" });
    for (const [name, hex] of Object.entries(palette)) expect(svg, name).not.toContain(hex);
    expect(svg).toContain("#FFE600");
  });

  it("scales strokes", () => {
    expect(picto({ concept: "object.apple" }, { strokeScale: 2 }).svg).toContain('stroke-width="8"');
  });

  it("is deterministic", () => {
    expect(picto({ concept: "lex.teacher" }).svg).toBe(picto({ concept: "lex.teacher" }).svg);
  });
});

describe("composePhrase", () => {
  const phrase = {
    phrase: [
      { concept: "person.child" },
      { concept: "action.eat", modifiers: ["negation"] },
      { concept: "object.apple", modifiers: ["plural"] },
    ],
    tense: "past",
  };

  it("renders one card per pictogram plus the tense mark, as a strip", () => {
    const r = composePhrase(phrase);
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.svg).toMatch(/viewBox="0 0 364 100"/); // 40 + 8 + 3 × 100 + 2 × 8
    expect(r.svg.match(/rx="10"/g)).toHaveLength(3);
    expect(r.label).toBe("[past] child · eat (not) · apple (several)");
  });

  it("labels the phrase in the requested language", () => {
    expect(composePhrase(phrase, { lang: "fr" })).toMatchObject({ label: "[passé] enfant · manger (pas) · pomme (plusieurs)" });
  });

  it("also returns each pictogram on its own", () => {
    const r = composePhrase(phrase);
    if (!r.ok) throw new Error();
    expect(r.pictos.map((p) => p.label)).toEqual(["child", "eat (not)", "apple (several)"]);
    for (const p of r.pictos) expect(p.svg).toMatch(/viewBox="0 0 100 100"/);
  });

  it("adds a question mark at the end", () => {
    const r = composePhrase({ phrase: [{ concept: "action.drink" }, { concept: "object.water" }], question: true });
    expect(r).toMatchObject({ ok: true, label: "drink · water ?" });
    if (r.ok) expect(r.svg).toMatch(/viewBox="0 0 256 100"/);
  });

  it("sizes the strip by its height", () => {
    const r = composePhrase({ phrase: [{ concept: "action.drink" }, { concept: "object.water" }] }, { size: 50 });
    if (r.ok) expect(r.svg).toContain('width="104" height="50"');
  });
});

describe("compose", () => {
  it("dispatches on the presence of a phrase", () => {
    expect(compose({ concept: "object.apple" })).toMatchObject({ ok: true, label: "apple" });
    expect(compose({ phrase: [{ concept: "object.apple" }] })).toMatchObject({ ok: true, pictos: [{ label: "apple" }] });
  });
});

describe("credits", () => {
  it("lists the source of every drawing used, once", () => {
    const r = composePhrase({ phrase: [{ concept: "animal.dog" }, { concept: "animal.dog", modifiers: ["plural"] }, { concept: "lex.kitchen" }] });
    if (!r.ok) throw new Error();
    expect(r.credits.map((c) => c.id)).toEqual(["animal.dog", "frame.place", "action.eat"]);
    expect(r.credits[0]?.source).toMatchObject({ name: "OpenMoji", license: "CC-BY-SA-4.0", modified: true });
  });

  it("credits badges too", () => {
    const r = composePicto({ concept: "person.adult", badge: "object.toothbrush" });
    expect(r.ok && r.credits.map((c) => c.id)).toEqual(["person.adult", "object.toothbrush"]);
  });
});
