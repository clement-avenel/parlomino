// Draws people and actions with the Parlomino character (see character.mjs).
// Like in the best-known AAC symbol sets, an action is shown by a person doing it:
// "drink" is a child bringing a cup to the mouth, not a cup alone.
// Writes elements/<prefix>/<name>.svg and elements.characters.json. Run: npm run draw:characters
// Run after import:openmoji: some props (cup, spoon, book…) are reused from the library.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { C, anchors, character, element, group, place, stroke } from "./character.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prop = (id) => element(root, id);
const A = anchors("child");
const SOURCE = { name: "Parlomino", license: "CC-BY-SA-4.0" };

/** [id, English labels, French labels, tags, forms, drawing] */
const DRAWINGS = [];
const add = (id, en, fr, tags, forms, svg) => DRAWINGS.push({ id, en, fr, tags, forms, svg });

// ─── People ─────────────────────────────────────────────────────────────────

add("person.child", ["child", "kid"], ["enfant"], ["person"], { en: ["children", "kids"], fr: ["enfants"] },
  character({ body: "child", outfit: { shirt: C.blue } }));

add("person.adult", ["adult"], ["adulte"], ["person"], { en: ["adults", "grown-up"], fr: ["adultes", "grand"] },
  character({ body: "adult", outfit: { shirt: C.green } }));

add("person.boy", ["boy"], ["garçon"], ["person"], { en: ["boys"], fr: ["garçons"] },
  character({ body: "child", outfit: { shirt: C.green } }));

add("person.girl", ["girl"], ["fille"], ["person"], { en: ["girls"], fr: ["filles"] },
  character({ body: "child", outfit: { shirt: C.orange, hair: "long" } }));

add("person.mother", ["mother", "mom", "mum"], ["maman", "mère"], ["family"], undefined,
  character({ body: "adult", outfit: { shirt: C.red, hair: "long" } }));

add("person.father", ["father", "dad"], ["papa", "père"], ["family"], undefined,
  character({ body: "adult", outfit: { shirt: C.blue, beard: true } }));

add("person.me", ["me", "I"], ["moi", "je"], ["core"], { en: ["my", "mine", "myself"], fr: ["mon", "ma", "mes", "m"] },
  character({
    bust: true,
    outfit: { shirt: C.yellow },
  }) + stroke("M94 18 L72 40 M72 28 V40 H84", 5));

add("person.you", ["you"], ["toi", "tu"], ["core"], { en: ["your", "yours", "yourself"], fr: ["ton", "ta", "tes", "te", "t"] },
  group(character({ bust: true, outfit: { shirt: C.purple } }), [-16, 0], 1) +
  place(prop("action.point"), [82, 56], 34));

add("person.friend", ["friend", "friends"], ["ami", "copain", "copine"], ["person"], { fr: ["amie", "amis", "copains", "copines"] },
  group(character({ body: "child", outfit: { shirt: C.blue }, pose: { r: [73, 58] } }), [-10, 22], 0.82) +
  group(character({ body: "child", outfit: { shirt: C.orange, hair: "long" }, pose: { l: [27, 58] } }), [28, 22], 0.82));

add("person.family", ["family"], ["famille"], ["family"], { fr: ["familles"] },
  group(character({ body: "adult", outfit: { shirt: C.red, hair: "long" } }), [-20, 10], 0.85) +
  group(character({ body: "adult", outfit: { shirt: C.blue, beard: true } }), [32, 10], 0.85) +
  group(character({ body: "child", outfit: { shirt: C.yellow } }), [19, 38], 0.62));

// ─── Actions ────────────────────────────────────────────────────────────────

add("action.eat", ["eat"], ["manger"], ["meal"], { en: ["eats", "ate", "eaten", "eating"] },
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { l: [40, 54], r: [56, 33] },
    held: place(prop("object.bowl"), [38, 56], 30),
    front: place(prop("object.spoon"), [56, 30], 22, -40),
  }));

add("action.drink", ["drink"], ["boire"], ["meal"], { en: ["drinks", "drank", "drunk", "drinking"], fr: ["bois", "boit", "buvons", "buvez", "boivent", "bu", "buvait", "buvant"] },
  character({
    bust: true,
    look: { mouth: "none" },
    pose: { r: [59, 36] },
    front: place(prop("object.cup"), [55, 30], 28, -25),
  }));

add("action.brush-teeth", ["brush teeth"], ["se brosser les dents", "brosser les dents"], ["hygiene", "routine"], { fr: ["brosse", "brosser"] },
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { r: [64, 34] },
    front: place(prop("object.toothbrush"), [56, 30], 30, 45),
  }));

add("action.listen", ["listen", "hear"], ["écouter", "entendre"], ["core"], { en: ["heard"], fr: ["entends", "entend", "entendu"] },
  character({
    bust: true,
    look: { look: [1.2, 0] },
    pose: { r: [65, 22] },
  }) + stroke("M76 12 Q82 22 76 32 M83 6 Q92 22 83 38"));

