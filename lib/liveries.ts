/**
 * Livery presets: three colours per airline — fuselage, wings/engines, tail.
 * These are approximations of each carrier's brand palette so a silhouette
 * reads as "that airline" at a glance. No logos or trademarks are drawn.
 */
export interface Livery {
  slug: string;
  name: string;
  /** Country / region, for grouping. */
  region: string;
  /** Fuselage. */
  primary: string;
  /** Wings and engines. */
  secondary: string;
  /** Horizontal stabiliser / tail. */
  accent: string;
}

export const DEFAULT_LIVERY: Livery = {
  slug: "wingspan",
  name: "Wingspan ink",
  region: "—",
  primary: "#0f172a",
  secondary: "#64748b",
  accent: "#64748b",
};

export const LIVERIES: Livery[] = [
  DEFAULT_LIVERY,
  { slug: "blueprint", name: "Blueprint", region: "—", primary: "#e6f0ff", secondary: "#9cc2ff", accent: "#5b9dff" },
  { slug: "international-orange", name: "International orange", region: "—", primary: "#f24e1e", secondary: "#c23a12", accent: "#f24e1e" },

  // Türkiye
  { slug: "turkish-airlines", name: "Turkish Airlines", region: "Türkiye", primary: "#f6f6f6", secondary: "#9aa1ab", accent: "#c8102e" },
  { slug: "pegasus", name: "Pegasus", region: "Türkiye", primary: "#f6f6f6", secondary: "#ffb81c", accent: "#f37021" },
  { slug: "sunexpress", name: "SunExpress", region: "Türkiye", primary: "#f6f6f6", secondary: "#f26522", accent: "#e30613" },
  { slug: "ajet", name: "AJet", region: "Türkiye", primary: "#f6f6f6", secondary: "#8f9bb3", accent: "#0b1f5c" },

  // Europe
  { slug: "lufthansa", name: "Lufthansa", region: "Europe", primary: "#f2f2f2", secondary: "#8a8f99", accent: "#05164d" },
  { slug: "british-airways", name: "British Airways", region: "Europe", primary: "#f2f2f2", secondary: "#8a8f99", accent: "#073590" },
  { slug: "air-france", name: "Air France", region: "Europe", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#002157" },
  { slug: "klm", name: "KLM", region: "Europe", primary: "#00a1de", secondary: "#a7b7c4", accent: "#00a1de" },
  { slug: "ryanair", name: "Ryanair", region: "Europe", primary: "#f5f5f5", secondary: "#073590", accent: "#073590" },
  { slug: "easyjet", name: "easyJet", region: "Europe", primary: "#f5f5f5", secondary: "#ff6600", accent: "#ff6600" },
  { slug: "wizz-air", name: "Wizz Air", region: "Europe", primary: "#f5f5f5", secondary: "#c6007e", accent: "#06038d" },
  { slug: "iberia", name: "Iberia", region: "Europe", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#d7192d" },
  { slug: "swiss", name: "SWISS", region: "Europe", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#e30613" },
  { slug: "aeroflot", name: "Aeroflot", region: "Europe", primary: "#f5f5f5", secondary: "#b9c0c8", accent: "#002b7f" },

  // Middle East
  { slug: "emirates", name: "Emirates", region: "Middle East", primary: "#f6f6f6", secondary: "#9aa1ab", accent: "#d71921" },
  { slug: "qatar-airways", name: "Qatar Airways", region: "Middle East", primary: "#f2f2f2", secondary: "#5c0632", accent: "#5c0632" },
  { slug: "etihad", name: "Etihad", region: "Middle East", primary: "#ebe3d4", secondary: "#7f6c4b", accent: "#b5975b" },
  { slug: "saudia", name: "Saudia", region: "Middle East", primary: "#f3efe4", secondary: "#8a8f99", accent: "#00502f" },

  // Americas
  { slug: "delta", name: "Delta", region: "Americas", primary: "#f5f5f5", secondary: "#003a70", accent: "#c01933" },
  { slug: "united", name: "United", region: "Americas", primary: "#f5f5f5", secondary: "#0033a0", accent: "#1e4fa5" },
  { slug: "american", name: "American", region: "Americas", primary: "#d6dae0", secondary: "#8f96a3", accent: "#b61f2b" },
  { slug: "southwest", name: "Southwest", region: "Americas", primary: "#304cb2", secondary: "#f9b612", accent: "#c7343e" },
  { slug: "air-canada", name: "Air Canada", region: "Americas", primary: "#f5f5f5", secondary: "#6b6b6b", accent: "#111111" },
  { slug: "westjet", name: "WestJet", region: "Americas", primary: "#f5f5f5", secondary: "#6fb7c9", accent: "#0e2a47" },
  { slug: "alaska", name: "Alaska", region: "Americas", primary: "#f5f5f5", secondary: "#5eb5a0", accent: "#003f6f" },
  { slug: "latam", name: "LATAM", region: "Americas", primary: "#f5f5f5", secondary: "#6b6b8f", accent: "#1b0088" },

  // Asia-Pacific
  { slug: "singapore-airlines", name: "Singapore Airlines", region: "Asia-Pacific", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#1d2a63" },
  { slug: "cathay-pacific", name: "Cathay Pacific", region: "Asia-Pacific", primary: "#f5f5f5", secondary: "#006564", accent: "#006564" },
  { slug: "qantas", name: "Qantas", region: "Asia-Pacific", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#e0001b" },
  { slug: "ana", name: "ANA", region: "Asia-Pacific", primary: "#f5f5f5", secondary: "#00358e", accent: "#00358e" },
  { slug: "jal", name: "JAL", region: "Asia-Pacific", primary: "#f5f5f5", secondary: "#8a8f99", accent: "#d81e05" },
  { slug: "korean-air", name: "Korean Air", region: "Asia-Pacific", primary: "#8cc7e8", secondary: "#a7b7c4", accent: "#8cc7e8" },

  // Cargo
  { slug: "fedex", name: "FedEx Express", region: "Cargo", primary: "#f5f5f5", secondary: "#4d148c", accent: "#ff6600" },
  { slug: "ups", name: "UPS", region: "Cargo", primary: "#f5f5f5", secondary: "#5b3a29", accent: "#351c15" },
  { slug: "dhl", name: "DHL", region: "Cargo", primary: "#ffcc00", secondary: "#d40511", accent: "#d40511" },
];

export const LIVERY_BY_SLUG: Record<string, Livery> = Object.fromEntries(LIVERIES.map((l) => [l.slug, l]));

export function getLivery(slug?: string | null): Livery {
  return (slug && LIVERY_BY_SLUG[slug]) || DEFAULT_LIVERY;
}

/** Group liveries by region, preserving order. */
export function liveryGroups(): { region: string; items: Livery[] }[] {
  const out: { region: string; items: Livery[] }[] = [];
  for (const l of LIVERIES) {
    const region = l.region === "—" ? "Presets" : l.region;
    const g = out.find((x) => x.region === region);
    if (g) g.items.push(l);
    else out.push({ region, items: [l] });
  }
  return out;
}
