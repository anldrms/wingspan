"use client";

import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AIRCRAFT, BY_SLUG, FAMILIES, type Aircraft } from "@/lib/aircraft";
import { buildSilhouette, polygonsPath } from "@/lib/silhouette";

const Compare3D = dynamic(() => import("./Compare3D"), {
  ssr: false,
  loading: () => (
    <div className="stage-frame stage-3d" style={{ display: "grid", placeItems: "center", color: "var(--ink-3)", fontFamily: "var(--font-mono)", fontSize: 12 }}>
      loading 3D…
    </div>
  ),
});

const MAX = 6;
export const COLORS = ["#e8491d", "#1f5fbf", "#0f8a5f", "#b8860b", "#7c3aed", "#0e7490"];
const DEFAULT = ["a380", "cessna-172"];

type View = "2d" | "3d";
type Layout = "overlay" | "row";
type Align = "nose" | "centre";
type Ref = "none" | "pitch" | "bus" | "human";

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString();

export default function Compare() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = useMemo(() => {
    const raw = (params.get("ids") ?? DEFAULT.join(",")).split(",").filter((s) => BY_SLUG[s]);
    return raw.length ? Array.from(new Set(raw)).slice(0, MAX) : DEFAULT;
  }, [params]);

  const [view, setView] = useState<View>((params.get("view") as View) || "2d");
  const [layout, setLayout] = useState<Layout>("overlay");
  const [align, setAlign] = useState<Align>("nose");
  const [ref, setRef] = useState<Ref>("none");
  const [q, setQ] = useState("");

  const setIds = useCallback(
    (next: string[]) => router.replace(`/compare?ids=${next.join(",")}${view === "3d" ? "&view=3d" : ""}`, { scroll: false }),
    [router, view],
  );

  const picked = ids.map((id) => BY_SLUG[id]);
  const sils = picked.map((a) => buildSilhouette(a.geometry));
  const maxSpan = Math.max(...sils.map((s) => s.wingspan));
  const maxLen = Math.max(...sils.map((s) => s.length));

  const refSize: [number, number] | null = ref === "pitch" ? [68, 105] : ref === "bus" ? [2.55, 12] : ref === "human" ? [0.5, 1.8] : null;

  // ----- 2D scene -----
  let vbW: number, vbH: number;
  const items: { a: Aircraft; tx: number; ty: number; color: string }[] = [];
  if (layout === "overlay") {
    vbW = Math.max(maxSpan, refSize?.[0] ?? 0);
    vbH = Math.max(maxLen, refSize?.[1] ?? 0);
    picked.forEach((a, i) => {
      const s = sils[i];
      const ty = align === "nose" ? (vbH - maxLen) / 2 : (vbH - s.length) / 2;
      items.push({ a, tx: vbW / 2, ty, color: COLORS[i] });
    });
  } else {
    const gap = Math.max(4, maxSpan * 0.08);
    const total = sils.reduce((acc, s) => acc + s.wingspan, 0) + gap * (sils.length - 1);
    vbW = Math.max(total, refSize?.[0] ?? 0);
    vbH = Math.max(maxLen, refSize?.[1] ?? 0);
    let x = (vbW - total) / 2;
    picked.forEach((a, i) => {
      const s = sils[i];
      items.push({ a, tx: x + s.wingspan / 2, ty: (vbH - maxLen) / 2, color: COLORS[i] });
      x += s.wingspan + gap;
    });
  }
  const pad = Math.max(vbW, vbH) * 0.08;
  const viewBox = `${-pad} ${-pad} ${vbW + pad * 2} ${vbH + pad * 2}`;
  const barLen = vbW > 150 ? 100 : vbW > 60 ? 50 : vbW > 20 ? 10 : vbW > 8 ? 5 : 1;
  const fontSize = Math.max(vbW, vbH) * 0.026;
  const strokeW = Math.max(vbW, vbH) * 0.0025;
  const refLabel = ref === "pitch" ? "Football pitch · 105 × 68 m" : ref === "bus" ? "City bus · 12 m" : ref === "human" ? "Person · 1.8 m" : "";

  const needle = q.trim().toLowerCase();
  const pickFamilies = FAMILIES.map((f) => ({
    ...f,
    members: f.members.filter((a) => !ids.includes(a.slug) && (!needle || `${a.manufacturer} ${a.name} ${a.icao} ${a.family}`.toLowerCase().includes(needle))),
  })).filter((f) => f.members.length);

  return (
    <div className="compare">
      <aside className="panel">
        <div className="panel-h">
          <span className="label">Selected · {ids.length}/{MAX}</span>
          {ids.length > 1 && (
            <button className="label" style={{ color: "var(--ink-2)" }} onClick={() => setIds([ids[0]])}>
              clear
            </button>
          )}
        </div>
        <div className="sel">
          {picked.map((a, i) => (
            <div key={a.slug} className="sel-row">
              <span className="sw" style={{ background: COLORS[i] }} />
              <span className="nm">
                {a.name}
                <small>{a.manufacturer}</small>
              </span>
              <span className="d">{a.geometry.wingspan} m</span>
              <button className="x" aria-label={`Remove ${a.name}`} onClick={() => setIds(ids.filter((x) => x !== a.slug))} disabled={ids.length === 1}>
                ×
              </button>
            </div>
          ))}
        </div>
        <div className="picker">
          <input className="field" placeholder="Add aircraft…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search aircraft to add" />
          <div className="pick-list">
            {pickFamilies.map((f) => (
              <div key={f.family}>
                <div className="pick-fam">
                  {f.manufacturer} · {f.family}
                </div>
                {f.members.map((a) => (
                  <button key={a.slug} onClick={() => setIds([...ids, a.slug])} disabled={ids.length >= MAX}>
                    <span>{a.name}</span>
                    <span className="d">{a.geometry.wingspan} m</span>
                  </button>
                ))}
              </div>
            ))}
            {pickFamilies.length === 0 && <p className="empty">Nothing matches.</p>}
          </div>
        </div>
      </aside>

      <div>
        <div className="toolbar" role="toolbar" aria-label="View options">
          <div className="seg" role="group" aria-label="View">
            <button aria-pressed={view === "2d"} onClick={() => setView("2d")}>
              Plan view
            </button>
            <button aria-pressed={view === "3d"} onClick={() => setView("3d")}>
              3D
            </button>
          </div>
          <div className="seg" role="group" aria-label="Layout">
            <button aria-pressed={layout === "overlay"} onClick={() => setLayout("overlay")}>
              Overlay
            </button>
            <button aria-pressed={layout === "row"} onClick={() => setLayout("row")}>
              Side by side
            </button>
          </div>
          {view === "2d" && layout === "overlay" && (
            <div className="seg" role="group" aria-label="Alignment">
              <button aria-pressed={align === "nose"} onClick={() => setAlign("nose")}>
                Noses
              </button>
              <button aria-pressed={align === "centre"} onClick={() => setAlign("centre")}>
                Centres
              </button>
            </div>
          )}
          <span className="spacer" />
          <div className="seg" role="group" aria-label="Reference object">
            <button aria-pressed={ref === "none"} onClick={() => setRef("none")}>
              None
            </button>
            <button aria-pressed={ref === "human"} onClick={() => setRef("human")}>
              Person
            </button>
            <button aria-pressed={ref === "bus"} onClick={() => setRef("bus")}>
              Bus
            </button>
            <button aria-pressed={ref === "pitch"} onClick={() => setRef("pitch")}>
              Pitch
            </button>
          </div>
        </div>

        {view === "3d" ? (
          <Compare3D aircraft={picked} colors={COLORS} layout={layout} reference={ref} />
        ) : (
          <div className="stage-frame stage">
            <svg viewBox={viewBox} role="img" aria-label={`Size comparison of ${picked.map((a) => a.name).join(", ")}`}>
              {refSize && (
                <g transform={`translate(${(vbW - refSize[0]) / 2} ${(vbH - refSize[1]) / 2})`}>
                  <rect width={refSize[0]} height={refSize[1]} fill="none" stroke="var(--ink-3)" strokeWidth={strokeW} strokeDasharray={`${strokeW * 4} ${strokeW * 3}`} rx={ref === "pitch" ? 0 : 0.3} />
                  {ref === "pitch" && (
                    <>
                      <line x1={0} y1={refSize[1] / 2} x2={refSize[0]} y2={refSize[1] / 2} stroke="var(--ink-3)" strokeWidth={strokeW} />
                      <circle cx={refSize[0] / 2} cy={refSize[1] / 2} r={9.15} fill="none" stroke="var(--ink-3)" strokeWidth={strokeW} />
                    </>
                  )}
                  {ref === "human" && <circle cx={refSize[0] / 2} cy={refSize[1] * 0.18} r={0.12} fill="var(--ink-3)" />}
                  <text x={refSize[0] / 2} y={-fontSize * 0.5} textAnchor="middle" fontSize={fontSize * 0.8} fill="var(--ink-3)" fontFamily="var(--font-mono)">
                    {refLabel}
                  </text>
                </g>
              )}
              {items.map(({ a, tx, ty, color }, i) => (
                <g key={a.slug} className="cmp-layer" transform={`translate(${tx} ${ty})`}>
                  <path d={polygonsPath(sils[i].secondary)} fill={color} fillOpacity={0.5} />
                  <path d={polygonsPath(sils[i].accent)} fill={color} fillOpacity={0.5} />
                  <path d={polygonsPath(sils[i].primary)} fill={color} fillOpacity={0.85} />
                </g>
              ))}
              <g transform={`translate(0 ${vbH + pad * 0.55})`}>
                <line x1={0} y1={0} x2={barLen} y2={0} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
                <line x1={0} y1={-strokeW * 3} x2={0} y2={strokeW * 3} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
                <line x1={barLen} y1={-strokeW * 3} x2={barLen} y2={strokeW * 3} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
                <text x={barLen / 2} y={fontSize * 1.1} textAnchor="middle" fontSize={fontSize * 0.8} fill="var(--ink-2)" fontFamily="var(--font-mono)">
                  {barLen} m
                </text>
              </g>
            </svg>
          </div>
        )}

        <StatsTable picked={picked} />
      </div>
    </div>
  );
}

