// Draws people, actions and core words with the Parlomino character (see character.mjs).
// Like in the best-known AAC symbol sets, an action is shown by a person doing it:
// "drink" is a child bringing a cup to the mouth, not a cup alone.
// Writes elements/<prefix>/<name>.svg and elements.characters.json. Run: npm run draw
// Runs after import:openmoji: props (cup, spoon, book…) are reused from the library.
//
// Close-ups (`bust: true`) show the body coordinates x 18 to 82 only: keep props inside.
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { C, character, element, group, place, stroke } from "./character.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const prop = (id) => element(root, id);
const SOURCE = { name: "Parlomino", license: "CC-BY-SA-4.0" };
const LINE = 3.75;

const DRAWINGS = [];
const add = (id, en, fr, tags, forms, svg) => DRAWINGS.push({ id, en, fr, tags, forms, svg });

/** A full-body drawing enlarged to fill the frame, standing on its bottom edge. */
const standing = (svg, scale = 1.02) => group(svg, [50 - 50 * scale, 91 - 88.5 * scale], scale);

// ─── Shapes reused by several drawings ────────────────────────────────────────

const table = (y = 68) =>
  `<rect x="4" y="${y}" width="92" height="9" rx="2" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<path d="M14 ${y + 9} V94 M86 ${y + 9} V94" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`;

/** A cardboard box seen from the front, with its top and side visible. */
const box = (x, y, w, h) =>
  `<path d="M${x} ${y} L${x + 8} ${y - 8} H${x + w + 8} L${x + w} ${y} Z" fill="${C.brown}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  `<path d="M${x + w} ${y} L${x + w + 8} ${y - 8} V${y + h - 8} L${x + w} ${y + h} Z" fill="${C.brown}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>`;

