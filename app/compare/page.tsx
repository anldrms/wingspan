import { Suspense } from "react";
import type { Metadata } from "next";
import Compare from "@/components/Compare";

export const metadata: Metadata = {
  title: "Compare aircraft sizes",
  description: "Overlay up to six aircraft at true scale in plan view or walk around them in 3D — wingspan, length, weight and more, side by side.",
};

export default function ComparePage() {
  return (
    <div className="wrap">
      <div className="section-head" style={{ paddingTop: 36 }}>
        <div>
          <h2>Compare</h2>
          <p>Up to six aircraft at true scale — overlay them in plan view or walk around them in 3D. The URL updates as you go, so any comparison is shareable.</p>
        </div>
      </div>
      <Suspense fallback={<p className="empty">Loading…</p>}>
        <Compare />
      </Suspense>
    </div>
  );
}
