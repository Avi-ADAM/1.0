<script>
  // The Quorum ring: scattered orbs (people) drift in from the dark and
  // snap into a circle. When the circle is full — the quorum — everything
  // pulses gold. Driven from the page via `signed` / `min` / `phase`.
  import { T, useTask } from '@threlte/core';
  import * as THREE from 'three';

  let { signed = 0, min = 10, phase = 'filling' } = $props();

  const RING_RADIUS = 2.35;

  function scatterPos() {
    // random point on a loose outer shell, biased to the camera-visible band
    const r = 5.5 + Math.random() * 3.5;
    const theta = Math.random() * Math.PI * 2;
    const y = (Math.random() - 0.5) * 4;
    return [Math.cos(theta) * r, y, Math.sin(theta) * r];
  }

  // one orb per potential signer; rebuilt when the demo offer (min) changes
  let orbs = $state([]);
  $effect(() => {
    orbs = Array.from({ length: min }, () => ({ pos: scatterPos() }));
  });

  function slotPos(i, n) {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * RING_RADIUS, 0, Math.sin(a) * RING_RADIUS];
  }

  let groupRotY = $state(0);
  let pulse = $state(1);
  let time = 0;

  useTask((delta) => {
    time += delta;
    groupRotY += delta * (phase === 'activated' ? 0.55 : 0.12);
    pulse = phase === 'activated' ? 1 + 0.16 * Math.sin(time * 7) : 1;

    const k = 1 - Math.exp(-delta * 2.4); // frame-rate independent lerp
    const n = orbs.length;
    for (let i = 0; i < n; i++) {
      const orb = orbs[i];
      let target;
      if (i < signed) {
        target = slotPos(i, n);
      } else {
        // unjoined orbs hover on their shell with a slow personal wobble
        const s = orb.pos;
        target = [
          s[0] + Math.sin(time * 0.6 + i) * 0.004,
          s[1] + Math.cos(time * 0.5 + i * 2) * 0.004,
          s[2]
        ];
      }
      orb.pos[0] += (target[0] - orb.pos[0]) * (i < signed ? k : 1);
      orb.pos[1] += (target[1] - orb.pos[1]) * (i < signed ? k : 1);
      orb.pos[2] += (target[2] - orb.pos[2]) * (i < signed ? k : 1);
    }
  });

  // static starfield backdrop
  const starGeometry = new THREE.BufferGeometry();
  {
    const count = 320;
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 9 + Math.random() * 9;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.cos(phi) * 0.6;
      arr[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);
    }
    starGeometry.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  }

  let ratio = $derived(min > 0 ? signed / min : 0);
</script>

<T.PerspectiveCamera
  makeDefault
  position={[0, 2.6, 7.6]}
  fov={42}
  oncreate={(ref) => ref.lookAt(0, 0.1, 0)}
/>

<T.AmbientLight intensity={0.45} />
<T.DirectionalLight position={[4, 8, 6]} intensity={1.1} color="#fff3d6" />
<T.PointLight position={[-5, -3, 2]} intensity={14} color="#ff77b0" />

<T.Points geometry={starGeometry}>
  <T.PointsMaterial
    size={0.045}
    color="#eee8aa"
    transparent
    opacity={0.45}
    sizeAttenuation
  />
</T.Points>

<T.Group rotation.y={groupRotY} rotation.x={0.06}>
  <!-- the quorum ring: brightens as it fills -->
  <T.Mesh rotation.x={Math.PI / 2}>
    <T.TorusGeometry args={[RING_RADIUS, 0.018, 12, 128]} />
    <T.MeshBasicMaterial
      color={phase === 'activated' ? '#ffd98a' : '#b7a86a'}
      transparent
      opacity={0.18 + ratio * 0.65}
    />
  </T.Mesh>

  <!-- the offer at the center -->
  <T.Mesh scale={pulse}>
    <T.SphereGeometry args={[0.52, 48, 48]} />
    <T.MeshStandardMaterial
      color="#e8c56a"
      emissive="#e8a53a"
      emissiveIntensity={0.35 + ratio * (phase === 'activated' ? 1.6 : 0.7)}
      metalness={0.6}
      roughness={0.25}
    />
  </T.Mesh>

  <!-- the people -->
  {#each orbs as orb, i (i)}
    <T.Mesh
      position={[orb.pos[0], orb.pos[1], orb.pos[2]]}
      scale={(i < signed ? 1 : 0.62) * (i < signed ? pulse : 1)}
    >
      <T.SphereGeometry args={[0.15, 24, 24]} />
      <T.MeshStandardMaterial
        color={i < signed ? '#ffe2a1' : '#8f86b8'}
        emissive={i < signed ? '#ffb54d' : '#4b4270'}
        emissiveIntensity={i < signed ? 1.15 : 0.35}
        metalness={0.3}
        roughness={0.4}
      />
    </T.Mesh>
  {/each}
</T.Group>
