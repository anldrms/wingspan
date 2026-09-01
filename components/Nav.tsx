"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const REPO = process.env.NEXT_PUBLIC_REPO_URL;
const LINKS = [
  { href: "/", label: "Gallery" },
  { href: "/compare", label: "Compare" },
  ...(REPO ? [{ href: REPO, label: "GitHub", external: true }] : []),
];

export default function Nav() {
  const path = usePathname();
  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link href="/" className="brand" aria-label="Wingspan home">
          <Logo />
          Wingspan
        </Link>
        <nav className="nav-links">
          {LINKS.map((l) =>
            l.external ? (
              <a key={l.href} href={l.href} target="_blank" rel="noreferrer">
                {l.label}
              </a>
            ) : (
              <Link key={l.href} href={l.href} aria-current={path === l.href ? "page" : undefined}>
                {l.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}

function Logo() {
  // Tiny stylised plan-view, same two-tone system as the silhouettes.
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <path fill="var(--ws-secondary)" d="M3 15h10l2-3h2l2 3h10l1 3-11 2v4l3 2v1l-6-1-6 1v-1l3-2v-4L2 18z" />
      <path fill="var(--ws-primary)" d="M14.6 3.5c.6-1.5 2.2-1.5 2.8 0L19 12v14l-3 3-3-3V12z" />
    </svg>
  );
}
