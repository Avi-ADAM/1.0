<!--
  Fruit.svelte — the shared fruit / profit of the ריקמה.

  Gold coins stamped with the 1💗1 logo bloom from the centre and stream
  outward to the partners, looping continuously. Emission distance and
  brightness grow with scroll, so the abundance visibly increases as the
  story unfolds. One InstancedMesh keeps it cheap.

  The coin face uses the same logo texture as the original hero scene
  (11.svelte), so the money reads as "our" coin, not a generic sphere.
-->
<script>
  import { T, useTask, useLoader } from '@threlte/core';
  import {
    InstancedMesh,
    CylinderGeometry,
    MeshStandardMaterial,
    TextureLoader,
    Object3D,
    Color
  } from 'three';

  /**
   * @typedef {Object} Props
   * @property {number} [scrollProgress]
   * @property {number} [count]
   */

  /** @type {Props} */
  let { scrollProgress = 0, count = 18 } = $props();

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const rnd = (s) => {
    const x = Math.sin(s * 91.37 + 47.13) * 43758.5453;
    return x - Math.floor(x);
  };

  // the 1💗1 logo, mapped onto the coin faces (same asset as the hero scene).
  const texture = useLoader(TextureLoader).load(
    'https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png'
  );

  // a flat disc — a coin. Unit radius; per-instance scale sets the real size.
  const geo = new CylinderGeometry(1, 1, 0.14, 32);
  const mat = new MeshStandardMaterial({
    color: new Color('#EEE8AA'),
    emissive: new Color('#7a5c14'),
    emissiveIntensity: 0.35,
    metalness: 0.7,
    roughness: 0.35
  });
  const mesh = new InstancedMesh(geo, mat, count);
  const dummy = new Object3D();

  // apply the logo texture to the coin faces once it has loaded.
  $effect(() => {
    if ($texture) {
      mat.map = $texture;
      mat.needsUpdate = true;
    }
  });

  // per-coin seed: a normalised outward direction, a life phase and a size.
  const seeds = Array.from({ length: count }, (_, i) => {
    let dx = rnd(i + 1) * 2 - 1;
    let dy = rnd(i + 5) * 2 - 1;
    let dz = rnd(i + 9) * 2 - 1;
    const len = Math.hypot(dx, dy, dz) || 1;
    dx /= len;
    dy /= len;
    dz /= len;
    return {
      dir: [dx, dy, dz],
      phase: rnd(i + 13),
      speed: 0.1 + rnd(i + 17) * 0.16,
      size: 0.22 + rnd(i + 21) * 0.14,
      tumble: 0.6 + rnd(i + 25) * 0.8
    };
  });

  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  let time = 0;
  useTask((delta) => {
    if (!reduce) time += delta;
    const flow = clamp01((scrollProgress - 0.2) / 0.5);
    mesh.visible = flow > 0.01;
    if (!mesh.visible) return;

    const reach = 1.2 + 2.2 * flow;
    for (let i = 0; i < count; i++) {
      const s = seeds[i];
      const life = (time * s.speed + s.phase) % 1;
      const dist = life * reach;
      dummy.position.set(
        s.dir[0] * dist,
        s.dir[1] * dist + 0.2,
        s.dir[2] * dist
      );
      // grow briefly, then fade toward the end of the journey
      const fade = life < 0.12 ? life / 0.12 : 1 - (life - 0.12) / 0.88;
      const sc = s.size * (0.55 + 0.6 * flow) * clamp01(fade);
      dummy.scale.setScalar(Math.max(0.0001, sc));
      // lay the coin face toward the viewer (+Z) and let it tumble & spin,
      // so the logo catches the light instead of showing the thin edge.
      dummy.rotation.set(
        Math.PI / 2 + Math.sin(time * 0.9 + i) * 0.5,
        Math.cos(time * 0.6 + i) * 0.4,
        time * s.tumble
      );
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
</script>

<T is={mesh} />