/** A thick arrow with an ink outline, readable in every theme. */
const arrow = (d, color = C.blue) =>
  `<path d="${d}" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;

/** A question mark, used by question words. */
const question = (x, y, s = 1) =>
  `<g transform="translate(${x} ${y}) scale(${s})">` +
  arrow("M-11 -14 Q-11 -28 0 -28 Q12 -28 12 -16 Q12 -7 0 -1 V6") +
  `<circle cx="0" cy="20" r="6" fill="${C.blue}" stroke="${C.ink}" stroke-width="${LINE}"/></g>`;

// ─── People ─────────────────────────────────────────────────────────────────

add("person.child", ["child", "kid"], ["enfant"], ["person"], { en: ["children", "kids"], fr: ["enfants"] },
  standing(character({ outfit: { shirt: C.blue } })));

add("person.adult", ["adult"], ["adulte"], ["person"], { en: ["adults", "grown-up"], fr: ["adultes", "grand"] },
  standing(character({ body: "adult", outfit: { shirt: C.green } }), 0.98));

add("person.boy", ["boy"], ["garçon"], ["person"], { en: ["boys"], fr: ["garçons"] },
  standing(character({ outfit: { shirt: C.green } })));

add("person.girl", ["girl"], ["fille"], ["person"], { en: ["girls"], fr: ["filles"] },
  standing(character({ outfit: { shirt: C.orange, hair: "long" } })));

add("person.mother", ["mother", "mom", "mum"], ["maman", "mère"], ["family"], undefined,
  standing(character({ body: "adult", outfit: { shirt: C.red, hair: "long" } }), 0.98));

add("person.father", ["father", "dad"], ["papa", "père"], ["family"], undefined,
  standing(character({ body: "adult", outfit: { shirt: C.blue, beard: true } }), 0.98));

add("person.me", ["me", "I"], ["moi", "je"], ["core"], { en: ["my", "mine", "myself"], fr: ["mon", "ma", "mes", "m"] },
  character({ bust: true, outfit: { shirt: C.yellow } }) + stroke("M92 12 L74 31 M74 20 V31 H85", 6));

add("person.you", ["you"], ["toi", "tu"], ["core"], { en: ["your", "yours", "yourself"], fr: ["ton", "ta", "tes", "te", "t"] },
  group(character({ bust: true, outfit: { shirt: C.purple } }), [0, 16], 0.84) + place(prop("action.point"), [84, 58], 32));

add("person.friend", ["friend", "friends"], ["ami", "copain", "copine"], ["person"], { fr: ["amie", "amis", "copains", "copines"] },
  group(character({ outfit: { shirt: C.blue }, pose: { r: [73, 58] } }), [-12, 2], 1.02) +
  group(character({ outfit: { shirt: C.orange, hair: "long" }, pose: { l: [27, 58] } }), [26, 2], 1.02));

add("person.family", ["family"], ["famille"], ["family"], { fr: ["familles"] },
  group(character({ body: "adult", outfit: { shirt: C.red, hair: "long" } }), [-24, 4], 0.95) +
  group(character({ body: "adult", outfit: { shirt: C.blue, beard: true } }), [29, 4], 0.95) +
  group(character({ outfit: { shirt: C.yellow } }), [16, 30], 0.72));

// ─── Actions of the face and hands (close-ups) ──────────────────────────────

add("action.eat", ["eat"], ["manger"], ["meal"], { en: ["eats", "ate", "eaten", "eating"] },
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { l: [38, 52], r: [57, 34] },
    held: place(prop("object.bowl"), [36, 51], 30),
    front: place(prop("object.spoon"), [56, 30], 28, -40),
  }));

add("action.drink", ["drink"], ["boire"], ["meal"], { en: ["drinks", "drank", "drunk", "drinking"], fr: ["bois", "boit", "buvons", "buvez", "boivent", "bu", "buvait", "buvant"] },
  character({
    bust: true,
    look: { mouth: "none" },
    pose: { r: [60, 38] },
    front: place(prop("object.cup"), [56, 30], 36, -25),
  }));

add("action.brush-teeth", ["brush teeth"], ["se brosser les dents", "brosser les dents"], ["hygiene", "routine"], { fr: ["brosse", "brosser"] },
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { r: [66, 33] },
    front: place(prop("object.toothbrush"), [58, 29], 38, 45),
  }));

add("action.listen", ["listen", "hear"], ["écouter", "entendre"], ["core"], { en: ["heard"], fr: ["entends", "entend", "entendu"] },
  character({ bust: true, look: { look: [1.2, 0] }, pose: { r: [65, 22] } }) +
  stroke("M82 18 Q88 30 82 42 M88 11 Q95 30 88 49", 4));

add("action.look", ["look", "see", "watch"], ["regarder", "voir"], ["core"], { en: ["saw", "seen", "sees"], fr: ["vois", "voit", "voyons", "voient", "vu"] },
  character({ bust: true, look: { look: [1.6, 0], mouth: "neutral" } }) +
  `<path d="M66 31 L74 33" fill="none" stroke="${C.ink}" stroke-width="3.4" stroke-linecap="round" stroke-dasharray="3 4"/>` +
  place(prop("animal.bird"), [86, 38], 26));

add("action.talk", ["talk", "speak", "say"], ["parler", "dire"], ["core"], { en: ["said", "says"], fr: ["dis", "dit", "disons", "dites", "disent"] },
  character({ bust: true, look: { mouth: "open" }, pose: { r: [72, 48] } }) +
  stroke("M74 30 L86 23 M76 40 H90 M74 50 L86 57", 4));

add("action.sing", ["sing"], ["chanter"], ["music"], { en: ["sang", "sung", "sings"] },
  character({ bust: true, look: { mouth: "open", eyes: "closed" }, pose: { l: [30, 44], r: [70, 44] } }) +
  place(prop("object.music"), [86, 18], 26));

add("action.read", ["read"], ["lire"], ["school"], { en: ["reads", "reading"], fr: ["lis", "lit", "lisons", "lisez", "lisent", "lu"] },
  character({
    bust: true,
    look: { look: [0, 2], mouth: "neutral" },
    pose: { l: [35, 48], r: [65, 48] },
    held: place(prop("object.book"), [50, 47], 40),
  }));

add("action.phone", ["call", "phone"], ["téléphoner", "appeler"], ["screen"], { en: ["calls", "called", "calling"], fr: ["téléphone", "appelle"] },
  character({ bust: true, look: { mouth: "open" }, pose: { r: [64, 26] }, front: place(prop("object.phone"), [63, 22], 26, 15) }));

add("action.music", ["listen to music"], ["écouter de la musique"], ["music"], undefined,
  character({
    bust: true,
    look: { eyes: "closed" },
    front:
      `<path d="M36 22 Q36 4 50 4 Q64 4 64 22" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
      `<rect x="32" y="16" width="8" height="13" rx="3" fill="${C.red}" stroke="${C.ink}" stroke-width="2.6"/>` +
      `<rect x="60" y="16" width="8" height="13" rx="3" fill="${C.red}" stroke="${C.ink}" stroke-width="2.6"/>`,
  }) + place(prop("object.music"), [88, 22], 24));

