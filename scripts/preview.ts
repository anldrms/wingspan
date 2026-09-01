// Dev helper: renders every silhouette into one contact-sheet HTML for eyeballing.
import { writeFileSync, mkdirSync } from "node:fs";
import { AIRCRAFT } from "../lib/aircraft";
import { aircraftToSvg } from "../lib/svg";

mkdirSync("tmp", { recursive: true });
const cells = AIRCRAFT.map(
  (a) =>
    `<figure style="margin:0;padding:12px;border:1px solid #ddd;text-align:center;background:#fff">` +
    aircraftToSvg(a, { width: 150, primary: "#0f172a", secondary: "#64748b" }) +
    `<figcaption style="font:12px sans-serif;margin-top:6px">${a.manufacturer} ${a.name}</figcaption></figure>`,
);
writeFileSync(
  "tmp/sheet.html",
  `<!doctype html><body style="margin:0;padding:16px;background:#f3f4f6"><div style="display:grid;grid-template-columns:repeat(8,1fr);gap:12px">${cells.join("")}</div></body>`,
);
console.log("wrote tmp/sheet.html");
