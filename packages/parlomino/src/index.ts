// The public entry point: the only package published on npm.
// @parlomino/spec, library and core stay internal to this repository.
export * from "@parlomino/core";
export * from "@parlomino/spec";
export { REQUIRED_LANGUAGES, createLibrary, defaultLibrary, palette, type Library, type PaletteColor } from "@parlomino/library";

declare const __PARLOMINO_VERSION__: string;
export const version: string = __PARLOMINO_VERSION__;
