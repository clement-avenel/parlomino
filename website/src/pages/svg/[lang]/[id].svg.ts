// Static route serving each concept, frame and lexicon entry as a downloadable SVG, per language.
import type { APIRoute, GetStaticPaths } from "astro";
import { LANGUAGES, downloadSvg, downloadableIds } from "../../../lib/parlomino";

export const getStaticPaths: GetStaticPaths = () =>
  LANGUAGES.flatMap((lang) => downloadableIds().map((id) => ({ params: { lang, id } })));

export const GET: APIRoute = ({ params }) =>
  new Response(downloadSvg(params.id!, params.lang!), { headers: { "Content-Type": "image/svg+xml; charset=utf-8" } });