add("action.medicine", ["take medicine"], ["prendre un médicament"], ["health"], undefined,
  character({
    bust: true,
    look: { mouth: "open" },
    pose: { l: [38, 54], r: [57, 34] },
    held: place(prop("object.cup"), [36, 52], 28),
    front: place(prop("object.medicine"), [55, 29], 18, -30),
  }));

add("action.cut", ["cut"], ["couper", "découper"], ["school"], { en: ["cuts", "cutting"], fr: ["coupe", "découpe"] },
  character({
    bust: true,
    look: { look: [0, 2], mouth: "neutral" },
    pose: { l: [38, 54], r: [60, 52] },
    held: `<path d="M26 46 H52 V62 H26 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>`,
    front: place(prop("object.scissors"), [60, 50], 30, -20),
  }));

add("action.paint", ["paint"], ["peindre"], ["school", "play"], { en: ["paints", "painting"], fr: ["peins", "peint"] },
  character({
    bust: true,
    pose: { l: [36, 54], r: [66, 40] },
    held: place(prop("object.paint"), [34, 54], 30),
    front: place(prop("object.paintbrush"), [68, 36], 26),
  }));

add("action.cook", ["cook"], ["cuisiner", "faire à manger"], ["meal"], { en: ["cooks", "cooking"], fr: ["cuisine", "cuisines"] },
  character({
    bust: true,
    look: { look: [0, 2] },
    pose: { l: [40, 56], r: [56, 48] },
    front: place(prop("object.soup"), [48, 53], 32) + place(prop("object.spoon"), [56, 44], 24, 20),
  }));

add("action.cry", ["cry"], ["pleurer"], ["feeling"], { en: ["cries", "cried", "crying"], fr: ["pleure", "pleures", "pleurent"] },
  character({ bust: true, look: { eyes: "closed", mouth: "sad" } }) +
  `<path d="M40 38 Q35 47 40 51 Q45 47 40 38 Z M60 38 Q55 47 60 51 Q65 47 60 38 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="2.4" stroke-linejoin="round"/>`);

add("action.laugh", ["laugh"], ["rire"], ["feeling"], { en: ["laughs", "laughed", "laughing"], fr: ["ris", "rit", "rigoler"] },
  character({ bust: true, look: { eyes: "happy", mouth: "laugh" }, pose: { l: [30, 52], r: [70, 52] } }) +
  stroke("M16 26 L9 20 M16 36 H7 M84 26 L91 20 M84 36 H93", 4));

add("action.want", ["want"], ["vouloir", "je veux"], ["core"], { en: ["wants", "wanted"], fr: ["veux", "veut", "voulons", "voulez", "veulent", "voulu"] },
  character({ bust: true, look: { look: [1.4, -1], mouth: "open" }, pose: { l: [62, 30], r: [70, 24] } }) +
  place(prop("object.apple"), [86, 16], 28));

add("idea.why", ["why"], ["pourquoi"], ["core", "question"], undefined,
  character({ bust: true, look: { look: [0, -1], mouth: "neutral" }, pose: { l: [28, 40], r: [72, 40] } }) +
  question(86, 32, 0.75));

