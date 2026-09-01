import { NextResponse } from "next/server";
import { getAircraft } from "@/lib/aircraft";
import { getLivery, LIVERY_BY_SLUG } from "@/lib/liveries";
import { aircraftToSvg } from "@/lib/svg";

// Rendered on demand (query params pick colours/size); CDN-cached for a year via Cache-Control.

const HEX = /^[0-9a-fA-F]{3,8}$/;

function color(v: string | null, fallback: string): string {
  if (!v) return fallback;
  if (HEX.test(v)) return `#${v}`;
  // Allow CSS named colours / "transparent" but nothing that could break out of an attribute.
  return /^[a-zA-Z]{3,24}$/.test(v) ? v : fallback;
}

/**
 * GET /api/svg/:slug
 *   ?livery=turkish-airlines        colour preset (see /liveries)
 *   ?primary=0f172a&secondary=64748b&accent=c8102e   explicit colours (override the livery)
 *   ?outline=1                      hairline outline (for light liveries on light backgrounds)
 *   ?width=512                      pixel width
 *   ?download=1                     Content-Disposition: attachment
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAircraft(slug);
  if (!a) return new NextResponse("Not found", { status: 404 });

  const url = new URL(req.url);
  const q = url.searchParams;
  const liverySlug = q.get("livery");
  if (liverySlug && !LIVERY_BY_SLUG[liverySlug]) return new NextResponse("Unknown livery", { status: 400 });
  const livery = getLivery(liverySlug);

  const width = Math.min(4096, Math.max(16, Number(q.get("width")) || 512));
  const svg = aircraftToSvg(a, {
    primary: color(q.get("primary"), livery.primary),
    secondary: color(q.get("secondary"), livery.secondary),
    accent: color(q.get("accent"), livery.accent),
    outline: q.get("outline") ? color(q.get("outline") === "1" ? null : q.get("outline"), "#0f172a") : undefined,
    width,
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    "Access-Control-Allow-Origin": "*",
  };
  if (q.get("download")) {
    headers["Content-Disposition"] = `attachment; filename="wingspan-${a.slug}${liverySlug ? `-${liverySlug}` : ""}.svg"`;
  }
  return new NextResponse(svg, { headers });
}
