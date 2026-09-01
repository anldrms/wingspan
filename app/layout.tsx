import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AIRCRAFT } from "@/lib/aircraft";
import { siteUrl } from "@/lib/site";

export const metadata: Metadata = {
  title: {
    default: "Wingspan — true-to-scale aircraft silhouettes",
    template: "%s · Wingspan",
  },
  description:
    `${AIRCRAFT.length} plan-view aircraft silhouettes drawn from real dimensions. Compare an A380 with a Cessna 172 at true scale, morph between types, and download every silhouette as SVG.`,
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
      <body>
        <Nav />
        <main>{children}</main>
        <footer className="container footer">
          <span>Wingspan · silhouettes generated from published dimensions; placement is approximate.</span>
          <span>
            <a href="/api/svg/a380">SVG API</a> · <a href="/compare">Compare</a>
          </span>
        </footer>
      </body>
    </html>
  );
}
