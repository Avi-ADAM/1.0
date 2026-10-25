<!--
  The /vision hero illustration: the two roads, without words.

  On the left, in muted dashed line, the usual road - one founder holding a
  pitch board in front of a closed door, waiting. On the right, in colour, the
  rikma road - an idea (the gold bulb) with pink threads stitching out to four
  partners, and once every thread is drawn the heart over the bulb beats.
  Threads, because a rikma is also embroidery; same line language, palette
  and draw-in animation as the /its-yours and /broken-deal heroes.
-->
<script>
  import { t } from '$lib/translations';

  /* x of each partner on the ground; the bulb hangs above the middle. */
  const PARTNERS = [262, 322, 408, 468];
  const BULB = { x: 365, y: 92 };
</script>

{#snippet person(/** @type {number} */ x, /** @type {number} */ y)}
  <g transform="translate({x} {y})">
    <circle cx="0" cy="-46" r="12" />
    <path d="M-17 0 v-18 a17 17 0 0 1 34 0 v18 Z" />
  </g>
{/snippet}

<svg class="va" viewBox="0 0 520 280" role="img" aria-label={$t('vision.hero.artAlt')}>
  <path class="va-ground" d="M14 232 H506" />

  <!-- the usual road: alone, a pitch board, a closed door -->
  <g class="va-usual">
    {@render person(58, 230)}
    <path d="M70 198 L88 186" />
    <rect x="86" y="138" width="52" height="40" rx="3" />
    <path d="M94 170 v-8 M104 170 v-14 M114 170 v-10 M124 170 v-20" />
    <path d="M112 178 v52" />
    <rect class="va-door" x="160" y="150" width="34" height="80" rx="2" />
    <circle cx="186" cy="192" r="2.2" />
    <!-- waiting marks over the founder -->
    <path class="va-wait" d="M42 150 h6 M54 150 h6 M66 150 h6" />
  </g>

  <path class="va-split" d="M224 70 V232" />

  <!-- the rikma road: the idea, threads, partners -->
  <g class="va-rays">
    <path d="M{BULB.x} {BULB.y - 40} v-12 M{BULB.x - 34} {BULB.y - 24} l-9 -8 M{BULB.x + 34} {BULB.y - 24} l9 -8" />
  </g>
  <g class="va-bulb">
    <circle cx={BULB.x} cy={BULB.y} r="24" />
    <rect x={BULB.x - 10} y={BULB.y + 22} width="20" height="10" rx="2" />
  </g>

  <g class="va-threads" fill="none" stroke-linecap="round">
    {#each PARTNERS as x, i (x)}
      <path
        class="va-thread"
        style="--i:{i}"
        d="M{BULB.x} {BULB.y + 32} Q{(BULB.x + x) / 2} {BULB.y + 70} {x} 170"
        pathLength="1"
      />
    {/each}
  </g>

  <g class="va-partners">
    {#each PARTNERS as x (x)}
      {@render person(x, 230)}
    {/each}
  </g>

  <path
    class="va-heart"
    d="M{BULB.x} {BULB.y - 4} c-4 -8 -16 -7 -16 3 c0 8 11 13 16 19 c5 -6 16 -11 16 -19 c0 -10 -12 -11 -16 -3 Z"
  />
</svg>

<style>
  .va {
    display: block;
    width: 100%;
    max-width: 30rem;
    height: auto;
    margin: 0 auto;
    overflow: visible;
    --va-muted: var(--tm, #94a3b8);
  }
  .va-ground {
    fill: none;
    stroke: var(--gold);
    stroke-width: 4;
    stroke-linecap: round;
  }
  .va-usual {
    fill: none;
    stroke: var(--va-muted);
    stroke-width: 3;
    stroke-linecap: round;
    stroke-linejoin: round;
    opacity: 0.85;
  }
  .va-door {
    stroke-dasharray: 5 4;
  }
  .va-wait {
    stroke-width: 4;
    animation: va-wait 2.4s ease-in-out infinite;
  }
  .va-split {
    fill: none;
    stroke: var(--va-muted);
    stroke-width: 1.5;
    stroke-dasharray: 2 7;
    opacity: 0.6;
  }
  .va-bulb {
    fill: var(--gold);
  }
  .va-rays {
    fill: none;
    stroke: var(--gold);
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  .va-threads {
    stroke: var(--barbi-pink);
    stroke-width: 3.5;
  }
  /* Drawn by default; the animation only starts them hidden (`backwards`), so
     a browser that never runs it - a background tab, a print - still shows them. */
  .va-thread {
    animation: va-draw 0.6s ease-out backwards;
    animation-delay: calc(0.3s + var(--i) * 0.25s);
  }
  .va-partners {
    fill: var(--barbi-pink);
  }
  .va-heart {
    fill: var(--barbi-pink);
    transform-box: fill-box;
    transform-origin: center;
    animation: va-beat 1.6s ease-in-out 1.6s 2;
  }
  /* The dash pattern lives only inside the animation: once it ends the thread
     is a plain solid stroke, whatever the renderer makes of pathLength. */
  @keyframes va-draw {
    from {
      stroke-dasharray: 1;
      stroke-dashoffset: 1;
    }
    to {
      stroke-dasharray: 1;
      stroke-dashoffset: 0;
    }
  }
  @keyframes va-beat {
    0%,
    100% {
      transform: scale(1);
    }
    30% {
      transform: scale(1.2);
    }
    60% {
      transform: scale(0.95);
    }
  }
  @keyframes va-wait {
    0%,
    100% {
      opacity: 0.25;
    }
    50% {
      opacity: 1;
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .va-thread,
    .va-heart,
    .va-wait {
      animation: none;
    }
  }
</style>
