// Interface text of the documentation site, per language. Missing languages fall back to English.
import type { Category, Zone } from "@parlomino/spec";

const en = {
  tagline: "An open, composable pictogram language for augmentative and alternative communication (AAC).",
  nav: { index: "Home", grammar: "How to read", catalog: "Catalog", examples: "Examples", developers: "Developers" },
  language: "Language",
  skip: "Skip to content",
  early: "Early version: the drawings are first drafts, being tested with therapists and families.",
  footer:
    'Code under <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache-2.0</a>. Pictograms under <a href="https://creativecommons.org/licenses/by-sa/4.0/">CC BY-SA 4.0</a>: free to use, share and adapt, including commercially, with attribution.',
  source: "Source code on GitHub",

  home: {
    title: "Pictograms that snap together",
    lead: "Parlomino is a free pictogram language for people who communicate with pictures. A few simple pieces combine, like dominoes, into an unlimited vocabulary, always drawn in the same, easy-to-read way.",
    exampleCaption: "“The child did not eat the apples”: one pictogram per idea, read from left to right.",
    cards: [
      { page: "grammar", title: "Read pictograms", text: "Four building blocks and five zones: everything you need to read and build pictograms." },
      { page: "catalog", title: "Browse the catalog", text: "Every pictogram drawn so far, to look at, print or download." },
      { page: "developers", title: "Use it in your code", text: "A TypeScript engine that turns a few lines of JSON into accessible SVG pictograms." },
    ],
    principlesTitle: "Principles",
    principles: [
      ["Simple for children", "Concrete drawings, few strokes, the same place for each element. Checked automatically for every drawing."],
      ["Open", "Free to use, share and adapt, including in commercial products. The language will remain open and complete."],
      ["Accessible", "High-contrast theme, thicker outlines, an accessible label in every pictogram."],
      ["International", "Drawings contain no text. Labels exist per language, starting with English and French."],
      ["Not a method", "Parlomino is a pictographic code and tools, designed to serve existing AAC approaches, not to replace them."],
    ],
  },

  grammar: {
    title: "How to read Parlomino",
    intro: "Every pictogram is built the same way. Once you know the five zones, you can read, and build, any pictogram.",
    readPicto: "Reading a pictogram",
    readPictoIntro: "Each element always has the same place, and each place holds one thing only.",
    zones: {
      concept: "<b>Concept</b>: the base drawing, in the middle. Drawn twice for a plural; next to a dashed copy of itself for big or small.",
      badge: "<b>Badge</b>: a small concept in the top-right corner, which changes the meaning (adult + care = doctor).",
      indicator: "<b>Intensity</b>, top left: very or a little.",
      negation: "<b>Negation</b>: a red bar across the concept.",
      frame: "<b>Frame</b>: the outline changes the category (place, moment).",
    },
    oneThing: "One thing per zone: two modifiers of the same zone cannot be combined.",
    examplesTitle: "One notion at a time",
    combining: "Building blocks in action",
    combiningIntro: "Badges, frames and modifiers create new meanings from the same few drawings.",
    readPhrase: "Reading a phrase",
    phraseLegend: [
      "<b>Tense</b>: an arrow to the left means past, to the right means future. No arrow means present.",
      "<b>Pictograms</b>, read from left to right, one per word or idea.",
      "<b>Question mark</b>: the whole phrase is a question.",
    ],
    possession: "Possession is said with a separate pictogram, like in most AAC systems: <i>my ball</i> = <i>me</i> + <i>ball</i>.",
    learned: "Concepts are meant to be understood at a glance. Modifiers (very, a little, big, small…) and badges are conventions: like in every AAC system, they are learned with a few examples.",
  },

  catalog: {
    title: "Catalog",
    intro: "Every building block drawn so far. Each pictogram can be downloaded as SVG.",
    attribution: "When you share or print these pictograms, please credit: “Parlomino pictograms (CC BY-SA 4.0)”.",
    download: "Download SVG",
    concepts: "Concepts",
    conceptsIntro: "The base drawings. Any concept can also be used as a badge.",
    categories: { person: "People", action: "Actions", object: "Objects", place: "Places", idea: "Ideas" } as Record<Category, string>,
    frames: "Frames",
    framesIntro: "A frame changes the category of the concept drawn inside.",
    modifiers: "Modifiers",
    modifiersIntro: "Shown here on an example. Each modifier always has the same place.",
    zoneNames: { concept: "the concept itself", overlay: "over the concept", indicator: "top left" } as Record<Zone, string>,
    phraseMarks: "Phrase marks",
    phraseMarksIntro: "They apply to the whole phrase.",
    past: "past",
    future: "future",
    question: "question",
    lexicon: "Lexicon",
    lexiconIntro: "Named combinations, used like a concept: their name stays the same even if their drawing changes.",
  },

  examples: {
    title: "Examples",
    intro: "Pictograms and phrases generated by the engine, in the default theme and in the high-contrast theme for people with low vision.",
    pictos: "Pictograms",
    phrases: "Phrases",
    themes: { default: "Default theme", "high-contrast": "High-contrast theme" } as Record<string, string>,
  },

  developers: {
    title: "Use Parlomino in your code",
    intro: "The engine is a small TypeScript library, with no DOM and no file access: it runs in browsers, Node, mobile apps and other stacks.",
    status: "The packages are not published on npm yet. Until then, use them from the GitHub repository.",
    install: "Install",
    compose: "Compose a pictogram",
    composeText: "Describe a pictogram in JSON, get an accessible SVG and its label.",
    phrase: "Compose a phrase",
    phraseText: "A phrase is a list of pictograms, with a tense and a question mark for the whole phrase. You get the strip, and each pictogram on its own.",
    errors: "Errors suggest a fix",
    errorsText: "The engine never throws on invalid input: it returns the issues, with a suggestion when it can. This makes it easy to use from a form, an API or an LLM.",
    search: "Search",
    searchText: "Search understands what people type: accents, case, articles, plurals and conjugations.",
    options: "Options",
    optionsRows: [
      ["lang", "Language of the labels (default: en)."],
      ["theme", "\"default\" or \"high-contrast\", or your own theme."],
      ["strokeScale", "Multiplies stroke widths, for low vision or small sizes."],
      ["size", "Rendered size in pixels."],
    ],
    format: "Format",
    formatText: "A pictogram has four fields. The JSON Schemas are exported by the spec package, for APIs and LLM tools.",
    fieldsRows: [
      ["concept", "A concept (person.child) or a lexicon entry (lex.doctor). Required."],
      ["badge", "A concept drawn small in the top-right corner."],
      ["frame", "A frame around the concept: frame.place, frame.moment."],
      ["modifiers", "plural, negation, very, little, big, small. One per zone."],
    ],
    more: "Going further",
    moreLinks: [
      ["docs/grammar.md", "The grammar, in one page"],
      ["docs/design-guidelines.md", "Design guidelines, to draw new pictograms"],
    ],
  },
};

