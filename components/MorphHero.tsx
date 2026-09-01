"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Aircraft } from "@/lib/aircraft";
import { buildSilhouette, morph, polygonsPath, type Silhouette } from "@/lib/silhouette";

const HOLD_MS = 2400;
const MORPH_MS = 1100;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Box = [number, number, number, number];

function fitBox(s: Silhouette, pad = 0.1): Box {
  const size = Math.max(s.wingspan, s.length) * (1 + pad);
  return [-size / 2, s.length / 2 - size / 2, size, size];
}

function trueBox(s: Silhouette, maxSize: number, pad = 0.1): Box {
  const size = maxSize * (1 + pad);
  return [-size / 2, s.length / 2 - size / 2, size, size];
}

export default function MorphHero({ aircraft }: { aircraft: Aircraft[] }) {
  const sils = useMemo(() => aircraft.map((a) => buildSilhouette(a.geometry)), [aircraft]);
  const maxSize = useMemo(() => Math.max(...sils.map((s) => Math.max(s.wingspan, s.length))), [sils]);

  const [trueScale, setTrueScale] = useState(false);
  const [idx, setIdx] = useState(0);
  const [frame, setFrame] = useState<{ s: Silhouette; box: Box }>(() => ({ s: sils[0], box: fitBox(sils[0]) }));
  const [progress, setProgress] = useState(0);
  const paused = useRef(false);
  const trueScaleRef = useRef(trueScale);
  trueScaleRef.current = trueScale;

  useEffect(() => {
    let raf = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    let current = idx;

    const boxFor = (s: Silhouette) => (trueScaleRef.current ? trueBox(s, maxSize) : fitBox(s));

    const run = () => {
      if (cancelled) return;
      if (paused.current) {
        timer = setTimeout(run, 300);
        return;
      }
      const from = current;
      const to = (current + 1) % sils.length;
      const start = performance.now();
      const step = (now: number) => {
        if (cancelled) return;
        const raw = Math.min(1, (now - start) / MORPH_MS);
        const t = easeInOut(raw);
        const s = morph(sils[from], sils[to], t);
        const a = boxFor(sils[from]);
        const b = boxFor(sils[to]);
        setFrame({ s, box: [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)] });
        setProgress(raw);
        if (raw < 1) raf = requestAnimationFrame(step);
        else {
          current = to;
          setIdx(to);
          timer = setTimeout(run, HOLD_MS);
        }
      };
      raf = requestAnimationFrame(step);
    };
    timer = setTimeout(run, HOLD_MS);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (timer) clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sils, maxSize]);

  // Snap the viewBox when toggling scale mode while holding.
  useEffect(() => {
    setFrame((f) => ({ s: f.s, box: trueScale ? trueBox(sils[idx], maxSize) : fitBox(sils[idx]) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trueScale]);

  // While morphing, the caption already names the aircraft we are flying towards.
  const label = progress > 0 && progress < 1 ? aircraft[(idx + 1) % aircraft.length] : aircraft[idx];

  return (
    <div
      className="morph-stage ws-hover"
      onMouseEnter={() => (paused.current = true)}
      onMouseLeave={() => (paused.current = false)}
    >
      <div className="grid-lines" />
      <svg className="ws" viewBox={frame.box.join(" ")} aria-label="Morphing aircraft silhouette">
        <path className="ws-secondary" d={polygonsPath(frame.s.secondary)} />
        <path className="ws-primary" d={polygonsPath(frame.s.primary)} />
      </svg>
      <div className="morph-toggle" role="group" aria-label="Scale mode">
        <button className="btn small" aria-pressed={!trueScale} onClick={() => setTrueScale(false)}>
          Fit
        </button>
        <button className="btn small" aria-pressed={trueScale} onClick={() => setTrueScale(true)}>
          True scale
        </button>
      </div>
      <div className="morph-caption">
        <div>
          <strong>{label.name}</strong>
          {label.manufacturer} · {label.firstFlight}
        </div>
        <div className="mono">
          {frame.s.wingspan.toFixed(1)} m × {frame.s.length.toFixed(1)} m
        </div>
      </div>
    </div>
  );
}
