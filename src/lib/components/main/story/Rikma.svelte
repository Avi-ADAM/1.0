<!--
  Rikma.svelte — the "ריקמה" (network) that tells the site's story with scroll.

  A single cloud of points morphs through three layouts driven by scrollProgress:
    scatter (a few isolated individuals, the minimal opening)  →  globe (a
    worldwide movement)  →  heart (the ריקמה closing around the "1💗1" reveal).
  Glowing lines between neighbours fade in as the points gather into the globe,
  so the viewer literally watches "alone" become "together", and fade out again
  when the heart forms so the final logo reveal stays clean.

  Everything is procedural + instanced (one Points object, one LineSegments),
  so it is light and animates entirely from a single scroll value.
-->
<script>
  import { T, useTask } from '@threlte/core';
  import {
    BufferGeometry,
    BufferAttribute,
    Points,
    PointsMaterial,
    LineSegments,
    LineBasicMaterial,
    Group,
    Color,
    CanvasTexture,
    AdditiveBlending
  } from 'three';

  // soft round sprite so nodes read as glowing dots, not squares.
  function dotTexture() {
    if (typeof document === 'undefined') return null;
    const s = 64;
    const c = document.createElement('canvas');
    c.width = c.height = s;
    const ctx = c.getContext('2d');
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.35, 'rgba(255,244,214,0.9)');
    g.addColorStop(1, 'rgba(255,244,214,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    return new CanvasTexture(c);
  }

  /**
   * @typedef {Object} Props
   * @property {number} [scrollProgress] 0..1 scroll position of the content panel.
   * @property {number} [count] number of network nodes.
   */

  /** @type {Props} */
  let { scrollProgress = 0, count = 120 } = $props();

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  // --- deterministic pseudo-random (stable between SSR and client) ---------
  const rnd = (s) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  // --- three target layouts, one entry per node ----------------------------
  // 1) scattered isolation — spread through a wide shell, slightly flattened.
  function scatterPoint(i) {
    const R = 4.6 + rnd(i + 1) * 3.4;
    const th = rnd(i + 2) * Math.PI * 2;
    const ph = Math.acos(2 * rnd(i + 3) - 1);
    return [
      R * Math.sin(ph) * Math.cos(th),
      R * Math.sin(ph) * Math.sin(th) * 0.7,
      R * Math.cos(ph) * 0.5 - 1
    ];
  }

  // 2) heart — classic parametric heart curve. It is the *last* act now, and it
  // has to frame the revealed 1💗1 logo, so the points stay on the outer rim
  // (large radius, only lightly filled) instead of crowding the centre.
  function heartPoint(i, n) {
    const t = (i / n) * Math.PI * 2;
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y =
      13 * Math.cos(t) -
      5 * Math.cos(2 * t) -
      2 * Math.cos(3 * t) -
      Math.cos(4 * t);
    const fill = 0.82 + 0.18 * rnd(i + 7); // keep them near the outline
    return [
      (x / 16) * 3.2 * fill,
      (y / 16) * 3.2 * fill + 0.15,
      (rnd(i + 11) - 0.5) * 0.9
    ];
  }

  // 3) globe — Fibonacci sphere for an even worldwide spread.
  function globePoint(i, n, R = 2.05) {
    const off = 2 / n;
    const inc = Math.PI * (3 - Math.sqrt(5));
    const y = i * off - 1 + off / 2;
    const r = Math.sqrt(Math.max(0, 1 - y * y));
    const phi = i * inc;
    return [Math.cos(phi) * r * R, y * R, Math.sin(phi) * r * R];
  }

  const scatter = [];
  const heart = [];
  const globe = [];
  for (let i = 0; i < count; i++) {
    scatter.push(scatterPoint(i));
    heart.push(heartPoint(i, count));
    globe.push(globePoint(i, count));
  }

  // --- points object -------------------------------------------------------
  const positions = new Float32Array(count * 3);
  const geom = new BufferGeometry();
  geom.setAttribute('position', new BufferAttribute(positions, 3));
  const points = new Points(
    geom,
    new PointsMaterial({
      size: 0.16,
      map: dotTexture(),
      color: new Color('#F2C879'),
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      blending: AdditiveBlending,
      depthWrite: false
    })
  );

  // --- neighbour links (computed on the globe layout) ----------------------
  // The globe is the act the links belong to — nearest neighbours on the sphere
  // draw the worldwide mesh. They fade out again once the heart forms.
  const pairs = [];
  for (let i = 0; i < count; i++) {
    const cand = [];
    for (let j = 0; j < count; j++) {
      if (i === j) continue;
      const dx = globe[i][0] - globe[j][0];
      const dy = globe[i][1] - globe[j][1];
      const dz = globe[i][2] - globe[j][2];
      cand.push([dx * dx + dy * dy + dz * dz, j]);
    }
    cand.sort((a, b) => a[0] - b[0]);
    for (let k = 0; k < 3; k++) {
      const j = cand[k][1];
      if (j > i) pairs.push([i, j]); // dedupe undirected edges
    }
  }
  const linePos = new Float32Array(pairs.length * 6);
  const lgeom = new BufferGeometry();
  lgeom.setAttribute('position', new BufferAttribute(linePos, 3));
  const lines = new LineSegments(
    lgeom,
    new LineBasicMaterial({
      color: new Color('#e0218a'),
      transparent: true,
      opacity: 0,
      blending: AdditiveBlending,
      depthWrite: false
    })
  );

  // one group holds points + lines so a single rotation (the globe spin) keeps
  // the links attached to their nodes.
  const rig = new Group();
  rig.add(points);
  rig.add(lines);

  // --- helpers -------------------------------------------------------------
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp01 = (x) => Math.min(1, Math.max(0, x));
  const smooth = (x) => x * x * (3 - 2 * x);

  let time = 0;
  let spin = 0;
  useTask((delta) => {
    if (!reduce) time += delta;
    const p = scrollProgress;

    // act weights: gather (scatter→globe) then bloom (globe→heart)
    const gather = smooth(clamp01((p - 0.1) / 0.34)); //  0.10 .. 0.44
    const bloom = smooth(clamp01((p - 0.62) / 0.3)); //   0.62 .. 0.92
    if (!reduce && gather > 0.001)
      spin += delta * (0.12 + gather * 0.45) * (1 - bloom);

    const drift = (1 - gather) * 0.25; // gentle isolation float, gone once joined
    for (let i = 0; i < count; i++) {
      const s = scatter[i];
      const g = globe[i];
      const h = heart[i];
      let x = lerp(s[0], g[0], gather);
      let y = lerp(s[1], g[1], gather);
      let z = lerp(s[2], g[2], gather);
      x = lerp(x, h[0], bloom);
      y = lerp(y, h[1], bloom);
      z = lerp(z, h[2], bloom);
      if (drift > 0) {
        y += Math.sin(time * 0.8 + i) * drift;
        x += Math.cos(time * 0.6 + i * 1.3) * drift * 0.6;
      }
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
    }
    geom.attributes.position.needsUpdate = true;

    for (let e = 0; e < pairs.length; e++) {
      const [i, j] = pairs[e];
      linePos[e * 6] = positions[i * 3];
      linePos[e * 6 + 1] = positions[i * 3 + 1];
      linePos[e * 6 + 2] = positions[i * 3 + 2];
      linePos[e * 6 + 3] = positions[j * 3];
      linePos[e * 6 + 4] = positions[j * 3 + 1];
      linePos[e * 6 + 5] = positions[j * 3 + 2];
    }
    lgeom.attributes.position.needsUpdate = true;

    // globe spin (points + lines share the same rotation so links stay attached).
    // It unwinds back to 0 as the heart forms, so the heart faces the viewer.
    rig.rotation.y = spin * (1 - bloom);

    lines.material.opacity = 0.4 * gather * (1 - bloom);
    points.material.opacity = 0.18 + 0.6 * gather + 0.2 * bloom;
  });
</script>

<T is={rig} />
