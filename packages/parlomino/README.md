# Parlomino

**An open, composable pictogram language for augmentative and alternative communication (AAC).**

Concepts, badges, frames and modifiers snap together like dominoes. The engine turns a few lines of JSON
into accessible SVG pictograms, with English and French labels.

```sh
npm install parlomino
```

```ts
import { compose, search } from "parlomino";

const result = compose({ concept: "lex.doctor", modifiers: ["plural"] }, { lang: "fr" });
if (result.ok) {
  result.svg;     // <svg … role="img" aria-label="médecin (plusieurs)">…</svg>
  result.credits; // who to credit for the drawings used
} else {
  result.issues;  // what is wrong, with suggested fixes
}

search("médecins", { lang: "fr" })[0].id; // "lex.doctor"
```

## From any language

`parlomino/global` (`dist/parlomino.global.js`) is the whole engine and library in one file, exposing a `Parlomino` global.
It only needs a JavaScript engine: no Node, no DOM, no file access.

## Documentation

https://clement-avenel.github.io/parlomino/

## Licenses and attribution

- Code: Apache-2.0 (`LICENSE`).
- Pictograms: CC BY-SA 4.0 (`LICENSE-PICTOGRAMS`), many adapted from [OpenMoji](https://openmoji.org).

**If you display these pictograms, you must credit them.** Every composed result includes `credits` for this purpose.
