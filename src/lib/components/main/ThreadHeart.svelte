<!--
  ThreadHeart.svelte — the homepage's 3D scene: a rikma of light that closes
  into a heart. Mounted inside a <Canvas> in fpage.svelte's hero.

  It tells the rikma in three acts, the storyboard on the design canvas:
    1. loose threads — each one someone's contribution (time, money,
       equipment, knowledge), entering from outside the frame, apart;
    2. weaving — the threads cross over and under each other, a tissue;
    3. the heart — they close into one heart, and a fine tissue of cells lights
       up inside it, the old scene's glowing network grown into the heart.
  Each thread's thickness is that partner's share of the sample rikma the split
  block below uses (`splitSeed.js`), so the picture and the numbers agree: the
  thick gold one is the 49.7%, the thin teal one the 8.5%.

  The threads are light, not material: a thin hot core and a soft halo around
  it, both drawn from the same tube by a fresnel shader, with pulses running
  along them - the contributions flowing. The first version shaded fat tubes
  with clearcoat, and a glossy fat tube reads as a balloon.

  Everything is procedural — TubeGeometry along a parametric curve, points and
  lines — so the scene costs no model download at all. The scene it replaces
  fetched withlev.glb (~11MB) and 11.glb before the first frame.

  Motion follows $lib/stores/motion.js like every animating thing on the
  page: when the scene may not animate (paused, reduced motion, the business
  theme) the story is drawn already at its last act, and only scroll turns it.
