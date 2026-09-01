import type { EngineSpec, FuselageSpec, Geometry, StabSpec, WingSpec } from "./silhouette";

export type Category =
  | "widebody"
  | "narrowbody"
  | "regional"
  | "business"
  | "general-aviation"
  | "cargo"
  | "military"
  | "supersonic"
  | "historic";

export interface Aircraft {
  slug: string;
  name: string;
  manufacturer: string;
  /** Family this variant belongs to (e.g. "A320 family", "737 MAX"). */
  family: string;
  /** ICAO type designator. */
  icao: string;
  category: Category;
  /** Year of first flight. Undefined for types that have not flown yet. */
  firstFlight?: number;
  /** Overall height (m). */
  height: number;
  /** Maximum take-off weight (tonnes). */
  mtow: number;
  /** Typical capacity, free text. */
  capacity: string;
  /** Approximate cruise speed (km/h). */
  cruise: number;
  geometry: Geometry;
}

export const CATEGORY_LABELS: Record<Category, string> = {
  widebody: "Wide-body",
  narrowbody: "Narrow-body",
  regional: "Regional",
  business: "Business jet",
  "general-aviation": "General aviation",
  cargo: "Cargo",
  military: "Military",
  supersonic: "Supersonic",
  historic: "Historic",
};

/* ------------------------------------------------------------------ */
/* Family helper                                                       */
/*                                                                     */
/* Variants of an airliner family share wing, tail and engine geometry */
/* and differ mostly by fuselage plugs. A family declares one baseline */
/* geometry at `baseLength`; each variant is derived by "stretching"   */
/* the fuselage: the wing moves aft by `foreFrac` of the length delta  */
/* (the forward plug), the tail and rear-mounted engines move by the   */
/* full delta. Any field can still be overridden per variant.          */
/* ------------------------------------------------------------------ */

interface FamilyDef {
  family: string;
  manufacturer: string;
  category: Category;
  /** Length (m) at which the baseline geometry below is drawn. */
  baseLength: number;
  /** Share of a fuselage stretch inserted ahead of the wing. Default 0.45. */
  foreFrac?: number;
  fuselage: FuselageSpec;
  wing: WingSpec;
  stab: StabSpec;
  engines: EngineSpec[];
  cruise?: number;
  wingPos?: Geometry["wingPos"];
  tail?: Geometry["tail"];
}

interface VariantRow {
  slug: string;
  name: string;
  icao: string;
  firstFlight?: number;
  length: number;
  wingspan: number;
  height: number;
  mtow: number;
  capacity: string;
  cruise?: number;
  category?: Category;
  manufacturer?: string;
  fuselage?: Partial<FuselageSpec>;
  wing?: Partial<WingSpec>;
  stab?: Partial<StabSpec>;
  engines?: EngineSpec[];
  wingPos?: Geometry["wingPos"];
  tail?: Geometry["tail"];
}

function family(def: FamilyDef, rows: VariantRow[]): Aircraft[] {
  const fore = def.foreFrac ?? 0.45;
  return rows.map((r) => {
    const delta = r.length - def.baseLength;
    const wing: WingSpec = { ...def.wing, y: def.wing.y + delta * fore, ...r.wing };
    const stab: StabSpec = { ...def.stab, y: def.stab.y + delta, ...r.stab };
    const engines: EngineSpec[] = (r.engines ?? def.engines).map((e) => {
      if (e.y === undefined || r.engines) return e;
      const shift = e.y < def.wing.y ? 0 : e.y > def.wing.y + def.wing.rootChord ? delta : delta * fore;
      return { ...e, y: e.y + shift };
    });
    return {
      slug: r.slug,
      name: r.name,
      manufacturer: r.manufacturer ?? def.manufacturer,
      family: def.family,
      icao: r.icao,
      category: r.category ?? def.category,
      firstFlight: r.firstFlight,
      height: r.height,
      mtow: r.mtow,
      capacity: r.capacity,
      cruise: r.cruise ?? def.cruise ?? 850,
      geometry: {
        wingspan: r.wingspan,
        length: r.length,
        fuselage: { ...def.fuselage, ...r.fuselage },
        wing,
        stab,
        engines,
        wingPos: r.wingPos ?? def.wingPos ?? "low",
        tail: r.tail ?? def.tail ?? "conventional",
      },
    };
  });
}

/* ------------------------------------------------------------------ */
/* Dataset                                                             */
/*                                                                     */
/* Wingspan, length, height, MTOW and first flight are published       */
/* manufacturer figures. Wing/stabiliser/engine placement is read off  */
/* three-view drawings — good enough for a silhouette, not for         */
/* engineering. Capacity is a typical two-class layout unless noted.   */
/* ------------------------------------------------------------------ */

