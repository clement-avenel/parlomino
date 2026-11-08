# Design guidelines

Each element is an SVG file in `packages/library/elements/<prefix>/<name>.svg`, declared in a manifest.
Tests check these rules automatically.

## Where drawings come from

| Source | Manifest | How to change it |
|---|---|---|
| The Parlomino character (people and actions) | `elements.characters.json` | Edit the pose in `scripts/draw-characters.mjs`, then `npm run draw` |
| Adapted from [OpenMoji](https://openmoji.org) (objects, food, animals, places, body, colors…) | `elements.openmoji.json` | Edit the list in `sources/openmoji.mjs`, then `npm run draw` |
| Drawn by hand (frames, marks, a few concepts) | `elements.json` | Edit the SVG file |

## Style: the OpenMoji guidelines

Most pictograms come from [OpenMoji](https://openmoji.org). Everything drawn for Parlomino follows the same style,
so that the library looks like one set:

| OpenMoji rule (72-unit grid) | Parlomino (100-unit canvas) |
|---|---|
| Artwork inside the template frame, 4 to 68 | Inside 3 to 97, the same tolerance OpenMoji drawings use |
| Black outline, 2 units, round caps and joins | Ink outline, 3.75 units: 2 × 100/72 × 1.35, the same thickening applied to imported drawings. Close-ups draw thinner lines so that they end up at the same width |
| Flat colors from the OpenMoji palette, no gradients or shadows | The Parlomino palette, onto which the OpenMoji palette is mapped |
| Layers: color, skin, hair, line | Fills under, outlines on top |
| Skin tones as variants | Light skin tone (`#F5C9A0`) by default |
| — | **No text, letters or numbers**, even drawn as shapes (OpenMoji's stop sign spells "STOP": it is not used) |

Parlomino departs from OpenMoji on purpose in one way: people performing actions are drawn with faces and in close-ups,
because AAC users need to see the action, not just a small silhouette.

## What makes a pictogram understandable

These principles come from the best-known AAC symbol sets, which have been tested with users for decades:

1. **Show a person doing the action.** "Drink" is a child bringing a cup to the mouth, not a cup.
   A cup alone is read as "cup".
2. **One consistent character** in every pose, so that the person is never what changes.
3. **Close-ups for the face and hands.** Eating, drinking, listening or reading are framed on the upper body,
   so the mouth, the hands and the object are big enough to see.
4. **Real shapes, simplified.** A shoe looks like a shoe, a dog like a dog: recognizable silhouettes,
   flat colors and a dark outline, not geometric abstractions.
5. **Context when needed.** A table for writing, a chair for sitting, a bed for sleeping, a tap and a basin for washing hands.
6. **One picture per word.** Two concepts never share the same main label; homonyms are made explicit ("orange (color)").

## Three kinds of elements

| Kind | Id | Role |
|---|---|---|
| Concept | `<category>.<name>` (`person`, `action`, `feeling`, `body`, `object`, `animal`, `place`, `color`, `idea`) | Base drawing, also usable as a badge |
| Frame | `frame.<name>` | Outline changing the category. Declares an `inner` box where the concept is drawn |
| Mark | `mark.<modifier>` | Small sign of a modifier (very, a little), shown in a corner disc |

## Rules

1. **Canvas**: `viewBox="0 0 100 100"`, centered drawing, margin of about 6 units.
   Nothing may go outside the frame: in a phrase, it would spill onto the neighboring pictogram.
   For close-ups of the character, keep props between x 18 and 82 in body coordinates.
2. **Palette only**: only the colors of `palette` (`packages/library/src/index.ts`) are allowed.
   This is what lets themes (high contrast, etc.) recolor the drawing.
3. **Always outlined**: every shape has a `stroke` (ink `#1F2937`), or is filled with ink. Without it, a shape disappears
   in high contrast. Imported drawings may have flat fills without outlines in a `color` layer, as long as a `line`
   layer draws every shape on top.
4. **Never color alone**: the shape must be enough to recognize the element.
5. **Readable when small**: a concept may be shown at 2 cm, or as a badge at a few millimeters.
   No gradients, shadows, text, `id`, `<script>` or links.
6. **Age-neutral**: usable by a child as well as an adult.
7. **Culturally neutral**: no text, letters or culture-specific gestures; prefer objects recognized worldwide.
8. **No protected emblems**: e.g. no red cross on a white background (protected by the Geneva Conventions).

## Designing for children first

Pictograms must be understood at a glance by young children, including children with
intellectual disabilities. When a rule below conflicts with aesthetics, the rule wins.

- **Concrete before abstract**: draw a thing a child has seen, not a symbol.
  A bandage for "care", not a cross. An alarm clock for "moment", not a circle with ticks.
- **The typical example**: the apple a child would draw, not a rare variety.
- **One idea, one silhouette**: the outline alone should be enough to recognize it.
- **Obvious differences**: two elements that mean different things must not look alike
  (a child has a big head and a small body, an adult a small head and a tall body).
- **Show, don't symbolize**: when a meaning can be shown with the concept itself, do it.
  Big and small compare the concept with a dashed copy of itself instead of using an abstract mark.
- **No computer conventions**: no resize arrows, crosshairs, cursors or interface icons.
- **No clutter**: a simplicity budget in the tests sets a ceiling on strokes and colors, and a minimal outline width.
  It catches outliers; it does not prove that a drawing is understood.
- **Modifiers are learned**: "very", "a little", "big", "small"… cannot be fully obvious.
  Keep their marks as simple as possible, and expect them to be taught.

## Testing with children

Automatic checks only catch complexity. Whether a pictogram is understood can only be tested with people.

1. **Guessability** (concepts): show the pictogram alone, without its label, to at least 5 children of the
   target age, and ask "what is it?". Count an answer as correct if it names the concept or a close synonym.
   Aim for at least 2 out of 3 correct answers; below that, redraw.
2. **Learnability** (badges, frames, modifiers): explain the mark once with two examples, then show new
   combinations a few days later. Aim for at least 2 out of 3 correct answers.
3. **Write results down** next to the element (date, age, number of children, score), so the library
   keeps track of what has been validated.

## Choosing what to draw

New concepts are prioritized from established AAC vocabularies: the most frequent "core" words
(such as the Universal Core from Project Core: help, stop, look, open, go…) and the immediate needs of
early vocabularies (eat, drink, toilet, hurt, home…). Very abstract core words (more, want, same…)
need a careful design with therapists before being drawn.

## Provenance and licenses

Each element declares its source in `elements.json`:

```json
"source": { "name": "OpenMoji", "author": "…", "url": "…", "license": "CC-BY-SA-4.0", "modified": true }
```

Accepted licenses (checked in CI): `CC-BY-SA-4.0`, `CC-BY-4.0`, `CC0-1.0`. OpenMoji is CC BY-SA 4.0.
Forbidden: ARASAAC, Sclera and any non-commercial (`NC`) symbol set, including as a model to redraw.

## Adding a hand-drawn element

1. Draw the SVG following the rules above.
2. Add it to `elements.json` with its `en` and `fr` labels and its source.
   For a verb or a noun with irregular forms, list them in `forms` so search finds them:
   `"forms": { "en": ["drank", "drunk"], "fr": ["boit", "bu"] }`.
3. Run `npm test`: it regenerates the library and checks these rules.

Drawings are published under CC BY-SA 4.0.