add("idea.finished", ["finished", "all done"], ["fini", "terminé"], ["core"], { en: ["finish", "done", "end"], fr: ["finir", "finie", "terminer", "c'est fini"] },
  character({ bust: true, look: { mouth: "smile" }, pose: { l: [26, 56], r: [74, 56] } }) +
  `<path d="M28 80 H72 Q70 94 50 94 Q30 94 28 80 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>`);

add("action.open", ["open"], ["ouvrir"], ["core"], { fr: ["ouvre", "ouvres", "ouvrons", "ouvrez", "ouvrent", "ouvert", "ouverte"] },
  // A box whose lid (as wide as the box) is opened backwards, a teddy bear peeking out.
  `<path d="M30 44 L36 12 H94 L88 44 Z" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  `<path d="M18 56 L30 44 H88 L76 56 Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  place(prop("object.teddy"), [52, 46], 34) +
  `<path d="M76 56 L88 44 V82 L76 94 Z" fill="${C.brown}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  `<rect x="18" y="56" width="58" height="38" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  arrow("M12 40 V20 M6 26 L12 20 L18 26", C.green));

// ─── Whole-body actions ─────────────────────────────────────────────────────

add("action.play", ["play"], ["jouer"], ["play"], { en: ["plays", "playing"], fr: ["joue", "joues", "jouons", "jouent"] },
  standing(character({ pose: { l: [38, 50], r: [62, 50] }, held: place(prop("object.ball"), [50, 50], 34) })));

add("action.give", ["give"], ["donner"], ["core"], { en: ["gives", "gave", "given", "giving"] },
  group(character({ pose: { r: [74, 50] } }), [-10, 2], 1) + place(prop("object.gift"), [70, 44], 30) +
  stroke("M70 84 H94 M86 76 L94 84 L86 92", 5));

add("action.take", ["take", "get"], ["prendre", "attraper"], ["core"], { en: ["took", "taken", "takes", "got"], fr: ["prends", "prend", "prenons", "pris"] },
  group(character({ pose: { r: [74, 50] } }), [-10, 2], 1) + place(prop("object.apple"), [72, 44], 28) +
  stroke("M94 84 H70 M78 76 L70 84 L78 92", 5));

add("action.help", ["help"], ["aider", "aide"], ["core", "need"], undefined,
  group(character({ body: "adult", outfit: { shirt: C.green }, pose: { r: [75, 51] } }), [-8, 6], 0.95) +
  group(character({ outfit: { shirt: C.blue } }), [27, 22], 0.8));

add("action.wave", ["hello", "goodbye", "wave"], ["bonjour", "salut", "au revoir", "coucou"], ["core", "social"], { en: ["hi", "bye"] },
  character({ bust: true, pose: { r: [70, 22] } }) + stroke("M82 9 Q87 17 82 27 M88 6 Q94 17 88 31", 4));

add("action.go", ["go", "walk"], ["aller", "marcher"], ["core"], { en: ["goes", "went", "gone", "going", "walks", "walked"], fr: ["vais", "vas", "va", "allons", "allez", "vont", "allé", "allée", "marche"] },
  group(character({ pose: { l: [34, 58], r: [64, 50], lf: [36, 87], rf: [60, 86], bend: { ll: 1, rl: -1 } } }), [-10, 2], 1) +
  stroke("M68 72 H95 M86 63 L95 72 L86 81", 5));

add("action.run", ["run"], ["courir"], ["play"], { en: ["runs", "ran", "running"], fr: ["cours", "court", "courons", "courent", "couru"] },
  group(character({ pose: { l: [30, 46], r: [70, 54], lf: [30, 84], rf: [68, 80], bend: { ll: 1, rl: -1 } } }), [-4, 2], 1.05) +
  stroke("M8 40 H20 M7 52 H19 M9 64 H20", 4));

