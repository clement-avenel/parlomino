// Shared helpers between the site components: every pictogram on the site is composed
// by the engine at build time, never drawn or copied by hand.
import { composePhrase, composePicto, type ComposeOptions, type Credit } from "@parlomino/core";
import { REQUIRED_LANGUAGES, defaultLibrary } from "@parlomino/library";
import { MODIFIERS, type Modifier, type PhraseInput, type PictoInput } from "@parlomino/spec";

export const REPO = "https://github.com/clement-avenel/parlomino";
export const LANGUAGES: readonly string[] = REQUIRED_LANGUAGES;

/** Language of the page being rendered, set by Starlight on every docs page. */
export function pageLang(locals: unknown): string {
  return (locals as { starlightRoute?: { lang?: string } }).starlightRoute?.lang ?? "en";
}

export function picto(input: PictoInput, lang: string, options: ComposeOptions = {}) {
  const r = composePicto(input, { ...options, lang });
  if (!r.ok) throw new Error(`Invalid pictogram ${JSON.stringify(input)}: ${JSON.stringify(r.issues)}`);
  return r;
}

export function phrase(input: PhraseInput, lang: string, options: ComposeOptions = {}) {
  const r = composePhrase(input, { ...options, lang });
  if (!r.ok) throw new Error(`Invalid phrase ${JSON.stringify(input)}: ${JSON.stringify(r.issues)}`);
  return r;
}

/** A library element drawn alone: frames are not pictograms by themselves. */
export function rawElement(id: string): string {
  const element = defaultLibrary.get(id);
  if (!element) throw new Error(`Unknown element ${id}`);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="${id}"><rect width="100" height="100" fill="#fff"/>${element.svg}</svg>`;
}

export function label(id: string, lang: string): string {
  const labels = (defaultLibrary.get(id) ?? defaultLibrary.entry(id))?.labels;
  return (labels?.[lang] ?? labels?.en ?? [id])[0]!;
}

export function modifierName(m: Modifier, lang: string): string {
  return (MODIFIERS[m].labels as Record<string, string>)[lang] ?? MODIFIERS[m].labels.en;
}

/** Every downloadable SVG: concepts, frames and lexicon entries. */
export function downloadableIds(): string[] {
  return [
    ...defaultLibrary.ofKind("concept").map((e) => e.id),
    ...defaultLibrary.ofKind("frame").map((e) => e.id),
    ...defaultLibrary.lexicon.map((e) => e.id),
  ];
}

export function downloadSvg(id: string, lang: string): string {
  const element = defaultLibrary.get(id);
  const svg = element?.kind === "frame" ? rawElement(id) : picto({ concept: id }, lang).svg;
  const credits: Credit[] = element?.kind === "frame" ? [{ id, source: element.source }] : picto({ concept: id }, lang).credits;
  // The credit travels with the file: CC BY-SA 4.0 requires attribution wherever the drawing is shared.
  return svg.replace(/^(<svg[^>]*>)/, `$1<!-- ${attribution(credits).replace(/--/g, "-")} -->`);
}

export const SITE = "https://clement-avenel.github.io/parlomino/";
export const OPENMOJI_CREDIT = "All emojis designed by OpenMoji – the open-source emoji and icon project. License: CC BY-SA 4.0";

/** Plain-text attribution for a set of drawings, as required by CC BY-SA 4.0. */
export function attribution(credits: Credit[]): string {
  const adapted = credits.filter((c) => c.source.name !== "Parlomino");
  const parts = [`Parlomino pictograms (${SITE}), CC BY-SA 4.0 (https://creativecommons.org/licenses/by-sa/4.0/).`];
  for (const c of adapted) {
    parts.push(`"${c.id}" adapted from ${c.source.name}${c.source.author ? ` (author: ${c.source.author})` : ""}, ${c.source.url ?? ""}, ${c.source.license}; colors and outlines modified.`);
  }
  if (adapted.some((c) => c.source.name === "OpenMoji")) parts.push(`${OPENMOJI_CREDIT}.`);
  return parts.join(" ");
}

export function downloadHref(id: string, lang: string): string {
  return `${import.meta.env.BASE_URL.replace(/\/$/, "")}/svg/${lang}/${id}.svg`;
}

/** Small interface strings used inside components (page text lives in the MDX content). */
const UI: Record<string, Record<string, string>> = {
  en: { download: "Download SVG", several: "several", big: "big" },
  fr: { download: "Télécharger le SVG", several: "plusieurs", big: "grand" },
};
export function ui(lang: string, key: string): string {
  return UI[lang]?.[key] ?? UI.en![key] ?? key;
}
