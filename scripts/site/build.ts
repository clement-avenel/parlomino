// Builds the static documentation site into site/, one version per supported language:
// English at the root (site/index.html…), other languages in a folder (site/fr/index.html…).
// Run: npm run site, then open site/index.html. Deployed to GitHub Pages by .github/workflows/pages.yml.
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { compose, composePhrase, composePicto, search, validatePicto, type ComposeOptions } from "@parlomino/core";
import { REQUIRED_LANGUAGES, defaultLibrary } from "@parlomino/library";
import { CATEGORIES, MODIFIERS, type Modifier, type PhraseInput, type PictoInput } from "@parlomino/spec";
import { text, type Text } from "./i18n.ts";

const OUT = "site";
const REPO = "https://github.com/clement-avenel/parlomino";
const PAGES = ["index", "grammar", "catalog", "examples", "developers"] as const;
type Page = (typeof PAGES)[number];

// English first: it is the default language and lives at the root.
const LANGUAGES = ["en", ...REQUIRED_LANGUAGES.filter((l) => l !== "en")];
const dir = (lang: string) => (lang === "en" ? "" : `${lang}/`);
/** Relative path from a page of `from` to the root of the site. */
const root = (from: string) => (from === "en" ? "" : "../");
const href = (from: string, to: string, page: Page) => `${root(from)}${dir(to)}${page}.html`;

const languageName = (lang: string) => {
  const name = new Intl.DisplayNames([lang], { type: "language" }).of(lang) ?? lang;
  return name.charAt(0).toUpperCase() + name.slice(1);
};
const esc = (s: string) => s.replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);
const word = (labels: Record<string, string[]>, lang: string) => (labels[lang] ?? labels.en ?? [])[0] ?? "?";
const label = (id: string, lang: string) => word((defaultLibrary.get(id) ?? defaultLibrary.entry(id))!.labels, lang);
const modifierName = (m: Modifier, lang: string) => (MODIFIERS[m].labels as Record<string, string>)[lang] ?? MODIFIERS[m].labels.en;

// ─── Pictogram helpers ───────────────────────────────────────────────────────

function picto(input: PictoInput, lang: string, options: ComposeOptions = {}) {
  const r = composePicto(input, { ...options, lang });
  if (!r.ok) throw new Error(`${JSON.stringify(input)}: ${JSON.stringify(r.issues)}`);
  return r;
}

function phrase(input: PhraseInput, lang: string, options: ComposeOptions = {}) {
  const r = composePhrase(input, { ...options, lang });
  if (!r.ok) throw new Error(`${JSON.stringify(input)}: ${JSON.stringify(r.issues)}`);
  return r;
}

/** A library element drawn alone (frames are not pictograms by themselves). */
function raw(id: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${esc(id)}"><rect width="100" height="100" fill="#fff"/>${defaultLibrary.get(id)!.svg}</svg>`;
}

/** Writes an SVG file for download and returns its path relative to the page. */
function saveSvg(lang: string, name: string, svg: string): string {
  const path = `${dir(lang)}svg/${name}.svg`;
  writeFileSync(`${OUT}/${path}`, svg);
  return `svg/${name}.svg`;
}

const card = (svg: string, caption: string, extra = "") =>
  `<figure class="card">${svg}<figcaption>${caption}${extra}</figcaption></figure>`;

const equation = (parts: string[], result: string) =>
  `<div class="equation">${parts.join(`<span class="op" aria-hidden="true">+</span>`)}<span class="op" aria-hidden="true">=</span>${result}</div>`;

