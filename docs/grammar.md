# The Parlomino grammar

A **pictogram** represents one idea. A **phrase** is a sequence of pictograms.
The whole system fits in four building blocks and five zones.

## Four building blocks

| Block | Role | Example |
|---|---|---|
| **Concept** | The base drawing | `object.apple` → apple |
| **Badge** | A small concept in the top-right corner, creating a new meaning | `person.adult` + badge `idea.care` → doctor |
| **Frame** | Changes the category of the concept | frame `frame.place` around `action.eat` → kitchen |
| **Modifier** | A grammatical or semantic transformation | `plural`, `negation`, `very`, `small`… |

## Zones: one thing per zone

```
┌──────────────────────────┐
│ indicator         badge  │   indicator: very, little
│                          │   badge:     any concept
│         concept          │   concept:   plural (the concept is drawn twice)
│                          │
│                    size  │   size:      big, small
└──────────────────────────┘   overlay:   negation (a bar across the concept)
                               outline:   the frame (place, moment)
```

Two modifiers of the same zone cannot be combined (`very` and `little`, for instance):
the engine rejects it with a clear message. This guarantees a readable result, every time.

## Phrases

```json
{
  "phrase": [
    { "concept": "person.child" },
    { "concept": "action.eat", "modifiers": ["negation"] },
    { "concept": "object.apple", "modifiers": ["plural"] }
  ],
  "tense": "past",
  "question": false
}
```

"The child did not eat the apples": three pictograms side by side, preceded by a left arrow (past).
Tense (`past`, `future`) and question apply to the whole phrase; negation applies to the pictogram it crosses.

Possession ("my ball", "your cup") is not a modifier: like in most AAC systems, it is expressed
with separate pictograms in the phrase ("me", "you"), which are easier for children to understand.

## Lexicon

A useful combination gets a stable name in the lexicon (`packages/library/lexicon.json`):

```json
{ "id": "lex.doctor", "labels": { "en": ["doctor"], "fr": ["médecin", "docteur"] },
  "picto": { "concept": "person.adult", "badge": "idea.care" } }
```

It is used like a concept: `{ "concept": "lex.doctor", "modifiers": ["plural"] }` → doctors.
If a dedicated drawing is made later, the entry points to it and its id does not change.

## Errors help fixing

The engine does not throw: it returns the list of issues, with a suggestion when possible.

| Input | Issue | Suggestion |
|---|---|---|
| `object.aple` | unknown element | `object.apple` |
| `object.pomme` | unknown element | `object.apple` (found by its French label) |
| `person.doctor` | unknown element | `lex.doctor` |
| `frame.place` as a concept | wrong kind | — |
| `very` + `little` | same zone | — |
