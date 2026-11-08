# Parlomino

**An open, composable pictogram language for augmentative and alternative communication (AAC).**

Pieces snap together like dominoes: a **concept** (apple, eat, child), a **badge**
(adult + care = doctor), a **frame** (place + eat = kitchen) and **modifiers**
(plural, negation, very, small…), each in a fixed zone. A **phrase** is a sequence of pictograms.

```ts
import { compose, search } from "@parlomino/core";

compose({ concept: "lex.doctor", modifiers: ["plural"] });
// → { ok: true, svg: "<svg … aria-label=\"doctor (several)\">…</svg>", label: "doctor (several)" }

compose({
  phrase: [
    { concept: "person.child" },
    { concept: "action.eat", modifiers: ["negation"] },
    { concept: "object.apple", modifiers: ["plural"] },
  ],
  tense: "past",
});
// → a strip of 3 pictograms with a past-tense mark, plus each pictogram on its own

compose({ concept: "object.aple" });
// → { ok: false, issues: [{ path: "concept", code: "unknown_element", suggestion: "object.apple" }] }

search("doctor");                   // → [{ id: "lex.doctor", picto: { concept: "lex.doctor", … } }]
search("médecin", { lang: "fr" });  // → same result, in French
```

The whole grammar fits on one page: [docs/grammar.md](docs/grammar.md).
Documentation site, in English and French: **https://clement-avenel.github.io/parlomino/**

Parlomino is not a therapy method: it is a **pictographic code and tools**, designed to serve
existing AAC approaches (picture exchange, communication books, core vocabulary, visual schedules…).

## Principles

- **Open**: code under Apache-2.0, pictograms under CC BY-SA 4.0 (commercial use allowed, derivatives stay open).
- **Composable**: an unlimited vocabulary from a small set of building blocks.
- **International**: drawings contain no text; labels are per-language data, with English as the fallback.
- **Accessible**: high-contrast theme, adjustable stroke width, an accessible label in every SVG.
- **Offline and portable**: pure TypeScript functions, no DOM, no file access.
  Runs in browsers, Node, mobile apps, or other stacks (e.g. Ruby through `mini_racer`).
- **LLM-friendly**: a closed vocabulary of ids, exported JSON Schemas, errors with suggested fixes.
- **Fast**: a budget of 10 ms per 1000 pictograms, checked in CI (`npm run bench`).

## Packages

| Package | Role |
|---|---|
| [`@parlomino/spec`](packages/spec) | The format of pictograms and phrases (Zod schemas + JSON Schemas) |
| [`@parlomino/library`](packages/library) | The drawings (concepts, frames, marks), the lexicon and the palette |
| [`@parlomino/core`](packages/core) | Validation with suggestions, composition to SVG (pictogram or phrase), search, themes |

## Languages

Every element and lexicon entry is labeled in English and French (enforced by tests).
Other languages are welcome: add them to the `labels` of `packages/library/elements.json` and `lexicon.json`.
Labels fall back to English when a language is missing.

Search understands what people actually type: it ignores accents, case and leading articles
("la cuisine", "the kitchen"), and handles plurals ("pommes", "apples") and regular conjugations
("mangeons", "eating"). Irregular forms ("boit", "ate") are listed per element in an optional `forms` field.
Adding a language means adding its labels, and optionally its rules in `packages/core/src/text.ts`.

## Development

```sh
npm install
npm test           # regenerates the library and runs the tests
npm run site       # documentation site in site/, one version per language (deployed to GitHub Pages)
npm run bench      # checks the performance budget
npm run build      # compiles to packages/*/dist
```

To draw new elements, see the [design guidelines](docs/design-guidelines.md).

## Roadmap

- [x] Grammar: concepts, badges, frames, fixed-zone modifiers, phrases, lexicon
- [x] Engine: validation with suggestions, composition, search, themes
- [ ] Grow the library, with occupational therapists and speech-language therapists
- [ ] Right-to-left phrases (Arabic, Hebrew…)
- [ ] Optional written labels under pictograms
- [ ] PNG/PDF rendering (`@parlomino/render`, via resvg)
- [ ] Search rules for more languages
- [ ] Open Board Format import/export

## Commitment

The Parlomino language (pictograms, grammar and engine) is and will remain open and complete.
Services built around it (application, sync, hosted API and MCP) are offered by subscription.

## License

Code: [Apache-2.0](LICENSE). Pictograms: [CC BY-SA 4.0](packages/library/LICENSE).