add("action.jump", ["jump"], ["sauter"], ["play"], { en: ["jumps", "jumped", "jumping"], fr: ["saute", "sautes", "sautons", "sautent"] },
  group(character({ pose: { l: [32, 18], r: [68, 18], lf: [41, 76], rf: [59, 76], bend: { ll: 1, rl: -1 } } }), [-2, -2], 1.04) +
  stroke("M32 88 H44 M56 88 H68 M40 94 H60", 3.75));

add("action.throw", ["throw"], ["lancer", "jeter"], ["play"], { en: ["throws", "threw", "thrown"], fr: ["lance", "lances", "jette"] },
  standing(character({ pose: { r: [72, 22] } })) + place(prop("object.ball"), [84, 14], 22) + stroke("M70 6 Q76 2 82 4 M64 14 Q68 8 74 8", 3));

add("action.dance", ["dance"], ["danser"], ["play", "music"], { en: ["dances", "danced", "dancing"], fr: ["danse", "danses", "dansons", "dansent"] },
  standing(character({ pose: { l: [30, 22], r: [72, 52], lf: [38, 86], rf: [64, 78] } })) +
  place(prop("object.music"), [86, 18], 24) + place(prop("object.music"), [14, 46], 18));

add("action.sit", ["sit"], ["s'asseoir", "assis"], ["core"], { en: ["sits", "sat", "sitting"], fr: ["assieds", "assied", "assise"] },
  standing(character({
    pose: { l: [38, 66], r: [62, 66], lf: [38, 88], rf: [62, 88], bend: { ll: 1, rl: -1 } },
    back:
      `<rect x="28" y="30" width="44" height="40" rx="4" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
      `<rect x="22" y="62" width="56" height="8" rx="3" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
      `<path d="M27 70 V89 M73 70 V89" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>`,
  }), 0.98));

add("action.wait", ["wait"], ["attendre"], ["core"], { en: ["waits", "waited", "waiting"], fr: ["attends", "attend", "attendu"] },
  group(character({ look: { mouth: "neutral" } }), [-18, 0], 1.04) + place(prop("object.hourglass"), [74, 56], 50));

add("action.dress", ["get dressed", "dress"], ["s'habiller", "habiller"], ["clothes", "routine"], { fr: ["habille", "habilles"] },
  // Smaller character, so that the T-shirt held above the head stays inside the frame.
  standing(character({ outfit: { shirt: C.yellow }, pose: { l: [37, 10], r: [63, 10] } }), 0.92) + place(prop("object.shirt"), [50, 16], 24));

add("action.clean", ["clean", "tidy up", "sweep"], ["nettoyer", "ranger", "balayer"], ["home"], { fr: ["nettoie", "range", "balaie"] },
  standing(character({ pose: { l: [58, 46], r: [62, 60] }, front: place(prop("object.broom"), [66, 58], 56, -20) })));

add("action.build", ["build"], ["construire"], ["play"], { en: ["builds", "built"], fr: ["construis", "construit"] },
  group(character({ pose: { r: [72, 40] }, look: { look: [1.2, 1] } }), [-12, 2], 1) +
  `<rect x="64" y="78" width="16" height="16" rx="2" fill="${C.red}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<rect x="80" y="78" width="16" height="16" rx="2" fill="${C.blue}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<rect x="72" y="62" width="16" height="16" rx="2" fill="${C.green}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<rect x="66" y="36" width="16" height="16" rx="2" fill="${C.yellow}" stroke="${C.ink}" stroke-width="${LINE}"/>`);

add("action.swim", ["swim"], ["nager"], ["play"], { en: ["swims", "swam", "swimming"], fr: ["nage", "nages", "nageons", "nagent"] },
  character({ bust: true, look: { mouth: "open" }, pose: { l: [26, 34], r: [66, 52] } }) +
  `<path d="M6 70 Q17 62 28 70 T50 70 T72 70 T94 70 V88 Q94 94 88 94 H12 Q6 94 6 88 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>`);

