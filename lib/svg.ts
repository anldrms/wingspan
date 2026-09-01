import type { Aircraft } from "./aircraft";
import { buildSilhouette, polygonsPath, viewBoxFor, type Silhouette } from "./silhouette";

export interface SvgOptions {
  /** Fuselage colour. Defaults to a CSS variable with a dark fallback. */
  primary?: string;
  /** Wings / stabiliser / engines colour. */
  secondary?: string;
  /** Pixel width of the output. Height follows the aircraft's proportions. */
  width?: number;
  /** Add an accessible <title>. */
  title?: string;
}

/** Standalone SVG markup for a silhouette. Usable as an <img>, in a README, or in any design tool. */
export function silhouetteToSvg(s: Silhouette, opts: SvgOptions = {}): string {
  const primary = opts.primary ?? "var(--ws-primary, #0f172a)";
  const secondary = opts.secondary ?? "var(--ws-secondary, #475569)";
  const vb = viewBoxFor(s);
  const [, , vw, vh] = vb.split(" ").map(Number);
  const width = opts.width ?? 512;
  const height = Math.round((width * vh) / vw);
  const title = opts.title ? `<title>${escapeXml(opts.title)}</title>` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" width="${width}" height="${height}" role="img"` +
    (opts.title ? ` aria-label="${escapeXml(opts.title)}"` : "") +
    `>${title}` +
    `<path class="ws-secondary" fill="${secondary}" d="${polygonsPath(s.secondary)}"/>` +
    `<path class="ws-primary" fill="${primary}" d="${polygonsPath(s.primary)}"/>` +
    `</svg>`
  );
}

export function aircraftToSvg(a: Aircraft, opts: SvgOptions = {}): string {
  return silhouetteToSvg(buildSilhouette(a.geometry), {
    title: `${a.manufacturer} ${a.name} — plan view silhouette, wingspan ${a.geometry.wingspan} m, length ${a.geometry.length} m`,
    ...opts,
  });
}

function escapeXml(s: string): string {
  return s.replace(/[<>&"']/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[c] as string);
}
