/**
 * Builds a low-poly 3D model of an aircraft from the same parametric
 * Geometry that drives the 2D silhouettes. Fuselage = revolved width profile,
 * lifting surfaces = extruded plan-view polygons, engines = cylinders, plus a
 * vertical fin sized from the published overall height.
 *
 * World axes (three.js): x = spanwise, y = up, z = along the fuselage (nose at z = 0, tail at +length).
 */
import * as THREE from "three";
import type { Aircraft } from "./aircraft";
import { buildSilhouette, wingLeadingEdgeAt, type Geometry, type Pt } from "./silhouette";

export interface ModelColors {
  primary: string;
  secondary: string;
  accent: string;
}

const deg = (d: number) => (d * Math.PI) / 180;

function halfWidthAt(g: Geometry, z: number): number {
  const f = g.fuselage;
  const hw = f.width / 2;
  if (z <= f.noseLen) return hw * Math.sin((Math.max(0, z / f.noseLen) * Math.PI) / 2) ** 0.85;
  const taperStart = g.length - f.tailLen;
  if (z >= taperStart) {
    const t = Math.min(1, (z - taperStart) / f.tailLen);
    return hw - (hw - f.tailWidth / 2) * t ** 1.4;
  }
  return hw;
}

/** Height of the fuselage centreline above ground. */
export function axisHeight(g: Geometry): number {
  return g.fuselage.width / 2 + Math.max(0.5, g.fuselage.width * 0.28);
}

function mat(color: string, opacity = 1): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.08, transparent: opacity < 1, opacity, side: THREE.DoubleSide });
}

/** Extrude a plan-view polygon (x spanwise, y along fuselage) into a flat plate lying in the XZ plane at height `y`. */
function plate(poly: Pt[], thickness: number, y: number, material: THREE.Material): THREE.Mesh {
  const shape = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, z)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  const mesh = new THREE.Mesh(geo, material);
  // Shape lives in XY; rotate so shape-Y becomes world Z. Extrusion (shape +Z) becomes world -Y, so lift by thickness.
  mesh.rotation.x = Math.PI / 2;
  mesh.position.y = y + thickness / 2;
  return mesh;
}

