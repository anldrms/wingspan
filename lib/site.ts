/**
 * Public URL of this deployment.
 * Order: explicit NEXT_PUBLIC_SITE_URL → Vercel's production URL → Vercel's deployment URL → localhost.
 * Empty strings are treated as unset (an empty env var on Vercel would otherwise crash `new URL("")`).
 */
export function siteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (prod) return `https://${prod}`;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel}`;
  return "http://localhost:3000";
}
