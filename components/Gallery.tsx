"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS, type Aircraft, type Category } from "@/lib/aircraft";
import Silhouette from "./Silhouette";

type Sort = "name" | "wingspan" | "length" | "year";

export default function Gallery({ aircraft }: { aircraft: Aircraft[] }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("wingspan");

  const cats = useMemo(() => Array.from(new Set(aircraft.map((a) => a.category))), [aircraft]);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return aircraft
      .filter((a) => cat === "all" || a.category === cat)
      .filter((a) => !needle || `${a.manufacturer} ${a.name} ${a.icao}`.toLowerCase().includes(needle))
      .sort((a, b) => {
        switch (sort) {
          case "name":
            return `${a.manufacturer} ${a.name}`.localeCompare(`${b.manufacturer} ${b.name}`);
          case "length":
            return b.geometry.length - a.geometry.length;
          case "year":
            return a.firstFlight - b.firstFlight;
          default:
            return b.geometry.wingspan - a.geometry.wingspan;
        }
      });
  }, [aircraft, cat, q, sort]);

  return (
    <>
      <div className="filters" style={{ marginBottom: 16 }}>
        <button className="chip" aria-pressed={cat === "all"} onClick={() => setCat("all")}>
          All · {aircraft.length}
        </button>
        {cats.map((c) => (
          <button key={c} className="chip" aria-pressed={cat === c} onClick={() => setCat(c)}>
            {CATEGORY_LABELS[c]}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        <select className="search" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="wingspan">Sort: wingspan</option>
          <option value="length">Sort: length</option>
          <option value="year">Sort: first flight</option>
          <option value="name">Sort: name</option>
        </select>
        <input
          className="search"
          placeholder="Search type or ICAO code…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-label="Search aircraft"
        />
      </div>
      <div className="grid">
        {list.map((a) => (
          <Link key={a.slug} href={`/aircraft/${a.slug}`} className="card">
            <div className="thumb">
              <Silhouette aircraft={a} />
            </div>
            <div className="name">{a.name}</div>
            <div className="meta">
              <span>{a.manufacturer}</span>
              <span className="mono">{a.geometry.wingspan} m</span>
            </div>
          </Link>
        ))}
        {list.length === 0 && <p style={{ color: "var(--ink-3)" }}>No aircraft match that search.</p>}
      </div>
    </>
  );
}
