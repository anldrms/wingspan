import type { CSSProperties } from "react";
import type { Aircraft } from "@/lib/aircraft";
import type { Livery } from "@/lib/liveries";
import { buildSilhouette, polygonsPath, squareViewBoxFor, viewBoxFor, type Silhouette as Sil } from "@/lib/silhouette";

interface Props {
  aircraft?: Aircraft;
  silhouette?: Sil;
  /** Square viewBox (for grids) or tight bounding box. */
  square?: boolean;
  className?: string;
  /** Wrap paths in a group that animates on hover (see .ws-anim in globals.css). */
  animate?: boolean;
  /** Colour preset. Sets the --ws-* variables inline; a light livery also gets a hairline outline. */
  livery?: Livery;
  /** Draw span/length dimension lines (technical-drawing style). */
  dimensions?: boolean;
  title?: string;
}

/** Inline CSS variables for a livery, so any silhouette can be recoloured without JS. */
export function liveryStyle(l: Livery): CSSProperties {
  const light = isLight(l.primary);
  return {
    "--ws-primary": l.primary,
    "--ws-secondary": l.secondary,
    "--ws-accent": l.accent,
    "--ws-outline": light ? "rgba(21,23,27,.55)" : "transparent",
  } as CSSProperties;
}

function isLight(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16), g = parseInt(m.slice(2, 4), 16), b = parseInt(m.slice(4, 6), 16);
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.72;
}

/**
 * Two-tone (plus tail accent) plan-view silhouette. Server-renderable: pure
 * SVG, colours come from --ws-primary / --ws-secondary / --ws-accent so any
 * parent can recolour it, and hover animation is pure CSS.
 */
export default function Silhouette({ aircraft, silhouette, square = true, className = "", animate = true, livery, dimensions, title }: Props) {
  const s = silhouette ?? (aircraft ? buildSilhouette(aircraft.geometry) : null);
  if (!s) return null;
  const vb = square ? squareViewBoxFor(s, dimensions ? 0.16 : 0.06) : viewBoxFor(s, dimensions ? 0.16 : 0.04);
  const label = title ?? (aircraft ? `${aircraft.manufacturer} ${aircraft.name} silhouette` : "Aircraft silhouette");
  const paths = (
    <>
      <path className="ws-secondary" d={polygonsPath(s.secondary)} />
      <path className="ws-accent" d={polygonsPath(s.accent)} />
      <path className="ws-primary" d={polygonsPath(s.primary)} />
    </>
  );
  return (
    <svg className={`ws ${className}`} viewBox={vb} role="img" aria-label={label} style={livery ? liveryStyle(livery) : undefined}>
      <title>{label}</title>
      {dimensions && <Dimensions s={s} />}
      {animate ? <g className="ws-anim">{paths}</g> : paths}
    </svg>
  );
}

/** Span line above the nose, length line to the right — like a three-view drawing. */
function Dimensions({ s }: { s: Sil }) {
  const size = Math.max(s.wingspan, s.length);
  const off = size * 0.07;
  const tick = size * 0.015;
  const fs = size * 0.035;
  const hw = s.wingspan / 2;
  const yTop = -off;
  const xRight = hw + off;
  return (
    <g aria-hidden="true">
      <line className="dimline" x1={-hw} y1={yTop} x2={hw} y2={yTop} />
      <line className="dimline" x1={-hw} y1={yTop - tick} x2={-hw} y2={yTop + tick} />
      <line className="dimline" x1={hw} y1={yTop - tick} x2={hw} y2={yTop + tick} />
      <text className="dimtext" x={0} y={yTop - tick * 1.4} fontSize={fs} textAnchor="middle">
        {s.wingspan.toFixed(2)} m
      </text>
      <line className="dimline" x1={xRight} y1={0} x2={xRight} y2={s.length} />
      <line className="dimline" x1={xRight - tick} y1={0} x2={xRight + tick} y2={0} />
      <line className="dimline" x1={xRight - tick} y1={s.length} x2={xRight + tick} y2={s.length} />
      <text className="dimtext" x={xRight + tick * 1.6} y={s.length / 2} fontSize={fs} textAnchor="middle" transform={`rotate(90 ${xRight + tick * 1.6} ${s.length / 2})`}>
        {s.length.toFixed(2)} m
      </text>
    </g>
  );
}
