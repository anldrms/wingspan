import type { Aircraft } from "@/lib/aircraft";
import { buildSilhouette, polygonsPath, squareViewBoxFor, viewBoxFor, type Silhouette as Sil } from "@/lib/silhouette";

interface Props {
  aircraft?: Aircraft;
  silhouette?: Sil;
  /** Square viewBox (for grids) or tight bounding box. */
  square?: boolean;
  className?: string;
  /** Wrap paths in a group that animates on hover (see .ws-anim in globals.css). */
  animate?: boolean;
  title?: string;
}

/**
 * Two-tone plan-view silhouette. Server-renderable: pure SVG, colours come
 * from the --ws-primary / --ws-secondary CSS variables so any parent can
 * recolour it, and hover animation is pure CSS.
 */
export default function Silhouette({ aircraft, silhouette, square = true, className = "", animate = true, title }: Props) {
  const s = silhouette ?? (aircraft ? buildSilhouette(aircraft.geometry) : null);
  if (!s) return null;
  const vb = square ? squareViewBoxFor(s) : viewBoxFor(s);
  const label = title ?? (aircraft ? `${aircraft.manufacturer} ${aircraft.name} silhouette` : "Aircraft silhouette");
  const paths = (
    <>
      <path className="ws-secondary" d={polygonsPath(s.secondary)} />
      <path className="ws-primary" d={polygonsPath(s.primary)} />
    </>
  );
  return (
    <svg className={`ws ${className}`} viewBox={vb} role="img" aria-label={label}>
      <title>{label}</title>
      {animate ? <g className="ws-anim">{paths}</g> : paths}
    </svg>
  );
}