add("action.bath", ["take a bath", "bath"], ["prendre un bain", "bain"], ["hygiene", "routine"], undefined,
  group(character({ bust: true, look: { eyes: "happy" }, pose: { l: [30, 40], r: [70, 40] } }), [10, 4], 0.8) +
  // A full-width bathtub, foam on the water, kept inside the frame.
  `<path d="M4 64 H96 V78 Q96 92 82 92 H18 Q4 92 4 78 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  `<path d="M16 92 L14 95 M84 92 L86 95" fill="none" stroke="${C.ink}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M8 64 Q14 56 22 60 Q28 52 36 58 Q44 52 52 58 Q60 52 68 58 Q76 52 84 60 Q90 56 94 64 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>` +
  `<circle cx="20" cy="50" r="5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="82" cy="46" r="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/><circle cx="88" cy="54" r="3" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.4"/>`);

add("action.shower", ["take a shower", "shower"], ["prendre une douche", "douche"], ["hygiene", "routine"], undefined,
  group(character({ bust: true, look: { eyes: "closed" } }), [-6, 6], 0.94) +
  place(prop("object.shower"), [80, 14], 30) +
  `<path d="M70 32 Q67 38 70 40 Q73 38 70 32 Z M80 36 Q77 42 80 44 Q83 42 80 36 Z M62 40 Q59 46 62 48 Q65 46 62 40 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="2" stroke-linejoin="round"/>`);