add("action.look", ["look", "see", "watch"], ["regarder", "voir"], ["core"], { en: ["saw", "seen", "sees"], fr: ["vois", "voit", "voyons", "voient", "vu"] },
  character({ bust: true, look: { look: [1.6, 0], mouth: "neutral" } }) +
  `<path d="M62 26 L72 30" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="3 4"/>` +
  place(prop("animal.bird"), [84, 36], 34));

add("action.talk", ["talk", "speak", "say"], ["parler", "dire"], ["core"], { en: ["said", "says"], fr: ["dis", "dit", "disons", "dites", "disent"] },
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { r: [70, 44] },
  }) + stroke("M68 22 L80 16 M70 29 H84 M68 36 L80 42"));

add("action.sing", ["sing"], ["chanter"], ["music"], { en: ["sang", "sung", "sings"] },
  character({
    bust: true,
    look: { mouth: "open", eyes: "closed" },
    pose: { l: [28, 42], r: [72, 42] },
  }) + place(prop("object.music"), [82, 16], 26));

add("action.read", ["read"], ["lire"], ["school"], { en: ["reads", "reading"], fr: ["lis", "lit", "lisons", "lisez", "lisent", "lu"] },
  character({
    bust: true,
    look: { look: [0, 2], mouth: "neutral" },
    pose: { l: [37, 52], r: [63, 52] },
    held: place(prop("object.book"), [50, 52], 38),
  }));

add("action.write", ["write"], ["écrire"], ["school"], { en: ["wrote", "written", "writes"], fr: ["écris", "écrit", "écrivons", "écrivent"] },
  character({
    look: { look: [0, 2], mouth: "neutral" },
    pose: { r: [60, 66] },
    front:
      `<rect x="4" y="68" width="92" height="9" rx="2" fill="${C.orange}" stroke="${C.ink}" stroke-width="3.4"/>` +
      `<path d="M14 77 V98 M86 77 V98" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M30 62 L66 60 L68 69 L28 70 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>` +
      stroke("M36 66 Q40 63 44 66 T52 66", 2) +
      place(prop("object.pencil"), [64, 58], 20, -10),
  }));

add("action.draw", ["draw", "paint"], ["dessiner", "peindre"], ["school", "play"], { en: ["drew", "drawn", "draws", "drawing"], fr: ["dessin"] },
  character({
    look: { look: [0, 2] },
    pose: { r: [62, 64] },
    front:
      `<rect x="4" y="68" width="92" height="9" rx="2" fill="${C.orange}" stroke="${C.ink}" stroke-width="3.4"/>` +
      `<path d="M14 77 V98 M86 77 V98" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
      `<path d="M26 58 H70 V70 H26 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>` +
      `<circle cx="38" cy="64" r="4" fill="${C.yellow}" stroke="${C.ink}" stroke-width="1.6"/>` +
      `<path d="M46 67 L52 61 L58 67 Z" fill="${C.green}" stroke="${C.ink}" stroke-width="1.6" stroke-linejoin="round"/>` +
      place(prop("object.crayon"), [66, 56], 20, -10),
  }));

add("action.play", ["play"], ["jouer"], ["play"], { en: ["plays", "playing"], fr: ["joue", "joues", "jouons", "jouent"] },
  character({
    pose: { l: [38, 50], r: [62, 50] },
    held: place(prop("object.ball"), [50, 50], 30),
  }));

add("action.give", ["give"], ["donner"], ["core"], { en: ["gives", "gave", "given", "giving"] },
  group(character({ pose: { r: [74, 50] }, held: "" }), [-10, 0], 1) +
  place(prop("object.gift"), [74, 44], 24) +
  stroke("M70 82 H94 M86 74 L94 82 L86 90", 4.5));

add("action.take", ["take", "get"], ["prendre", "attraper"], ["core"], { en: ["took", "taken", "takes", "got"], fr: ["prends", "prend", "prenons", "pris"] },
  group(character({ pose: { r: [74, 50] } }), [-10, 0], 1) +
  place(prop("object.apple"), [76, 44], 22) +
  stroke("M94 82 H70 M78 74 L70 82 L78 90", 4.5));

add("action.help", ["help"], ["aider", "aide"], ["core", "need"], undefined,
  group(character({ body: "adult", outfit: { shirt: C.green }, pose: { r: [75, 51] } }), [-9, 13.5], 0.9) +
  group(character({ body: "child", outfit: { shirt: C.blue } }), [28.5, 28.4], 0.75));

add("action.wave", ["hello", "goodbye", "wave"], ["bonjour", "salut", "au revoir", "coucou"], ["core", "social"], { en: ["hi", "bye"] },
  character({ bust: true, pose: { r: [70, 22] } }) + stroke("M84 6 Q90 14 84 24 M91 2 Q99 14 91 28"));

