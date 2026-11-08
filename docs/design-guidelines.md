# Design guidelines

Each element is an SVG file in `packages/library/elements/<prefix>/<name>.svg`,
declared in `packages/library/elements.json`. Tests check these rules automatically.

## Three kinds of elements

| Kind | Id | Role |
|---|---|---|
| Concept | `<category>.<name>` (`person`, `action`, `object`, `place`, `idea`) | Base drawing, also usable as a badge |
| Frame | `frame.<name>` | Outline changing the category. Declares an `inner` box where the concept is drawn |
| Mark | `mark.<modifier>` | Small sign of a modifier (very, a little), shown in a corner disc |

## Rules

1. **Canvas**: `viewBox="0 0 100 100"`, centered drawing, margin of about 6 units.
2. **Palette only**: only the colors of `palette` (`packages/library/src/index.ts`) are allowed.
   This is what lets themes (high contrast, etc.) recolor the drawing.
3. **Always outlined**: every shape has a `stroke` (ink `#1F2937`). Without it, a shape disappears in high contrast.
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
- **Few strokes, few colors**: enforced by a simplicity budget in the tests
  (strokes, colors and minimal stroke width per kind of element).
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

## Provenance and licenses

Each element declares its source in `elements.json`:

```json
"source": { "name": "OpenMoji", "author": "…", "url": "…", "license": "CC-BY-SA-4.0", "modified": true }
```

Accepted licenses (checked in CI): `CC-BY-SA-4.0`, `CC-BY-4.0`, `CC0-1.0`.
Forbidden: ARASAAC, Sclera and any non-commercial (`NC`) symbol set, including as a model to redraw.

## Adding an element

1. Draw the SVG following the rules above.
2. Add it to `elements.json` with its `en` and `fr` labels and its source.
   For a verb or a noun with irregular forms, list them in `forms` so search finds them:
   `"forms": { "en": ["drank", "drunk"], "fr": ["boit", "bu"] }`.
3. Run `npm test`: it regenerates the library and checks these rules.

Drawings are published under CC BY-SA 4.0.
