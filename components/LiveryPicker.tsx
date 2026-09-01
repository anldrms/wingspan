"use client";

import { useState } from "react";
import type { Aircraft } from "@/lib/aircraft";
import { DEFAULT_LIVERY, liveryGroups, type Livery } from "@/lib/liveries";
import Silhouette from "./Silhouette";
import CopyButton from "./CopyButton";

/**
 * Detail-page figure + livery swatches + export controls. The chosen livery
 * recolours the inline SVG (CSS variables) and is threaded into the download
 * and embed URLs so what you see is what you get.
 */
export default function LiveryPicker({ aircraft, site }: { aircraft: Aircraft; site: string }) {
  const [livery, setLivery] = useState<Livery>(DEFAULT_LIVERY);
  const q = livery.slug === DEFAULT_LIVERY.slug ? "" : `livery=${livery.slug}`;
  const svgUrl = `/api/svg/${aircraft.slug}${q ? `?${q}` : ""}`;
  const embed = `<img src="${site}/api/svg/${aircraft.slug}?${q ? `${q}&` : ""}width=320" alt="${aircraft.manufacturer} ${aircraft.name} silhouette${q ? ` in ${livery.name} colours` : ""}" />`;

  return (
    <>
      <div className="stage-frame figure hoverable">
        <Silhouette aircraft={aircraft} square dimensions livery={livery} />
      </div>
      <div style={{ marginTop: 18 }}>
        <div className="liveries">
          {liveryGroups().map((g) => (
            <div key={g.region} className="livery-group">
              <div className="label">{g.region}</div>
              <div className="livery-row">
                {g.items.map((l) => (
                  <button key={l.slug} className="swatch" aria-pressed={livery.slug === l.slug} onClick={() => setLivery(l)} title={`${l.name} colours`}>
                    <i>
                      <b style={{ background: l.primary }} />
                      <b style={{ background: l.secondary }} />
                      <b style={{ background: l.accent }} />
                    </i>
                    {l.name}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="actions" style={{ marginTop: 18 }}>
          <a className="btn solid" href={`${svgUrl}${q ? "&" : "?"}download=1`}>
            Download SVG{q ? ` · ${livery.name}` : ""}
          </a>
          <CopyButton text={embed} label="Copy embed" />
          <a className="btn" href={svgUrl} target="_blank" rel="noreferrer">
            Open raw SVG
          </a>
        </div>
        <div className="label">Embed</div>
        <pre className="code">
          <code>{embed}</code>
        </pre>
        <p style={{ color: "var(--ink-3)", fontSize: 12.5, margin: "8px 0 0" }}>
          Query params: <code>livery</code>, or explicit <code>primary</code> / <code>secondary</code> / <code>accent</code> (hex without #), <code>outline=1</code>,{" "}
          <code>width</code> (px), <code>download=1</code>.
        </p>
      </div>
    </>
  );
}
