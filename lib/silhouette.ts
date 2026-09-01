/**
 * Wingspan silhouette engine.
 *
 * Every aircraft is described by a small set of real-world measurements
 * (metres) and turned into a plan-view (top-down) silhouette. All silhouettes
 * share the exact same point topology — same number of sub-paths, same number
 * of points in each — which is what makes any aircraft morph smoothly into any
 * other by simple linear interpolation.
 *
 * Coordinate system: metres. x = spanwise (0 at centreline, + to the right),
 * y = along the fuselage (0 at the nose tip, + towards the tail).
 */

export type Pt = [number, number];

export interface FuselageSpec {
  /** Maximum fuselage width (m). */
  width: number;
  /** Distance from nose tip to the point where the fuselage reaches full width (m). */
  noseLen: number;
  /** Length of the rear taper (m). */
  tailLen: number;
  /** Width of the fuselage at the very tail (m). */
  tailWidth: number;
}

export interface WingSpec {
  /** Leading-edge position at the wing root, measured from the nose (m). */
  y: number;
  /** Root chord (m). */
  rootChord: number;
  /** Position of the trailing-edge kink as a fraction of the exposed half-span (0..1). */
  kinkFrac: number;
  /** Chord at the kink (m). */
  kinkChord: number;
  /** Tip chord (m). */
  tipChord: number;
  /** Leading-edge sweep from the kink to the tip (degrees, positive = swept back). */
  sweep: number;
  /** Leading-edge sweep from the root to the kink. Defaults to `sweep`. Use for ogival/cranked deltas. */
  innerSweep?: number;
}

export interface StabSpec {
  y: number;
  span: number;
  rootChord: number;
  tipChord: number;
  sweep: number;
}

export interface EngineSpec {
  /** Spanwise position of the nacelle centre (m). */
  x: number;
  /** Nacelle width (m). 0 hides the nacelle. */
  w: number;
  /** Nacelle length (m). */
  l: number;
  /**
   * Nacelle centre along the fuselage (m). If omitted, the nacelle hangs from
   * the wing leading edge at that spanwise position.
   */
  y?: number;
  /** Propeller diameter (m). Draws a thin disc ahead of the nacelle. */
  prop?: number;
}

export interface Geometry {
  wingspan: number;
  length: number;
  fuselage: FuselageSpec;
  wing: WingSpec;
  stab: StabSpec;
  /** Up to MAX_ENGINES per side. Missing slots are hidden. */
  engines: EngineSpec[];
}

/** A silhouette is a list of closed polygons plus its bounding box. */
export interface Silhouette {
  /** Polygons drawn in the primary tone (fuselage). */
  primary: Pt[][];
  /** Polygons drawn in the secondary tone (wings, stabiliser, engines). */
  secondary: Pt[][];
  wingspan: number;
  length: number;
}

export const MAX_ENGINES = 3;
const NOSE_SAMPLES = 9;
const MID_SAMPLES = 2;
const TAIL_SAMPLES = 8;
const CAPSULE_SAMPLES = 8; // per semicircle end

const deg = (d: number) => (d * Math.PI) / 180;

/* ------------------------------------------------------------------ */
/* Fuselage                                                            */
/* ------------------------------------------------------------------ */

function fuselageHalfWidth(f: FuselageSpec, length: number, y: number): number {
  const hw = f.width / 2;
  if (y <= f.noseLen) {
    const t = Math.max(0, y / f.noseLen);
    // Rounded nose: fast initial expansion, eases into full width.
    return hw * Math.sin((t * Math.PI) / 2) ** 0.85;
  }
  const taperStart = length - f.tailLen;
  if (y >= taperStart) {
    const t = Math.min(1, (y - taperStart) / f.tailLen);
    const tw = f.tailWidth / 2;
    return hw - (hw - tw) * t ** 1.4;
  }
  return hw;
}

function fuselagePolygon(g: Geometry): Pt[] {
  const { fuselage: f, length: L } = g;
  const right: Pt[] = [];
  const taperStart = L - f.tailLen;

  for (let i = 0; i < NOSE_SAMPLES; i++) {
    const y = (f.noseLen * i) / (NOSE_SAMPLES - 1);
    right.push([fuselageHalfWidth(f, L, y), y]);
  }
  for (let i = 1; i <= MID_SAMPLES; i++) {
    const y = f.noseLen + ((taperStart - f.noseLen) * i) / (MID_SAMPLES + 1);
    right.push([fuselageHalfWidth(f, L, y), y]);
  }
  for (let i = 0; i < TAIL_SAMPLES; i++) {
    const y = taperStart + (f.tailLen * i) / (TAIL_SAMPLES - 1);
    right.push([fuselageHalfWidth(f, L, y), y]);
  }

  const left: Pt[] = right.map(([x, y]) => [-x, y] as Pt).reverse();
  return [...right, ...left];
}

