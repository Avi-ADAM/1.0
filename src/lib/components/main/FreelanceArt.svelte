<!--
  FreelanceArt — the /freelance argument as one picture, no words inside.

  Start side: one figure on a treadmill, chasing a coin dangled from a stick
  tied to their own back - the next client, always one step ahead - and under
  it the months: bars that rise and fall back to zero.
  End side: three figures weaving one pink thread between them (a rikma is
  also embroidery), a heart over it, and under it stacks of coins that only
  grow.

  The captions are HTML under the drawing, not <text> in it: RTL runs inside
  SVG reorder badly, and HTML gets the page's fonts and translation for free.
  For the same reason the drawing mirrors in RTL - the story reads from the
  reader's start side to their end side, and with no glyphs inside nothing
  comes out backwards.

  Motion (coin swing, belt, stacks rising) runs only in the site's "full"
  motion mode, the same switch IncomeCurves reads.
-->
<script>
  import { t, isRtl } from '$lib/translations';
  import { motionMode, MOTION_MODES } from '$lib/stores/motion.js';

  let animate = $derived($motionMode === MOTION_MODES.full);

  /** Months alone: up, down, and back to zero. */
  const MONTHS = [34, 12, 42, 0, 24, 3];
  /** Years together: every stack taller than the last. */
  const STACKS = [1, 2, 3, 4, 5, 6];
  /** @type {{ x: number, cls: string }[]} */
  const PEOPLE = [
    { x: 345, cls: 'fa-p1' },
    { x: 430, cls: 'fa-p2' },
    { x: 515, cls: 'fa-p3' }
  ];
</script>

