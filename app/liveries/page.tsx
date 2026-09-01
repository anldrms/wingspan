import type { Metadata } from "next";
import Link from "next/link";
import Silhouette from "@/components/Silhouette";
import { AIRCRAFT, getAircraft } from "@/lib/aircraft";
import { LIVERIES } from "@/lib/liveries";

export const metadata: Metadata = {
  title: "Liveries",
  description: "Every silhouette in airline colours — approximate brand palettes for Turkish Airlines, Lufthansa, Emirates and more.",
};

const FEATURED = ["a321neo", "737-max-8", "777-300er", "787-9", "a350-900", "a380", "747-8", "a330-900", "e195-e2", "atr72-600", "crj900", "concorde"];

export default async function LiveriesPage({ searchParams }: { searchParams: Promise<{ a?: string }> }) {
  const { a: slug } = await searchParams;
  const a = getAircraft(slug ?? "") ?? getAircraft("a321neo")!;
  const featured = FEATURED.map((s) => getAircraft(s)).filter((x): x is NonNullable<typeof x> => !!x);

  return (
    <div className="wrap">
      <div className="section-head" style={{ paddingTop: 36 }}>
        <div>
          <h2>Liveries</h2>
          <p>
            {LIVERIES.length - 3} airline palettes as three-tone presets — fuselage, wings &amp; engines, tail. Colours are approximations; no logos are drawn.
          </p>
        </div>
      </div>

      <div className="toolbar">
        <span className="label">Aircraft</span>
        <div className="livery-row">
          {featured.map((f) => (
            <Link key={f.slug} className="swatch" aria-pressed={f.slug === a.slug} href={`/liveries?a=${f.slug}`}>
              {f.name}
            </Link>
          ))}
        </div>
        <span className="spacer" />
        <form action="/liveries" method="get">
          <select className="field" name="a" defaultValue={a.slug} aria-label="Choose any aircraft">
            {AIRCRAFT.map((x) => (
              <option key={x.slug} value={x.slug}>
                {x.manufacturer} {x.name}
              </option>
            ))}
          </select>{" "}
          <button className="btn" type="submit">
            Show
          </button>
        </form>
      </div>

      <div className="livery-grid">
        {LIVERIES.map((l) => (
          <a key={l.slug} className="livery-cell hoverable" href={`/api/svg/${a.slug}?livery=${l.slug}&download=1`} title={`Download ${a.name} in ${l.name} colours`}>
            <div className="thumb">
              <Silhouette aircraft={a} livery={l} animate={false} />
            </div>
            <div className="t">{l.name}</div>
            <div className="m">
              {l.region === "—" ? "preset" : l.region} · {l.primary} {l.secondary} {l.accent}
            </div>
          </a>
        ))}
      </div>
      <p style={{ color: "var(--ink-3)", fontSize: 13, marginTop: 14 }}>
        Click any cell to download that combination as SVG, or use <code>/api/svg/{a.slug}?livery=&lt;slug&gt;</code> directly. Livery slugs match the names above in kebab-case.
      </p>
    </div>
  );
}