function StatsTable({ picked }: { picked: Aircraft[] }) {
  const base = picked[0];
  const rows: { k: string; get: (a: Aircraft) => number | string | undefined; unit?: string; ratio?: boolean }[] = [
    { k: "Wingspan", get: (a) => a.geometry.wingspan, unit: "m", ratio: true },
    { k: "Length", get: (a) => a.geometry.length, unit: "m", ratio: true },
    { k: "Height", get: (a) => a.height, unit: "m", ratio: true },
    { k: "Fuselage width", get: (a) => a.geometry.fuselage.width, unit: "m", ratio: true },
    { k: "Max take-off weight", get: (a) => a.mtow, unit: "t", ratio: true },
    { k: "Cruise speed", get: (a) => a.cruise, unit: "km/h", ratio: true },
    { k: "First flight", get: (a) => a.firstFlight ?? "—" },
    { k: "Capacity", get: (a) => a.capacity },
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="cmp">
        <thead>
          <tr>
            <th>Spec</th>
            {picked.map((a, i) => (
              <th key={a.slug}>
                <span className="sw" style={{ background: COLORS[i] }} />
                {a.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.k}>
              <td>{r.k}</td>
              {picked.map((a, i) => {
                const v = r.get(a);
                const b = r.get(base);
                const ratio = r.ratio && i > 0 && typeof v === "number" && typeof b === "number" ? v / b : null;
                return (
                  <td key={a.slug}>
                    {typeof v === "number" ? fmt1(v) : v}
                    {r.unit && typeof v === "number" ? ` ${r.unit}` : ""}
                    {ratio !== null && <span className="r">{ratio >= 1 ? `${fmt1(ratio)}×` : `÷${fmt1(1 / ratio)}`}</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
