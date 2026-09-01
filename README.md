# Wingspan

**True-to-scale aircraft silhouettes — an icon library and a size-comparison playground.**

Wingspan turns a handful of published measurements (wingspan, length, fuselage width, sweep…) into clean, two-tone, plan-view silhouettes of real aircraft. Because every silhouette is generated from metres rather than hand-drawn, proportions *between* aircraft are real: drop an A380 on top of a Cessna 172 and the ratio is right.

- **Catalogue** — 129 aircraft in 51 families (every A320/737/747/777/787/A330/A340/A350 variant, regionals, MD/DC types, cargo, military, GA, historic), grouped by family with a manufacturer index.
- **Compare** — up to six aircraft at true scale: overlay or side-by-side in plan view, or a **3D walk-around** (three.js) built from the same parametric geometry, with person / bus / football-pitch references. Shareable URLs.
- **Liveries** — 38 airline colour presets (fuselage / wings / tail) applied live to any silhouette; `?livery=turkish-airlines` on the SVG API.
- **Morph** — every silhouette shares one point topology, so any aircraft interpolates smoothly into any other with plain linear math.
- **SVG API** — `/api/svg/:slug?livery=…` or `?primary=&secondary=&accent=` returns a standalone SVG you can `<img>` anywhere.

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run preview    # writes tmp/sheet.html — a contact sheet of every silhouette
```

## Deploy to Vercel

1. Push this folder to a GitHub repository.
2. In Vercel, **Add New → Project**, import the repo. The Next.js preset is detected automatically; no configuration is needed.
3. Optional environment variables (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_SITE_URL` — your deployment URL, used in embed snippets and metadata (e.g. `https://wingspan.vercel.app`).
   - `NEXT_PUBLIC_REPO_URL` — adds a GitHub link to the navigation.

Or from the command line: `npx vercel`.

## Adding an aircraft

Everything lives in [`lib/aircraft.ts`](lib/aircraft.ts). Aircraft are declared in **families**: a family carries the shared wing / tail / engine geometry drawn at a `baseLength`, and each variant row gives its own real dimensions. Variants are derived by *stretching* the fuselage (the wing moves aft by `foreFrac` of the length delta, the tail and rear engines by the full delta), and any field can be overridden per variant. Adding a variant to an existing family is one line:

```ts
{ slug: "a321lr", name: "A321LR", icao: "A21N", firstFlight: 2018, length: 44.51, wingspan: 35.8, height: 11.76, mtow: 97, capacity: "206 passengers" },
```

A brand-new family looks like this:

```ts
{
  slug: "a220-300",
  name: "A220-300",
  manufacturer: "Airbus",
  icao: "BCS3",
  category: "narrowbody",
  firstFlight: 2015,
  height: 11.5,
  mtow: 70.9,            // tonnes
  capacity: "140 passengers",
  cruise: 829,           // km/h
  geometry: {
    wingspan: 35.1,      // m
    length: 38.7,        // m
    fuselage: { width: 3.7, noseLen: 4.2, tailLen: 11, tailWidth: 0.7 },
    wing:     { y: 14.5, rootChord: 7, kinkFrac: 0.3, kinkChord: 4.2, tipChord: 1.5, sweep: 25 },
    stab:     { y: 33.5, span: 12.5, rootChord: 3.8, tipChord: 1.4, sweep: 30 },
    engines:  [{ x: 5.2, w: 2.3, l: 3.9 }],
  },
}
```

Geometry reference (all in metres, `y` measured from the nose tip):

| Field | Meaning |
| --- | --- |
| `fuselage.width` | maximum fuselage width |
| `fuselage.noseLen` | distance from nose tip to full width |
| `fuselage.tailLen` / `tailWidth` | length of the rear taper and width at the very tail |
| `wing.y` | wing leading edge at the root |
| `wing.rootChord` / `kinkChord` / `tipChord` | chord at root, trailing-edge kink and tip |
| `wing.kinkFrac` | kink position as a fraction of exposed half-span (0–1) |
| `wing.sweep` / `innerSweep` | leading-edge sweep in degrees; `innerSweep` (optional) applies root→kink for cranked deltas like Concorde |
| `stab.*` | same idea for the horizontal stabiliser (`span: 0` for tailless designs) |
| `engines[]` | up to 3 per side; `x` spanwise, `w`×`l` nacelle size, optional `y` for fuselage-mounted engines (`x: 0` = centreline tail engine), optional `prop` diameter for turboprops |
| `wingPos` / `tail` | `low`/`mid`/`high` and `conventional`/`t`/`cruciform` — only affect the 3D model |

Run `npm run preview` and open `tmp/sheet.html` to eyeball your new silhouette next to the others.

## Using the silhouettes elsewhere

- **Hotlink**: `<img src="https://your-deployment/api/svg/a380?primary=0f172a&secondary=64748b&width=320">`
- **Download**: append `&download=1`, or use the button on any aircraft page.
- **In code**: `lib/silhouette.ts` and `lib/svg.ts` are dependency-free TypeScript. `buildSilhouette(geometry)` gives you polygons in metres; `silhouetteToSvg()` gives you markup; `morph(a, b, t)` interpolates.

The two paths inside each SVG carry the classes `ws-primary` (fuselage) and `ws-secondary` (wings, stabiliser, engines), and default their fills to the CSS variables `--ws-primary` / `--ws-secondary`, so inline SVGs recolour with a single CSS rule.

## Accuracy

Wingspan, length, height, MTOW and first-flight year are published manufacturer figures. Wing, stabiliser and engine *placement* values are approximations read off three-view drawings — good enough for a silhouette, not for engineering. Corrections are welcome.

## Liveries

[`lib/liveries.ts`](lib/liveries.ts) holds three colours per airline (fuselage, wings & engines, tail). They are approximations of brand palettes so a silhouette reads as "that airline"; no logos or trademarks are drawn. Add a row to add an airline.

## Roadmap ideas

- Side-view silhouettes (same parametric approach, second topology)
- Winglets, twin tails, canards; textured liveries in 3D
- `@wingspan/icons` npm package with React / Vue / Svelte wrappers
- OG image per aircraft and per comparison

## License

MIT
