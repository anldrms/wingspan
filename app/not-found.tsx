import Link from "next/link";

export default function NotFound() {
  return (
    <div className="wrap notfound">
      <div className="label">404</div>
      <h1>Lost contact with that aircraft.</h1>
      <p style={{ color: "var(--ink-2)", marginBottom: 24 }}>It may not be in the fleet yet.</p>
      <Link className="btn solid" href="/">
        Back to the catalogue
      </Link>
    </div>
  );
}