export type Text = typeof en;

const fr: Text = {
  tagline: "Un langage de pictogrammes ouvert et composable, pour la communication alternative et améliorée (CAA).",
  nav: { index: "Accueil", grammar: "Comment lire", catalog: "Catalogue", examples: "Exemples", developers: "Développeurs" },
  language: "Langue",
  skip: "Aller au contenu",
  early: "Version préliminaire : les dessins sont des premières versions, en cours de test avec des thérapeutes et des familles.",
  footer:
    'Code sous licence <a href="https://www.apache.org/licenses/LICENSE-2.0">Apache-2.0</a>. Pictogrammes sous licence <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.fr">CC BY-SA 4.0</a> : libres d\'utilisation, de partage et d\'adaptation, y compris commerciale, avec attribution.',
  source: "Code source sur GitHub",

  home: {
    title: "Des pictos qui s'assemblent",
    lead: "Parlomino est un langage de pictogrammes libre, pour les personnes qui communiquent avec des images. Quelques pièces simples s'assemblent, comme des dominos, en un vocabulaire illimité, toujours dessiné de la même façon, facile à lire.",
    exampleCaption: "« L'enfant n'a pas mangé les pommes » : un picto par idée, lu de gauche à droite.",
    cards: [
      { page: "grammar", title: "Lire les pictos", text: "Quatre briques et cinq zones : tout ce qu'il faut pour lire et construire des pictos." },
      { page: "catalog", title: "Parcourir le catalogue", text: "Tous les pictos dessinés à ce jour, à consulter, imprimer ou télécharger." },
      { page: "developers", title: "L'utiliser dans votre code", text: "Un moteur TypeScript qui transforme quelques lignes de JSON en pictos SVG accessibles." },
    ],
    principlesTitle: "Principes",
    principles: [
      ["Simple pour les enfants", "Des dessins concrets, peu de traits, la même place pour chaque élément. Vérifié automatiquement pour chaque dessin."],
      ["Libre", "Libre d'utilisation, de partage et d'adaptation, y compris dans des produits commerciaux. Le langage restera libre et complet."],
      ["Accessible", "Thème fort contraste, contours épaissis, un libellé accessible dans chaque picto."],
      ["International", "Les dessins ne contiennent aucun texte. Les libellés existent par langue, à commencer par l'anglais et le français."],
      ["Pas une méthode", "Parlomino est un code pictographique et des outils, au service des approches de CAA existantes, pas pour les remplacer."],
    ],
  },

  grammar: {
    title: "Comment lire Parlomino",
    intro: "Tous les pictos sont construits de la même façon. Une fois les cinq zones connues, on peut lire, et construire, n'importe quel picto.",
    readPicto: "Lire un picto",
    readPictoIntro: "Chaque élément a toujours la même place, et chaque place ne contient qu'une seule chose.",
    zones: {
      concept: "<b>Concept</b> : le dessin de base, au centre. Dessiné deux fois pour le pluriel ; à côté d'une copie en pointillés de lui-même pour grand ou petit.",
      badge: "<b>Badge</b> : un petit concept en haut à droite, qui change le sens (adulte + soin = médecin).",
      indicator: "<b>Intensité</b>, en haut à gauche : très ou un peu.",
      negation: "<b>Négation</b> : une barre rouge en travers du concept.",
      frame: "<b>Cadre</b> : le contour change la catégorie (lieu, moment).",
    },
    oneThing: "Une seule chose par zone : deux modificateurs de la même zone ne peuvent pas être combinés.",
    examplesTitle: "Une notion à la fois",
    combining: "Les briques en action",
    combiningIntro: "Les badges, les cadres et les modificateurs créent de nouveaux sens à partir des mêmes dessins.",
    readPhrase: "Lire une phrase",
    phraseLegend: [
      "<b>Temps</b> : une flèche vers la gauche indique le passé, vers la droite le futur. Pas de flèche : le présent.",
      "<b>Les pictos</b>, lus de gauche à droite, un par mot ou par idée.",
      "<b>Point d'interrogation</b> : toute la phrase est une question.",
    ],
    possession: "La possession se dit avec un picto séparé, comme dans la plupart des systèmes de CAA : <i>mon ballon</i> = <i>moi</i> + <i>ballon</i>.",
    learned: "Les concepts doivent se comprendre au premier coup d'œil. Les modificateurs (très, un peu, grand, petit…) et les badges sont des conventions : comme dans tous les systèmes de CAA, ils s'apprennent avec quelques exemples.",
  },

  catalog: {
    title: "Catalogue",
    intro: "Toutes les briques dessinées à ce jour. Chaque picto peut être téléchargé en SVG.",
    attribution: "Si vous partagez ou imprimez ces pictos, merci de mentionner : « Pictogrammes Parlomino (CC BY-SA 4.0) ».",
    download: "Télécharger le SVG",
    concepts: "Concepts",
    conceptsIntro: "Les dessins de base. Chaque concept peut aussi servir de badge.",
    categories: { person: "Personnes", action: "Actions", object: "Objets", place: "Lieux", idea: "Idées" },
    frames: "Cadres",
    framesIntro: "Un cadre change la catégorie du concept dessiné à l'intérieur.",
    modifiers: "Modificateurs",
    modifiersIntro: "Montrés ici sur un exemple. Chaque modificateur a toujours la même place.",
    zoneNames: { concept: "le concept lui-même", overlay: "par-dessus le concept", indicator: "en haut à gauche" },
    phraseMarks: "Marques de phrase",
    phraseMarksIntro: "Elles s'appliquent à toute la phrase.",
    past: "passé",
    future: "futur",
    question: "question",
    lexicon: "Lexique",
    lexiconIntro: "Des combinaisons nommées, utilisées comme un concept : leur nom reste le même, même si leur dessin change.",
  },

  examples: {
    title: "Exemples",
    intro: "Des pictos et des phrases générés par le moteur, dans le thème par défaut et dans le thème fort contraste, pour les personnes malvoyantes.",
    pictos: "Pictos",
    phrases: "Phrases",
    themes: { default: "Thème par défaut", "high-contrast": "Thème fort contraste" },
  },

  developers: {
    title: "Utiliser Parlomino dans votre code",
    intro: "Le moteur est une petite bibliothèque TypeScript, sans DOM ni accès aux fichiers : il fonctionne dans un navigateur, sous Node, dans une app mobile ou dans d'autres langages.",
    status: "Les paquets ne sont pas encore publiés sur npm. En attendant, utilisez-les depuis le dépôt GitHub.",
    install: "Installation",
    compose: "Composer un picto",
    composeText: "Décrivez un picto en JSON, et obtenez un SVG accessible et son libellé.",
    phrase: "Composer une phrase",
    phraseText: "Une phrase est une liste de pictos, avec un temps et un point d'interrogation pour toute la phrase. Vous obtenez la bande complète, et chaque picto séparément.",
    errors: "Les erreurs proposent une correction",
    errorsText: "Le moteur ne lève jamais d'exception sur une saisie invalide : il renvoie les problèmes, avec une suggestion quand c'est possible. C'est pratique depuis un formulaire, une API ou un LLM.",
    search: "Recherche",
    searchText: "La recherche comprend ce que les gens tapent : accents, majuscules, articles, pluriels et conjugaisons.",
    options: "Options",
    optionsRows: [
      ["lang", "Langue des libellés (par défaut : en)."],
      ["theme", "\"default\" ou \"high-contrast\", ou votre propre thème."],
      ["strokeScale", "Multiplie l'épaisseur des traits, pour la basse vision ou les petites tailles."],
      ["size", "Taille d'affichage en pixels."],
    ],
    format: "Format",
    formatText: "Un picto a quatre champs. Les JSON Schemas sont exportés par le paquet spec, pour les API et les outils de LLM.",
    fieldsRows: [
      ["concept", "Un concept (person.child) ou une entrée du lexique (lex.doctor). Obligatoire."],
      ["badge", "Un concept dessiné en petit en haut à droite."],
      ["frame", "Un cadre autour du concept : frame.place, frame.moment."],
      ["modifiers", "plural, negation, very, little, big, small. Un par zone."],
    ],
    more: "Pour aller plus loin",
    moreLinks: [
      ["docs/grammar.md", "La grammaire, en une page (en anglais)"],
      ["docs/design-guidelines.md", "La charte graphique, pour dessiner de nouveaux pictos (en anglais)"],
    ],
  },
};

const TEXTS: Record<string, Text> = { en, fr };

export function text(lang: string): Text {
  return TEXTS[lang] ?? en;
}
