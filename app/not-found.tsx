import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ padding: "80px 24px", textAlign: "center" }}>
      <div className="eyebrow">404</div>
      <h1 style={{ letterSpacing: "-0.03em" }}>Lost contact with that aircraft.</h1>
      <p style={{ color: "var(--ink-2)" }}>It may not be in the fleet yet.</p>
      <Link className="btn primary" href="/">
        Back to the gallery
      </Link>
    </div>
  );
}
