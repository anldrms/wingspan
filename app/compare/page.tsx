import { Suspense } from "react";
import type { Metadata } from "next";
import Compare from "@/components/Compare";

export const metadata: Metadata = {
  title: "Compare aircraft sizes",
  description: "Overlay up to four aircraft at true scale — wingspan, length, weight and more, side by side.",
};

export default function ComparePage() {
  return (
    <div className="container">
      <div className="section-head" style={{ paddingTop: 36 }}>
        <div>
          <h2>Compare</h2>
          <p>Overlay up to four aircraft at true scale. The URL updates as you go, so any comparison is shareable.</p>
        </div>
      </div>
      <Suspense fallback={<p style={{ color: "var(--ink-3)", padding: "40px 0" }}>Loading…</p>}>
        <Compare />
      </Suspense>
    </div>
  );
}
