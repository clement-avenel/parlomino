// Renders a catalog of every building block currently drawn, with a visual guide to the grammar,
// one version per supported language: examples/catalog.html (English) and examples/catalog.<lang>.html.
// Run: npm run examples, then open examples/catalog.html.
import { mkdirSync, writeFileSync } from "node:fs";
import { composePhrase, composePicto } from "@parlomino/core";
import { REQUIRED_LANGUAGES, defaultLibrary } from "@parlomino/library";
import { CATEGORIES, MODIFIERS, type Category, type Modifier, type PictoInput, type Zone } from "@parlomino/spec";

// ─── Interface text, per language (falls back to English) ────────────────────

const en = {
  title: "Parlomino — catalog",
  intro: "Every building block currently drawn, and how to read pictograms and phrases.",
  gallery: "Examples",
  readPicto: "How to read a pictogram",
  readPictoIntro: "Every pictogram is built the same way. Each element always has the same place, and each place holds one thing only.",
  zones: {
    concept: "<b>Concept</b>: the base drawing, in the middle. Drawn twice for a plural.",
    badge: "<b>Badge</b>: a small concept in the top-right corner, which changes the meaning (adult + care = doctor).",
    indicator: "<b>Intensity</b>, top left: very or a little.",
    size: "<b>Size</b>, bottom right: big or small.",
    negation: "<b>Negation</b>: a red bar across the concept.",
    frame: "<b>Frame</b>: the outline changes the category (place, moment).",
  },
  oneThing: "One thing per zone: two modifiers of the same zone cannot be combined.",
  readPhrase: "How to read a phrase",
  phraseLegend: [
    "<b>Tense</b>: an arrow to the left means past, to the right means future. No arrow means present.",
    "<b>Pictograms</b>, read from left to right, one per word or idea.",
    "<b>Question mark</b>: the whole phrase is a question.",
  ],
  combining: "Building blocks in action",
  concepts: "Concepts",
  conceptsIntro: "The base drawings. Any concept can also be used as a badge.",
  categories: { person: "People", action: "Actions", object: "Objects", place: "Places", idea: "Ideas" } as Record<Category, string>,
  frames: "Frames",
  framesIntro: "A frame changes the category of the concept drawn inside.",
  modifiers: "Modifiers",
  modifiersIntro: "Shown here on an example. Each modifier always has the same place.",
  zoneNames: { concept: "the concept itself", overlay: "over the concept", indicator: "top left", size: "bottom right" } as Record<Zone, string>,
  phraseMarks: "Phrase marks",
  phraseMarksIntro: "They apply to the whole phrase.",
  past: "past",
  future: "future",
  question: "question",
  lexicon: "Lexicon",
  lexiconIntro: "Named combinations, used like a concept: their name stays the same even if their drawing changes.",
};
type Text = typeof en;

