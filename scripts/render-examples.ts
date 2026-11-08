// Renders a gallery of sample pictograms and phrases to examples/ (git-ignored),
// one version per supported language: examples/index.html (English) and examples/index.<lang>.html.
// Run: npm run examples, then open examples/index.html.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { compose, type ComposeOptions } from "@parlomino/core";
import { REQUIRED_LANGUAGES } from "@parlomino/library";
import type { PhraseInput, PictoInput } from "@parlomino/spec";

const pictos: [string, PictoInput][] = [
  ["apple", { concept: "object.apple" }],
  ["doctor", { concept: "lex.doctor" }],
  ["doctors", { concept: "lex.doctor", modifiers: ["plural"] }],
  ["pupil", { concept: "lex.pupil" }],
  ["kitchen", { concept: "lex.kitchen" }],
  ["bedroom", { concept: "lex.bedroom" }],
  ["mealtime", { concept: "lex.mealtime" }],
  ["small-ball", { concept: "object.ball", modifiers: ["small"] }],
  ["a-little-sleep", { concept: "action.sleep", modifiers: ["little"] }],
  ["very-big-apple", { concept: "object.apple", modifiers: ["very", "big"] }],
  ["not-sleep", { concept: "action.sleep", modifiers: ["negation"] }],
  ["a-little-water", { concept: "object.water", modifiers: ["little"] }],
];
const phrases: [string, PhraseInput][] = [
  ["the-child-did-not-eat-the-apples", {
    phrase: [{ concept: "person.child" }, { concept: "action.eat", modifiers: ["negation"] }, { concept: "object.apple", modifiers: ["plural"] }],
    tense: "past",
  }],
  ["do-you-want-to-drink-water", { phrase: [{ concept: "action.drink" }, { concept: "object.water" }], question: true }],
  ["the-doctor-will-sleep-in-the-bedroom", {
    phrase: [{ concept: "lex.doctor" }, { concept: "action.sleep" }, { concept: "lex.bedroom" }],
    tense: "future",
  }],
];
const variants: [string, ComposeOptions][] = [
  ["default", {}],
  ["high-contrast", { theme: "high-contrast", strokeScale: 1.5 }],
];

// English first: it is the default language and gets examples/index.html.
const languages = ["en", ...REQUIRED_LANGUAGES.filter((l) => l !== "en")];
const page = (lang: string) => (lang === "en" ? "index.html" : `index.${lang}.html`);
const languageName = (lang: string) => {
  const name = new Intl.DisplayNames([lang], { type: "language" }).of(lang) ?? lang;
  return name.charAt(0).toUpperCase() + name.slice(1);
};

function render(name: string, input: PictoInput | PhraseInput, lang: string, variant: string, options: ComposeOptions) {
  const r = compose(input, { ...options, lang });
  if (!r.ok) throw new Error(`${name}: ${JSON.stringify(r.issues)}`);
  writeFileSync(`examples/${lang}/${name}.${variant}.svg`, r.svg);
  return r;
}

rmSync("examples", { recursive: true, force: true });
for (const lang of languages) {
  mkdirSync(`examples/${lang}`, { recursive: true });
  let html = "";
  for (const [variant, options] of variants) {
    html += `<h2>${variant}</h2><div class="grid">`;
    for (const [name, input] of pictos) {
      const r = render(name, input, lang, variant, options);
      html += `<figure>${r.svg}<figcaption>${r.label}</figcaption></figure>`;
    }
    html += `</div>`;
    for (const [name, input] of phrases) {
      const r = render(name, input, lang, variant, options);
      html += `<figure class="phrase">${r.svg}<figcaption>${r.label}</figcaption></figure>`;
    }
  }
  const nav = languages
    .map((l) => (l === lang ? `<strong>${languageName(l)}</strong>` : `<a href="${page(l)}" hreflang="${l}">${languageName(l)}</a>`))
    .concat(`<a href="${lang === "en" ? "catalog.html" : `catalog.${lang}.html`}">${lang === "fr" ? "Catalogue" : "Catalog"}</a>`)
    .join(" · ");
  writeFileSync(
    `examples/${page(lang)}`,
    `<!doctype html><html lang="${lang}"><meta charset="utf-8"><title>Parlomino — examples (${lang})</title>
<style>body{font:15px system-ui;margin:24px}nav{margin-bottom:16px}.grid{display:grid;grid-template-columns:repeat(auto-fill,150px);gap:16px;margin-bottom:24px}
figure{margin:0 0 16px;border:1px solid #ddd;border-radius:12px;padding:8px}svg{width:100%;height:auto;border-radius:8px}
figure.phrase{max-width:640px}figcaption{font-size:12px;color:#555;margin-top:6px;text-align:center}</style>
<h1>Parlomino — examples</h1><nav>${nav}</nav>${html}`,
  );
}
console.log(`examples: ${languages.map((l) => `examples/${page(l)}`).join(", ")}`);
