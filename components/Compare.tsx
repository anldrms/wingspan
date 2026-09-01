"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { AIRCRAFT, BY_SLUG, type Aircraft } from "@/lib/aircraft";
import { buildSilhouette, polygonsPath } from "@/lib/silhouette";

const MAX = 4;
const COLORS = ["#2563eb", "#f59e0b", "#10b981", "#f43f5e"];
const DEFAULT = ["a380", "cessna-172"];

type Mode = "overlay" | "row";
type Align = "nose" | "centre";
type Ref = "none" | "pitch" | "bus";

const fmt1 = (n: number) => (Math.round(n * 10) / 10).toString();

export default function Compare() {
  const router = useRouter();
  const params = useSearchParams();
  const ids = useMemo(() => {
    const raw = (params.get("ids") ?? DEFAULT.join(",")).split(",").filter((s) => BY_SLUG[s]);
    return raw.length ? raw.slice(0, MAX) : DEFAULT;
  }, [params]);

  const [mode, setMode] = useState<Mode>("overlay");
  const [align, setAlign] = useState<Align>("nose");
  const [ref, setRef] = useState<Ref>("none");
  const [q, setQ] = useState("");

  const setIds = useCallback(
    (next: string[]) => router.replace(`/compare?ids=${next.join(",")}`, { scroll: false }),
    [router],
  );

  const picked = ids.map((id) => BY_SLUG[id]);
  const sils = picked.map((a) => buildSilhouette(a.geometry));
  const maxSpan = Math.max(...sils.map((s) => s.wingspan));
  const maxLen = Math.max(...sils.map((s) => s.length));

  // Reference objects (metres): a football pitch and a 12 m city bus.
  const refSize: [number, number] | null = ref === "pitch" ? [68, 105] : ref === "bus" ? [2.55, 12] : null;

  // ----- Build the scene -----
  let vbW: number, vbH: number;
  const items: { a: Aircraft; tx: number; ty: number; color: string }[] = [];
  if (mode === "overlay") {
    const sceneW = Math.max(maxSpan, refSize?.[0] ?? 0);
    const sceneH = Math.max(maxLen, refSize?.[1] ?? 0);
    vbW = sceneW;
    vbH = sceneH;
    picked.forEach((a, i) => {
      const s = sils[i];
      const ty = align === "nose" ? (sceneH - maxLen) / 2 : (sceneH - s.length) / 2;
      items.push({ a, tx: sceneW / 2, ty, color: COLORS[i] });
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
  const barLen = vbW > 150 ? 100 : vbW > 60 ? 50 : vbW > 20 ? 10 : 5;
  const fontSize = Math.max(vbW, vbH) * 0.028;
  const strokeW = Math.max(vbW, vbH) * 0.003;

  const available = AIRCRAFT.filter((a) => !ids.includes(a.slug)).filter((a) => {
    const n = q.trim().toLowerCase();
    return !n || `${a.manufacturer} ${a.name} ${a.icao}`.toLowerCase().includes(n);
  });

  return (
    <div className="compare-layout">
      <aside className="panel">
        <h3>Selected · {ids.length}/{MAX}</h3>
        <div className="picked">
          {picked.map((a, i) => (
            <div key={a.slug} className="picked-row">
              <span className="sw" style={{ background: COLORS[i] }} />
              <span className="nm">{a.name}</span>
              <button
                aria-label={`Remove ${a.name}`}
                onClick={() => setIds(ids.filter((x) => x !== a.slug))}
                disabled={ids.length === 1}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        <h3>Add aircraft</h3>
        <input
          className="search"
          style={{ width: "100%" }}
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search aircraft to add"
        />
        <div className="pick-list">
          {available.map((a) => (
            <button key={a.slug} onClick={() => setIds([...ids, a.slug])} disabled={ids.length >= MAX}>
              <span>
                {a.manufacturer} {a.name}
              </span>
              <span className="dim">{a.geometry.wingspan} m</span>
            </button>
          ))}
        </div>
      </aside>

      <div>
        <div className="toolbar" role="toolbar" aria-label="View options">
          <button className="btn small" aria-pressed={mode === "overlay"} onClick={() => setMode("overlay")}>
            Overlay
          </button>
          <button className="btn small" aria-pressed={mode === "row"} onClick={() => setMode("row")}>
            Side by side
          </button>
          {mode === "overlay" && (
            <>
              <span className="sep" />
              <button className="btn small" aria-pressed={align === "nose"} onClick={() => setAlign("nose")}>
                Align noses
              </button>
              <button className="btn small" aria-pressed={align === "centre"} onClick={() => setAlign("centre")}>
                Align centres
              </button>
            </>
          )}
          <span className="sep" />
          <button className="btn small" aria-pressed={ref === "none"} onClick={() => setRef("none")}>
            No reference
          </button>
          <button className="btn small" aria-pressed={ref === "pitch"} onClick={() => setRef("pitch")}>
            Football pitch
          </button>
          <button className="btn small" aria-pressed={ref === "bus"} onClick={() => setRef("bus")}>
            City bus
          </button>
        </div>

        <div className="stage">
          <svg viewBox={viewBox} role="img" aria-label={`Size comparison of ${picked.map((a) => a.name).join(", ")}`}>
            {refSize && (
              <g transform={`translate(${(vbW - refSize[0]) / 2} ${(vbH - refSize[1]) / 2})`}>
                <rect
                  width={refSize[0]}
                  height={refSize[1]}
                  fill="none"
                  stroke="var(--ink-3)"
                  strokeWidth={strokeW}
                  strokeDasharray={`${strokeW * 4} ${strokeW * 3}`}
                  rx={ref === "bus" ? 0.6 : 0}
                />
                {ref === "pitch" && (
                  <>
                    <line x1={0} y1={refSize[1] / 2} x2={refSize[0]} y2={refSize[1] / 2} stroke="var(--ink-3)" strokeWidth={strokeW} />
                    <circle cx={refSize[0] / 2} cy={refSize[1] / 2} r={9.15} fill="none" stroke="var(--ink-3)" strokeWidth={strokeW} />
                  </>
                )}
                <text
                  x={refSize[0] / 2}
                  y={-fontSize * 0.5}
                  textAnchor="middle"
                  fontSize={fontSize * 0.8}
                  fill="var(--ink-3)"
                  fontFamily="var(--mono)"
                >
                  {ref === "pitch" ? "Football pitch · 105 × 68 m" : "City bus · 12 m"}
                </text>
              </g>
            )}

            {items.map(({ a, tx, ty, color }, i) => (
              <g key={a.slug} className="cmp-layer" transform={`translate(${tx} ${ty})`}>
                <path d={polygonsPath(sils[i].secondary)} fill={color} fillOpacity={0.45} />
                <path d={polygonsPath(sils[i].primary)} fill={color} fillOpacity={0.8} />
              </g>
            ))}

            {/* Scale bar */}
            <g transform={`translate(0 ${vbH + pad * 0.55})`}>
              <line x1={0} y1={0} x2={barLen} y2={0} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
              <line x1={0} y1={-strokeW * 3} x2={0} y2={strokeW * 3} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
              <line x1={barLen} y1={-strokeW * 3} x2={barLen} y2={strokeW * 3} stroke="var(--ink-2)" strokeWidth={strokeW * 1.5} />
              <text x={barLen / 2} y={fontSize * 1.1} textAnchor="middle" fontSize={fontSize * 0.8} fill="var(--ink-2)" fontFamily="var(--mono)">
                {barLen} m
              </text>
            </g>
          </svg>
        </div>

        <StatsTable picked={picked} />
      </div>
    </div>
  );
}

function StatsTable({ picked }: { picked: Aircraft[] }) {
  const base = picked[0];
  const rows: { k: string; get: (a: Aircraft) => number | string; unit?: string; ratio?: boolean }[] = [
    { k: "Wingspan", get: (a) => a.geometry.wingspan, unit: "m", ratio: true },
    { k: "Length", get: (a) => a.geometry.length, unit: "m", ratio: true },
    { k: "Height", get: (a) => a.height, unit: "m", ratio: true },
    { k: "Max take-off weight", get: (a) => a.mtow, unit: "t", ratio: true },
    { k: "Cruise speed", get: (a) => a.cruise, unit: "km/h", ratio: true },
    { k: "First flight", get: (a) => a.firstFlight },
    { k: "Capacity", get: (a) => a.capacity },
  ];
  return (
    <div style={{ overflowX: "auto" }}>
      <table className="cmp-table">
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
                    {ratio !== null && <span className="ratio">{ratio >= 1 ? `${fmt1(ratio)}×` : `${fmt1(1 / ratio)}× smaller`}</span>}
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