const fr: Text = {
  title: "Parlomino — catalogue",
  intro: "Toutes les briques dessinées à ce jour, et comment lire les pictos et les phrases.",
  gallery: "Exemples",
  readPicto: "Comment lire un picto",
  readPictoIntro: "Tous les pictos sont construits de la même façon. Chaque élément a toujours la même place, et chaque place ne contient qu'une seule chose.",
  zones: {
    concept: "<b>Concept</b> : le dessin de base, au centre. Dessiné deux fois pour le pluriel.",
    badge: "<b>Badge</b> : un petit concept en haut à droite, qui change le sens (adulte + soin = médecin).",
    indicator: "<b>Intensité</b>, en haut à gauche : très ou un peu.",
    size: "<b>Taille</b>, en bas à droite : grand ou petit.",
    negation: "<b>Négation</b> : une barre rouge en travers du concept.",
    frame: "<b>Cadre</b> : le contour change la catégorie (lieu, moment).",
  },
  oneThing: "Une seule chose par zone : deux modificateurs de la même zone ne peuvent pas être combinés.",
  readPhrase: "Comment lire une phrase",
  phraseLegend: [
    "<b>Temps</b> : une flèche vers la gauche indique le passé, vers la droite le futur. Pas de flèche : le présent.",
    "<b>Les pictos</b>, lus de gauche à droite, un par mot ou par idée.",
    "<b>Point d'interrogation</b> : toute la phrase est une question.",
  ],
  combining: "Les briques en action",
  concepts: "Concepts",
  conceptsIntro: "Les dessins de base. Chaque concept peut aussi servir de badge.",
  categories: { person: "Personnes", action: "Actions", object: "Objets", place: "Lieux", idea: "Idées" },
  frames: "Cadres",
  framesIntro: "Un cadre change la catégorie du concept dessiné à l'intérieur.",
  modifiers: "Modificateurs",
  modifiersIntro: "Montrés ici sur un exemple. Chaque modificateur a toujours la même place.",
  zoneNames: { concept: "le concept lui-même", overlay: "par-dessus le concept", indicator: "en haut à gauche", size: "en bas à droite" },
  phraseMarks: "Marques de phrase",
  phraseMarksIntro: "Elles s'appliquent à toute la phrase.",
  past: "passé",
  future: "futur",
  question: "question",
  lexicon: "Lexique",
  lexiconIntro: "Des combinaisons nommées, utilisées comme un concept : leur nom reste le même, même si leur dessin change.",
};

const TEXTS: Record<string, Text> = { en, fr };

// ─── Helpers ─────────────────────────────────────────────────────────────────

const languages = ["en", ...REQUIRED_LANGUAGES.filter((l) => l !== "en")];
const page = (base: string, lang: string) => (lang === "en" ? `${base}.html` : `${base}.${lang}.html`);
const languageName = (lang: string) => {
  const name = new Intl.DisplayNames([lang], { type: "language" }).of(lang) ?? lang;
  return name.charAt(0).toUpperCase() + name.slice(1);
};
const modifierName = (m: Modifier, lang: string) => (MODIFIERS[m].labels as Record<string, string>)[lang] ?? MODIFIERS[m].labels.en;
const word = (labels: Record<string, string[]>, lang: string) => (labels[lang] ?? labels.en ?? [])[0] ?? "?";

function picto(input: PictoInput, lang: string): string {
  const r = composePicto(input, { lang });
  if (!r.ok) throw new Error(JSON.stringify(r.issues));
  return r.svg;
}

/** A library element drawn alone (frames and marks are not pictograms by themselves). */
function raw(id: string): string {
  const e = defaultLibrary.get(id)!;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${id}"><rect width="100" height="100" fill="#fff"/>${e.svg}</svg>`;
}

const card = (svg: string, caption: string, id?: string) =>
  `<figure>${svg}<figcaption>${caption}${id ? `<code>${id}</code>` : ""}</figcaption></figure>`;

const equation = (parts: string[], result: string) =>
  `<div class="equation">${parts.join(`<span class="op">+</span>`)}<span class="op">=</span>${result}</div>`;

