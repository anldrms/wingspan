"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CATEGORY_LABELS, FAMILIES, type Aircraft, type Category } from "@/lib/aircraft";
import Silhouette from "./Silhouette";

type Sort = "family" | "wingspan" | "length" | "year" | "name";

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function Gallery({ aircraft }: { aircraft: Aircraft[] }) {
  const [cat, setCat] = useState<Category | "all">("all");
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("family");

  const cats = useMemo(() => Array.from(new Set(aircraft.map((a) => a.category))), [aircraft]);

  const matches = (a: Aircraft) => {
    const needle = q.trim().toLowerCase();
    return (cat === "all" || a.category === cat) && (!needle || `${a.manufacturer} ${a.name} ${a.icao} ${a.family}`.toLowerCase().includes(needle));
  };

  const flat = useMemo(() => {
    const list = aircraft.filter(matches);
    const by: Record<Sort, (a: Aircraft, b: Aircraft) => number> = {
      family: () => 0,
      name: (a, b) => `${a.manufacturer} ${a.name}`.localeCompare(`${b.manufacturer} ${b.name}`),
      length: (a, b) => b.geometry.length - a.geometry.length,
      year: (a, b) => (a.firstFlight ?? 9999) - (b.firstFlight ?? 9999),
      wingspan: (a, b) => b.geometry.wingspan - a.geometry.wingspan,
    };
    return list.sort(by[sort]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aircraft, cat, q, sort]);

  const families = useMemo(() => FAMILIES.map((f) => ({ ...f, members: f.members.filter(matches) })).filter((f) => f.members.length > 0), [cat, q]); // eslint-disable-line react-hooks/exhaustive-deps

  // Index: manufacturers → first family anchor
  const index = useMemo(() => {
    const seen = new Map<string, string>();
    for (const f of families) if (!seen.has(f.manufacturer)) seen.set(f.manufacturer, slugify(f.family));
    return Array.from(seen.entries());
  }, [families]);

  return (
    <>
      <div className="toolbar">
        <select className="field" value={cat} onChange={(e) => setCat(e.target.value as Category | "all")} aria-label="Category">
          <option value="all">All categories</option>
          {cats.map((c) => (
            <option key={c} value={c}>
              {CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
        <select className="field" value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort">
          <option value="family">Group by family</option>
          <option value="wingspan">Sort by wingspan</option>
          <option value="length">Sort by length</option>
          <option value="year">Sort by first flight</option>
          <option value="name">Sort by name</option>
        </select>
        <span className="spacer" />
        <input className="field" style={{ minWidth: 260 }} placeholder="Search type, family or ICAO code" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search aircraft" />
      </div>

      {sort === "family" ? (
        <div className="catalogue">
          <nav className="index" aria-label="Manufacturers">
            <div className="label">Index</div>
            {index.map(([m, anchor]) => (
              <a key={m} href={`#${anchor}`}>
                {m}
              </a>
            ))}
          </nav>
          <div>
            {families.map((f) => {
              const spans = f.members.map((m) => m.geometry.wingspan);
              const years = f.members.map((m) => m.firstFlight).filter((y): y is number => !!y);
              return (
                <section key={f.family} id={slugify(f.family)} className="fam">
                  <div className="fam-head">
                    <h3>
                      {f.family}
                      <span>{f.manufacturer}</span>
                    </h3>
                    <div className="meta">
                      {f.members.length} {f.members.length === 1 ? "type" : "types"} · span {Math.min(...spans)}–{Math.max(...spans)} m
                      {years.length ? ` · ${Math.min(...years)}${years.length > 1 && Math.max(...years) !== Math.min(...years) ? `–${Math.max(...years)}` : ""}` : ""}
                    </div>
                  </div>
                  <Tiles list={f.members} />
                </section>
              );
            })}
            {families.length === 0 && <p className="empty">No aircraft match that search.</p>}
          </div>
        </div>
      ) : (
        <>
          <Tiles list={flat} />
          {flat.length === 0 && <p className="empty">No aircraft match that search.</p>}
        </>
      )}
    </>
  );
}

function Tiles({ list }: { list: Aircraft[] }) {
  return (
    <div className="tiles">
      {list.map((a) => (
        <Link key={a.slug} href={`/aircraft/${a.slug}`} className="tile">
          <div className="thumb">
            <Silhouette aircraft={a} />
          </div>
          <div className="t">{a.name}</div>
          <div className="m">
            <span>{a.icao}</span>
            <span>{a.geometry.wingspan} m</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
