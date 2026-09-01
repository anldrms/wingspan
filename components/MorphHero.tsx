"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Aircraft } from "@/lib/aircraft";
import { buildSilhouette, morph, polygonsPath, type Silhouette } from "@/lib/silhouette";

const HOLD_MS = 2600;
const MORPH_MS = 1200;

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

type Box = [number, number, number, number];

function fitBox(s: Silhouette, pad = 0.26): Box {
  const size = Math.max(s.wingspan, s.length) * (1 + pad);
  return [-size / 2, s.length / 2 - size / 2 - size * 0.02, size, size * 0.92];
}
function trueBox(s: Silhouette, maxSize: number, pad = 0.26): Box {
  const size = maxSize * (1 + pad);
  return [-size / 2, s.length / 2 - size / 2 - size * 0.02, size, size * 0.92];
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
        const a = boxFor(sils[from]);
        const b = boxFor(sils[to]);
        setFrame({ s: morph(sils[from], sils[to], t), box: [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t), lerp(a[3], b[3], t)] });
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

  useEffect(() => {
    setFrame((f) => ({ s: f.s, box: trueScale ? trueBox(sils[idx], maxSize) : fitBox(sils[idx]) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trueScale]);

  const label = progress > 0 && progress < 1 ? aircraft[(idx + 1) % aircraft.length] : aircraft[idx];
  const s = frame.s;
  const size = Math.max(frame.box[2], frame.box[3]);
  const off = size * 0.045;
  const tick = size * 0.01;
  const fs = size * 0.026;
  const hw = s.wingspan / 2;

  return (
    <div className="stage-frame morph hoverable" onMouseEnter={() => (paused.current = true)} onMouseLeave={() => (paused.current = false)}>
      <svg className="ws" viewBox={frame.box.join(" ")} aria-label="Morphing aircraft silhouette">
        {/* dimension lines follow the morph */}
        <g aria-hidden="true">
          <line className="dimline" x1={-hw} y1={-off} x2={hw} y2={-off} />
          <line className="dimline" x1={-hw} y1={-off - tick} x2={-hw} y2={-off + tick} />
          <line className="dimline" x1={hw} y1={-off - tick} x2={hw} y2={-off + tick} />
          <text className="dimtext" x={0} y={-off - tick * 1.6} fontSize={fs} textAnchor="middle">
            {s.wingspan.toFixed(1)} m
          </text>
          <line className="dimline" x1={hw + off} y1={0} x2={hw + off} y2={s.length} />
          <line className="dimline" x1={hw + off - tick} y1={0} x2={hw + off + tick} y2={0} />
          <line className="dimline" x1={hw + off - tick} y1={s.length} x2={hw + off + tick} y2={s.length} />
          <text className="dimtext" x={hw + off + tick * 1.8} y={s.length / 2} fontSize={fs} textAnchor="middle" transform={`rotate(90 ${hw + off + tick * 1.8} ${s.length / 2})`}>
            {s.length.toFixed(1)} m
          </text>
        </g>
        <g className="ws-anim">
          <path className="ws-secondary" d={polygonsPath(s.secondary)} />
          <path className="ws-accent" d={polygonsPath(s.accent)} />
          <path className="ws-primary" d={polygonsPath(s.primary)} />
        </g>
      </svg>
      <div className="morph-ctl seg" role="group" aria-label="Scale mode">
        <button aria-pressed={!trueScale} onClick={() => setTrueScale(false)}>
          Fit
        </button>
        <button aria-pressed={trueScale} onClick={() => setTrueScale(true)}>
          True scale
        </button>
      </div>
      <div className="morph-hud">
        <div>
          <div className="name serif">{label.name}</div>
          <div className="sub">
            {label.manufacturer} · {label.family} · {label.firstFlight ?? "not yet flown"}
          </div>
        </div>
        <div className="dims">
          MTOW {label.mtow} t<br />
          {label.capacity}
        </div>
      </div>
    </div>
  );
}