export const AIRCRAFT: Aircraft[] = [
  /* ============================== AIRBUS ============================== */
  ...family(
    {
      family: "A220",
      manufacturer: "Airbus",
      category: "narrowbody",
      baseLength: 38.71,
      cruise: 829,
      fuselage: { width: 3.7, noseLen: 4.2, tailLen: 10, tailWidth: 0.7 },
      wing: { y: 14.5, rootChord: 7, kinkFrac: 0.3, kinkChord: 4.2, tipChord: 1.5, sweep: 25 },
      stab: { y: 33.5, span: 12.5, rootChord: 3.8, tipChord: 1.4, sweep: 30 },
      engines: [{ x: 5.2, w: 2.3, l: 3.9 }],
    },
    [
      { slug: "a220-100", name: "A220-100", icao: "BCS1", firstFlight: 2013, length: 35.0, wingspan: 35.1, height: 11.5, mtow: 63.1, capacity: "116 passengers" },
      { slug: "a220-300", name: "A220-300", icao: "BCS3", firstFlight: 2015, length: 38.71, wingspan: 35.1, height: 11.5, mtow: 70.9, capacity: "140 passengers" },
    ],
  ),
  ...family(
    {
      family: "A320ceo family",
      manufacturer: "Airbus",
      category: "narrowbody",
      baseLength: 37.57,
      cruise: 833,
      fuselage: { width: 3.95, noseLen: 4.5, tailLen: 11, tailWidth: 0.8 },
      wing: { y: 13.5, rootChord: 7.5, kinkFrac: 0.3, kinkChord: 4.5, tipChord: 1.6, sweep: 25 },
      stab: { y: 32, span: 12.45, rootChord: 4, tipChord: 1.5, sweep: 28 },
      engines: [{ x: 5.75, w: 2.2, l: 3.8 }],
    },
    [
      { slug: "a318", name: "A318", icao: "A318", firstFlight: 2002, length: 31.44, wingspan: 34.1, height: 12.56, mtow: 68, capacity: "107 passengers" },
      { slug: "a319", name: "A319", icao: "A319", firstFlight: 1995, length: 33.84, wingspan: 34.1, height: 11.76, mtow: 75.5, capacity: "124 passengers" },
      { slug: "a320", name: "A320", icao: "A320", firstFlight: 1987, length: 37.57, wingspan: 34.1, height: 11.76, mtow: 78, capacity: "150 passengers" },
      { slug: "a321", name: "A321", icao: "A321", firstFlight: 1993, length: 44.51, wingspan: 34.1, height: 11.76, mtow: 93.5, capacity: "185 passengers" },
    ],
  ),
  ...family(
    {
      family: "A320neo family",
      manufacturer: "Airbus",
      category: "narrowbody",
      baseLength: 37.57,
      cruise: 833,
      fuselage: { width: 3.95, noseLen: 4.5, tailLen: 11, tailWidth: 0.8 },
      wing: { y: 13.5, rootChord: 7.5, kinkFrac: 0.3, kinkChord: 4.5, tipChord: 1.6, sweep: 25 },
      stab: { y: 32, span: 12.45, rootChord: 4, tipChord: 1.5, sweep: 28 },
      engines: [{ x: 5.75, w: 2.5, l: 4 }],
    },
    [
      { slug: "a319neo", name: "A319neo", icao: "A19N", firstFlight: 2017, length: 33.84, wingspan: 35.8, height: 11.76, mtow: 75.5, capacity: "140 passengers" },
      { slug: "a320neo", name: "A320neo", icao: "A20N", firstFlight: 2014, length: 37.57, wingspan: 35.8, height: 11.76, mtow: 79, capacity: "165 passengers" },
      { slug: "a321neo", name: "A321neo", icao: "A21N", firstFlight: 2016, length: 44.51, wingspan: 35.8, height: 11.76, mtow: 97, capacity: "206 passengers" },
      { slug: "a321xlr", name: "A321XLR", icao: "A21N", firstFlight: 2022, length: 44.51, wingspan: 35.8, height: 11.76, mtow: 101, capacity: "200 passengers · 8,700 km" },
    ],
  ),
  ...family(
    {
      family: "A300 / A310",
      manufacturer: "Airbus",
      category: "widebody",
      baseLength: 54.08,
      cruise: 850,
      fuselage: { width: 5.64, noseLen: 6.5, tailLen: 15, tailWidth: 1.1 },
      wing: { y: 19.5, rootChord: 12, kinkFrac: 0.3, kinkChord: 6.5, tipChord: 2.5, sweep: 28 },
      stab: { y: 46, span: 16.26, rootChord: 6, tipChord: 2.2, sweep: 30 },
      engines: [{ x: 8.5, w: 3.2, l: 5.5 }],
    },
    [
      { slug: "a300-600", name: "A300-600", icao: "A306", firstFlight: 1983, length: 54.08, wingspan: 44.84, height: 16.53, mtow: 171.7, capacity: "266 passengers" },
      { slug: "a310-300", name: "A310-300", icao: "A310", firstFlight: 1985, length: 46.66, wingspan: 43.9, height: 15.8, mtow: 164, capacity: "220 passengers" },
    ],
  ),
  ...family(
    {
      family: "A330",
      manufacturer: "Airbus",
      category: "widebody",
      baseLength: 63.69,
      cruise: 871,
      fuselage: { width: 5.64, noseLen: 6.5, tailLen: 18, tailWidth: 1.1 },
      wing: { y: 22.5, rootChord: 13.5, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.5, sweep: 30 },
      stab: { y: 55, span: 19.4, rootChord: 6.5, tipChord: 2.4, sweep: 30 },
      engines: [{ x: 9.4, w: 3.4, l: 6 }],
    },
    [
      { slug: "a330-200", name: "A330-200", icao: "A332", firstFlight: 1997, length: 58.82, wingspan: 60.3, height: 17.39, mtow: 242, capacity: "247 passengers" },
      { slug: "a330-300", name: "A330-300", icao: "A333", firstFlight: 1992, length: 63.69, wingspan: 60.3, height: 16.79, mtow: 242, capacity: "277 passengers" },
      { slug: "a330-800", name: "A330-800neo", icao: "A338", firstFlight: 2018, length: 58.82, wingspan: 64, height: 17.39, mtow: 251, capacity: "257 passengers", engines: [{ x: 9.4, w: 3.8, l: 6.4 }] },
      { slug: "a330-900", name: "A330-900neo", icao: "A339", firstFlight: 2017, length: 63.66, wingspan: 64, height: 16.79, mtow: 251, capacity: "287 passengers", engines: [{ x: 9.4, w: 3.8, l: 6.4 }] },
      { slug: "beluga-xl", name: "BelugaXL", icao: "A337", firstFlight: 2018, length: 63.1, wingspan: 60.3, height: 18.9, mtow: 227, capacity: "51 t outsize cargo", cruise: 737, category: "cargo", fuselage: { width: 8.8, noseLen: 9, tailLen: 16, tailWidth: 1.4 } },
    ],
  ),
  ...family(
    {
      family: "A340",
      manufacturer: "Airbus",
      category: "widebody",
      baseLength: 63.69,
      cruise: 871,
      fuselage: { width: 5.64, noseLen: 6.5, tailLen: 18, tailWidth: 1.1 },
      wing: { y: 22.5, rootChord: 13.5, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.5, sweep: 30 },
      stab: { y: 55, span: 19.4, rootChord: 6.5, tipChord: 2.4, sweep: 30 },
      engines: [
        { x: 9.4, w: 2.6, l: 5 },
        { x: 18.5, w: 2.6, l: 5 },
      ],
    },
    [
      { slug: "a340-200", name: "A340-200", icao: "A342", firstFlight: 1992, length: 59.4, wingspan: 60.3, height: 16.8, mtow: 275, capacity: "261 passengers" },
      { slug: "a340-300", name: "A340-300", icao: "A343", firstFlight: 1991, length: 63.69, wingspan: 60.3, height: 16.85, mtow: 276.5, capacity: "295 passengers" },
      { slug: "a340-500", name: "A340-500", icao: "A345", firstFlight: 2002, length: 67.93, wingspan: 63.45, height: 17.53, mtow: 380, capacity: "313 passengers", wing: { rootChord: 14.5 }, engines: [{ x: 9.8, w: 3.0, l: 5.6 }, { x: 19.5, w: 3.0, l: 5.6 }] },
      { slug: "a340-600", name: "A340-600", icao: "A346", firstFlight: 2001, length: 75.36, wingspan: 63.45, height: 17.93, mtow: 380, capacity: "380 passengers", wing: { rootChord: 14.5 }, engines: [{ x: 9.8, w: 3.0, l: 5.6 }, { x: 19.5, w: 3.0, l: 5.6 }] },
    ],
  ),
  ...family(
    {
      family: "A350",
      manufacturer: "Airbus",
      category: "widebody",
      baseLength: 66.8,
      cruise: 903,
      fuselage: { width: 5.96, noseLen: 7, tailLen: 19, tailWidth: 1.1 },
      wing: { y: 23, rootChord: 14, kinkFrac: 0.3, kinkChord: 7.5, tipChord: 2.5, sweep: 31.9 },
      stab: { y: 57, span: 19.6, rootChord: 7, tipChord: 2.5, sweep: 33 },
      engines: [{ x: 9.5, w: 3.8, l: 6.5 }],
    },
    [
      { slug: "a350-900", name: "A350-900", icao: "A359", firstFlight: 2013, length: 66.8, wingspan: 64.75, height: 17.05, mtow: 280, capacity: "315 passengers" },
      { slug: "a350-1000", name: "A350-1000", icao: "A35K", firstFlight: 2016, length: 73.79, wingspan: 64.75, height: 17.08, mtow: 322, capacity: "369 passengers", engines: [{ x: 9.5, w: 4.0, l: 6.8 }] },
    ],
  ),
  ...family(
    {
      family: "A380",
      manufacturer: "Airbus",
      category: "widebody",
      baseLength: 72.72,
      cruise: 903,
      fuselage: { width: 7.14, noseLen: 8, tailLen: 22, tailWidth: 1.5 },
      wing: { y: 24, rootChord: 19, kinkFrac: 0.3, kinkChord: 10, tipChord: 3.5, sweep: 33.5 },
      stab: { y: 62, span: 30.4, rootChord: 8.5, tipChord: 3, sweep: 33 },
      engines: [
        { x: 11.5, w: 3.4, l: 7 },
        { x: 22.5, w: 3.4, l: 7 },
      ],
    },
    [{ slug: "a380", name: "A380-800", icao: "A388", firstFlight: 2005, length: 72.72, wingspan: 79.75, height: 24.09, mtow: 575, capacity: "555 passengers (853 max)" }],
  ),

  /* ============================== BOEING ============================== */
  ...family(
    {
      family: "707",
      manufacturer: "Boeing",
      category: "historic",
      baseLength: 46.61,
      cruise: 977,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 12, tailWidth: 0.8 },
      wing: { y: 16, rootChord: 9, kinkFrac: 0.3, kinkChord: 5.5, tipChord: 2, sweep: 35 },
      stab: { y: 40, span: 13.95, rootChord: 4.5, tipChord: 1.8, sweep: 35 },
      engines: [
        { x: 7.5, w: 1.6, l: 4.5 },
        { x: 13.5, w: 1.6, l: 4.5 },
      ],
    },
    [{ slug: "707-320b", name: "707-320B", icao: "B703", firstFlight: 1957, length: 46.61, wingspan: 44.42, height: 12.93, mtow: 151.3, capacity: "189 passengers" }],
  ),
  ...family(
    {
      family: "727",
      tail: "t",
      manufacturer: "Boeing",
      category: "historic",
      baseLength: 46.69,
      cruise: 917,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 11, tailWidth: 1.4 },
      wing: { y: 17, rootChord: 8.5, kinkFrac: 0.3, kinkChord: 5, tipChord: 1.8, sweep: 32 },
      stab: { y: 40, span: 10.9, rootChord: 3.5, tipChord: 1.4, sweep: 35 },
      engines: [
        { x: 2.6, y: 37, w: 1.5, l: 4.5 },
        { x: 0, y: 43, w: 1.5, l: 4 },
      ],
    },
    [
      { slug: "727-100", name: "727-100", icao: "B721", firstFlight: 1963, length: 40.59, wingspan: 32.92, height: 10.36, mtow: 76.7, capacity: "131 passengers" },
      { slug: "727-200", name: "727-200", icao: "B722", firstFlight: 1967, length: 46.69, wingspan: 32.92, height: 10.36, mtow: 95, capacity: "189 passengers" },
    ],
  ),
  ...family(
    {
      family: "737 Original",
      manufacturer: "Boeing",
      category: "historic",
      baseLength: 30.53,
      cruise: 780,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 10, tailWidth: 0.8 },
      wing: { y: 11.5, rootChord: 6.5, kinkFrac: 0.3, kinkChord: 4, tipChord: 1.4, sweep: 25 },
      stab: { y: 26, span: 12.7, rootChord: 3.8, tipChord: 1.4, sweep: 30 },
      engines: [{ x: 4.6, w: 1.4, l: 5 }],
    },
    [
      { slug: "737-100", name: "737-100", icao: "B731", firstFlight: 1967, length: 28.65, wingspan: 28.35, height: 11.28, mtow: 49.9, capacity: "118 passengers" },
      { slug: "737-200", name: "737-200", icao: "B732", firstFlight: 1967, length: 30.53, wingspan: 28.35, height: 11.28, mtow: 52.4, capacity: "130 passengers" },
    ],
  ),
  ...family(
    {
      family: "737 Classic",
      manufacturer: "Boeing",
      category: "narrowbody",
      baseLength: 33.4,
      cruise: 794,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 10.5, tailWidth: 0.8 },
      wing: { y: 12.8, rootChord: 7, kinkFrac: 0.3, kinkChord: 4.2, tipChord: 1.5, sweep: 25 },
      stab: { y: 28.5, span: 12.7, rootChord: 3.8, tipChord: 1.4, sweep: 30 },
      engines: [{ x: 4.8, w: 2.0, l: 3.6 }],
    },
    [
      { slug: "737-300", name: "737-300", icao: "B733", firstFlight: 1984, length: 33.4, wingspan: 28.88, height: 11.13, mtow: 62.8, capacity: "149 passengers" },
      { slug: "737-400", name: "737-400", icao: "B734", firstFlight: 1988, length: 36.4, wingspan: 28.88, height: 11.13, mtow: 68, capacity: "168 passengers" },
      { slug: "737-500", name: "737-500", icao: "B735", firstFlight: 1989, length: 31.0, wingspan: 28.88, height: 11.13, mtow: 60.5, capacity: "132 passengers" },
    ],
  ),
  ...family(
    {
      family: "737 Next Generation",
      manufacturer: "Boeing",
      category: "narrowbody",
      baseLength: 39.47,
      cruise: 842,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 12, tailWidth: 0.8 },
      wing: { y: 14.5, rootChord: 7.6, kinkFrac: 0.3, kinkChord: 4.4, tipChord: 1.5, sweep: 25 },
      stab: { y: 34, span: 14.35, rootChord: 4, tipChord: 1.5, sweep: 30 },
      engines: [{ x: 4.9, w: 2.1, l: 3.7 }],
    },
    [
      { slug: "737-600", name: "737-600", icao: "B736", firstFlight: 1998, length: 31.24, wingspan: 34.32, height: 12.57, mtow: 65.5, capacity: "130 passengers" },
      { slug: "737-700", name: "737-700", icao: "B737", firstFlight: 1997, length: 33.63, wingspan: 35.79, height: 12.57, mtow: 70.1, capacity: "149 passengers" },
      { slug: "737-800", name: "737-800", icao: "B738", firstFlight: 1997, length: 39.47, wingspan: 35.79, height: 12.55, mtow: 79, capacity: "189 passengers" },
      { slug: "737-900er", name: "737-900ER", icao: "B739", firstFlight: 2006, length: 42.11, wingspan: 35.79, height: 12.55, mtow: 85.1, capacity: "220 passengers" },
    ],
  ),
  ...family(
    {
      family: "737 MAX",
      manufacturer: "Boeing",
      category: "narrowbody",
      baseLength: 39.52,
      cruise: 839,
      fuselage: { width: 3.76, noseLen: 4.5, tailLen: 12, tailWidth: 0.8 },
      wing: { y: 14.5, rootChord: 7.6, kinkFrac: 0.3, kinkChord: 4.4, tipChord: 1.5, sweep: 25 },
      stab: { y: 34, span: 14.35, rootChord: 4, tipChord: 1.5, sweep: 30 },
      engines: [{ x: 4.9, w: 2.3, l: 3.9 }],
    },
    [
      { slug: "737-max-7", name: "737 MAX 7", icao: "B37M", firstFlight: 2018, length: 35.56, wingspan: 35.9, height: 12.3, mtow: 80.3, capacity: "153 passengers" },
      { slug: "737-max-8", name: "737 MAX 8", icao: "B38M", firstFlight: 2016, length: 39.52, wingspan: 35.9, height: 12.3, mtow: 82.2, capacity: "178 passengers" },
      { slug: "737-max-9", name: "737 MAX 9", icao: "B39M", firstFlight: 2017, length: 42.16, wingspan: 35.9, height: 12.3, mtow: 88.3, capacity: "193 passengers" },
      { slug: "737-max-10", name: "737 MAX 10", icao: "B3XM", firstFlight: 2021, length: 43.8, wingspan: 35.9, height: 12.3, mtow: 89.8, capacity: "204 passengers" },
    ],
  ),
  ...family(
    {
      family: "747",
      manufacturer: "Boeing",
      category: "widebody",
      baseLength: 70.66,
      cruise: 913,
      fuselage: { width: 6.5, noseLen: 8, tailLen: 21, tailWidth: 1.2 },
      wing: { y: 25, rootChord: 16.5, kinkFrac: 0.32, kinkChord: 9, tipChord: 3.2, sweep: 37.5 },
      stab: { y: 61, span: 22.17, rootChord: 7.5, tipChord: 2.8, sweep: 35 },
      engines: [
        { x: 11.5, w: 3, l: 6 },
        { x: 21, w: 3, l: 6 },
      ],
    },
    [
      { slug: "747-100", name: "747-100", icao: "B741", firstFlight: 1969, length: 70.66, wingspan: 59.64, height: 19.33, mtow: 333.4, capacity: "366 passengers", category: "historic" },
      { slug: "747-200b", name: "747-200B", icao: "B742", firstFlight: 1970, length: 70.66, wingspan: 59.64, height: 19.33, mtow: 377.8, capacity: "366 passengers", category: "historic" },
      { slug: "747-300", name: "747-300", icao: "B743", firstFlight: 1980, length: 70.66, wingspan: 59.64, height: 19.33, mtow: 377.8, capacity: "400 passengers", category: "historic" },
      { slug: "747sp", name: "747SP", icao: "B74S", firstFlight: 1975, length: 56.31, wingspan: 59.64, height: 20.06, mtow: 318.4, capacity: "276 passengers", category: "historic" },
      { slug: "747-400", name: "747-400", icao: "B744", firstFlight: 1988, length: 70.66, wingspan: 64.44, height: 19.41, mtow: 412.8, capacity: "416 passengers" },
      { slug: "747-8", name: "747-8 Intercontinental", icao: "B748", firstFlight: 2010, length: 76.25, wingspan: 68.4, height: 19.35, mtow: 447.7, capacity: "410 passengers", engines: [{ x: 11.5, w: 3.2, l: 6.2 }, { x: 21.5, w: 3.2, l: 6.2 }] },
      { slug: "747-8f", name: "747-8 Freighter", icao: "B748", firstFlight: 2010, length: 76.25, wingspan: 68.4, height: 19.35, mtow: 447.7, capacity: "137 t cargo", category: "cargo", engines: [{ x: 11.5, w: 3.2, l: 6.2 }, { x: 21.5, w: 3.2, l: 6.2 }] },
    ],
  ),
  ...family(
    {
      family: "757",
      manufacturer: "Boeing",
      category: "narrowbody",
      baseLength: 47.32,
      cruise: 850,
      fuselage: { width: 3.76, noseLen: 5, tailLen: 13, tailWidth: 0.8 },
      wing: { y: 17.5, rootChord: 8.5, kinkFrac: 0.3, kinkChord: 5, tipChord: 1.7, sweep: 25 },
      stab: { y: 41, span: 15.21, rootChord: 4.5, tipChord: 1.7, sweep: 30 },
      engines: [{ x: 5.5, w: 2.3, l: 4.5 }],
    },
    [
      { slug: "757-200", name: "757-200", icao: "B752", firstFlight: 1982, length: 47.32, wingspan: 38.05, height: 13.56, mtow: 115.7, capacity: "200 passengers" },
      { slug: "757-300", name: "757-300", icao: "B753", firstFlight: 1998, length: 54.43, wingspan: 38.05, height: 13.56, mtow: 123.6, capacity: "243 passengers" },
    ],
  ),
  ...family(
    {
      family: "767",
      manufacturer: "Boeing",
      category: "widebody",
      baseLength: 54.94,
      cruise: 851,
      fuselage: { width: 5.03, noseLen: 6, tailLen: 15, tailWidth: 1.0 },
      wing: { y: 19.5, rootChord: 11.5, kinkFrac: 0.3, kinkChord: 6.5, tipChord: 2.4, sweep: 31.5 },
      stab: { y: 47.5, span: 18.62, rootChord: 5.5, tipChord: 2.2, sweep: 33 },
      engines: [{ x: 8.2, w: 3.0, l: 5.5 }],
    },
    [
      { slug: "767-200er", name: "767-200ER", icao: "B762", firstFlight: 1981, length: 48.51, wingspan: 47.57, height: 15.85, mtow: 179.2, capacity: "181 passengers" },
      { slug: "767-300er", name: "767-300ER", icao: "B763", firstFlight: 1986, length: 54.94, wingspan: 47.57, height: 15.85, mtow: 186.9, capacity: "218 passengers" },
      { slug: "767-400er", name: "767-400ER", icao: "B764", firstFlight: 1999, length: 61.37, wingspan: 51.92, height: 16.87, mtow: 204.1, capacity: "245 passengers" },
    ],
  ),
  ...family(
    {
      family: "777",
      manufacturer: "Boeing",
      category: "widebody",
      baseLength: 63.73,
      cruise: 905,
      fuselage: { width: 6.2, noseLen: 7, tailLen: 19, tailWidth: 1.2 },
      wing: { y: 22.5, rootChord: 14, kinkFrac: 0.33, kinkChord: 8, tipChord: 2.7, sweep: 31.6 },
      stab: { y: 54, span: 21.5, rootChord: 7.5, tipChord: 2.8, sweep: 33 },
      engines: [{ x: 9.7, w: 3.9, l: 6.8 }],
    },
    [
      { slug: "777-200", name: "777-200", icao: "B772", firstFlight: 1994, length: 63.73, wingspan: 60.93, height: 18.5, mtow: 247.2, capacity: "313 passengers" },
      { slug: "777-200er", name: "777-200ER", icao: "B772", firstFlight: 1996, length: 63.73, wingspan: 60.93, height: 18.5, mtow: 297.5, capacity: "313 passengers" },
      { slug: "777-200lr", name: "777-200LR", icao: "B77L", firstFlight: 2005, length: 63.73, wingspan: 64.8, height: 18.6, mtow: 347.5, capacity: "317 passengers", engines: [{ x: 9.7, w: 4.2, l: 7 }] },
      { slug: "777f", name: "777 Freighter", icao: "B77L", firstFlight: 2008, length: 63.73, wingspan: 64.8, height: 18.6, mtow: 347.8, capacity: "102 t cargo", category: "cargo", engines: [{ x: 9.7, w: 4.2, l: 7 }] },
      { slug: "777-300", name: "777-300", icao: "B773", firstFlight: 1997, length: 73.86, wingspan: 60.93, height: 18.5, mtow: 299.4, capacity: "396 passengers" },
      { slug: "777-300er", name: "777-300ER", icao: "B77W", firstFlight: 2003, length: 73.86, wingspan: 64.8, height: 18.5, mtow: 351.5, capacity: "396 passengers", engines: [{ x: 9.7, w: 4.2, l: 7 }] },
    ],
  ),
  ...family(
    {
      family: "777X",
      manufacturer: "Boeing",
      category: "widebody",
      baseLength: 76.72,
      cruise: 905,
      fuselage: { width: 6.2, noseLen: 7, tailLen: 20, tailWidth: 1.2 },
      wing: { y: 26.5, rootChord: 15, kinkFrac: 0.3, kinkChord: 8.5, tipChord: 2.6, sweep: 32 },
      stab: { y: 66, span: 21.5, rootChord: 7.5, tipChord: 2.8, sweep: 33 },
      engines: [{ x: 10, w: 4.6, l: 7.5 }],
    },
    [
      { slug: "777-8", name: "777-8", icao: "B778", length: 70.86, wingspan: 71.75, height: 19.5, mtow: 351.5, capacity: "395 passengers" },
      { slug: "777-9", name: "777-9", icao: "B779", firstFlight: 2020, length: 76.72, wingspan: 71.75, height: 19.5, mtow: 351.5, capacity: "426 passengers" },
    ],
  ),
  ...family(
    {
      family: "787 Dreamliner",
      manufacturer: "Boeing",
      category: "widebody",
      baseLength: 62.81,
      cruise: 903,
      fuselage: { width: 5.77, noseLen: 6.5, tailLen: 18, tailWidth: 1.1 },
      wing: { y: 22, rootChord: 13, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.4, sweep: 32.2 },
      stab: { y: 54, span: 19.7, rootChord: 6.5, tipChord: 2.4, sweep: 33 },
      engines: [{ x: 9.5, w: 3.6, l: 6 }],
    },
    [
      { slug: "787-8", name: "787-8", icao: "B788", firstFlight: 2009, length: 56.72, wingspan: 60.12, height: 16.92, mtow: 227.9, capacity: "248 passengers" },
      { slug: "787-9", name: "787-9", icao: "B789", firstFlight: 2013, length: 62.81, wingspan: 60.12, height: 17.02, mtow: 254, capacity: "296 passengers" },
      { slug: "787-10", name: "787-10", icao: "B78X", firstFlight: 2017, length: 68.28, wingspan: 60.12, height: 17.02, mtow: 254, capacity: "336 passengers" },
    ],
  ),

  /* ===================== McDONNELL DOUGLAS / DOUGLAS ===================== */
  ...family(
    {
      family: "DC-9 / MD-80 / MD-90 / 717",
      tail: "t",
      manufacturer: "McDonnell Douglas",
      category: "narrowbody",
      baseLength: 36.37,
      cruise: 903,
      fuselage: { width: 3.35, noseLen: 4, tailLen: 11, tailWidth: 0.7 },
      wing: { y: 15, rootChord: 6.3, kinkFrac: 0.3, kinkChord: 4, tipChord: 1.4, sweep: 24 },
      stab: { y: 31.5, span: 11.23, rootChord: 3, tipChord: 1.3, sweep: 30 },
      engines: [{ x: 2.3, y: 28.5, w: 1.5, l: 4.2 }],
    },
    [
      { slug: "dc-9-30", name: "DC-9-30", icao: "DC93", firstFlight: 1966, length: 36.37, wingspan: 28.47, height: 8.38, mtow: 49.9, capacity: "115 passengers", category: "historic", manufacturer: "Douglas" },
      { slug: "dc-9-50", name: "DC-9-50", icao: "DC95", firstFlight: 1974, length: 40.72, wingspan: 28.47, height: 8.53, mtow: 54.9, capacity: "139 passengers", category: "historic" },
      { slug: "md-82", name: "MD-82", icao: "MD82", firstFlight: 1979, length: 45.06, wingspan: 32.87, height: 9.05, mtow: 67.8, capacity: "172 passengers" },
      { slug: "md-87", name: "MD-87", icao: "MD87", firstFlight: 1986, length: 39.75, wingspan: 32.87, height: 9.5, mtow: 63.5, capacity: "139 passengers" },
      { slug: "md-90-30", name: "MD-90-30", icao: "MD90", firstFlight: 1993, length: 46.5, wingspan: 32.87, height: 9.33, mtow: 70.8, capacity: "172 passengers", engines: [{ x: 2.4, y: 38.5, w: 1.9, l: 5 }] },
      { slug: "717-200", name: "717-200", icao: "B712", firstFlight: 1998, length: 37.8, wingspan: 28.47, height: 8.92, mtow: 54.9, capacity: "117 passengers", manufacturer: "Boeing", engines: [{ x: 2.4, y: 30, w: 1.9, l: 4.6 }] },
    ],
  ),
  ...family(
    {
      family: "DC-10 / MD-11",
      manufacturer: "McDonnell Douglas",
      category: "widebody",
      baseLength: 55.5,
      cruise: 908,
      fuselage: { width: 6.02, noseLen: 7, tailLen: 16, tailWidth: 1.8 },
      wing: { y: 21, rootChord: 12, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.5, sweep: 35 },
      stab: { y: 47, span: 21.7, rootChord: 6, tipChord: 2.5, sweep: 35 },
      engines: [
        { x: 9.5, w: 3.0, l: 5.5 },
        { x: 0, y: 49, w: 3.0, l: 7 },
      ],
    },
    [
      { slug: "dc-10-30", name: "DC-10-30", icao: "DC10", firstFlight: 1970, length: 55.5, wingspan: 50.4, height: 17.7, mtow: 259.5, capacity: "270 passengers", category: "historic" },
      { slug: "md-11", name: "MD-11", icao: "MD11", firstFlight: 1990, length: 61.2, wingspan: 51.7, height: 17.6, mtow: 285.9, capacity: "298 passengers", cruise: 876 },
    ],
  ),
  ...family(
    {
      family: "L-1011 TriStar",
      manufacturer: "Lockheed",
      category: "historic",
      baseLength: 54.17,
      cruise: 890,
      fuselage: { width: 5.97, noseLen: 7, tailLen: 16, tailWidth: 1.6 },
      wing: { y: 20.5, rootChord: 12, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.5, sweep: 35 },
      stab: { y: 46, span: 21.8, rootChord: 6, tipChord: 2.5, sweep: 35 },
      engines: [
        { x: 9.2, w: 3.0, l: 5.5 },
        { x: 0, y: 48, w: 2.6, l: 6 },
      ],
    },
    [{ slug: "l-1011", name: "L-1011 TriStar", icao: "L101", firstFlight: 1970, length: 54.17, wingspan: 47.34, height: 16.87, mtow: 195, capacity: "256 passengers" }],
  ),

  /* ============================== REGIONAL ============================== */
  ...family(
    {
      family: "E-Jets",
      manufacturer: "Embraer",
      category: "regional",
      baseLength: 36.24,
      cruise: 829,
      fuselage: { width: 3.01, noseLen: 4, tailLen: 11, tailWidth: 0.7 },
      wing: { y: 14, rootChord: 5.5, kinkFrac: 0.3, kinkChord: 3.5, tipChord: 1.2, sweep: 25 },
      stab: { y: 31.5, span: 12.0, rootChord: 3.3, tipChord: 1.2, sweep: 30 },
      engines: [{ x: 5.0, w: 1.9, l: 3.4 }],
    },
    [
      { slug: "e170", name: "E170", icao: "E170", firstFlight: 2002, length: 29.9, wingspan: 26.0, height: 9.85, mtow: 38.6, capacity: "72 passengers" },
      { slug: "e175", name: "E175", icao: "E75L", firstFlight: 2003, length: 31.68, wingspan: 28.65, height: 9.86, mtow: 40.37, capacity: "78 passengers" },
      { slug: "e190", name: "E190", icao: "E190", firstFlight: 2004, length: 36.24, wingspan: 28.72, height: 10.57, mtow: 51.8, capacity: "100 passengers" },
      { slug: "e195", name: "E195", icao: "E195", firstFlight: 2004, length: 38.65, wingspan: 28.72, height: 10.55, mtow: 52.29, capacity: "118 passengers" },
    ],
  ),
  ...family(
    {
      family: "E-Jets E2",
      manufacturer: "Embraer",
      category: "regional",
      baseLength: 36.24,
      cruise: 829,
      fuselage: { width: 3.01, noseLen: 4, tailLen: 11, tailWidth: 0.7 },
      wing: { y: 14, rootChord: 6, kinkFrac: 0.3, kinkChord: 3.6, tipChord: 1.2, sweep: 27 },
      stab: { y: 31.5, span: 12.0, rootChord: 3.4, tipChord: 1.2, sweep: 30 },
      engines: [{ x: 5.3, w: 2.1, l: 3.6 }],
    },
    [
      { slug: "e175-e2", name: "E175-E2", icao: "E275", firstFlight: 2019, length: 32.4, wingspan: 31.0, height: 9.98, mtow: 44.8, capacity: "88 passengers" },
      { slug: "e190-e2", name: "E190-E2", icao: "E290", firstFlight: 2016, length: 36.24, wingspan: 33.72, height: 10.96, mtow: 56.4, capacity: "106 passengers" },
      { slug: "e195-e2", name: "E195-E2", icao: "E295", firstFlight: 2017, length: 41.5, wingspan: 35.12, height: 10.9, mtow: 61.5, capacity: "132 passengers" },
    ],
  ),
  ...family(
    {
      family: "CRJ",
      tail: "t",
      manufacturer: "Bombardier",
      category: "regional",
      baseLength: 36.2,
      cruise: 829,
      fuselage: { width: 2.69, noseLen: 3.5, tailLen: 10, tailWidth: 0.6 },
      wing: { y: 15, rootChord: 4.5, kinkFrac: 0.3, kinkChord: 3, tipChord: 1.1, sweep: 26 },
      stab: { y: 32, span: 8.5, rootChord: 2.8, tipChord: 1.2, sweep: 30 },
      engines: [{ x: 2.3, y: 27, w: 1.7, l: 4 }],
    },
    [
      { slug: "crj200", name: "CRJ200", icao: "CRJ2", firstFlight: 1991, length: 26.77, wingspan: 21.21, height: 6.22, mtow: 23.1, capacity: "50 passengers", engines: [{ x: 2.1, y: 19.5, w: 1.4, l: 3.6 }] },
      { slug: "crj700", name: "CRJ700", icao: "CRJ7", firstFlight: 1999, length: 32.3, wingspan: 23.24, height: 7.57, mtow: 33.0, capacity: "70 passengers" },
      { slug: "crj900", name: "CRJ900", icao: "CRJ9", firstFlight: 2001, length: 36.2, wingspan: 24.85, height: 7.5, mtow: 38.3, capacity: "90 passengers" },
      { slug: "crj1000", name: "CRJ1000", icao: "CRJX", firstFlight: 2008, length: 39.1, wingspan: 26.18, height: 7.5, mtow: 41.6, capacity: "104 passengers" },
    ],
  ),
  ...family(
    {
      family: "ATR",
      wingPos: "high",
      manufacturer: "ATR",
      category: "regional",
      baseLength: 27.17,
      cruise: 510,
      fuselage: { width: 2.87, noseLen: 3, tailLen: 8, tailWidth: 0.6 },
      wing: { y: 10, rootChord: 2.6, kinkFrac: 0.5, kinkChord: 2.4, tipChord: 1.6, sweep: 0 },
      stab: { y: 24, span: 7.3, rootChord: 1.8, tipChord: 1.2, sweep: 5 },
      engines: [{ x: 4.1, w: 1.2, l: 3.6, prop: 3.93 }],
    },
    [
      { slug: "atr42-600", name: "ATR 42-600", icao: "AT46", firstFlight: 1984, length: 22.67, wingspan: 24.57, height: 7.59, mtow: 18.6, capacity: "48 passengers", cruise: 556 },
      { slug: "atr72-600", name: "ATR 72-600", icao: "AT76", firstFlight: 1988, length: 27.17, wingspan: 27.05, height: 7.65, mtow: 23, capacity: "72 passengers" },
    ],
  ),
  ...family(
    {
      family: "Dash 8",
      tail: "t",
      wingPos: "high",
      manufacturer: "De Havilland Canada",
      category: "regional",
      baseLength: 32.8,
      cruise: 667,
      fuselage: { width: 2.69, noseLen: 3.5, tailLen: 9, tailWidth: 0.6 },
      wing: { y: 12.5, rootChord: 3, kinkFrac: 0.5, kinkChord: 2.6, tipChord: 1.6, sweep: 0 },
      stab: { y: 29.5, span: 8.4, rootChord: 2, tipChord: 1.3, sweep: 8 },
      engines: [{ x: 4.4, w: 1.2, l: 4.2, prop: 4.1 }],
    },
    [
      { slug: "dash8-100", name: "Dash 8-100", icao: "DH8A", firstFlight: 1983, length: 22.25, wingspan: 25.91, height: 7.49, mtow: 15.65, capacity: "37 passengers", cruise: 500, engines: [{ x: 4.0, w: 1.1, l: 3.6, prop: 3.96 }] },
      { slug: "dash8-300", name: "Dash 8-300", icao: "DH8C", firstFlight: 1987, length: 25.68, wingspan: 27.43, height: 7.49, mtow: 19.5, capacity: "50 passengers", cruise: 528, engines: [{ x: 4.2, w: 1.1, l: 3.6, prop: 3.96 }] },
      { slug: "q400", name: "Dash 8 Q400", icao: "DH8D", firstFlight: 1998, length: 32.8, wingspan: 28.42, height: 8.3, mtow: 29.6, capacity: "78 passengers" },
    ],
  ),
  ...family(
    {
      family: "Superjet",
      manufacturer: "Sukhoi",
      category: "regional",
      baseLength: 29.94,
      cruise: 828,
      fuselage: { width: 3.24, noseLen: 4, tailLen: 9, tailWidth: 0.7 },
      wing: { y: 11.5, rootChord: 5.5, kinkFrac: 0.3, kinkChord: 3.4, tipChord: 1.2, sweep: 25 },
      stab: { y: 25.5, span: 10.1, rootChord: 3.2, tipChord: 1.2, sweep: 30 },
      engines: [{ x: 4.6, w: 2.0, l: 3.5 }],
    },
    [{ slug: "ssj100", name: "Superjet 100", icao: "SU95", firstFlight: 2008, length: 29.94, wingspan: 27.8, height: 10.28, mtow: 45.88, capacity: "98 passengers" }],
  ),
  ...family(
    {
      family: "ARJ21",
      tail: "t",
      manufacturer: "COMAC",
      category: "regional",
      baseLength: 33.46,
      cruise: 828,
      fuselage: { width: 3.14, noseLen: 4, tailLen: 10, tailWidth: 0.7 },
      wing: { y: 13.5, rootChord: 5.5, kinkFrac: 0.3, kinkChord: 3.5, tipChord: 1.3, sweep: 25 },
      stab: { y: 29.5, span: 10.7, rootChord: 3, tipChord: 1.2, sweep: 30 },
      engines: [{ x: 2.3, y: 25.5, w: 1.7, l: 4.2 }],
    },
    [{ slug: "arj21-700", name: "ARJ21-700", icao: "AJ27", firstFlight: 2008, length: 33.46, wingspan: 27.29, height: 8.44, mtow: 40.5, capacity: "90 passengers" }],
  ),

  /* ===================== OTHER NARROW- & WIDE-BODIES ===================== */
  ...family(
    {
      family: "C919",
      manufacturer: "COMAC",
      category: "narrowbody",
      baseLength: 38.9,
      cruise: 834,
      fuselage: { width: 3.96, noseLen: 4.5, tailLen: 11.5, tailWidth: 0.8 },
      wing: { y: 14.2, rootChord: 7.6, kinkFrac: 0.3, kinkChord: 4.5, tipChord: 1.6, sweep: 25 },
      stab: { y: 33.5, span: 12.9, rootChord: 4, tipChord: 1.5, sweep: 30 },
      engines: [{ x: 5.7, w: 2.5, l: 4 }],
    },
    [{ slug: "c919", name: "C919", icao: "C919", firstFlight: 2017, length: 38.9, wingspan: 35.8, height: 11.95, mtow: 77.3, capacity: "158 passengers" }],
  ),
  ...family(
    {
      family: "MC-21",
      manufacturer: "Yakovlev (Irkut)",
      category: "narrowbody",
      baseLength: 42.2,
      cruise: 870,
      fuselage: { width: 4.06, noseLen: 4.6, tailLen: 12, tailWidth: 0.8 },
      wing: { y: 15.5, rootChord: 7.8, kinkFrac: 0.3, kinkChord: 4.6, tipChord: 1.6, sweep: 27 },
      stab: { y: 36.5, span: 13.4, rootChord: 4.2, tipChord: 1.5, sweep: 30 },
      engines: [{ x: 5.8, w: 2.6, l: 4.2 }],
    },
    [{ slug: "mc-21-300", name: "MC-21-300", icao: "MC23", firstFlight: 2017, length: 42.2, wingspan: 35.9, height: 11.5, mtow: 79.25, capacity: "163 passengers" }],
  ),
  ...family(
    {
      family: "Tu-154",
      tail: "t",
      manufacturer: "Tupolev",
      category: "historic",
      baseLength: 47.9,
      cruise: 900,
      fuselage: { width: 3.8, noseLen: 4.8, tailLen: 12, tailWidth: 1.5 },
      wing: { y: 17.5, rootChord: 9.5, kinkFrac: 0.3, kinkChord: 5.5, tipChord: 1.8, sweep: 35 },
      stab: { y: 41, span: 13.4, rootChord: 4.5, tipChord: 1.6, sweep: 40 },
      engines: [
        { x: 2.7, y: 40, w: 1.6, l: 6 },
        { x: 0, y: 44, w: 1.6, l: 5 },
      ],
    },
    [{ slug: "tu-154m", name: "Tu-154M", icao: "T154", firstFlight: 1968, length: 47.9, wingspan: 37.55, height: 11.4, mtow: 104, capacity: "180 passengers" }],
  ),
  ...family(
    {
      family: "Tu-204",
      manufacturer: "Tupolev",
      category: "narrowbody",
      baseLength: 46.1,
      cruise: 850,
      fuselage: { width: 3.8, noseLen: 4.8, tailLen: 12.5, tailWidth: 0.8 },
      wing: { y: 17, rootChord: 8.5, kinkFrac: 0.3, kinkChord: 5, tipChord: 1.7, sweep: 28 },
      stab: { y: 40, span: 15.2, rootChord: 4.5, tipChord: 1.7, sweep: 30 },
      engines: [{ x: 5.6, w: 2.3, l: 4.6 }],
    },
    [{ slug: "tu-204", name: "Tu-204-100", icao: "T204", firstFlight: 1989, length: 46.1, wingspan: 41.8, height: 13.9, mtow: 103, capacity: "210 passengers" }],
  ),
  ...family(
    {
      family: "Il-96",
      manufacturer: "Ilyushin",
      category: "widebody",
      baseLength: 55.3,
      cruise: 850,
      fuselage: { width: 6.08, noseLen: 7, tailLen: 16, tailWidth: 1.1 },
      wing: { y: 20, rootChord: 12.5, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.6, sweep: 30 },
      stab: { y: 47, span: 20.6, rootChord: 6, tipChord: 2.4, sweep: 33 },
      engines: [
        { x: 9, w: 2.8, l: 5.5 },
        { x: 16.5, w: 2.8, l: 5.5 },
      ],
    },
    [{ slug: "il-96-300", name: "Il-96-300", icao: "IL96", firstFlight: 1988, length: 55.3, wingspan: 60.1, height: 17.55, mtow: 250, capacity: "262 passengers" }],
  ),

  /* ============================== SUPERSONIC ============================== */
  ...family(
    {
      family: "Concorde",
      manufacturer: "Aérospatiale / BAC",
      category: "supersonic",
      baseLength: 61.66,
      cruise: 2179,
      fuselage: { width: 2.88, noseLen: 12, tailLen: 12, tailWidth: 0.5 },
      wing: { y: 20, rootChord: 34, kinkFrac: 0.42, kinkChord: 16, tipChord: 2.5, sweep: 50, innerSweep: 74 },
      stab: { y: 55, span: 0, rootChord: 1, tipChord: 1, sweep: 0 },
      engines: [{ x: 5.4, y: 49, w: 3.4, l: 13 }],
    },
    [{ slug: "concorde", name: "Concorde", icao: "CONC", firstFlight: 1969, length: 61.66, wingspan: 25.6, height: 12.2, mtow: 185, capacity: "100 passengers" }],
  ),
  ...family(
    {
      family: "Tu-144",
      manufacturer: "Tupolev",
      category: "supersonic",
      baseLength: 65.7,
      cruise: 2300,
      fuselage: { width: 3.3, noseLen: 13, tailLen: 12, tailWidth: 0.6 },
      wing: { y: 20, rootChord: 38, kinkFrac: 0.4, kinkChord: 18, tipChord: 2.5, sweep: 55, innerSweep: 76 },
      stab: { y: 58, span: 0, rootChord: 1, tipChord: 1, sweep: 0 },
      engines: [{ x: 3.6, y: 51, w: 3.6, l: 15 }],
    },
    [{ slug: "tu-144", name: "Tu-144", icao: "T144", firstFlight: 1968, length: 65.7, wingspan: 28.8, height: 12.5, mtow: 207, capacity: "140 passengers" }],
  ),

  /* ============================== CARGO ============================== */
  ...family(
    {
      family: "Antonov heavy lifters",
      wingPos: "high",
      manufacturer: "Antonov",
      category: "cargo",
      baseLength: 84.0,
      cruise: 800,
      fuselage: { width: 6.4, noseLen: 9, tailLen: 25, tailWidth: 1.2 },
      wing: { y: 30, rootChord: 16, kinkFrac: 0.4, kinkChord: 8, tipChord: 3, sweep: 33 },
      stab: { y: 70, span: 32.65, rootChord: 8, tipChord: 3.5, sweep: 30 },
      engines: [
        { x: 9, w: 2.6, l: 6 },
        { x: 16, w: 2.6, l: 6 },
        { x: 23, w: 2.6, l: 6 },
      ],
    },
    [
      { slug: "an-124", tail: "t", name: "An-124 Ruslan", icao: "A124", firstFlight: 1982, length: 69.1, wingspan: 73.3, height: 21.08, mtow: 402, capacity: "150 t cargo", fuselage: { width: 7.3, noseLen: 8, tailLen: 20, tailWidth: 1.2 }, stab: { span: 24.5 }, engines: [{ x: 10.5, w: 2.8, l: 6 }, { x: 19, w: 2.8, l: 6 }] },
      { slug: "an-225", name: "An-225 Mriya", icao: "A225", firstFlight: 1988, length: 84.0, wingspan: 88.4, height: 18.1, mtow: 640, capacity: "250 t cargo" },
    ],
  ),
  ...family(
    {
      family: "Il-76",
      tail: "t",
      wingPos: "high",
      manufacturer: "Ilyushin",
      category: "cargo",
      baseLength: 46.6,
      cruise: 800,
      fuselage: { width: 4.8, noseLen: 5, tailLen: 14, tailWidth: 1.0 },
      wing: { y: 17, rootChord: 9.5, kinkFrac: 0.35, kinkChord: 6, tipChord: 2.6, sweep: 25 },
      stab: { y: 40, span: 17.4, rootChord: 4.5, tipChord: 2, sweep: 30 },
      engines: [
        { x: 7, w: 2.2, l: 5 },
        { x: 13.5, w: 2.2, l: 5 },
      ],
    },
    [{ slug: "il-76td", name: "Il-76TD", icao: "IL76", firstFlight: 1971, length: 46.6, wingspan: 50.5, height: 14.76, mtow: 190, capacity: "50 t cargo" }],
  ),

  /* ============================== MILITARY ============================== */
  ...family(
    {
      family: "C-130 Hercules",
      wingPos: "high",
      manufacturer: "Lockheed Martin",
      category: "military",
      baseLength: 29.8,
      cruise: 660,
      fuselage: { width: 4.3, noseLen: 3.5, tailLen: 10, tailWidth: 0.8 },
      wing: { y: 11, rootChord: 4.9, kinkFrac: 0.45, kinkChord: 4.4, tipChord: 2.3, sweep: 0 },
      stab: { y: 26, span: 16, rootChord: 3, tipChord: 1.5, sweep: 5 },
      engines: [
        { x: 5, w: 1.5, l: 5, prop: 4.1 },
        { x: 10, w: 1.5, l: 5, prop: 4.1 },
      ],
    },
    [
      { slug: "c-130j", name: "C-130J Super Hercules", icao: "C30J", firstFlight: 1996, length: 29.8, wingspan: 40.4, height: 11.8, mtow: 74.4, capacity: "92 troops / 19 t cargo" },
      { slug: "c-130j-30", name: "C-130J-30", icao: "C30J", firstFlight: 1996, length: 34.4, wingspan: 40.4, height: 11.8, mtow: 74.4, capacity: "128 troops / 20 t cargo" },
    ],
  ),
  ...family(
    {
      family: "A400M",
      wingPos: "high",
      manufacturer: "Airbus",
      category: "military",
      baseLength: 45.1,
      cruise: 780,
      fuselage: { width: 5.64, noseLen: 5, tailLen: 14, tailWidth: 1.2 },
      wing: { y: 16.5, rootChord: 8, kinkFrac: 0.4, kinkChord: 6, tipChord: 2.8, sweep: 15 },
      stab: { y: 38.5, span: 19, rootChord: 4.5, tipChord: 2, sweep: 20 },
      engines: [
        { x: 6.5, w: 2.0, l: 6, prop: 5.3 },
        { x: 12.5, w: 2.0, l: 6, prop: 5.3 },
      ],
    },
    [{ slug: "a400m", name: "A400M Atlas", icao: "A400", firstFlight: 2009, length: 45.1, wingspan: 42.4, height: 14.7, mtow: 141, capacity: "116 troops / 37 t cargo" }],
  ),
  ...family(
    {
      family: "C-17",
      tail: "t",
      wingPos: "high",
      manufacturer: "Boeing",
      category: "military",
      baseLength: 53.0,
      cruise: 830,
      fuselage: { width: 6.9, noseLen: 6, tailLen: 16, tailWidth: 1.5 },
      wing: { y: 19, rootChord: 11, kinkFrac: 0.35, kinkChord: 7, tipChord: 2.5, sweep: 25 },
      stab: { y: 44, span: 19.8, rootChord: 5, tipChord: 2.2, sweep: 25 },
      engines: [
        { x: 10.5, w: 3, l: 5.5 },
        { x: 17.5, w: 3, l: 5.5 },
      ],
    },
    [{ slug: "c-17", name: "C-17 Globemaster III", icao: "C17", firstFlight: 1991, length: 53.0, wingspan: 51.75, height: 16.8, mtow: 265, capacity: "77 t cargo" }],
  ),
  ...family(
    {
      family: "C-5 Galaxy",
      tail: "t",
      wingPos: "high",
      manufacturer: "Lockheed",
      category: "military",
      baseLength: 75.31,
      cruise: 833,
      fuselage: { width: 7.5, noseLen: 9, tailLen: 22, tailWidth: 1.6 },
      wing: { y: 27, rootChord: 15, kinkFrac: 0.35, kinkChord: 8.5, tipChord: 3.2, sweep: 25 },
      stab: { y: 63, span: 20.9, rootChord: 6.5, tipChord: 2.8, sweep: 25 },
      engines: [
        { x: 12, w: 2.8, l: 6 },
        { x: 21.5, w: 2.8, l: 6 },
      ],
    },
    [{ slug: "c-5m", name: "C-5M Super Galaxy", icao: "C5M", firstFlight: 1968, length: 75.31, wingspan: 67.89, height: 19.84, mtow: 381, capacity: "122 t cargo" }],
  ),
  ...family(
    {
      family: "B-52",
      manufacturer: "Boeing",
      category: "military",
      baseLength: 48.5,
      cruise: 819,
      fuselage: { width: 3.5, noseLen: 5, tailLen: 14, tailWidth: 0.8 },
      wing: { y: 14, rootChord: 12, kinkFrac: 0.3, kinkChord: 7, tipChord: 2.4, sweep: 35 },
      stab: { y: 41, span: 15.9, rootChord: 4, tipChord: 1.8, sweep: 35 },
      engines: [
        { x: 9.5, w: 2.6, l: 5.5 },
        { x: 16.5, w: 2.6, l: 5.5 },
      ],
    },
    [{ slug: "b-52h", name: "B-52H Stratofortress", icao: "B52", firstFlight: 1952, length: 48.5, wingspan: 56.4, height: 12.4, mtow: 220, capacity: "5 crew / 32 t weapons" }],
  ),
  ...family(
    {
      family: "SR-71",
      wingPos: "mid",
      manufacturer: "Lockheed",
      category: "military",
      baseLength: 32.74,
      cruise: 3540,
      fuselage: { width: 1.9, noseLen: 8, tailLen: 6, tailWidth: 1.2 },
      wing: { y: 14, rootChord: 17, kinkFrac: 0.5, kinkChord: 9, tipChord: 1.5, sweep: 52, innerSweep: 66 },
      stab: { y: 30, span: 0, rootChord: 1, tipChord: 1, sweep: 0 },
      engines: [{ x: 4.3, y: 25, w: 1.9, l: 14 }],
    },
    [{ slug: "sr-71", name: "SR-71 Blackbird", icao: "SR71", firstFlight: 1964, length: 32.74, wingspan: 16.94, height: 5.64, mtow: 78, capacity: "2 crew" }],
  ),
  ...family(
    {
      family: "Fighters",
      wingPos: "mid",
      manufacturer: "Various",
      category: "military",
      baseLength: 15.06,
      cruise: 2120,
      fuselage: { width: 1.5, noseLen: 2.2, tailLen: 3, tailWidth: 0.9 },
      wing: { y: 5.2, rootChord: 6.8, kinkFrac: 0.3, kinkChord: 4.2, tipChord: 1.1, sweep: 40, innerSweep: 62 },
      stab: { y: 12.5, span: 5.6, rootChord: 2.3, tipChord: 0.9, sweep: 40 },
      engines: [],
    },
    [
      { slug: "f-16", name: "F-16 Fighting Falcon", icao: "F16", firstFlight: 1974, length: 15.06, wingspan: 9.96, height: 4.88, mtow: 19.2, capacity: "1 crew", manufacturer: "General Dynamics / Lockheed Martin" },
      {
        slug: "f-22", name: "F-22 Raptor", icao: "F22", firstFlight: 1997, length: 18.92, wingspan: 13.56, height: 5.08, mtow: 38, capacity: "1 crew", cruise: 1963, manufacturer: "Lockheed Martin",
        fuselage: { width: 2.6, noseLen: 5, tailLen: 3.5, tailWidth: 1.8 },
        wing: { y: 7.2, rootChord: 8.5, kinkFrac: 0.25, kinkChord: 5.5, tipChord: 1.3, sweep: 42, innerSweep: 55 },
        stab: { y: 14.5, span: 8.9, rootChord: 3.4, tipChord: 1.2, sweep: 42 },
      },
      {
        slug: "f-35a", name: "F-35A Lightning II", icao: "F35", firstFlight: 2006, length: 15.67, wingspan: 10.7, height: 4.38, mtow: 31.8, capacity: "1 crew", cruise: 1930, manufacturer: "Lockheed Martin",
        fuselage: { width: 2.4, noseLen: 4, tailLen: 3, tailWidth: 1.6 },
        wing: { y: 6.2, rootChord: 7.2, kinkFrac: 0.25, kinkChord: 4.6, tipChord: 1.2, sweep: 35, innerSweep: 50 },
        stab: { y: 12.6, span: 6.9, rootChord: 2.8, tipChord: 1.0, sweep: 35 },
      },
      {
        slug: "f-15e", name: "F-15E Strike Eagle", icao: "F15", firstFlight: 1972, length: 19.43, wingspan: 13.05, height: 5.63, mtow: 36.7, capacity: "2 crew", cruise: 2655, manufacturer: "McDonnell Douglas / Boeing",
        fuselage: { width: 2.4, noseLen: 4.5, tailLen: 3.5, tailWidth: 2.0 },
        wing: { y: 7.5, rootChord: 8, kinkFrac: 0.3, kinkChord: 5, tipChord: 1.5, sweep: 45, innerSweep: 45 },
        stab: { y: 15.5, span: 8.6, rootChord: 3.4, tipChord: 1.2, sweep: 50 },
      },
      {
        slug: "su-27", name: "Su-27 Flanker", icao: "SU27", firstFlight: 1977, length: 21.9, wingspan: 14.7, height: 5.92, mtow: 30.45, capacity: "1 crew", cruise: 2500, manufacturer: "Sukhoi",
        fuselage: { width: 2.2, noseLen: 5, tailLen: 5, tailWidth: 2.2 },
        wing: { y: 8.5, rootChord: 8.5, kinkFrac: 0.3, kinkChord: 5.5, tipChord: 1.4, sweep: 42, innerSweep: 42 },
        stab: { y: 17, span: 9.9, rootChord: 3.6, tipChord: 1.2, sweep: 45 },
      },
    ],
  ),

  /* ===================== BUSINESS & GENERAL AVIATION ===================== */
  ...family(
    {
      family: "Large-cabin business jets",
      tail: "t",
      manufacturer: "Gulfstream",
      category: "business",
      baseLength: 30.41,
      cruise: 904,
      fuselage: { width: 2.6, noseLen: 3.5, tailLen: 8.5, tailWidth: 0.5 },
      wing: { y: 12.5, rootChord: 4.8, kinkFrac: 0.35, kinkChord: 3.3, tipChord: 1.2, sweep: 36 },
      stab: { y: 26.5, span: 10.8, rootChord: 2.8, tipChord: 1.2, sweep: 33 },
      engines: [{ x: 2.3, y: 24, w: 1.6, l: 3.8 }],
    },
    [
      { slug: "g650er", name: "G650ER", icao: "GLF6", firstFlight: 2009, length: 30.41, wingspan: 30.36, height: 7.82, mtow: 47.1, capacity: "19 passengers" },
      { slug: "g700", name: "G700", icao: "GA7C", firstFlight: 2020, length: 33.48, wingspan: 31.39, height: 7.75, mtow: 48.8, capacity: "19 passengers", cruise: 956 },
      { slug: "global-7500", name: "Global 7500", icao: "GL7T", firstFlight: 2016, length: 33.8, wingspan: 31.7, height: 8.2, mtow: 48.2, capacity: "19 passengers", cruise: 956, manufacturer: "Bombardier", fuselage: { width: 2.7 } },
      { slug: "falcon-8x", tail: "cruciform", name: "Falcon 8X", icao: "FA8X", firstFlight: 2015, length: 24.46, wingspan: 26.29, height: 7.94, mtow: 33.1, capacity: "16 passengers", cruise: 900, manufacturer: "Dassault", engines: [{ x: 2.0, y: 18.5, w: 1.3, l: 3.4 }, { x: 0, y: 20, w: 1.3, l: 3.2 }] },
    ],
  ),
  ...family(
    {
      family: "Light jets",
      tail: "t",
      manufacturer: "Cessna",
      category: "business",
      baseLength: 16.26,
      cruise: 835,
      fuselage: { width: 1.7, noseLen: 2.4, tailLen: 5, tailWidth: 0.4 },
      wing: { y: 7, rootChord: 2.8, kinkFrac: 0.35, kinkChord: 2.1, tipChord: 0.9, sweep: 15 },
      stab: { y: 14, span: 6.2, rootChord: 1.6, tipChord: 0.8, sweep: 25 },
      engines: [{ x: 1.4, y: 12.3, w: 1.1, l: 2.6 }],
    },
    [
      { slug: "citation-cj4", name: "Citation CJ4", icao: "C25C", firstFlight: 2008, length: 16.26, wingspan: 15.49, height: 4.65, mtow: 7.76, capacity: "10 passengers" },
      { slug: "phenom-300", name: "Phenom 300E", icao: "E55P", firstFlight: 2008, length: 15.9, wingspan: 16.2, height: 5.1, mtow: 8.4, capacity: "10 passengers", cruise: 839, manufacturer: "Embraer" },
    ],
  ),
  ...family(
    {
      family: "Turboprops",
      tail: "t",
      manufacturer: "Beechcraft",
      category: "general-aviation",
      baseLength: 14.22,
      cruise: 578,
      fuselage: { width: 1.5, noseLen: 2, tailLen: 5, tailWidth: 0.35 },
      wing: { y: 5.2, rootChord: 2.3, kinkFrac: 0.5, kinkChord: 1.9, tipChord: 1.1, sweep: 3 },
      stab: { y: 12.5, span: 5.6, rootChord: 1.3, tipChord: 0.7, sweep: 15 },
      engines: [{ x: 2.6, w: 0.9, l: 3.2, prop: 2.67 }],
    },
    [
      { slug: "king-air-350", name: "King Air 350", icao: "B350", firstFlight: 1988, length: 14.22, wingspan: 17.65, height: 4.37, mtow: 6.8, capacity: "11 passengers" },
      { slug: "pc-12", tail: "conventional", name: "PC-12 NGX", icao: "PC12", firstFlight: 1991, length: 14.4, wingspan: 16.28, height: 4.26, mtow: 4.74, capacity: "9 passengers", cruise: 528, manufacturer: "Pilatus", fuselage: { width: 1.7 }, engines: [{ x: 0, y: 1.2, w: 0, l: 0, prop: 2.67 }] },
    ],
  ),
  ...family(
    {
      family: "Light aircraft",
      wingPos: "high",
      manufacturer: "Cessna",
      category: "general-aviation",
      baseLength: 8.28,
      cruise: 226,
      fuselage: { width: 1.05, noseLen: 1.0, tailLen: 3.5, tailWidth: 0.25 },
      wing: { y: 2.4, rootChord: 1.63, kinkFrac: 0.6, kinkChord: 1.63, tipChord: 1.15, sweep: 0 },
      stab: { y: 7.3, span: 3.4, rootChord: 1.0, tipChord: 0.6, sweep: 5 },
      engines: [{ x: 0, y: 0.6, w: 0, l: 0, prop: 1.9 }],
    },
    [
      { slug: "cessna-172", name: "172 Skyhawk", icao: "C172", firstFlight: 1955, length: 8.28, wingspan: 11.0, height: 2.72, mtow: 1.111, capacity: "4 seats" },
      { slug: "cessna-182", name: "182 Skylane", icao: "C182", firstFlight: 1956, length: 8.84, wingspan: 11.0, height: 2.84, mtow: 1.406, capacity: "4 seats", cruise: 269 },
      { slug: "pa-28", wingPos: "low", name: "PA-28 Cherokee", icao: "P28A", firstFlight: 1960, length: 7.25, wingspan: 10.8, height: 2.2, mtow: 1.16, capacity: "4 seats", cruise: 230, manufacturer: "Piper", wing: { rootChord: 1.6, kinkChord: 1.6, tipChord: 1.6, kinkFrac: 0.5 } },
      { slug: "sr22", wingPos: "low", name: "SR22", icao: "SR22", firstFlight: 2001, length: 7.92, wingspan: 11.68, height: 2.7, mtow: 1.633, capacity: "4 seats", cruise: 340, manufacturer: "Cirrus" },
      { slug: "da40", wingPos: "low", name: "DA40 NG", icao: "DA40", firstFlight: 1997, length: 8.06, wingspan: 11.63, height: 1.97, mtow: 1.28, capacity: "4 seats", cruise: 280, manufacturer: "Diamond", wing: { rootChord: 1.4, kinkChord: 1.3, tipChord: 0.9, kinkFrac: 0.6 } },
    ],
  ),

  /* ============================== HISTORIC ============================== */
  ...family(
    {
      family: "Propliners",
      manufacturer: "Douglas",
      category: "historic",
      baseLength: 19.7,
      cruise: 333,
      fuselage: { width: 2.4, noseLen: 2.5, tailLen: 7, tailWidth: 0.4 },
      wing: { y: 6, rootChord: 4.3, kinkFrac: 0.3, kinkChord: 3.3, tipChord: 1.3, sweep: 10 },
      stab: { y: 17, span: 8.5, rootChord: 2, tipChord: 1.2, sweep: 8 },
      engines: [{ x: 3.4, w: 1.4, l: 3.2, prop: 3.5 }],
    },
    [
      { slug: "dc-3", name: "DC-3", icao: "DC3", firstFlight: 1935, length: 19.7, wingspan: 29.0, height: 5.16, mtow: 11.4, capacity: "32 passengers" },
      {
        slug: "ju-52", name: "Ju 52/3m", icao: "JU52", firstFlight: 1930, length: 18.9, wingspan: 29.25, height: 4.5, mtow: 10.5, capacity: "17 passengers", cruise: 250, manufacturer: "Junkers",
        fuselage: { width: 2.0, noseLen: 1.6, tailLen: 7, tailWidth: 0.5 },
        wing: { y: 5.5, rootChord: 4.6, kinkFrac: 0.4, kinkChord: 3.6, tipChord: 1.6, sweep: 4 },
        engines: [{ x: 3.7, w: 1.4, l: 2.8, prop: 3.0 }, { x: 0, y: 1.4, w: 0, l: 0, prop: 3.0 }],
      },
      {
        slug: "l-1049", name: "L-1049 Super Constellation", icao: "CONI", firstFlight: 1950, length: 34.62, wingspan: 37.49, height: 7.54, mtow: 62.4, capacity: "95 passengers", cruise: 547, manufacturer: "Lockheed",
        fuselage: { width: 3.4, noseLen: 4, tailLen: 12, tailWidth: 0.5 },
        wing: { y: 11.5, rootChord: 6.5, kinkFrac: 0.35, kinkChord: 4.6, tipChord: 1.6, sweep: 6 },
        stab: { y: 30, span: 14, rootChord: 3, tipChord: 1.6, sweep: 10 },
        engines: [{ x: 4.8, w: 1.7, l: 4.5, prop: 4.6 }, { x: 9.6, w: 1.7, l: 4.5, prop: 4.6 }],
      },
      {
        slug: "comet-4", name: "Comet 4", icao: "COMT", firstFlight: 1958, length: 33.99, wingspan: 35.0, height: 8.99, mtow: 73.5, capacity: "81 passengers", cruise: 800, manufacturer: "de Havilland",
        fuselage: { width: 3.05, noseLen: 4, tailLen: 10, tailWidth: 0.6 },
        wing: { y: 12, rootChord: 9, kinkFrac: 0.35, kinkChord: 5, tipChord: 1.8, sweep: 20 },
        stab: { y: 29, span: 11.9, rootChord: 3.2, tipChord: 1.4, sweep: 20 },
        engines: [{ x: 3.0, y: 16.5, w: 1.3, l: 6 }, { x: 4.5, y: 17.2, w: 1.3, l: 6 }],
      },
    ],
  ),
];

export const BY_SLUG: Record<string, Aircraft> = Object.fromEntries(AIRCRAFT.map((a) => [a.slug, a]));

export function getAircraft(slug: string): Aircraft | undefined {
  return BY_SLUG[slug];
}

/** All families in dataset order, with their members. */
export const FAMILIES: { family: string; manufacturer: string; members: Aircraft[] }[] = (() => {
  const map = new Map<string, { family: string; manufacturer: string; members: Aircraft[] }>();
  for (const a of AIRCRAFT) {
    const f = map.get(a.family) ?? { family: a.family, manufacturer: a.manufacturer, members: [] };
    f.members.push(a);
    map.set(a.family, f);
  }
  return Array.from(map.values());
})();

export function siblings(a: Aircraft): Aircraft[] {
  return AIRCRAFT.filter((x) => x.family === a.family && x.slug !== a.slug);
}
