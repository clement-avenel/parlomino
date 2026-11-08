// Builds the published package into dist/:
// - index.js and index.d.ts: the ES module, with its types
// - parlomino.global.js: everything in one file, exposing a `Parlomino` global, for hosts of any language
//   that embed a JavaScript engine
// Then checks both: the module in Node, the global file in an empty context (no Node, no DOM, no console).
import { execFileSync } from "node:child_process";
import { copyFileSync, cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import vm from "node:vm";
import { build } from "esbuild";

const pkg = join(dirname(fileURLToPath(import.meta.url)), "..");
const root = join(pkg, "..", "..");
const out = join(pkg, "dist");
const { version } = JSON.parse(readFileSync(join(pkg, "package.json"), "utf8"));

// The drawings and the type declarations come from the internal packages.
execFileSync("node", [join(root, "packages/library/scripts/generate.mjs")], { stdio: "inherit" });
execFileSync(join(root, "node_modules/.bin/tsc"), ["-b", join(root, "packages/core")], { stdio: "inherit" });

rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });

const shared = {
  entryPoints: [join(pkg, "src/index.ts")],
  bundle: true,
  platform: "neutral",
  target: "es2022",
  mainFields: ["module", "main"],
  conditions: ["source"],
  define: { __PARLOMINO_VERSION__: JSON.stringify(version) },
  legalComments: "none",
  banner: {
    js: `/* Parlomino ${version}. Code: Apache-2.0. Pictograms: CC BY-SA 4.0, many adapted from OpenMoji (openmoji.org), CC BY-SA 4.0. Credits are returned with every composed result. */`,
  },
};
await build({ ...shared, outfile: join(out, "index.js"), format: "esm", external: ["zod"] });
await build({ ...shared, outfile: join(out, "parlomino.global.js"), format: "iife", globalName: "Parlomino", minify: true });

// Types: the declarations of the internal packages, with imports rewritten so that they work once published.
const internal = ["spec", "library", "core"];
for (const name of internal) {
  const target = join(out, "types", name);
  mkdirSync(target, { recursive: true });
  for (const file of readdirSync(join(root, "packages", name, "dist")).filter((f) => f.endsWith(".d.ts"))) {
    const types = readFileSync(join(root, "packages", name, "dist", file), "utf8")
      .replace(/from "\.\/([^"]+)\.ts"/g, 'from "./$1.js"')
      .replace(/from "@parlomino\/(spec|library|core)"/g, 'from "../$1/index.js"');
    writeFileSync(join(target, file), types);
  }
}
writeFileSync(
  join(out, "index.d.ts"),
  `export * from "./types/core/index.js";
export * from "./types/spec/index.js";
export { REQUIRED_LANGUAGES, createLibrary, defaultLibrary, palette, type Library, type PaletteColor } from "./types/library/index.js";
export declare const version: string;
`,
);

copyFileSync(join(root, "LICENSE"), join(pkg, "LICENSE"));
copyFileSync(join(root, "packages/library/LICENSE"), join(pkg, "LICENSE-PICTOGRAMS"));

// ─── Checks ──────────────────────────────────────────────────────────────────

function check(name, api) {
  const fail = (what) => {
    throw new Error(`${name}: ${what}`);
  };
  if (api.version !== version) fail("version");
  const picto = api.compose({ concept: "lex.doctor", modifiers: ["plural"] }, { lang: "fr", theme: "high-contrast" });
  if (!picto.ok || !picto.svg.startsWith("<svg") || picto.label !== "médecin (plusieurs)" || !picto.credits.length) fail("compose a pictogram");
  const phrase = api.compose({ phrase: [{ concept: "person.me" }, { concept: "action.drink" }], question: true });
  if (!phrase.ok || phrase.pictos.length !== 2) fail("compose a phrase");
  const invalid = api.compose({ concept: "object.aple" });
  if (invalid.ok || invalid.issues[0].suggestion !== "object.apple") fail("suggestions");
  if (api.search("Médecins", { lang: "fr" })[0]?.id !== "lex.doctor") fail("search with accents and plurals");
  if (api.jsonSchemas().picto.type !== "object") fail("JSON Schemas");
}

check("ES module", await import(pathToFileURL(join(out, "index.js")).href));
const context = vm.createContext({});
vm.runInContext(readFileSync(join(out, "parlomino.global.js"), "utf8"), context);
check("global bundle", vm.runInContext("Parlomino", context));

const kb = (file) => Math.round(statSync(join(out, file)).size / 1024);
console.log(`parlomino ${version}: index.js ${kb("index.js")} KB, parlomino.global.js ${kb("parlomino.global.js")} KB, both checked`);
