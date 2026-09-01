"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import type { Aircraft } from "@/lib/aircraft";
import { buildAircraftModel, buildReference } from "@/lib/model3d";

export interface Compare3DProps {
  aircraft: Aircraft[];
  colors: string[];
  layout: "row" | "overlay";
  reference: "none" | "pitch" | "bus" | "human";
}

function shade(hex: string, k: number): string {
  const c = new THREE.Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s, Math.min(1, Math.max(0, hsl.l * k)));
  return `#${c.getHexString()}`;
}

function cssVar(name: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return v || fallback;
}

/**
 * Walk-around comparison. Models are rebuilt whenever the selection changes;
 * the camera is re-fitted only when the scene's size changes noticeably so
 * a user's orbit position survives small edits.
 */
export default function Compare3D({ aircraft, colors, layout, reference }: Compare3DProps) {
  const host = useRef<HTMLDivElement>(null);
  const state = useRef<{ renderer: THREE.WebGLRenderer; scene: THREE.Scene; camera: THREE.PerspectiveCamera; controls: OrbitControls; content: THREE.Group; fitted: number; layout?: string } | null>(null);

  // One-time scene setup
  useEffect(() => {
    const el = host.current;
    if (!el) return;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    renderer.setSize(el.clientWidth, el.clientHeight, false);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, 0.1, 5000);
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.minDistance = 3;

    scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8a80, 1.1));
    const sun = new THREE.DirectionalLight(0xffffff, 1.6);
    sun.position.set(80, 140, 60);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    scene.add(sun);
    scene.userData.sun = sun;

    const content = new THREE.Group();
    scene.add(content);

    state.current = { renderer, scene, camera, controls, content, fitted: 0 };

    let raf = 0;
    const loop = () => {
      controls.update();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(loop);
    };
    loop();

    const ro = new ResizeObserver(() => {
      const w = el.clientWidth, h = el.clientHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    });
    ro.observe(el);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      el.removeChild(renderer.domElement);
      state.current = null;
    };
  }, []);

  // Rebuild content when inputs change
  useEffect(() => {
    const st = state.current;
    if (!st) return;
    const { content, scene, camera, controls } = st;
    content.clear();

    const ink = cssVar("--ink-3", "#7d786c");
    const rule = cssVar("--rule-strong", "#b9b1a0");

    const models = aircraft.map((a, i) => {
      const c = colors[i % colors.length];
      return buildAircraftModel(a, { primary: c, secondary: shade(c, 0.82), accent: c }, layout === "overlay" && aircraft.length > 1 ? 0.78 : 1);
    });

    // Arrange
    const gap = Math.max(4, Math.max(...aircraft.map((a) => a.geometry.wingspan)) * 0.08);
    let extentX = 0;
    if (layout === "row") {
      const total = aircraft.reduce((s, a) => s + a.geometry.wingspan, 0) + gap * (aircraft.length - 1);
      let x = -total / 2;
      models.forEach((m, i) => {
        m.position.x = x + aircraft[i].geometry.wingspan / 2;
        x += aircraft[i].geometry.wingspan + gap;
      });
      extentX = total;
    } else {
      extentX = Math.max(...aircraft.map((a) => a.geometry.wingspan));
    }
    const maxLen = Math.max(...aircraft.map((a) => a.geometry.length));
    models.forEach((m) => {
      m.position.z = -maxLen / 2; // noses aligned at z = -maxLen/2
      m.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          o.castShadow = true;
          o.receiveShadow = false;
        }
      });
      content.add(m);
    });

    // Reference object, parked ahead of the noses on the left
    if (reference !== "none") {
      const ref = buildReference(reference, reference === "pitch" ? ink : "#e8491d");
      if (reference === "pitch") ref.position.set(0, 0, 0);
      else ref.position.set(-extentX / 2 - gap - 2, 0, -maxLen / 2 - 6);
      content.add(ref);
    }

    // Ground + grid sized to the scene
    const size = Math.max(extentX, maxLen, reference === "pitch" ? 110 : 0) * 1.9;
    const ground = new THREE.Mesh(new THREE.PlaneGeometry(size * 2, size * 2), new THREE.ShadowMaterial({ opacity: 0.22 }));
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    content.add(ground);
    const grid = new THREE.GridHelper(size, Math.round(size / 10), new THREE.Color(rule), new THREE.Color(rule));
    (grid.material as THREE.Material).transparent = true;
    (grid.material as THREE.Material).opacity = 0.55;
    content.add(grid);

    // Shadow camera follows scene size
    const sun = scene.userData.sun as THREE.DirectionalLight;
    const sc = sun.shadow.camera as THREE.OrthographicCamera;
    sc.left = sc.bottom = -size * 0.7;
    sc.right = sc.top = size * 0.7;
    sc.near = 1;
    sc.far = 600;
    sc.updateProjectionMatrix();

    // Fit camera when the scene size or arrangement changes meaningfully
    const fitSize = Math.max(extentX, maxLen);
    const layoutChanged = st.layout !== layout;
    st.layout = layout;
    if (!st.fitted || layoutChanged || Math.abs(fitSize - st.fitted) / st.fitted > 0.25) {
      const d = fitSize * 1.15;
      camera.position.set(d * 0.75, d * 0.42, d * 0.85);
      controls.target.set(0, Math.min(10, fitSize * 0.08), 0);
      controls.update();
      st.fitted = fitSize;
    }
  }, [aircraft, colors, layout, reference]);

  return (
    <div className="stage-frame stage-3d" ref={host}>
      <div className="stage-hint">drag to orbit · wheel to zoom · right-drag to pan</div>
    </div>
  );
}
