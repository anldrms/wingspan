import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AIRCRAFT, FAMILIES } from "@/lib/aircraft";
import { siteUrl } from "@/lib/site";
import { Analytics } from "@vercel/analytics/next";

export const metadata: Metadata = {
  title: {
    default: "Wingspan — true-to-scale aircraft silhouettes",
    template: "%s · Wingspan",
  },
  description: `${AIRCRAFT.length} plan-view aircraft silhouettes across ${FAMILIES.length} families, drawn from real dimensions. Compare an A380 with a Cessna 172 at true scale, in 2D or 3D, and download every silhouette as SVG.`,
  metadataBase: new URL(siteUrl()),
  openGraph: {
    title: "Wingspan",
    description: "True-to-scale aircraft silhouettes: an icon library and a size-comparison playground.",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="wrap footer">
          <span>
            Wingspan · {AIRCRAFT.length} aircraft, {FAMILIES.length} families · dimensions from published data, placement approximate ·
            liveries are colour approximations, no logos.
          </span>
          <span>
            <a href="/api/svg/a380?livery=turkish-airlines">SVG API</a> · <a href="/liveries">Liveries</a> · <a href="/compare">Compare</a>
          </span>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