add("action.go", ["go", "walk"], ["aller", "marcher"], ["core"], { en: ["goes", "went", "gone", "going", "walks", "walked"], fr: ["vais", "vas", "va", "allons", "allez", "vont", "allé", "allée", "marche"] },
  group(character({ pose: { l: [34, 58], r: [64, 50], lf: [36, 87], rf: [60, 86], bend: { ll: 1, rl: -1 } } }), [-10, 0], 1) +
  stroke("M66 70 H94 M85 61 L94 70 L85 79", 5));

add("action.jump", ["jump"], ["sauter"], ["play"], { en: ["jumps", "jumped", "jumping"], fr: ["saute", "sautes", "sautons", "sautent"] },
  group(character({ pose: { l: [32, 18], r: [68, 18], lf: [41, 76], rf: [59, 76], bend: { ll: 1, rl: -1 } } }), [0, -4], 1) +
  stroke("M34 90 H44 M56 90 H66 M40 96 H60", 3));

add("action.dance", ["dance"], ["danser"], ["play", "music"], { en: ["dances", "danced", "dancing"], fr: ["danse", "danses", "dansons", "dansent"] },
  character({ pose: { l: [30, 22], r: [72, 52], lf: [38, 86], rf: [64, 78] } }) +
  place(prop("object.music"), [82, 18], 22) + place(prop("object.music"), [16, 40], 16));

add("action.sit", ["sit"], ["s'asseoir", "assis"], ["core"], { en: ["sits", "sat", "sitting"], fr: ["assieds", "assied", "assise"] },
  group(
    character({
      pose: { l: [38, 66], r: [62, 66], lf: [38, 88], rf: [62, 88], bend: { ll: 1, rl: -1 } },
      back:
        `<rect x="28" y="30" width="44" height="40" rx="4" fill="${C.orange}" stroke="${C.ink}" stroke-width="3.4"/>` +
        `<rect x="22" y="62" width="56" height="8" rx="3" fill="${C.orange}" stroke="${C.ink}" stroke-width="3.4"/>` +
        `<path d="M27 70 V96 M73 70 V96" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`,
    }),
    [0, 0],
    1,
  ));

add("action.wait", ["wait"], ["attendre"], ["core"], { en: ["waits", "waited", "waiting"], fr: ["attends", "attend", "attendu"] },
  group(character({ look: { mouth: "neutral" } }), [-16, 0], 1) + place(prop("idea.wait"), [76, 56], 48));

add("action.dress", ["get dressed", "dress"], ["s'habiller", "habiller"], ["clothes", "routine"], { fr: ["habille", "habilles"] },
  character({ pose: { l: [34, 12], r: [66, 12] }, front: place(prop("object.shirt"), [50, 8], 30) }));

// Sleep: a child in bed, head on the pillow, eyes closed.
add("action.sleep", ["sleep"], ["dormir"], ["routine"], { en: ["sleeps", "slept", "sleeping", "asleep"], fr: ["dors", "dort", "dormons", "dorment", "dormi"] },
  `<rect x="6" y="30" width="12" height="62" rx="4" fill="${C.orange}" stroke="${C.ink}" stroke-width="3.4"/>` +
  `<path d="M90 64 V92" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
  `<rect x="14" y="62" width="80" height="14" rx="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="3.4"/>` +
  `<ellipse cx="30" cy="54" rx="13" ry="7" fill="${C.paper}" stroke="${C.ink}" stroke-width="3.4"/>` +
  `<circle cx="32" cy="45" r="11" fill="${C.skin}" stroke="${C.ink}" stroke-width="3.4"/>` +
  `<path d="M21 43 Q21 32 32 33 Q42 33 43 42 Q36 38 30 39 Q25 40 21 43 Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
  `<path d="M28 47 Q30 49 32 47 M35 47 Q37 49 39 47" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>` +
  `<path d="M40 50 Q44 40 60 42 H90 Q96 42 96 50 V68 H40 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="3.4" stroke-linejoin="round"/>` +
  stroke("M56 8 H68 L56 22 H68 M74 22 H82 L74 32 H82", 3.4));

// ─── Write ──────────────────────────────────────────────────────────────────

const manifest = [];
for (const { id, en, fr, tags, forms, svg } of DRAWINGS) {
  const [prefix, name] = id.split(".");
  mkdirSync(join(root, "elements", prefix), { recursive: true });
  writeFileSync(
    join(root, "elements", prefix, `${name}.svg`),
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">\n  <!-- Generated by scripts/draw-characters.mjs: edit the pose there, not this file. -->\n  ${svg}\n</svg>\n`,
  );
  manifest.push({ id, kind: "concept", category: prefix, labels: { en, fr }, ...(forms && { forms }), tags, source: SOURCE });
}
writeFileSync(join(root, "elements.characters.json"), JSON.stringify(manifest, null, 2) + "\n");
console.log(`characters: ${manifest.length} drawings`);
