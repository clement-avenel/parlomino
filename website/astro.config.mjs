// @ts-check
import { fileURLToPath } from "node:url";
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const REPO = "https://github.com/clement-avenel/parlomino";
// Use the engine from source, like the tests do: no build step needed before the site.
const pkg = (name) => fileURLToPath(new URL(`../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  site: "https://clement-avenel.github.io",
  base: "/parlomino",
  vite: {
    resolve: {
      alias: {
        "@parlomino/spec": pkg("spec"),
        "@parlomino/library": pkg("library"),
        "@parlomino/core": pkg("core"),
      },
    },
  },
  integrations: [
    starlight({
      title: "Parlomino",
      description: "An open, composable pictogram language for augmentative and alternative communication (AAC).",
      logo: { src: "./src/assets/logo.svg" },
      favicon: "/favicon.svg",
      defaultLocale: "root",
      locales: {
        root: { label: "English", lang: "en" },
        fr: { label: "Français", lang: "fr" },
      },
      social: [{ icon: "github", label: "GitHub", href: REPO }],
      editLink: { baseUrl: `${REPO}/edit/main/website/` },
      customCss: [
        "@fontsource/atkinson-hyperlegible-next/400.css",
        "@fontsource/atkinson-hyperlegible-next/700.css",
        "./src/styles/theme.css",
      ],
      sidebar: [
        {
          label: "Learn",
          translations: { fr: "Apprendre" },
          items: [{ slug: "reading" }],
        },
        {
          label: "Reference",
          translations: { fr: "Référence" },
          items: [{ slug: "catalog" }, { slug: "examples" }],
        },
        {
          label: "Developers",
          translations: { fr: "Développeurs" },
          items: [{ slug: "developers/quick-start" }, { slug: "developers/reference" }],
        },
        {
          label: "Project",
          translations: { fr: "Projet" },
          items: [{ slug: "about" }, { slug: "credits" }],
        },
      ],
    }),
  ],
});
