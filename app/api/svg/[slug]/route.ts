import { NextResponse } from "next/server";
import { getAircraft } from "@/lib/aircraft";
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
 * GET /api/svg/:slug?primary=0f172a&secondary=64748b&width=512&download=1
 * Returns a standalone two-tone SVG of the aircraft.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = getAircraft(slug);
  if (!a) return new NextResponse("Not found", { status: 404 });

  const url = new URL(req.url);
  const width = Math.min(4096, Math.max(16, Number(url.searchParams.get("width")) || 512));
  const svg = aircraftToSvg(a, {
    primary: color(url.searchParams.get("primary"), "#0f172a"),
    secondary: color(url.searchParams.get("secondary"), "#64748b"),
    width,
  });

  const headers: Record<string, string> = {
    "Content-Type": "image/svg+xml; charset=utf-8",
    "Cache-Control": "public, max-age=86400, s-maxage=31536000, immutable",
    "Access-Control-Allow-Origin": "*",
  };
  if (url.searchParams.get("download")) {
    headers["Content-Disposition"] = `attachment; filename="wingspan-${a.slug}.svg"`;
  }
  return new NextResponse(svg, { headers });
}