/* ------------------------------------------------------------------ */
/* Lifting surfaces                                                    */
/* ------------------------------------------------------------------ */

interface SurfaceSpec {
  y: number;
  halfSpan: number;
  rootChord: number;
  kinkFrac: number;
  kinkChord: number;
  tipChord: number;
  sweep: number;
  innerSweep?: number;
}

/** Root x (buried inside the fuselage so the join is seamless), kink x and tip x of a surface. */
function surfaceStations(g: Geometry, spec: SurfaceSpec) {
  const rootX = Math.min(g.fuselage.width * 0.35, spec.halfSpan);
  const tipX = spec.halfSpan;
  const kinkX = rootX + (tipX - rootX) * spec.kinkFrac;
  return { rootX, kinkX, tipX };
}

/** Leading-edge y of a surface at spanwise position x (cranked LE aware). */
function leadingEdgeAt(g: Geometry, spec: SurfaceSpec, x: number): number {
  const { rootX, kinkX } = surfaceStations(g, spec);
  const ax = Math.abs(x);
  const tanIn = Math.tan(deg(spec.innerSweep ?? spec.sweep));
  const tanOut = Math.tan(deg(spec.sweep));
  if (ax <= kinkX) return spec.y + Math.max(0, ax - rootX) * tanIn;
  return spec.y + (kinkX - rootX) * tanIn + (ax - kinkX) * tanOut;
}

/** Leading-edge y position of the wing at spanwise position x. */
export function wingLeadingEdgeAt(g: Geometry, x: number): number {
  return leadingEdgeAt(g, { ...g.wing, halfSpan: g.wingspan / 2 }, x);
}

function surfacePolygon(g: Geometry, spec: SurfaceSpec, mirror: boolean): Pt[] {
  const { rootX, kinkX, tipX } = surfaceStations(g, spec);
  const leAt = (x: number) => leadingEdgeAt(g, spec, x);

  const pts: Pt[] = [
    [rootX, spec.y],
    [kinkX, leAt(kinkX)],
    [tipX, leAt(tipX)],
    [tipX, leAt(tipX) + spec.tipChord],
    [kinkX, leAt(kinkX) + spec.kinkChord],
    [rootX, spec.y + spec.rootChord],
  ];
  return mirror ? pts.map(([x, y]) => [-x, y] as Pt) : pts;
}

function wingPolygon(g: Geometry, mirror: boolean): Pt[] {
  return surfacePolygon(g, { ...g.wing, halfSpan: g.wingspan / 2 }, mirror);
}

function stabPolygon(g: Geometry, mirror: boolean): Pt[] {
  const s = g.stab;
  const halfSpan = s.span / 2;
  return surfacePolygon(
    g,
    {
      y: s.y,
      halfSpan,
      rootChord: s.rootChord,
      kinkFrac: 0.5,
      kinkChord: (s.rootChord + s.tipChord) / 2,
      tipChord: s.tipChord,
      sweep: s.sweep,
    },
    mirror,
  );
}

/* ------------------------------------------------------------------ */
/* Engines                                                             */
/* ------------------------------------------------------------------ */

/** Rounded capsule centred at (cx, cy), width w, length l (along y). */
function capsule(cx: number, cy: number, w: number, l: number): Pt[] {
  const r = Math.min(w / 2, l / 2);
  const straight = Math.max(0, l / 2 - r);
  const pts: Pt[] = [];
  // Top semicircle (nose of nacelle), right to left.
  for (let i = 0; i <= CAPSULE_SAMPLES; i++) {
    const a = Math.PI * (i / CAPSULE_SAMPLES); // 0..π
    pts.push([cx + Math.cos(a) * (w / 2), cy - straight - Math.sin(a) * r]);
  }
  // Bottom semicircle, left to right.
  for (let i = 0; i <= CAPSULE_SAMPLES; i++) {
    const a = Math.PI + Math.PI * (i / CAPSULE_SAMPLES); // π..2π
    pts.push([cx + Math.cos(a) * (w / 2), cy + straight - Math.sin(a) * r]);
  }
  return pts;
}

