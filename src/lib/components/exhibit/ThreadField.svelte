<!--
  ThreadField — the living background of /exhibit: gold knots drifting on a
  warm page, stitched to their neighbours by pink threads, drawn toward the
  visitor's pointer. It is the one image the whole installation is made of — a
  rikma is also embroidery — so it stays on screen across all five steps and
  only changes its mood:

    attract  the welcome screen's idle loop: every few seconds the knots
             gather into a heart and let go again;
    gather   pull the knots in around `focus` (a point in 0..1 of the screen),
             the moment an idea becomes the centre of things.

  Canvas, not SVG: ~100 knots and their links every frame. Under
  prefers-reduced-motion it draws one still frame. Decorative: aria-hidden.
-->
<script>
  import { onMount } from 'svelte';

  /** @type {{ attract?: boolean, gather?: boolean, focus?: { x: number, y: number } }} */
  let { attract = false, gather = false, focus = { x: 0.5, y: 0.5 } } = $props();

  /** @type {HTMLCanvasElement | undefined} */
  let canvas = $state();

  const LINK = 150; // px: knots closer than this are stitched together
  const PINK = '226, 18, 122';
  const GOLD = '212, 161, 42';

  onMount(() => {
    const el = /** @type {HTMLCanvasElement} */ (canvas);
    const ctx = el.getContext('2d');
    if (!ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let w = 0;
    let h = 0;
    /** @type {{ x: number, y: number, vx: number, vy: number, r: number, gold: boolean, tx: number, ty: number }[]} */
    let knots = [];
    const pointer = { x: -1e4, y: -1e4 };

    function heartPoint(/** @type {number} */ t) {
      // The classic heart curve, y flipped for screen space.
      const x = 16 * Math.sin(t) ** 3;
      const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
      const s = Math.min(w, h) / 38;
      return { x: w / 2 + x * s, y: h * 0.47 + y * s };
    }

    function resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = el.clientWidth;
      h = el.clientHeight;
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.max(40, Math.min(110, Math.round((w * h) / 21000)));
      knots = Array.from({ length: n }, (_, i) => {
        const p = heartPoint((i / n) * Math.PI * 2);
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: 1.6 + Math.random() * 2.6,
          gold: Math.random() < 0.72,
          tx: p.x,
          ty: p.y
        };
      });
    }

    let heart = 0; // 0..1, how strongly the knots hold the heart shape
    let t0 = performance.now();

    function heartTarget(/** @type {number} */ now) {
      if (!attract) return 0;
      // 9s cycle: wander 3.6s, gather 1.4s, hold 2.6s, release 1.4s.
      const c = ((now - t0) / 1000) % 9;
      if (c < 3.6) return 0;
      if (c < 5) return (c - 3.6) / 1.4;
      if (c < 7.6) return 1;
      return 1 - (c - 7.6) / 1.4;
    }

    function step(/** @type {number} */ now) {
      heart += (heartTarget(now) - heart) * 0.08;
      const fx = focus.x * w;
      const fy = focus.y * h;
      for (const k of knots) {
        k.vx += (Math.random() - 0.5) * 0.04;
        k.vy += (Math.random() - 0.5) * 0.04;
        // The pointer pulls gently, from up to 220px away.
        const dx = pointer.x - k.x;
        const dy = pointer.y - k.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 220 * 220 && d2 > 1) {
          const f = 0.018 * (1 - Math.sqrt(d2) / 220);
          k.vx += dx * f * 0.05;
          k.vy += dy * f * 0.05;
        }
        if (gather) {
          // A loose ring around the focus, not a pile on top of it.
          const gx = fx - k.x;
          const gy = fy - k.y;
          const gd = Math.hypot(gx, gy) || 1;
          const ring = Math.min(w, h) * 0.34;
          const pull = (gd - ring) / gd;
          k.vx += gx * pull * 0.0009;
          k.vy += gy * pull * 0.0009;
        }
        k.vx *= 0.97;
        k.vy *= 0.97;
        k.x += k.vx;
        k.y += k.vy;
        if (heart > 0.01) {
          k.x += (k.tx - k.x) * 0.07 * heart;
          k.y += (k.ty - k.y) * 0.07 * heart;
        }
        // Wrap softly at the edges so the field never empties.
        if (k.x < -20) k.x = w + 20;
        if (k.x > w + 20) k.x = -20;
        if (k.y < -20) k.y = h + 20;
        if (k.y > h + 20) k.y = -20;
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      ctx.lineWidth = 1.1;
      for (let i = 0; i < knots.length; i++) {
        const a = knots[i];
        for (let j = i + 1; j < knots.length; j++) {
          const b = knots[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          if (Math.abs(dx) > LINK || Math.abs(dy) > LINK) continue;
          const d = Math.hypot(dx, dy);
          if (d > LINK) continue;
          ctx.strokeStyle = `rgba(${PINK}, ${(1 - d / LINK) * (0.22 + heart * 0.28)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      for (const k of knots) {
        ctx.fillStyle = k.gold ? `rgba(${GOLD}, 0.85)` : `rgba(${PINK}, 0.7)`;
        ctx.beginPath();
        ctx.arc(k.x, k.y, k.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let raf = 0;
    function frame(/** @type {number} */ now) {
      step(now);
      draw();
      raf = requestAnimationFrame(frame);
    }

    function onMove(/** @type {PointerEvent} */ e) {
      const r = el.getBoundingClientRect();
      pointer.x = e.clientX - r.left;
      pointer.y = e.clientY - r.top;
    }
    function onLeave() {
      pointer.x = pointer.y = -1e4;
    }
    function onVisibility() {
      cancelAnimationFrame(raf);
      if (!document.hidden && !still) raf = requestAnimationFrame(frame);
    }

    resize();
    t0 = performance.now();
    if (still) draw();
    else raf = requestAnimationFrame(frame);

    const ro = new ResizeObserver(() => {
      resize();
      if (still) draw();
    });
    ro.observe(el);
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  });
</script>

<canvas bind:this={canvas} class="thread-field" aria-hidden="true"></canvas>

<style>
  .thread-field {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
</style>
