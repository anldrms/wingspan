import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Silhouette from "@/components/Silhouette";
import CopyButton from "@/components/CopyButton";
import { AIRCRAFT, CATEGORY_LABELS, getAircraft } from "@/lib/aircraft";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return AIRCRAFT.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const a = getAircraft((await params).slug);
  if (!a) return {};
  return {
    title: `${a.manufacturer} ${a.name}`,
    description: `${a.manufacturer} ${a.name} plan-view silhouette — wingspan ${a.geometry.wingspan} m, length ${a.geometry.length} m. Download as SVG or compare at true scale.`,
  };
}

export default async function AircraftPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const a = getAircraft(slug);
  if (!a) notFound();

  const svgUrl = `/api/svg/${a.slug}`;
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://wingspan.vercel.app";
  const embed = `<img src="${site}${svgUrl}?primary=0f172a&secondary=64748b&width=320" alt="${a.manufacturer} ${a.name} silhouette" />`;

  // Nearest neighbours by wingspan make for interesting comparisons, plus the two extremes.
  const others = AIRCRAFT.filter((x) => x.slug !== a.slug);
  const bySpan = [...others].sort(
    (x, y) => Math.abs(x.geometry.wingspan - a.geometry.wingspan) - Math.abs(y.geometry.wingspan - a.geometry.wingspan),
  );
  const biggest = [...others].sort((x, y) => y.geometry.wingspan - x.geometry.wingspan)[0];
  const smallest = [...others].sort((x, y) => x.geometry.wingspan - y.geometry.wingspan)[0];
  const related = Array.from(new Set([bySpan[0], bySpan[1], biggest, smallest])).slice(0, 4);

  return (
    <div className="container detail">
      <div className="detail-figure ws-hover">
        <Silhouette aircraft={a} square />
      </div>
      <div>
        <div className="eyebrow">
          {CATEGORY_LABELS[a.category]} · {a.icao}
        </div>
        <h1>{a.name}</h1>
        <p className="sub">
          {a.manufacturer} · first flight {a.firstFlight}
        </p>

        <div className="stats">
          <Stat k="Wingspan" v={a.geometry.wingspan} u="m" />
          <Stat k="Length" v={a.geometry.length} u="m" />
          <Stat k="Height" v={a.height} u="m" />
          <Stat k="Max take-off weight" v={a.mtow} u="t" />
          <Stat k="Cruise speed" v={a.cruise} u="km/h" />
          <div className="stat">
            <div className="k">Capacity</div>
            <div className="v" style={{ fontSize: 16 }}>
              {a.capacity}
            </div>
          </div>
        </div>

        <div className="hero-actions" style={{ marginBottom: 22 }}>
          <a className="btn primary" href={`${svgUrl}?download=1`}>
            Download SVG
          </a>
          <Link className="btn" href={`/compare?ids=${a.slug},${a.slug === "a380" ? "cessna-172" : "a380"}`}>
            Compare
          </Link>
          <CopyButton text={embed} label="Copy embed" />
        </div>

        <div className="eyebrow">Embed</div>
        <pre className="code">
          <code>{embed}</code>
        </pre>
        <p style={{ color: "var(--ink-3)", fontSize: 13, margin: "8px 0 0" }}>
          Query params: <code>primary</code>, <code>secondary</code> (hex without #), <code>width</code> (px),{" "}
          <code>download=1</code>.
        </p>

        <div className="eyebrow" style={{ marginTop: 22 }}>
          Compare with
        </div>
        <div className="related">
          {related.map((r) => (
            <Link key={r.slug} className="chip" href={`/compare?ids=${a.slug},${r.slug}`}>
              {r.name} · {r.geometry.wingspan} m
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ k, v, u }: { k: string; v: number; u: string }) {
  return (
    <div className="stat">
      <div className="k">{k}</div>
      <div className="v">
        {v}
        <small>{u}</small>
      </div>
    </div>
  );
}