function engineSlot(g: Geometry, i: number): EngineSpec {
  const e = g.engines[i];
  if (e) return e;
  // Hidden slot: collapse onto the wing kink so morphs grow engines out of the wing.
  const kinkX = g.fuselage.width * 0.35 + (g.wingspan / 2 - g.fuselage.width * 0.35) * g.wing.kinkFrac;
  return { x: kinkX, w: 0, l: 0 };
}

function enginePolygons(g: Geometry, mirror: boolean): Pt[][] {
  const out: Pt[][] = [];
  for (let i = 0; i < MAX_ENGINES; i++) {
    const e = engineSlot(g, i);
    const sign = mirror ? -1 : 1;
    // Fraction of the nacelle that protrudes ahead of the wing leading edge.
    const ahead = e.prop ? 0.8 : 0.7;
    const cy = e.y ?? wingLeadingEdgeAt(g, e.x) - ahead * e.l + e.l / 2;
    const front = cy - e.l / 2;
    // Nacelle
    out.push(capsule(sign * e.x, cy, e.w, e.l));
    // Propeller disc (thin bar just ahead of the nacelle)
    const propD = e.prop ?? 0;
    out.push(capsule(sign * e.x, propD ? front - 0.2 : cy, propD, propD ? 0.3 : 0));
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Assembly                                                            */
/* ------------------------------------------------------------------ */

export function buildSilhouette(g: Geometry): Silhouette {
  return {
    primary: [fuselagePolygon(g)],
    secondary: [
      wingPolygon(g, false),
      wingPolygon(g, true),
      stabPolygon(g, false),
      stabPolygon(g, true),
      ...enginePolygons(g, false),
      ...enginePolygons(g, true),
    ],
    wingspan: g.wingspan,
    length: g.length,
  };
}

/* ------------------------------------------------------------------ */
/* Morphing                                                            */
/* ------------------------------------------------------------------ */

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function lerpPolys(a: Pt[][], b: Pt[][], t: number): Pt[][] {
  return a.map((poly, i) => poly.map(([x, y], j) => [lerp(x, b[i][j][0], t), lerp(y, b[i][j][1], t)] as Pt));
}

/** Linear interpolation between two silhouettes (they always share topology). */
export function morph(a: Silhouette, b: Silhouette, t: number): Silhouette {
  return {
    primary: lerpPolys(a.primary, b.primary, t),
    secondary: lerpPolys(a.secondary, b.secondary, t),
    wingspan: lerp(a.wingspan, b.wingspan, t),
    length: lerp(a.length, b.length, t),
  };
}

/* ------------------------------------------------------------------ */
/* Path output                                                         */
/* ------------------------------------------------------------------ */

const fmt = (n: number) => (Math.round(n * 100) / 100).toString();

function signedArea(poly: Pt[]): number {
  let a = 0;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly[i];
    const [x2, y2] = poly[(i + 1) % poly.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * One closed sub-path. Winding is normalised so that overlapping components
 * (a nacelle sitting on a wing) union under the non-zero fill rule instead of
 * punching holes in each other.
 */
export function polygonPath(poly: Pt[]): string {
  if (poly.length === 0) return "";
  const pts = signedArea(poly) < 0 ? [...poly].reverse() : poly;
  return pts.map(([x, y], i) => `${i === 0 ? "M" : "L"}${fmt(x)} ${fmt(y)}`).join("") + "Z";
}

export function polygonsPath(polys: Pt[][]): string {
  return polys.map(polygonPath).join("");
}

/** Bounding box of a silhouette in metres: x from -span/2..span/2, y from 0..length (plus a little padding). */
export function viewBoxFor(s: Silhouette, pad = 0.04): string {
  const size = Math.max(s.wingspan, s.length);
  const p = size * pad;
  const w = s.wingspan + p * 2;
  const h = s.length + p * 2;
  return `${fmt(-w / 2)} ${fmt(-p)} ${fmt(w)} ${fmt(h)}`;
}

/** Square viewBox that fits the whole aircraft, centred. Handy for icon grids. */
export function squareViewBoxFor(s: Silhouette, pad = 0.06): string {
  const size = Math.max(s.wingspan, s.length) * (1 + pad * 2);
  const cy = s.length / 2;
  return `${fmt(-size / 2)} ${fmt(cy - size / 2)} ${fmt(size)} ${fmt(size)}`;
}
