import Link from "next/link";
import Gallery from "@/components/Gallery";
import MorphHero from "@/components/MorphHero";
import { AIRCRAFT, FAMILIES } from "@/lib/aircraft";
import { LIVERIES } from "@/lib/liveries";

const HERO_CYCLE = ["a380", "cessna-172", "concorde", "747-8", "atr72-600", "f-22", "an-225", "sr-71", "a321neo", "dc-3", "777-9", "md-82"];

export default function Home() {
  const cycle = HERO_CYCLE.map((slug) => AIRCRAFT.find((a) => a.slug === slug)).filter((a): a is NonNullable<typeof a> => !!a);
  const spans = AIRCRAFT.map((a) => a.geometry.wingspan);
  const years = AIRCRAFT.map((a) => a.firstFlight).filter((y): y is number => !!y);

  return (
    <>
      <section className="wrap hero">
        <div className="hero-copy">
          <div className="label">Plan-view atlas · true scale</div>
          <h1>
            Every aircraft,
            <br />
            <em>to scale.</em>
          </h1>
          <p>
            {AIRCRAFT.length} silhouettes across {FAMILIES.length} families, generated from published dimensions rather than drawn by hand. Overlay an
            A380 on a Cessna 172, walk around them in 3D, morph a Concorde into a 747, and export any of them as a two-tone SVG in your
            airline&rsquo;s colours.
          </p>
          <div className="hero-actions">
            <Link className="btn solid" href="/compare?ids=a380,cessna-172">
              Compare sizes
            </Link>
            <a className="btn" href="#catalogue">
              Browse the catalogue
            </a>
            <Link className="btn" href="/liveries">
              Liveries
            </Link>
          </div>
        </div>
        <MorphHero aircraft={cycle} />
      </section>

      <section className="wrap">
        <div className="strip">
          <div>
            <div className="label">Aircraft</div>
            <div className="v num">
              {AIRCRAFT.length}
              <small>types</small>
            </div>
          </div>
          <div>
            <div className="label">Families</div>
            <div className="v num">
              {FAMILIES.length}
              <small>lineages</small>
            </div>
          </div>
          <div>
            <div className="label">Wingspan range</div>
            <div className="v num">
              {Math.min(...spans)}–{Math.max(...spans)}
              <small>m</small>
            </div>
          </div>
          <div>
            <div className="label">First flights</div>
            <div className="v num">
              {Math.min(...years)}–{Math.max(...years)}
              <small>· {LIVERIES.length - 3} liveries</small>
            </div>
          </div>
        </div>
      </section>

      <section id="catalogue" className="wrap section">
        <div className="section-head">
          <h2>Catalogue</h2>
          <p>Grouped by family. Hover to take off; open a type for dimensions, variants, liveries and SVG export.</p>
        </div>
        <Gallery aircraft={AIRCRAFT} />
      </section>
    </>
  );
}