<figure class="fa">
  <svg
    viewBox="0 58 560 236"
    role="img"
    aria-label={$t('freelance.art.alt')}
    class:fa-anim={animate}
    style:transform={$isRtl ? 'scaleX(-1)' : undefined}
  >
    <!-- ===== alone ===== -->
    <g class="fa-ink">
      <!-- treadmill: belt, rollers, arrows running backwards -->
      <rect x="34" y="196" width="176" height="12" rx="6" class="fa-belt" />
      <circle cx="42" cy="202" r="3" class="fa-dot" />
      <circle cx="202" cy="202" r="3" class="fa-dot" />
      <g class="fa-belt-arrows">
        <path d="M150 202 h-10 m4 -4 l-4 4 l4 4" />
        <path d="M110 202 h-10 m4 -4 l-4 4 l4 4" />
        <path d="M70 202 h-10 m4 -4 l-4 4 l4 4" />
      </g>
      <!-- runner, leaning in -->
      <circle cx="108" cy="116" r="11" class="fa-fill" />
      <path d="M104 129 L92 164" />
      <path d="M101 138 L121 150 M101 138 L82 147" />
      <path d="M92 164 L112 178 L110 194 M92 164 L76 180 L64 186" />
      <!-- the stick tied to their own back, the coin always ahead -->
      <path d="M96 140 Q126 82 176 96" class="fa-stick" />
      <path d="M176 96 V112" class="fa-string" />
      <g class="fa-coin-swing">
        <circle cx="176" cy="124" r="12" class="fa-coin" />
        <circle cx="176" cy="124" r="6.5" class="fa-coin-in" />
      </g>
      <!-- months: up, down, zero -->
      <path d="M30 284 H214" class="fa-base" />
      {#each MONTHS as h, i (i)}
        {#if h > 0}
          <rect x={40 + i * 29} y={284 - h} width="18" height={h} rx="3" class="fa-bar" />
        {:else}
          <path d="M{40 + i * 29} 284 h18" class="fa-zero" />
        {/if}
      {/each}
    </g>

    <!-- the turn -->
    <path d="M244 150 H300 m-10 -9 l10 9 l-10 9" class="fa-turn" />

    <!-- ===== together ===== -->
    <g>
      {#each PEOPLE as { x, cls } (x)}
        <g class={cls}>
          <circle cx={x} cy="128" r="12" />
          <path d="M{x - 15} 196 v-26 q0 -24 15 -24 q15 0 15 24 v26 Z" />
        </g>
      {/each}
      <!-- one thread, woven: two strands crossing between every pair -->
      <g class="fa-thread">
        <path d="M358 162 C376 144 398 180 416 162 M444 162 C462 144 484 180 502 162" />
        <path d="M358 162 C376 180 398 144 416 162 M444 162 C462 180 484 144 502 162" />
      </g>
      <path
        class="fa-heart"
        d="M430 78 c-5 -10 -20 -8 -20 3 c0 10 13 16 20 23 c7 -7 20 -13 20 -23 c0 -11 -15 -13 -20 -3 Z"
      />
      <!-- years: every stack taller than the last -->
      <path d="M318 284 H546" class="fa-base fa-ink" />
      {#each STACKS as n, i (i)}
        <g class="fa-stack" style="--i:{i}">
          {#each Array(n) as _, k (k)}
            <ellipse cx={336 + i * 38} cy={278 - k * 9} rx="14" ry="5" class="fa-coin" />
          {/each}
        </g>
      {/each}
    </g>
  </svg>
  <figcaption class="fa-caps">
    <span>{$t('freelance.art.alone')}</span>
    <span class="fa-cap-on">{$t('freelance.art.together')}</span>
  </figcaption>
</figure>

<style>
  .fa {
    margin: 0;
    width: 100%;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    color: rgb(var(--surface-ink-rgb, 59 47 47));
  }
  .fa-ink {
    stroke: currentColor;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    fill: none;
  }
  .fa-fill {
    fill: currentColor;
    stroke: none;
  }
  .fa-belt {
    stroke-width: 3;
    opacity: 0.55;
  }
  .fa-dot {
    fill: currentColor;
    stroke: none;
    opacity: 0.55;
  }
  .fa-belt-arrows path {
    stroke-width: 2.5;
    opacity: 0.6;
  }
  .fa-stick {
    stroke-width: 3;
    opacity: 0.75;
  }
  .fa-string {
    stroke-width: 1.5;
    opacity: 0.75;
  }
  .fa-coin {
    fill: rgb(var(--gold-rgb, 238 232 170));
    stroke: #b45309;
    stroke-width: 2;
  }
  .fa-coin-in {
    fill: none;
    stroke: #b45309;
    stroke-width: 1.5;
  }
  .fa-base {
    stroke-width: 2;
    opacity: 0.45;
  }
  .fa-bar {
    fill: currentColor;
    stroke: none;
    opacity: 0.35;
  }
  .fa-zero {
    stroke: rgb(var(--barbi-pink-rgb, 255 0 146));
    stroke-width: 4;
  }
  .fa-turn {
    fill: none;
    stroke: #c9a227;
    stroke-width: 4;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-dasharray: 2 9;
  }
  .fa-p1,
  .fa-p3 {
    fill: currentColor;
    opacity: 0.85;
  }
  .fa-p2 {
    fill: rgb(var(--barbi-pink-rgb, 255 0 146));
  }
  .fa-thread path {
    fill: none;
    stroke: rgb(var(--barbi-pink-rgb, 255 0 146));
    stroke-width: 3.5;
    stroke-linecap: round;
  }
  /* A fixed deeper gold, not --gold: the theme gold is a pale #eee8aa that
     all but vanishes on the light surface. */
  .fa-thread path + path {
    stroke: #c9a227;
  }
  .fa-heart {
    fill: rgb(var(--barbi-pink-rgb, 255 0 146));
  }

  /* Two captions under their halves, in the page's own direction, so the
     start-side caption sits under the (mirrored) start-side drawing. */
  .fa-caps {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
    margin-top: 0.5rem;
    text-align: center;
    font-size: 0.95rem;
    line-height: 1.4;
    color: rgb(var(--surface-muted-rgb, 100 116 139));
  }
  .fa-cap-on {
    font-weight: 700;
    color: rgb(var(--barbi-pink-rgb, 255 0 146));
  }

  /* ---- motion: only in "full" mode ---- */
  .fa-anim .fa-coin-swing {
    transform-box: view-box;
    transform-origin: 176px 96px;
    animation: fa-swing 2.4s ease-in-out infinite;
  }
  .fa-anim .fa-belt-arrows {
    animation: fa-belt 1s linear infinite;
  }
  .fa-anim .fa-stack {
    animation: fa-rise 0.5s ease-out both;
    animation-delay: calc(var(--i) * 0.18s + 0.3s);
  }
  @keyframes fa-swing {
    0%,
    100% {
      transform: rotate(-7deg);
    }
    50% {
      transform: rotate(7deg);
    }
  }
  @keyframes fa-belt {
    from {
      transform: translateX(0);
    }
    to {
      transform: translateX(-40px);
    }
  }
  @keyframes fa-rise {
    from {
      opacity: 0;
      transform: translateY(12px);
    }
    to {
      opacity: 1;
      transform: none;
    }
  }
</style>
