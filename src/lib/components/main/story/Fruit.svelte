<!--
  Fruit.svelte — the shared fruit / profit of the ריקמה.

  Small gold "coins" bloom from the centre and stream outward to the partners,
  looping continuously. Emission distance and brightness grow with scroll, so
  the abundance visibly increases as the story unfolds. One InstancedMesh keeps
  it cheap.
-->
<script>
  import { T, useTask } from '@threlte/core';
  import {
    InstancedMesh,
    SphereGeometry,
    MeshStandardMaterial,
    Object3D,
    Color
  } from 'three';

  /**
   * @typedef {Object} Props
   * @property {number} [scrollProgress]
   * @property {number} [count]
   */

  /** @type {Props} */
  let { scrollProgress = 0, count = 48 } = $props();

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const rnd = (s) => {
    const x = Math.sin(s * 91.37 + 47.13) * 43758.5453;
    return x - Math.floor(x);
  };

  const geo = new SphereGeometry(1, 12, 12);
  const mat = new MeshStandardMaterial({
    color: new Color('#E9C46A'),
    emissive: new Color('#7a5c14'),
    emissiveIntensity: 0.5,
    metalness: 0.75,
    roughness: 0.25
  });
  const mesh = new InstancedMesh(geo, mat, count);
  const dummy = new Object3D();

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
      speed: 0.12 + rnd(i + 17) * 0.22,
      size: 0.05 + rnd(i + 21) * 0.06
    };
  });

  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  let time = 0;
  useTask((delta) => {
    if (!reduce) time += delta;
    const flow = clamp01((scrollProgress - 0.2) / 0.5);
    mesh.visible = flow > 0.01;
    if (!mesh.visible) return;

    const reach = 1.4 + 2.6 * flow;
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
      const fade = life < 0.15 ? life / 0.15 : 1 - (life - 0.15) / 0.85;
      const sc = s.size * (0.4 + flow) * clamp01(fade);
      dummy.scale.setScalar(Math.max(0.0001, sc));
      dummy.rotation.set(time * 0.6 + i, time * 0.8, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });
</script>

<T is={mesh} />
