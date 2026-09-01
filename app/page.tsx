import Link from "next/link";
import Gallery from "@/components/Gallery";
import MorphHero from "@/components/MorphHero";
import { AIRCRAFT } from "@/lib/aircraft";

const HERO_CYCLE = ["a380", "cessna-172", "concorde", "747-8", "atr72-600", "f-22", "an-225", "sr-71", "a320neo", "dc-3"];

export default function Home() {
  const cycle = HERO_CYCLE.map((slug) => AIRCRAFT.find((a) => a.slug === slug)!).filter(Boolean);
  return (
    <>
      <section className="container hero">
        <div>
          <h1>
            Every aircraft, <em>to scale.</em>
          </h1>
          <p className="lede">
            {AIRCRAFT.length} plan-view silhouettes generated from real dimensions. Overlay an A380 on a Cessna 172, morph a
            Concorde into a 747, and drop any of them into your project as a two-tone SVG.
          </p>
          <div className="hero-actions">
            <Link className="btn primary" href="/compare?ids=a380,cessna-172">
              Compare sizes
            </Link>
            <a className="btn" href="#gallery">
              Browse silhouettes
            </a>
          </div>
        </div>
        <MorphHero aircraft={cycle} />
      </section>

      <section className="container section" style={{ paddingTop: 8 }}>
        <div className="features">
          <div className="feature">
            <h3>Metres in, SVG out</h3>
            <p>
              Each silhouette is built from a handful of published measurements — wingspan, length, fuselage width, sweep —
              so proportions between aircraft are real, not eyeballed.
            </p>
          </div>
          <div className="feature">
            <h3>Morphable by design</h3>
            <p>
              All silhouettes share one point topology. Any type interpolates into any other with plain linear math, no
              path-matching library required.
            </p>
          </div>
          <div className="feature">
            <h3>Two-tone, CSS-only</h3>
            <p>
              Fuselage and wings are separate paths coloured by CSS variables. Hover animations are pure CSS; the SVG API
              serves any colour you ask for.
            </p>
          </div>
        </div>
      </section>

      <section id="gallery" className="container section">
        <div className="section-head">
          <div>
            <h2>Silhouettes</h2>
            <p>Hover to take off. Click for dimensions, downloads and comparisons.</p>
          </div>
        </div>
        <Gallery aircraft={AIRCRAFT} />
      </section>
    </>
  );
}