// Numbered diagram of the zones, using the engine's geometry (see @parlomino/core compose.ts).
const ZONE_ORDER = ["concept", "badge", "indicator", "negation", "frame"] as const;
const ZONE_DIAGRAM = (() => {
  const num = (n: number, x: number, y: number) =>
    `<circle cx="${x}" cy="${y}" r="6" fill="#1F2937"/><text x="${x}" y="${y + 2.6}" font-size="7.5" font-family="system-ui,sans-serif" font-weight="700" fill="#fff" text-anchor="middle">${n}</text>`;
  const dash = `fill="none" stroke="#6B7280" stroke-width="1" stroke-dasharray="3 2"`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 116 116" class="diagram" aria-hidden="true">
<rect x="0" y="0" width="100" height="100" rx="8" fill="#fff" stroke="#1F2937" stroke-width="1.5"/>
<rect x="14" y="16" width="72" height="72" rx="4" ${dash}/>
<circle cx="83" cy="17" r="15" ${dash}/><circle cx="17" cy="17" r="15" ${dash}/>
<path d="M18 20 L82 84" fill="none" stroke="#D62828" stroke-width="1.5" stroke-dasharray="4 3"/>
${num(1, 34, 72)}${num(2, 83, 17)}${num(3, 17, 17)}${num(4, 56, 58)}${num(5, 50, 100)}
</svg>`;
})();

const code = (src: string) => `<pre><code>${esc(src.trim())}</code></pre>`;

// ─── Pages ───────────────────────────────────────────────────────────────────

const HERO_PHRASE: PhraseInput = {
  phrase: [{ concept: "person.child" }, { concept: "action.eat", modifiers: ["negation"] }, { concept: "object.apple", modifiers: ["plural"] }],
  tense: "past",
};

function homePage(lang: string, t: Text): string {
  const s: string[] = [];
  s.push(`<section class="hero"><h1>${t.home.title}</h1><p class="lead">${t.home.lead}</p>`);
  s.push(`<figure class="hero-phrase">${phrase(HERO_PHRASE, lang).svg}<figcaption>${t.home.exampleCaption}</figcaption></figure></section>`);
  s.push(`<div class="cards">`);
  for (const c of t.home.cards) {
    s.push(`<a class="nav-card" href="${c.page}.html"><h2>${c.title}</h2><p>${c.text}</p></a>`);
  }
  s.push(`</div><h2>${t.home.principlesTitle}</h2><dl class="principles">`);
  for (const [title, body] of t.home.principles) s.push(`<div><dt>${title}</dt><dd>${body}</dd></div>`);
  s.push(`</dl>`);
  return s.join("\n");
}

function grammarPage(lang: string, t: Text): string {
  const g = t.grammar;
  const s: string[] = [`<h1>${g.title}</h1><p class="lead">${g.intro}</p>`];

  s.push(`<h2>${g.readPicto}</h2><p>${g.readPictoIntro}</p><div class="explain">${ZONE_DIAGRAM}<ol>`);
  for (const z of ZONE_ORDER) s.push(`<li>${g.zones[z]}</li>`);
  s.push(`</ol></div><p class="note">${g.oneThing}</p>`);

  s.push(`<h3>${g.examplesTitle}</h3><div class="row">`);
  for (const input of [
    { concept: "person.adult", badge: "idea.care" },
    { concept: "object.water", modifiers: ["very"] },
    { concept: "object.apple", modifiers: ["small"] },
    { concept: "action.sleep", modifiers: ["negation"] },
    { concept: "lex.mealtime" },
  ] satisfies PictoInput[]) {
    const r = picto(input, lang);
    s.push(card(r.svg, esc(r.label)));
  }
  s.push(`</div>`);

  s.push(`<h2>${g.combining}</h2><p>${g.combiningIntro}</p><div class="equations">`);
  for (const entry of defaultLibrary.lexicon) {
    const p = entry.picto;
    const parts = [
      ...(p.frame ? [card(raw(p.frame), label(p.frame, lang))] : []),
      card(picto({ concept: p.concept }, lang).svg, label(p.concept, lang)),
      ...(p.badge ? [card(picto({ concept: p.badge }, lang).svg, label(p.badge, lang))] : []),
    ];
    s.push(equation(parts, card(picto({ concept: entry.id }, lang).svg, `<b>${label(entry.id, lang)}</b>`)));
  }
  for (const m of ["plural", "big"] as const) {
    const r = picto({ concept: "object.ball", modifiers: [m] }, lang);
    s.push(equation(
      [card(picto({ concept: "object.ball" }, lang).svg, label("object.ball", lang)), `<figure class="card word">${modifierName(m, lang)}</figure>`],
      card(r.svg, `<b>${esc(r.label)}</b>`),
    ));
  }
  s.push(`</div>`);

  const example = phrase(
    { phrase: [{ concept: "person.child" }, { concept: "action.drink" }, { concept: "object.water" }], tense: "past", question: true },
    lang,
  );
  s.push(`<h2>${g.readPhrase}</h2><figure class="phrase">${example.svg}<div class="phrase-nums" aria-hidden="true"><span>1</span><span>2</span><span>3</span></div><figcaption>${esc(example.label)}</figcaption></figure><ol>`);
  for (const line of g.phraseLegend) s.push(`<li>${line}</li>`);
  s.push(`</ol><p>${g.possession}</p>`);
  const mine = phrase({ phrase: [{ concept: "person.me" }, { concept: "object.ball" }] }, lang);
  s.push(`<figure class="phrase small">${mine.svg}<figcaption>${esc(mine.label)}</figcaption></figure>`);
  s.push(`<p class="note">${g.learned}</p>`);
  return s.join("\n");
}

function catalogPage(lang: string, t: Text): string {
  const c = t.catalog;
  const s: string[] = [`<h1>${c.title}</h1><p class="lead">${c.intro}</p><p class="note">${c.attribution}</p>`];
  const downloadable = (name: string, svg: string, caption: string, id: string) => {
    const path = saveSvg(lang, name, svg);
    return card(svg, caption, `<code>${esc(id)}</code><a class="download" href="${path}" download>${c.download}</a>`);
  };

  s.push(`<h2>${c.concepts}</h2><p>${c.conceptsIntro}</p>`);
  for (const category of CATEGORIES) {
    const concepts = defaultLibrary.ofKind("concept").filter((e) => e.category === category);
    if (!concepts.length) continue;
    s.push(`<h3>${c.categories[category]}</h3><div class="grid">`);
    for (const e of concepts) s.push(downloadable(e.id, picto({ concept: e.id }, lang).svg, label(e.id, lang), e.id));
    s.push(`</div>`);
  }

  s.push(`<h2>${c.frames}</h2><p>${c.framesIntro}</p><div class="grid">`);
  for (const e of defaultLibrary.ofKind("frame")) s.push(downloadable(e.id, raw(e.id), label(e.id, lang), e.id));
  s.push(`</div>`);

  s.push(`<h2>${c.modifiers}</h2><p>${c.modifiersIntro}</p><div class="grid">`);
  for (const [m, def] of Object.entries(MODIFIERS) as [Modifier, (typeof MODIFIERS)[Modifier]][]) {
    const example = m === "negation" ? "action.sleep" : "object.ball";
    const r = picto({ concept: example, modifiers: [m] }, lang);
    s.push(card(r.svg, `<b>${modifierName(m, lang)}</b> · ${c.zoneNames[def.zone]}`, `<code>${m}</code>`));
  }
  s.push(`</div>`);

  const one = [{ concept: "action.sleep" }];
  s.push(`<h2>${c.phraseMarks}</h2><p>${c.phraseMarksIntro}</p><div class="row">`);
  for (const [input, caption, id] of [
    [{ phrase: one, tense: "past" }, c.past, `tense: "past"`],
    [{ phrase: one, tense: "future" }, c.future, `tense: "future"`],
    [{ phrase: one, question: true }, c.question, `question: true`],
  ] as [PhraseInput, string, string][]) {
    s.push(`<figure class="card wide">${phrase(input, lang).svg}<figcaption>${caption}<code>${esc(id)}</code></figcaption></figure>`);
  }
  s.push(`</div>`);

  s.push(`<h2>${c.lexicon}</h2><p>${c.lexiconIntro}</p><div class="grid">`);
  for (const e of defaultLibrary.lexicon) s.push(downloadable(e.id, picto({ concept: e.id }, lang).svg, label(e.id, lang), e.id));
  s.push(`</div>`);
  return s.join("\n");
}

const GALLERY_PICTOS: PictoInput[] = [
  { concept: "lex.doctor" },
  { concept: "lex.doctor", modifiers: ["plural"] },
  { concept: "lex.pupil" },
  { concept: "lex.kitchen" },
  { concept: "lex.bedroom" },
  { concept: "lex.mealtime" },
  { concept: "object.ball", modifiers: ["small"] },
  { concept: "object.apple", modifiers: ["very", "big"] },
  { concept: "action.sleep", modifiers: ["negation"] },
  { concept: "object.water", modifiers: ["little"] },
];
const GALLERY_PHRASES: PhraseInput[] = [
  HERO_PHRASE,
  { phrase: [{ concept: "person.me" }, { concept: "object.ball" }] },
  { phrase: [{ concept: "person.you" }, { concept: "object.ball", modifiers: ["small"] }] },
  { phrase: [{ concept: "action.drink" }, { concept: "object.water" }], question: true },
  { phrase: [{ concept: "lex.doctor" }, { concept: "action.sleep" }, { concept: "lex.bedroom" }], tense: "future" },
];

function examplesPage(lang: string, t: Text): string {
  const e = t.examples;
  const s: string[] = [`<h1>${e.title}</h1><p class="lead">${e.intro}</p>`];
  for (const [theme, options] of [["default", {}], ["high-contrast", { theme: "high-contrast", strokeScale: 1.5 }]] as const) {
    s.push(`<h2>${e.themes[theme]}</h2><h3>${e.pictos}</h3><div class="grid${theme === "high-contrast" ? " dark" : ""}">`);
    for (const p of GALLERY_PICTOS) {
      const r = picto(p, lang, options);
      s.push(card(r.svg, esc(r.label)));
    }
    s.push(`</div><h3>${e.phrases}</h3><div class="phrases${theme === "high-contrast" ? " dark" : ""}">`);
    for (const p of GALLERY_PHRASES) {
      const r = phrase(p, lang, options);
      s.push(`<figure class="card phrase">${r.svg}<figcaption>${esc(r.label)}</figcaption></figure>`);
    }
    s.push(`</div>`);
  }
  return s.join("\n");
}

function developersPage(_lang: string, t: Text): string {
  const d = t.developers;
  const shown = (v: unknown) => JSON.stringify(v, null, 0).replace(/,"/g, ', "').replace(/":/g, '": ');
  const doctor = compose({ concept: "lex.doctor", modifiers: ["plural"] });
  const typo = validatePicto({ concept: "object.aple" });
  const found = search("médecins", { lang: "fr" })[0];
  const s: string[] = [`<h1>${d.title}</h1><p class="lead">${d.intro}</p><p class="note">${d.status}</p>`];

  s.push(`<h2>${d.install}</h2>`, code(`
git clone ${REPO}.git
cd parlomino && npm install && npm run build
# then, in your project: npm install ../parlomino/packages/core`));

  s.push(`<h2>${d.compose}</h2><p>${d.composeText}</p>`, code(`
import { compose } from "@parlomino/core";

const result = compose({ concept: "lex.doctor", modifiers: ["plural"] });
result.ok;    // ${doctor.ok}
result.label; // ${doctor.ok ? JSON.stringify(doctor.label) : ""}
result.svg;   // <svg … role="img" aria-label="…">…</svg>`));
  if (doctor.ok) s.push(`<div class="row">${card(doctor.svg, esc(doctor.label))}</div>`);

  s.push(`<h2>${d.phrase}</h2><p>${d.phraseText}</p>`, code(`
const result = compose(${JSON.stringify(HERO_PHRASE, null, 2)});
result.svg;    // the strip
result.pictos; // [{ svg, label }, …] each pictogram on its own`));

  s.push(`<h2>${d.errors}</h2><p>${d.errorsText}</p>`, code(`
compose({ concept: "object.aple" });
// ${typo.ok ? "" : shown({ ok: false, issues: typo.issues })}`));

  s.push(`<h2>${d.search}</h2><p>${d.searchText}</p>`, code(`
import { search } from "@parlomino/core";

search("médecins", { lang: "fr" })[0].id; // ${JSON.stringify(found?.id)}
search("the kitchen")[0].id;               // ${JSON.stringify(search("the kitchen")[0]?.id)}`));

  s.push(`<h2>${d.options}</h2>`, code(`compose(input, { lang: "fr", theme: "high-contrast", strokeScale: 1.5, size: 200 });`));
  s.push(`<table><tbody>${d.optionsRows.map(([k, v]) => `<tr><th><code>${k}</code></th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`);

  s.push(`<h2>${d.format}</h2><p>${d.formatText}</p>`);
  s.push(`<table><tbody>${d.fieldsRows.map(([k, v]) => `<tr><th><code>${k}</code></th><td>${esc(v)}</td></tr>`).join("")}</tbody></table>`);
  s.push(code(`
import { jsonSchemas } from "@parlomino/spec";
const { picto, phrase } = jsonSchemas();`));

  s.push(`<h2>${d.more}</h2><ul>${d.moreLinks.map(([path, title]) => `<li><a href="${REPO}/blob/main/${path}">${title}</a></li>`).join("")}</ul>`);
  return s.join("\n");
}

const RENDER: Record<Page, (lang: string, t: Text) => string> = {
  index: homePage,
  grammar: grammarPage,
  catalog: catalogPage,
  examples: examplesPage,
  developers: developersPage,
};

// ─── Layout ──────────────────────────────────────────────────────────────────

function layout(lang: string, page: Page, body: string): string {
  const t = text(lang);
  const title = page === "index" ? `Parlomino — ${t.tagline}` : `${t.nav[page]} — Parlomino`;
  const nav = PAGES.map((p) => `<a href="${p}.html"${p === page ? ' aria-current="page"' : ""}>${t.nav[p]}</a>`).join("");
  const languages = LANGUAGES.map((l) =>
    l === lang
      ? `<span aria-current="true">${languageName(l)}</span>`
      : `<a href="${href(lang, l, page)}" hreflang="${l}" lang="${l}">${languageName(l)}</a>`,
  ).join("");
  const alternates = LANGUAGES.map((l) => `<link rel="alternate" hreflang="${l}" href="${href(lang, l, page)}">`).join("");

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(t.tagline)}">
${alternates}
<link rel="icon" href="${root(lang)}favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="${root(lang)}style.css">
</head>
<body>
<a class="skip" href="#main">${t.skip}</a>
<header>
  <a class="brand" href="index.html">${BRAND}<span>Parlomino</span></a>
  <nav aria-label="Parlomino">${nav}</nav>
  <nav class="languages" aria-label="${t.language}">${languages}</nav>
</header>
<p class="banner">${t.early}</p>
<main id="main">
${body}
</main>
<footer>
  <p>${t.footer}</p>
  <p><a href="${REPO}">${t.source}</a></p>
</footer>
</body>
</html>
`;
}

// Logo: two domino halves, a nod to pieces that snap together.
const BRAND = `<svg viewBox="0 0 40 24" width="40" height="24" aria-hidden="true"><rect x="1" y="1" width="18" height="22" rx="5" fill="#F2C14E" stroke="#1F2937" stroke-width="2"/><rect x="21" y="1" width="18" height="22" rx="5" fill="#7EC8E3" stroke="#1F2937" stroke-width="2"/><circle cx="10" cy="12" r="3" fill="#1F2937"/><circle cx="26" cy="8" r="2.5" fill="#1F2937"/><circle cx="34" cy="16" r="2.5" fill="#1F2937"/></svg>`;

const FAVICON = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect x="2" y="8" width="17" height="24" rx="5" fill="#F2C14E" stroke="#1F2937" stroke-width="2.5"/><rect x="21" y="8" width="17" height="24" rx="5" fill="#7EC8E3" stroke="#1F2937" stroke-width="2.5"/><circle cx="10.5" cy="20" r="3" fill="#1F2937"/><circle cx="29.5" cy="20" r="3" fill="#1F2937"/></svg>`;

const STYLE = `
:root{--ink:#1F2937;--muted:#4B5563;--line:#E5E7EB;--bg:#FAFAF7;--card:#fff;--accent:#2563EB;--note:#FEF3C7;--note-ink:#78350F;--code:#F3F4F6}
@media (prefers-color-scheme: dark){:root{--ink:#F3F4F6;--muted:#C5CAD3;--line:#374151;--bg:#111827;--card:#1F2937;--accent:#93C5FD;--note:#422006;--note-ink:#FDE68A;--code:#0B1220}}
*{box-sizing:border-box}
body{margin:0;font:17px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:var(--ink);background:var(--bg)}
a{color:var(--accent)}
.skip{position:absolute;left:-999px}.skip:focus{left:16px;top:8px;background:var(--card);padding:8px;z-index:1}
header{display:flex;flex-wrap:wrap;align-items:center;gap:8px 24px;padding:12px 16px;border-bottom:1px solid var(--line);max-width:1100px;margin:0 auto}
.brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:20px;color:var(--ink);text-decoration:none}
header nav{display:flex;flex-wrap:wrap;gap:4px 16px}
header nav a{color:var(--ink);text-decoration:none;padding:4px 0;border-bottom:2px solid transparent}
header nav a:hover{border-color:var(--line)}header nav a[aria-current]{border-color:var(--accent);font-weight:600}
.languages{margin-left:auto;font-size:15px}.languages span{font-weight:700}
.banner{max-width:1100px;margin:12px auto 0;padding:8px 16px;font-size:15px;color:var(--muted)}
main{max-width:1100px;margin:0 auto;padding:8px 16px 48px}
h1{font-size:clamp(30px,5vw,44px);line-height:1.15;margin:24px 0 8px}
h2{margin-top:48px;padding-bottom:4px;border-bottom:2px solid var(--line)}h3{margin:28px 0 8px;color:var(--muted)}
.lead{font-size:19px;max-width:760px;color:var(--muted)}
.note{background:var(--note);color:var(--note-ink);border-radius:10px;padding:10px 14px;max-width:860px}
figure{margin:0}svg{display:block;width:100%;height:auto}
.card{background:#fff;color:#1F2937;border:1px solid var(--line);border-radius:14px;padding:10px;text-align:center}
.card svg{border-radius:8px}
figcaption{font-size:14px;margin-top:6px;line-height:1.35}
figcaption code{display:block;font-size:12px;color:#6B7280;background:none}
.download{display:inline-block;margin-top:6px;font-size:13px;color:#1D4ED8}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
.row{display:flex;flex-wrap:wrap;gap:12px}.row .card{width:150px}.row .card.wide{width:auto;max-width:260px}
.dark .card{background:#000;color:#FFE600;border-color:#444}.dark figcaption code{color:#BFBFBF}
.phrases{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px}
.explain{display:flex;flex-wrap:wrap;gap:24px;align-items:center}.diagram{width:260px;flex:none}.explain ol{flex:1;min-width:260px}
.equations{display:grid;grid-template-columns:repeat(auto-fill,minmax(380px,1fr));column-gap:28px}
.equation{display:flex;align-items:center;gap:8px;margin:8px 0}.equation .card{width:110px;flex:none}
.equation .word{display:grid;place-items:center;height:132px;font-weight:700}
.op{font-size:26px;font-weight:700;color:var(--muted)}
figure.phrase,.hero-phrase{background:#fff;color:#1F2937;border:1px solid var(--line);border-radius:14px;padding:10px}
.dark figure.phrase{background:#000;color:#FFE600;border-color:#444}
figure.phrase{max-width:540px}figure.phrase.small{max-width:280px}
.phrase-nums{display:flex;justify-content:space-between;margin-top:4px}
.phrase-nums span{background:#1F2937;color:#fff;border-radius:50%;width:22px;height:22px;display:grid;place-items:center;font-size:13px;font-weight:700}
.hero{display:grid;gap:8px}.hero-phrase{max-width:620px;margin-top:12px}.hero-phrase figcaption{color:#4B5563}
.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:36px}
.nav-card{display:block;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px 20px;color:var(--ink);text-decoration:none}
.nav-card:hover{border-color:var(--accent)}.nav-card h2{margin:0 0 6px;padding:0;border:0;font-size:20px;color:var(--accent)}.nav-card p{margin:0;color:var(--muted)}
.principles{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:16px 28px}.principles dt{font-weight:700}.principles dd{margin:2px 0 0;color:var(--muted)}
pre{background:var(--code);border:1px solid var(--line);border-radius:10px;padding:14px;overflow-x:auto;font-size:14px;line-height:1.5}
code{font:14px/1.5 ui-monospace,SFMono-Regular,Menlo,monospace}
table{border-collapse:collapse;margin:8px 0;max-width:860px}th,td{text-align:left;padding:6px 12px 6px 0;border-bottom:1px solid var(--line);vertical-align:top}
footer{max-width:1100px;margin:0 auto;padding:24px 16px 48px;border-top:1px solid var(--line);font-size:14px;color:var(--muted)}
@media (max-width:560px){.equations{grid-template-columns:1fr}.equation{gap:4px}.equation .card{flex:1 1 0;min-width:0;width:auto;padding:6px}.equation .word{height:auto;align-self:stretch}.op{font-size:20px}.languages{margin-left:0}}
`;

// ─── Build ───────────────────────────────────────────────────────────────────

rmSync(OUT, { recursive: true, force: true });
for (const lang of LANGUAGES) mkdirSync(`${OUT}/${dir(lang)}svg`, { recursive: true });
writeFileSync(`${OUT}/style.css`, STYLE.trim() + "\n");
writeFileSync(`${OUT}/favicon.svg`, FAVICON);
writeFileSync(`${OUT}/.nojekyll`, "");

let count = 0;
for (const lang of LANGUAGES) {
  const t = text(lang);
  for (const page of PAGES) {
    writeFileSync(`${OUT}/${dir(lang)}${page}.html`, layout(lang, page, RENDER[page](lang, t)));
    count++;
  }
}
console.log(`site: ${count} pages in ${LANGUAGES.join(", ")} → ${OUT}/index.html`);