-->
<script>
  import { T, useTask, useThrelte } from '@threlte/core';
  import {
    AdditiveBlending,
    BufferAttribute,
    BufferGeometry,
    Color,
    Curve,
    NormalBlending,
    ShaderMaterial,
    TubeGeometry,
    Vector3
  } from 'three';
  import { onDestroy } from 'svelte';
  import { sceneAnimates, motionSpeed } from '$lib/stores/motion.js';
  import { theme, resolvedMode, THEMES } from '$lib/stores/theme';
  import { seedShares } from './splitSeed.js';

  /**
   * @typedef {Object} Props
   * @property {number} [scroll] 0..1, how far the hero has scrolled out of view
   * @property {boolean} [active] false while the stage is off-screen: the frame
   *   task stops, and with it every render - nobody is looking at the heart
   */
  /** @type {Props} */
  let { scroll = 0, active = true } = $props();

  const STRANDS = 4;
  const SEGMENTS = 240;
  const RADIAL = 8;
  const INTRO_MS = 3400;
  const INTRO_DELAY_MS = 350;
  const FOV = 34;
  const PULSES = 4; // per strand
  const TAIL = 7; // sprites per pulse

  // thickness = share: the same four partners the split card shows
  const radii = seedShares(STRANDS).map(({ share }) => 0.0055 + 0.00032 * share);

  const clamp01 = (/** @type {number} */ x) => Math.min(1, Math.max(0, x));
  const smooth = (/** @type {number} */ x) => x * x * (3 - 2 * x);
  /** Deterministic, so server and client and every visit draw the same tissue. */
  const rnd = (/** @type {number} */ s) => {
    const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  /* --- the curves ---------------------------------------------------------- */

  const HEART_SCALE = 1.12;
  /** The classic parametric heart, centred on the origin. */
  function heart(/** @type {number} */ t, /** @type {Vector3} */ out) {
    const s = Math.sin(t);
    const x = 16 * s * s * s;
    const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
    return out.set((x / 16) * HEART_SCALE, (y / 16) * HEART_SCALE + 0.12, 0);
  }

  /**
   * One strand: loose (act 1) → woven (act 2) → heart (act 3), for a morph
   * value `e` in 0..1. The heart form keeps a small over/under weave in z so
   * the four read as a braid and not as four stacked outlines.
   */
  class Strand extends Curve {
    /** @param {number} i @param {number} e */
    constructor(i, e) {
      super();
      this.i = i;
      this.e = e;
      this.h = new Vector3();
    }
    /**
     * @param {number} u
     * @param {Vector3} [target]
     * @returns {Vector3}
     */
    // @ts-ignore - the installed three typings declare Curve.getPoint() with
    // no parameters; three itself calls it as getPoint(t, optionalTarget).
    getPoint(u, target = new Vector3()) {
      const { i, e } = this;
      const TAU = Math.PI * 2;
      // act 1: a loose wave that enters from beyond the frame's edge
      const lx = -2.7 + 5.4 * u;
      const ly = (i - 1.5) * 0.55 + 0.2 * Math.sin(TAU * (u * 1.5 + i * 0.3));
      const lz = 0.3 * Math.sin(TAU * (u + i * 0.2));
      // act 3: the heart, each strand a little inside the last, phase-shifted
      heart(TAU * (u + i * 0.25), this.h);
      const inset = 1 - i * 0.045;
      const hx = this.h.x * inset;
      const hy = this.h.y * inset + i * 0.01;
      const hz = 0.1 * Math.sin(TAU * u * 7 + (i * Math.PI) / 2);
      // act 2: the weave swells mid-way and settles again
      const w = Math.sin(Math.PI * e);
      const wz = 0.38 * w * Math.sin(TAU * u * 4 + (i * Math.PI) / 2);
      const wy = 0.12 * w * Math.cos(TAU * u * 3 + i);
      return target.set(
        lx + (hx - lx) * e,
        ly + (hy - ly) * e + wy,
        lz + (hz - lz) * e + wz
      );
    }
  }

  /** Staggered, so the threads arrive one after another rather than as a block. */
  const morphOf = (/** @type {number} */ story, /** @type {number} */ i) =>
    smooth(clamp01((story - i * 0.08) / 0.76));

  /* --- shaders -------------------------------------------------------------- */

  /* A thread of light. The same tube is drawn twice: once as the core (the
     view-facing middle is white-hot, the rim takes the partner's colour) and
     once pushed out along its normals as the halo, whose alpha falls off
     toward the silhouette - which is what makes it read as glow and not as a
     thicker solid. `vU` runs along the thread and carries a slow shimmer. */
  const TUBE_VERT = /* glsl */ `
    uniform float uGrow;
    varying vec3 vN;
    varying vec3 vV;
    varying float vU;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position + normal * uGrow, 1.0);
      vN = normalize(normalMatrix * normal);
      vV = normalize(-mv.xyz);
      vU = uv.x;
      gl_Position = projectionMatrix * mv;
    }
  `;
  const TUBE_FRAG = /* glsl */ `
    uniform vec3 uColor;
    uniform float uOpacity;
    uniform float uPower;
    uniform float uWhite;
    uniform float uTime;
    varying vec3 vN;
    varying vec3 vV;
    varying float vU;
    void main() {
      float ndv = abs(dot(normalize(vN), normalize(vV)));
      float shimmer = 0.78 + 0.22 * sin(vU * 46.0 - uTime * 2.4);
      float a = pow(ndv, uPower) * uOpacity * shimmer;
      vec3 c = mix(uColor, vec3(1.0), uWhite * pow(ndv, 3.0));
      gl_FragColor = vec4(c, a);
    }
  `;
  /* Soft round sprites: pulses, tissue nodes, drifting dust, the heart's light. */
  const SPRITE_VERT = /* glsl */ `
    attribute float aSize;
    attribute float aAlpha;
    attribute vec3 aColor;
    uniform float uScale;
    varying float vA;
    varying vec3 vC;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = aSize * uScale / -mv.z;
      vA = aAlpha;
      vC = aColor;
      gl_Position = projectionMatrix * mv;
    }
  `;
  const SPRITE_FRAG = /* glsl */ `
    uniform float uWhite;
    varying float vA;
    varying vec3 vC;
    void main() {
      float r = length(gl_PointCoord - 0.5) * 2.0;
      if (r > 1.0) discard;
      float a = 1.0 - r;
      a *= a;
      float core = smoothstep(0.4, 0.0, r);
      gl_FragColor = vec4(mix(vC, vec3(1.0), core * uWhite), a * vA);
    }
  `;
  const LINE_VERT = /* glsl */ `
    attribute float aAlpha;
    varying float vA;
    void main() {
      vA = aAlpha;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;
  const LINE_FRAG = /* glsl */ `
    uniform vec3 uColor;
    varying float vA;
    void main() { gl_FragColor = vec4(uColor, vA); }
  `;

  /** @param {{ grow: number, power: number, white: number, opacity: number, halo: boolean }} o */
  function tubeMaterial(o) {
    return new ShaderMaterial({
      vertexShader: TUBE_VERT,
      fragmentShader: TUBE_FRAG,
      uniforms: {
        uGrow: { value: o.grow },
        uColor: { value: new Color() },
        uOpacity: { value: o.opacity },
        uPower: { value: o.power },
        uWhite: { value: o.white },
        uTime: { value: 0 }
      },
      transparent: true,
      depthWrite: !o.halo
    });
  }
  const spriteMaterial = () =>
    new ShaderMaterial({
      vertexShader: SPRITE_VERT,
      fragmentShader: SPRITE_FRAG,
      uniforms: { uScale: { value: 600 }, uWhite: { value: 0.8 } },
      transparent: true,
      depthWrite: false
    });

  const cores = radii.map(() => tubeMaterial({ grow: 0, power: 0.5, white: 0.75, opacity: 1, halo: false }));
  const halos = radii.map((r) => tubeMaterial({ grow: r * 4.5, power: 2.2, white: 0, opacity: 0.4, halo: true }));

  /* --- the threads, rebuilt only while the story is moving ---------------- */

  const strands = radii.map((_, i) => new Strand(i, 0));
  /** @type {TubeGeometry[]} */
  let tubes = $state.raw([]);
  let builtStory = -1;

  function build(/** @type {number} */ story) {
    if (Math.abs(story - builtStory) < 0.002) return;
    builtStory = story;
    const next = [];
    for (let i = 0; i < STRANDS; i++) {
      strands[i].e = morphOf(story, i);
      // The installed three typings pin TubeGeometry's path to a built-in
      // curve class; any Curve<Vector3> is what it actually accepts.
      next.push(
        new TubeGeometry(/** @type {any} */ (strands[i]), SEGMENTS, radii[i], RADIAL, false)
      );
    }
    for (const g of tubes) g.dispose();
    tubes = next;
  }

  /* --- the tissue inside the heart ----------------------------------------- */

  /* The old scene's glowing network, grown into the heart's cells: a jittered
     hex grid clipped to the heart, each node linked to its near neighbours.
     It lights from the centre outward once the threads have closed. */
  const outline = Array.from({ length: 160 }, (_, k) => {
    const p = heart((k / 160) * Math.PI * 2, new Vector3());
    return [p.x * 0.9, (p.y - 0.12) * 0.9 + 0.12];
  });
  const inHeart = (/** @type {number} */ x, /** @type {number} */ y) => {
    let inside = false;
    for (let a = 0, b = outline.length - 1; a < outline.length; b = a++) {
      const [xa, ya] = outline[a];
      const [xb, yb] = outline[b];
      if (ya > y !== yb > y && x < ((xb - xa) * (y - ya)) / (yb - ya) + xa) inside = !inside;
    }
    return inside;
  };
  const STEP = 0.2;
  /** @type {{ x: number, y: number, z: number, r: number, ph: number }[]} */
  const nodes = [];
  for (let row = -8; row <= 8; row++) {
    for (let col = -8; col <= 8; col++) {
      const seed = row * 31 + col;
      const x = (col + (row & 1 ? 0.5 : 0)) * STEP + (rnd(seed) - 0.5) * 0.08;
      const y = row * STEP * 0.866 + 0.1 + (rnd(seed + 5) - 0.5) * 0.08;
      if (!inHeart(x, y)) continue;
      const r = Math.hypot(x, y - 0.1);
      // a gentle dome, so the tissue has body when the heart turns
      const z = 0.32 * Math.max(0, 1 - (r / 1.15) ** 2) * (rnd(seed + 9) > 0.5 ? 1 : -1) * 0.6;
      nodes.push({ x, y, z, r, ph: rnd(seed + 13) * Math.PI * 2 });
    }
  }
  const maxR = Math.max(...nodes.map((n) => n.r));
  /** @type {[number, number][]} */
  const links = [];
  for (let a = 0; a < nodes.length; a++) {
    for (let b = a + 1; b < nodes.length; b++) {
      const d = Math.hypot(nodes[a].x - nodes[b].x, nodes[a].y - nodes[b].y);
      if (d < STEP * 1.18 && rnd(a * 97 + b) > 0.18) links.push([a, b]);
    }
  }

  /* --- sprite and line buffers -------------------------------------------- */

  const DUST = 70;
  const PULSE_COUNT = STRANDS * PULSES * TAIL;
  const N_SPRITES = PULSE_COUNT + nodes.length + DUST + 1;
  const sPos = new Float32Array(N_SPRITES * 3);
  const sSize = new Float32Array(N_SPRITES);
  const sAlpha = new Float32Array(N_SPRITES);
  const sColor = new Float32Array(N_SPRITES * 3);
  const spriteGeo = new BufferGeometry();
  spriteGeo.setAttribute('position', new BufferAttribute(sPos, 3));
  spriteGeo.setAttribute('aSize', new BufferAttribute(sSize, 1));
  spriteGeo.setAttribute('aAlpha', new BufferAttribute(sAlpha, 1));
  spriteGeo.setAttribute('aColor', new BufferAttribute(sColor, 3));
  const sprites = spriteMaterial();

  const NODE0 = PULSE_COUNT;
  const DUST0 = NODE0 + nodes.length;
  const GLOW = DUST0 + DUST;
  nodes.forEach((n, k) => sPos.set([n.x, n.y, n.z], (NODE0 + k) * 3));
  /** the old scene's opening act: a few lone points drifting far out */
  const dust = Array.from({ length: DUST }, (_, k) => {
    const R = 2.2 + rnd(k + 1) * 2.4;
    const th = rnd(k + 2) * Math.PI * 2;
    const ph = Math.acos(2 * rnd(k + 3) - 1);
    return {
      x: R * Math.sin(ph) * Math.cos(th) * 1.3,
      y: R * Math.sin(ph) * Math.sin(th) * 0.75,
      z: R * Math.cos(ph) * 0.6 - 1.4,
      ph: rnd(k + 4) * Math.PI * 2,
      s: 0.035 + rnd(k + 5) * 0.05
    };
  });
  sPos.set([0, 0.05, -0.2], GLOW * 3);

  const lPos = new Float32Array(links.length * 6);
  const lAlpha = new Float32Array(links.length * 2);
  links.forEach(([a, b], k) => {
    lPos.set([nodes[a].x, nodes[a].y, nodes[a].z, nodes[b].x, nodes[b].y, nodes[b].z], k * 6);
  });
  const lineGeo = new BufferGeometry();
  lineGeo.setAttribute('position', new BufferAttribute(lPos, 3));
  lineGeo.setAttribute('aAlpha', new BufferAttribute(lAlpha, 1));
  const lineMat = new ShaderMaterial({
    vertexShader: LINE_VERT,
    fragmentShader: LINE_FRAG,
    uniforms: { uColor: { value: new Color() } },
    transparent: true,
    depthWrite: false
  });

  onDestroy(() => {
    for (const g of tubes) g.dispose();
    for (const m of [...cores, ...halos, sprites, lineMat]) m.dispose();
    spriteGeo.dispose();
    lineGeo.dispose();
  });

  /* --- palette: theme × mode ---------------------------------------------- */

  const PALETTES = {
    personal: {
      light: ['#b98510', '#d6247f', '#c9a032', '#15849c'],
      dark: ['#f0c040', '#ff5cad', '#ffe7a0', '#3cc4de']
    },
    business: {
      light: ['#1d4ed8', '#64748b', '#94a3b8', '#0e7490'],
      dark: ['#60a5fa', '#cbd5e1', '#94a3b8', '#38bdf8']
    }
  };
  const TISSUE = {
    personal: { light: '#c08a1a', dark: '#f5d27a' },
    business: { light: '#3b5b9a', dark: '#93c5fd' }
  };
  let night = $derived($resolvedMode === 'dark');
  let kind = $derived($theme === THEMES.business ? 'business' : 'personal');
  let colors = $derived(PALETTES[kind][night ? 'dark' : 'light']);

  /* Light adds up on a dark page and vanishes on a light one: at night the
     glow is additive, by day the same shapes are laid on with normal alpha.
     By day the halo is a paler tint of its thread - four deep halos stacked at
     normal alpha turn brown. */
  const WHITE = new Color('#ffffff');
  $effect(() => {
    const blending = night ? AdditiveBlending : NormalBlending;
    colors.forEach((c, i) => {
      cores[i].uniforms.uColor.value.set(c);
      cores[i].uniforms.uWhite.value = night ? 0.75 : 0;
      halos[i].uniforms.uColor.value.set(c).lerp(WHITE, night ? 0 : 0.45);
      halos[i].uniforms.uOpacity.value = night ? 0.42 : 0.14;
    });
    const tissue = new Color(TISSUE[kind][night ? 'dark' : 'light']);
    lineMat.uniforms.uColor.value.copy(tissue);
    sprites.uniforms.uWhite.value = night ? 0.8 : 0.5;
    for (let k = 0; k < N_SPRITES; k++) {
      const c =
        k < PULSE_COUNT
          ? new Color(colors[Math.floor(k / (PULSES * TAIL))]).lerp(WHITE, night ? 0 : 0.2)
          : tissue;
      sColor.set([c.r, c.g, c.b], k * 3);
    }
    spriteGeo.attributes.aColor.needsUpdate = true;
    for (const m of [...cores, ...halos, sprites, lineMat]) {
      m.blending = blending;
      m.needsUpdate = true;
    }
  });

  /* --- the story clock ---------------------------------------------------- */

  const { size, dpr } = useThrelte();
  const tan = Math.tan(((FOV / 2) * Math.PI) / 180);

  let story = 0;
  let started = /** @type {number | null} */ (null);
  let clock = 0;
  let spin = $state(0);
  let tilt = $state(0);
  let beatScale = $state(1);
  const p = new Vector3();

  /** Lub-dub: two soft beats, then rest. 0..1. */
  function beat(/** @type {number} */ t) {
    const ph = (t / 1.25) % 1;
    return Math.exp(-(((ph - 0.08) / 0.05) ** 2)) + 0.55 * Math.exp(-(((ph - 0.26) / 0.06) ** 2));
  }

  function frame(/** @type {number} */ speed) {
    const done = smooth(clamp01((story - 0.72) / 0.28));
    const b = beat(clock) * done * Math.min(1, speed);
    beatScale = 1 + 0.022 * b;
    for (const m of cores) m.uniforms.uTime.value = clock;
    for (const m of halos) m.uniforms.uTime.value = clock;
    halos.forEach((m, i) => (m.uniforms.uGrow.value = radii[i] * (4.5 + 2.2 * b)));

    // pulses: light running along each thread, a short comet each
    const arrived = smooth(clamp01((story - 0.1) / 0.3));
    for (let i = 0; i < STRANDS; i++) {
      for (let k = 0; k < PULSES; k++) {
        const head = (clock * (0.07 + 0.012 * i) + k / PULSES + i * 0.13) % 1;
        for (let j = 0; j < TAIL; j++) {
          const idx = (i * PULSES + k) * TAIL + j;
          const u = (head - j * 0.007 + 1) % 1;
          strands[i].getPoint(u, p);
          sPos.set([p.x, p.y, p.z], idx * 3);
          sSize[idx] = (radii[i] * 11 + 0.05) * (1 - j / TAIL) * (1 + 0.5 * b) * (night ? 1 : 0.7);
          sAlpha[idx] = arrived * (1 - j / TAIL) * (night ? 1 : 0.9);
        }
      }
    }

    // the tissue lights from the centre outward, then breathes
    const grow = smooth(clamp01((story - 0.62) / 0.38)) * 1.25;
    nodes.forEach((n, k) => {
      const lit = smooth(clamp01((grow - n.r / maxR) / 0.25));
      const tw = 0.62 + 0.38 * Math.sin(clock * 1.4 + n.ph);
      sSize[NODE0 + k] = 0.055 + 0.03 * lit * b;
      sAlpha[NODE0 + k] = lit * tw * (night ? 0.85 : 0.6);
    });
    links.forEach(([a, c], k) => {
      const la = smooth(clamp01((grow - nodes[a].r / maxR) / 0.25));
      const lc = smooth(clamp01((grow - nodes[c].r / maxR) / 0.25));
      const base = night ? 0.22 : 0.2;
      lAlpha[k * 2] = la * base * (0.7 + 0.5 * b);
      lAlpha[k * 2 + 1] = lc * base * (0.7 + 0.5 * b);
    });

    dust.forEach((d, k) => {
      const i = DUST0 + k;
      sPos.set(
        [d.x + 0.12 * Math.sin(clock * 0.2 + d.ph), d.y + 0.1 * Math.cos(clock * 0.17 + d.ph), d.z],
        i * 3
      );
      sSize[i] = d.s;
      sAlpha[i] = (0.25 + 0.2 * Math.sin(clock * 0.9 + d.ph)) * (night ? 1 : 0.55);
    });

    // the light in the heart, once it has closed
    sSize[GLOW] = 2.6 + 0.4 * b;
    sAlpha[GLOW] = done * (night ? 0.16 : 0.1) * (1 + 0.6 * b);

    sprites.uniforms.uScale.value = (size.current.height * dpr.current) / (2 * tan);
    spriteGeo.attributes.position.needsUpdate = true;
    spriteGeo.attributes.aSize.needsUpdate = true;
    spriteGeo.attributes.aAlpha.needsUpdate = true;
    lineGeo.attributes.aAlpha.needsUpdate = true;
  }

  // Nothing may move on its own: draw the last act straight away.
  if (!$sceneAnimates) story = 1;
  build(story);
  frame(0);

  useTask(
    (delta) => {
      if (story < 1) {
        if (!$sceneAnimates) {
          story = 1;
        } else {
          const now = performance.now();
          started ??= now + INTRO_DELAY_MS;
          story = clamp01((now - started) / INTRO_MS);
        }
        build(story);
      }
      const speed = motionSpeed();
      clock += delta * speed;
      frame(speed);
      // scroll turns the heart whether or not it may move on its own - it is
      // the visitor's own hand, not ambient motion
      spin = Math.sin(clock * 0.45) * 0.32 + scroll * 1.1;
      tilt = Math.sin(clock * 0.3) * 0.06 - scroll * 0.18;
    },
    { running: () => active }
  );
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 6.2]} fov={FOV} />

<T.Group rotation={[tilt, spin, 0]} scale={beatScale}>
  <T.LineSegments geometry={lineGeo} material={lineMat} renderOrder={1} />
  {#each tubes as geometry, i (i)}
    <T.Mesh {geometry} material={halos[i]} renderOrder={2} />
    <T.Mesh {geometry} material={cores[i]} renderOrder={3} />
  {/each}
  <T.Points geometry={spriteGeo} material={sprites} renderOrder={4} frustumCulled={false} />
</T.Group>