// Washing hands: a real tap, water running onto two open hands, soap bubbles, a basin under them.
add("action.wash", ["wash hands", "wash"], ["se laver les mains", "laver"], ["hygiene", "routine"], { fr: ["lave", "laves", "lavons", "lavent"] },
  `<g transform="translate(5 4) scale(0.9)">` +
  `<path d="M6 14 H44 Q58 14 58 28 V34" fill="none" stroke="${C.ink}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<path d="M6 14 H44 Q58 14 58 28 V34" fill="none" stroke="${C.gray}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>` +
  `<rect x="24" y="2" width="14" height="8" rx="2" fill="${C.gray}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<path d="M54 40 Q51 50 57 56 Q63 50 60 40 Z" fill="${C.water}" stroke="${C.ink}" stroke-width="2.6" stroke-linejoin="round"/>` +
  `<path d="M8 82 H92 Q90 99 50 99 Q10 99 8 82 Z" fill="${C.paper}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  place(prop("body.hand"), [40, 66], 46, 35) + place(prop("body.hand"), [66, 66], 46, -35) +
  `<circle cx="22" cy="58" r="5" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="84" cy="56" r="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/><circle cx="88" cy="66" r="3" fill="${C.paper}" stroke="${C.ink}" stroke-width="2.2"/>` + "</g>");

// Sleep: a child in bed, head on the pillow, eyes closed.
const bed =
  `<rect x="6" y="30" width="12" height="62" rx="4" fill="${C.orange}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<path d="M90 64 V92" fill="none" stroke="${C.ink}" stroke-width="5" stroke-linecap="round"/>` +
  `<rect x="14" y="62" width="80" height="14" rx="4" fill="${C.paper}" stroke="${C.ink}" stroke-width="${LINE}"/>`;
const blanket = `<path d="M40 50 Q44 40 60 42 H90 Q96 42 96 50 V68 H40 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>`;

add("action.sleep", ["sleep"], ["dormir"], ["routine"], { en: ["sleeps", "slept", "sleeping", "asleep"], fr: ["dors", "dort", "dormons", "dorment", "dormi"] },
  bed +
  `<ellipse cx="30" cy="54" rx="13" ry="7" fill="${C.paper}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<circle cx="32" cy="45" r="11" fill="${C.skin}" stroke="${C.ink}" stroke-width="${LINE}"/>` +
  `<path d="M21 43 Q21 32 32 33 Q42 33 43 42 Q36 38 30 39 Q25 40 21 43 Z" fill="${C.hair}" stroke="${C.ink}" stroke-width="3" stroke-linejoin="round"/>` +
  `<path d="M28 47 Q30 49 32 47 M35 47 Q37 49 39 47" fill="none" stroke="${C.ink}" stroke-width="1.8" stroke-linecap="round"/>` +
  blanket +
  stroke("M56 8 H68 L56 22 H68 M74 22 H82 L74 32 H82", LINE));

add("action.wake-up", ["wake up", "get up"], ["se réveiller", "se lever"], ["routine"], { en: ["woke", "wakes", "waking"], fr: ["réveille", "lève", "réveillé"] },
  bed +
  group(character({ look: { eyes: "happy", mouth: "open" }, pose: { l: [30, 18], r: [70, 18] } }), [12, -2], 0.76) +
  `<path d="M20 52 H96 V68 H20 Z" fill="${C.blue}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  place(prop("idea.day"), [86, 14], 24));

// ─── Core words drawn as small scenes ───────────────────────────────────────

// Stop: a raised hand on a red disc. No text: the OpenMoji stop sign spells "STOP", unreadable for many users.
add("idea.stop", ["stop"], ["stop", "arrêter"], ["need"], { en: ["stops", "stopped", "stopping"] },
  `<circle cx="50" cy="50" r="42" fill="${C.red}" stroke="${C.ink}" stroke-width="${LINE}"/>` + place(prop("body.hand"), [50, 50], 64));

add("idea.what", ["what"], ["quoi", "qu'est-ce que"], ["core", "question"], undefined,
  question(30, 52) + place(prop("object.box"), [70, 56], 46));

add("idea.where", ["where"], ["où"], ["core", "question"], undefined,
  question(30, 52) + place(prop("place.map-pin"), [70, 52], 50));

add("idea.who", ["who"], ["qui"], ["core", "question"], undefined,
  question(30, 52) + place(prop("person.someone"), [70, 54], 50));

add("idea.when", ["when"], ["quand"], ["core", "question"], undefined,
  question(30, 52) + place(prop("object.clock"), [70, 54], 48));

add("idea.in", ["in", "inside"], ["dans", "dedans"], ["core", "position"], undefined,
  `<path d="M20 50 L30 40 H90 L80 50 Z" fill="${C.brown}" stroke="${C.ink}" stroke-width="${LINE}" stroke-linejoin="round"/>` +
  place(prop("object.ball"), [52, 48], 34) + box(20, 50, 60, 40));

add("idea.on", ["on", "on top"], ["sur", "dessus"], ["core", "position"], undefined,
  box(20, 56, 60, 36) + place(prop("object.ball"), [54, 30], 36));

add("idea.under", ["under", "below"], ["sous", "dessous"], ["core", "position"], undefined,
  table(34) + place(prop("object.ball"), [50, 78], 34));

add("idea.up", ["up"], ["en haut", "monter"], ["core", "position"], { fr: ["haut", "monte"] },
  arrow("M50 90 V14 M28 36 L50 14 L72 36"));

add("idea.down", ["down"], ["en bas", "descendre"], ["core", "position"], { fr: ["bas", "descends", "descend"] },
  arrow("M50 10 V86 M28 64 L50 86 L72 64"));

add("idea.more", ["more", "again"], ["encore", "plus"], ["core"], { en: ["more please"], fr: ["encore une fois", "redonne"] },
  place(prop("object.apple"), [14, 50], 26) + arrow("M30 50 H46 M39 43 L46 50 L39 57", C.green) +
  place(prop("object.apple"), [74, 34], 28) + place(prop("object.apple"), [62, 64], 28) + place(prop("object.apple"), [86, 64], 28));

add("idea.same", ["same"], ["pareil", "même"], ["core"], { fr: ["pareille", "pareils", "identique"] },
  place(prop("object.apple"), [20, 50], 36) + stroke("M42 42 H58 M42 58 H58", 6) + place(prop("object.apple"), [80, 50], 36));

add("idea.different", ["different"], ["différent"], ["core"], { fr: ["différente", "différents", "pas pareil"] },
  place(prop("object.apple"), [20, 50], 36) + stroke("M42 42 H58 M42 58 H58 M56 34 L44 66", 6) + place(prop("object.banana"), [80, 50], 36));

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
