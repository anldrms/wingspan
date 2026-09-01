import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import LiveryPicker from "@/components/LiveryPicker";
import { AIRCRAFT, CATEGORY_LABELS, getAircraft, siblings } from "@/lib/aircraft";
import { siteUrl } from "@/lib/site";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return AIRCRAFT.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const a = getAircraft((await params).slug);
  if (!a) return {};
  return {
    title: `${a.manufacturer} ${a.name}`,
    description: `${a.manufacturer} ${a.name} plan-view silhouette — wingspan ${a.geometry.wingspan} m, length ${a.geometry.length} m. Download as SVG in airline colours or compare at true scale.`,
  };
}

export default async function AircraftPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = getAircraft(slug);
  if (!a) notFound();

  const sibs = siblings(a);
  const familyAll = [a, ...sibs].sort((x, y) => x.geometry.length - y.geometry.length);

  const others = AIRCRAFT.filter((x) => x.slug !== a.slug && x.family !== a.family);
  const bySpan = [...others].sort((x, y) => Math.abs(x.geometry.wingspan - a.geometry.wingspan) - Math.abs(y.geometry.wingspan - a.geometry.wingspan));
  const biggest = [...others].sort((x, y) => y.geometry.wingspan - x.geometry.wingspan)[0];
  const smallest = [...others].sort((x, y) => x.geometry.wingspan - y.geometry.wingspan)[0];
  const related = Array.from(new Set([bySpan[0], bySpan[1], biggest, smallest])).slice(0, 4);
  const compareFamily = familyAll.slice(0, 6).map((x) => x.slug).join(",");

  return (
    <div className="wrap">
      <div className="detail">
        <div>
          <LiveryPicker aircraft={a} site={siteUrl()} />
        </div>
        <div>
          <div className="crumbs">
            <Link href="/">Catalogue</Link>
            <span>/</span>
            <Link href={`/#${a.family.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`}>{a.family}</Link>
            <span>/</span>
            <span>{a.icao}</span>
          </div>
          <h1>{a.name}</h1>
          <p className="sub">
            {a.manufacturer} · {CATEGORY_LABELS[a.category]} · first flight {a.firstFlight ?? "pending"}
          </p>

          <table className="spec">
            <tbody>
              <Row k="Wingspan" v={a.geometry.wingspan} u="m" />
              <Row k="Length" v={a.geometry.length} u="m" />
              <Row k="Height" v={a.height} u="m" />
              <Row k="Fuselage width" v={a.geometry.fuselage.width} u="m" />
              <Row k="Max take-off weight" v={a.mtow} u="t" />
              <Row k="Cruise speed" v={a.cruise} u="km/h" />
              <tr>
                <th>Capacity</th>
                <td>{a.capacity}</td>
              </tr>
              <tr>
                <th>Configuration</th>
                <td>
                  {a.geometry.engines.length === 0
                    ? "internal engines"
                    : `${a.geometry.engines.reduce((n, e) => n + (e.x === 0 ? 1 : 2) * (e.w > 0 || e.prop ? 1 : 0), 0)} × ${a.geometry.engines.some((e) => e.prop) ? "propeller" : "jet"}`}
                  , {a.geometry.wingPos}-wing, {a.geometry.tail === "t" ? "T-tail" : a.geometry.tail === "cruciform" ? "cruciform tail" : "conventional tail"}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="actions">
            <Link className="btn solid" href={`/compare?ids=${a.slug},${a.slug === "a380" ? "cessna-172" : "a380"}`}>
              Compare
            </Link>
            {sibs.length > 0 && (
              <Link className="btn" href={`/compare?ids=${compareFamily}`}>
                Compare all {a.family} variants
              </Link>
            )}
          </div>

          {sibs.length > 0 && (
            <>
              <div className="label">{a.family} · variants</div>
              <table className="variants">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Length</th>
                    <th>Span</th>
                    <th>MTOW</th>
                    <th>Seats</th>
                    <th>First flight</th>
                  </tr>
                </thead>
                <tbody>
                  {familyAll.map((v) => (
                    <tr key={v.slug} className={v.slug === a.slug ? "on" : undefined}>
                      <td>{v.slug === a.slug ? v.name : <Link href={`/aircraft/${v.slug}`}>{v.name}</Link>}</td>
                      <td>{v.geometry.length} m</td>
                      <td>{v.geometry.wingspan} m</td>
                      <td>{v.mtow} t</td>
                      <td>{v.capacity.replace(/ passengers.*$/, "").replace(/ seats$/, "")}</td>
                      <td>{v.firstFlight ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}

          <div className="label" style={{ marginTop: 26 }}>
            Compare with
          </div>
          <div className="livery-row" style={{ marginTop: 8 }}>
            {related.map((r) => (
              <Link key={r.slug} className="swatch" href={`/compare?ids=${a.slug},${r.slug}`}>
                {r.name} · {r.geometry.wingspan} m
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, u }: { k: string; v: number; u: string }) {
  return (
    <tr>
      <th>{k}</th>
      <td>
        {v}
        <small>{u}</small>
      </td>
    </tr>
  );
}