export function buildAircraftModel(a: Aircraft, colors: ModelColors, opacity = 1): THREE.Group {
  const g = a.geometry;
  const group = new THREE.Group();
  const sil = buildSilhouette(g);
  const primary = mat(colors.primary, opacity);
  const secondary = mat(colors.secondary, opacity);
  const accent = mat(colors.accent, opacity);
  const dark = mat("#2b2d31", opacity);

  const axisY = axisHeight(g);
  const hw = g.fuselage.width / 2;

  /* Fuselage: revolve the width profile. Slightly squash vertically for airliners (ovoid cross-section reads better). */
  const N = 48;
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= N; i++) {
    // denser sampling at both ends
    const t = i / N;
    const z = g.length * (0.5 - 0.5 * Math.cos(t * Math.PI));
    pts.push(new THREE.Vector2(Math.max(0.001, halfWidthAt(g, z)), z));
  }
  const fus = new THREE.Mesh(new THREE.LatheGeometry(pts, 40), primary);
  fus.rotation.x = Math.PI / 2; // lathe axis (+Y) → +Z
  fus.position.y = axisY;
  fus.scale.y = 1.06; // a touch taller than wide
  group.add(fus);

  /* Wings */
  const wingY = g.wingPos === "high" ? axisY + hw * 0.55 : g.wingPos === "mid" ? axisY : axisY - hw * 0.45;
  const dihedral = g.wingPos === "high" ? -2.5 : g.wingPos === "mid" ? 0 : 5;
  const wingT = Math.max(0.12, g.wing.kinkChord * 0.09);
  const [wingR, wingL] = sil.secondary; // first two secondary polys are the wings
  for (const [poly, sign] of [[wingR, 1], [wingL, -1]] as [Pt[], number][]) {
    const holder = new THREE.Group();
    holder.add(plate(poly, wingT, 0, secondary));
    holder.rotation.z = sign * deg(dihedral);
    holder.position.y = wingY;
    group.add(holder);
  }

  /* Vertical fin, sized from overall height. */
  const finRoot = Math.max(1.2, g.stab.rootChord * 1.5, g.fuselage.tailLen * 0.35);
  const finBaseY = axisY + halfWidthAt(g, g.length - finRoot * 0.5) * 0.6;
  const finTop = Math.max(finBaseY + 0.8, a.height);
  const finH = finTop - finBaseY;
  const finSweep = Math.tan(deg(Math.min(55, Math.max(20, g.stab.sweep + 8))));
  const finZ0 = Math.min(g.length - finRoot * 1.05, g.stab.y - finRoot * 0.3);
  const finTip = finRoot * 0.42;
  const finShape = new THREE.Shape([
    new THREE.Vector2(finZ0, finBaseY),
    new THREE.Vector2(finZ0 + finH * finSweep, finTop),
    new THREE.Vector2(Math.min(g.length + finTip * 0.3, finZ0 + finH * finSweep + finTip), finTop),
    new THREE.Vector2(finZ0 + finRoot, finBaseY),
  ]);
  const finT = Math.max(0.1, finRoot * 0.06);
  const fin = new THREE.Mesh(new THREE.ExtrudeGeometry(finShape, { depth: finT, bevelEnabled: false }), accent);
  fin.rotation.y = -Math.PI / 2; // shape X → world Z
  fin.position.x = finT / 2;
  group.add(fin);

  /* Horizontal stabiliser */
  if (g.stab.span > 0) {
    const stabY = g.tail === "t" ? finTop - finT : g.tail === "cruciform" ? finBaseY + finH * 0.45 : axisY + halfWidthAt(g, g.stab.y) * 0.35;
    const stabT = Math.max(0.08, g.stab.rootChord * 0.08);
    for (const poly of sil.accent) group.add(plate(poly, stabT, stabY, accent));
  }

  /* Engines */
  for (const e of g.engines) {
    if (e.w <= 0 && !e.prop) continue;
    const ahead = e.prop ? 0.8 : 0.7;
    const cz = e.y ?? wingLeadingEdgeAt(g, e.x) - ahead * e.l + e.l / 2;
    const sides = e.x === 0 ? [0] : [1, -1];
    for (const sign of sides) {
      const x = sign * e.x;
      let y: number;
      if (e.x === 0) y = e.y !== undefined && e.y > g.length * 0.6 ? axisY + hw * 0.9 + e.w / 2 : axisY; // tail-mounted centre engine vs nose prop
      else if (e.y !== undefined) y = axisY + hw * 0.35; // rear fuselage-mounted
      else y = wingY - e.w / 2 - Math.max(0.15, e.w * 0.12) + (g.wingPos === "high" ? e.w * 0.9 : 0); // podded under wing (high wings: nacelle in line)
      if (e.w > 0) {
        const nac = new THREE.Mesh(new THREE.CylinderGeometry(e.w / 2, e.w / 2 * 0.92, e.l, 24), secondary);
        nac.rotation.x = Math.PI / 2;
        nac.position.set(x, y, cz);
        group.add(nac);
        // pylon
        if (e.y === undefined && e.x !== 0) {
          const py = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.15, e.w * 0.12), Math.abs(wingY - y), e.l * 0.5), secondary);
          py.position.set(x, (wingY + y) / 2, cz + e.l * 0.1);
          group.add(py);
        }
      }
      if (e.prop) {
        const disc = new THREE.Mesh(new THREE.CylinderGeometry(e.prop / 2, e.prop / 2, 0.08, 32), mat("#1d1f23", Math.min(opacity, 0.35)));
        disc.rotation.x = Math.PI / 2;
        disc.position.set(x, e.x === 0 ? axisY : y, e.w > 0 ? cz - e.l / 2 - 0.15 : e.y ?? 0.4);
        group.add(disc);
        const hub = new THREE.Mesh(new THREE.SphereGeometry(Math.max(0.12, e.prop * 0.05), 12, 12), dark);
        hub.position.copy(disc.position);
        group.add(hub);
      }
    }
  }

  /* Cockpit windows hint */
  const win = new THREE.Mesh(new THREE.BoxGeometry(hw * 1.9, hw * 0.28, g.fuselage.noseLen * 0.35), dark);
  win.position.set(0, axisY + hw * 0.62, g.fuselage.noseLen * 0.62);
  group.add(win);

  group.userData.length = g.length;
  group.userData.wingspan = g.wingspan;
  group.userData.height = a.height;
  return group;
}

/** Simple reference objects, all in metres. */
export function buildReference(kind: "bus" | "human" | "pitch", color: string): THREE.Object3D {
  const m = new THREE.MeshStandardMaterial({ color, roughness: 0.8, metalness: 0, transparent: true, opacity: 0.85 });
  if (kind === "bus") {
    const gr = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.6, 12), m);
    body.position.y = 0.6 + 1.3;
    gr.add(body);
    for (const [x, z] of [[-1.2, -4], [1.2, -4], [-1.2, 4], [1.2, 4]]) {
      const w = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16), new THREE.MeshStandardMaterial({ color: "#222" }));
      w.rotation.z = Math.PI / 2;
      w.position.set(x, 0.5, z);
      gr.add(w);
    }
    return gr;
  }
  if (kind === "human") {
    const gr = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 1.1, 6, 12), m);
    body.position.y = 0.85;
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 12), m);
    head.position.y = 1.67;
    gr.add(body, head);
    return gr;
  }
  // football pitch: outline on the ground
  const lm = new THREE.LineBasicMaterial({ color });
  const pts = [
    new THREE.Vector3(-34, 0.02, -52.5), new THREE.Vector3(34, 0.02, -52.5), new THREE.Vector3(34, 0.02, 52.5), new THREE.Vector3(-34, 0.02, 52.5), new THREE.Vector3(-34, 0.02, -52.5),
  ];
  const gr = new THREE.Group();
  gr.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm));
  gr.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(-34, 0.02, 0), new THREE.Vector3(34, 0.02, 0)]), lm));
  const circle: THREE.Vector3[] = [];
  for (let i = 0; i <= 64; i++) circle.push(new THREE.Vector3(Math.cos((i / 64) * Math.PI * 2) * 9.15, 0.02, Math.sin((i / 64) * Math.PI * 2) * 9.15));
  gr.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(circle), lm));
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(68, 105), new THREE.MeshStandardMaterial({ color, transparent: true, opacity: 0.07 }));
  plane.rotation.x = -Math.PI / 2;
  plane.position.y = 0.01;
  gr.add(plane);
  return gr;
}