// Numbered diagram of the zones, using the engine's geometry (see @parlomino/core compose.ts).
const ZONE_ORDER = ["concept", "badge", "indicator", "size", "negation", "frame"] as const;
const zoneDiagram = (() => {
  const num = (n: number, x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="6" fill="#1F2937"/><text x="${x}" y="${y + 2.6}" font-size="7.5" font-family="system-ui" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>`;
  const dash = `fill="none" stroke="#6B7280" stroke-width="1" stroke-dasharray="3 2"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 116 116" class="diagram" role="img" aria-hidden="true">
<rect x="0" y="0" width="100" height="100" rx="8" fill="#fff" stroke="#1F2937" stroke-width="1.5"/>
<rect x="14" y="16" width="72" height="72" rx="4" ${dash}/>
<circle cx="83" cy="17" r="15" ${dash}/><circle cx="17" cy="17" r="15" ${dash}/><circle cx="83" cy="83" r="15" ${dash}/>
<path d="M18 20 L82 84" fill="none" stroke="#D62828" stroke-width="1.5" stroke-dasharray="4 3"/>
${num(1, 34, 72)}${num(2, 83, 17)}${num(3, 17, 17)}${num(4, 83, 83)}${num(5, 56, 58)}${num(6, 50, 100)}
</svg>`;
})();

// ─── Page ────────────────────────────────────────────────────────────────────

function render(lang: string): string {
  const t = TEXTS[lang] ?? en;
  const L = (id: string) => word((defaultLibrary.get(id) ?? defaultLibrary.entry(id))!.labels, lang);
  const s: string[] = [];

  // How to read a pictogram
  s.push(`<h2>${t.readPicto}</h2><p>${t.readPictoIntro}</p><div class="explain">${zoneDiagram}<ol>`);
  for (const z of ZONE_ORDER) s.push(`<li>${t.zones[z]}</li>`);
  s.push(`</ol></div><p class="rule">${t.oneThing}</p><div class="row">`);
  for (const input of [
    { concept: "person.adult", badge: "idea.care", modifiers: ["very", "big"] },
    { concept: "lex.mealtime", modifiers: ["negation"] },
    { concept: "object.apple", modifiers: ["plural", "small"] },
  ] satisfies PictoInput[]) {
    const r = composePicto(input, { lang });
    if (r.ok) s.push(card(r.svg, r.label));
  }
  s.push(`</div>`);

  // How to read a phrase
  const phrase = composePhrase(
    { phrase: [{ concept: "person.child" }, { concept: "action.drink" }, { concept: "object.water" }], tense: "past", question: true },
    { lang },
  );
  if (!phrase.ok) throw new Error(JSON.stringify(phrase.issues));
  s.push(`<h2>${t.readPhrase}</h2><figure class="phrase">${phrase.svg}<div class="phrase-nums"><span>1</span><span>2</span><span>3</span></div><figcaption>${phrase.label}</figcaption></figure><ol>`);
  for (const line of t.phraseLegend) s.push(`<li>${line}</li>`);
  s.push(`</ol>`);

  // Building blocks in action
  s.push(`<h2>${t.combining}</h2><div class="equations">`);
  for (const entry of defaultLibrary.lexicon) {
    const p = entry.picto;
    const parts = [
      ...(p.frame ? [card(raw(p.frame), L(p.frame))] : []),
      card(picto({ concept: p.concept }, lang), L(p.concept)),
      ...(p.badge ? [card(picto({ concept: p.badge }, lang), L(p.badge))] : []),
    ];
    s.push(equation(parts, card(picto({ concept: entry.id }, lang), L(entry.id))));
  }
  for (const m of ["plural", "big"] as const) {
    const r = composePicto({ concept: "object.ball", modifiers: [m] }, { lang });
    if (!r.ok) continue;
    const sign = defaultLibrary.get(`mark.${m}`) ? card(raw(`mark.${m}`), modifierName(m, lang)) : `<figure class="text">${modifierName(m, lang)}</figure>`;
    s.push(equation([card(picto({ concept: "object.ball" }, lang), L("object.ball")), sign], card(r.svg, r.label)));
  }

  s.push(`</div>`);

  // Concepts, by category
  s.push(`<h2>${t.concepts}</h2><p>${t.conceptsIntro}</p>`);
  for (const category of CATEGORIES) {
    const concepts = defaultLibrary.ofKind("concept").filter((e) => e.category === category);
    if (!concepts.length) continue;
    s.push(`<h3>${t.categories[category]}</h3><div class="grid">`);
    for (const e of concepts) s.push(card(picto({ concept: e.id }, lang), L(e.id), e.id));
    s.push(`</div>`);
  }

  // Frames
  s.push(`<h2>${t.frames}</h2><p>${t.framesIntro}</p><div class="grid">`);
  for (const e of defaultLibrary.ofKind("frame")) s.push(card(raw(e.id), L(e.id), e.id));
  s.push(`</div>`);

  // Modifiers
  s.push(`<h2>${t.modifiers}</h2><p>${t.modifiersIntro}</p><div class="grid">`);
  for (const [m, def] of Object.entries(MODIFIERS) as [Modifier, (typeof MODIFIERS)[Modifier]][]) {
    const example = m === "negation" ? "action.sleep" : "object.ball";
    s.push(card(picto({ concept: example, modifiers: [m] }, lang), `<b>${modifierName(m, lang)}</b> · ${t.zoneNames[def.zone]}`, m));
  }
  s.push(`</div>`);

  // Phrase marks
  const mark = (input: Parameters<typeof composePhrase>[0], caption: string, id: string) => {
    const r = composePhrase(input, { lang });
    return r.ok ? `<figure class="wide">${r.svg}<figcaption>${caption}<code>${id}</code></figcaption></figure>` : "";
  };
  const one = [{ concept: "action.sleep" }];
  s.push(`<h2>${t.phraseMarks}</h2><p>${t.phraseMarksIntro}</p><div class="row">`);
  s.push(mark({ phrase: one, tense: "past" }, t.past, `tense: "past"`));
  s.push(mark({ phrase: one, tense: "future" }, t.future, `tense: "future"`));
  s.push(mark({ phrase: one, question: true }, t.question, `question: true`));
  s.push(`</div>`);

  // Lexicon
  s.push(`<h2>${t.lexicon}</h2><p>${t.lexiconIntro}</p><div class="grid">`);
  for (const e of defaultLibrary.lexicon) s.push(card(picto({ concept: e.id }, lang), L(e.id), e.id));
  s.push(`</div>`);

  const nav = [
    ...languages.map((l) => (l === lang ? `<strong>${languageName(l)}</strong>` : `<a href="${page("catalog", l)}" hreflang="${l}">${languageName(l)}</a>`)),
    `<a href="${page("index", lang)}">${t.gallery}</a>`,
  ].join(" · ");

  return `<!doctype html><html lang="${lang}"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${t.title}</title>
<style>
body{font:15px/1.5 system-ui;margin:24px auto;max-width:960px;padding:0 16px;color:#1F2937}
h2{margin-top:40px;border-bottom:2px solid #E5E7EB;padding-bottom:4px}h3{margin:20px 0 8px;color:#4B5563}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:12px}
.row{display:flex;flex-wrap:wrap;gap:12px}.row figure{width:150px}.row figure.wide{width:auto;max-width:240px}
figure{margin:0;border:1px solid #E5E7EB;border-radius:12px;padding:8px;background:#fff}
svg{width:100%;height:auto;display:block;border-radius:6px}
figcaption{font-size:13px;margin-top:6px;text-align:center}code{display:block;font-size:11px;color:#6B7280}
.explain{display:flex;flex-wrap:wrap;gap:24px;align-items:center}.diagram{width:260px;flex:none}.explain ol{flex:1;min-width:260px}
.rule{background:#FEF3C7;border-radius:8px;padding:8px 12px}
.equations{display:grid;grid-template-columns:repeat(auto-fill,minmax(400px,1fr));column-gap:24px}
.equation{display:flex;align-items:center;gap:8px;margin:8px 0;flex-wrap:wrap}.equation figure{width:110px}
.equation figure.text{display:grid;place-items:center;height:110px;font-weight:700}
.op{font-size:28px;font-weight:700;color:#6B7280}
figure.phrase{max-width:520px}.phrase-nums{display:flex;justify-content:space-around;font-weight:700;margin-top:4px}
.phrase-nums span{background:#1F2937;color:#fff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font-size:13px}
.phrase-nums span:nth-child(1){margin-right:auto}.phrase-nums span:nth-child(3){margin-left:auto}
</style>
<h1>${t.title}</h1><nav>${nav}</nav><p>${t.intro}</p>${s.join("\n")}`;
}

mkdirSync("examples", { recursive: true });
for (const lang of languages) writeFileSync(`examples/${page("catalog", lang)}`, render(lang));
console.log(`catalog: ${languages.map((l) => `examples/${page("catalog", l)}`).join(", ")}`);
