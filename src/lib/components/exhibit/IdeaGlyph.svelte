<!--
  Line icons for the ready ideas — one stroke weight, round caps, in the same
  hand as VisionArt, so the cards read as drawings rather than as app icons.
-->
<script>
  /** @type {{ kind: string, size?: number }} */
  let { kind, size = 64 } = $props();
</script>

<svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" class="glyph">
  {#if kind === 'mural'}
    <path d="M8 50h48M8 50V18h48v32" />
    <path d="M8 29h48M8 40h48M20 18v11M36 18v11M28 29v11M44 29v11M20 40v10M36 40v10" class="soft" />
    <path d="M42 8l10 10-14 14-6 2 2-6z" class="accent" />
  {:else if kind === 'book'}
    <path d="M32 16c-6-4-14-5-22-4v36c8-1 16 0 22 4 6-4 14-5 22-4V12c-8-1-16 0-22 4z" />
    <path d="M32 16v36" />
    <circle cx="44" cy="28" r="4" class="accent" />
    <path d="M38 40l6-6 6 6" class="soft" />
  {:else if kind === 'repair'}
    <path d="M14 30h26v12a10 10 0 0 1-10 10h-6a10 10 0 0 1-10-10z" />
    <path d="M40 34h4a5 5 0 0 1 0 10h-4" />
    <path d="M20 22c0-4 4-4 4-8M30 22c0-4 4-4 4-8" class="soft" />
    <path d="M46 8a7 7 0 0 0-6 10L30 28l3 3 10-10a7 7 0 0 0 10-6l-4 3-4-1-1-4z" class="accent" />
  {:else if kind === 'fashion'}
    <path d="M32 18a5 5 0 1 1 5-5" />
    <path d="M32 18v4L8 40h48L32 22" />
    <path d="M18 40l4 16h20l4-16" class="soft" />
    <path d="M44 48l8-8M48 52l6-6" class="accent" />
  {:else if kind === 'festival'}
    <path d="M24 46V14l26-6v32" />
    <circle cx="18" cy="46" r="6" />
    <circle cx="44" cy="40" r="6" />
    <path d="M24 22l26-6" class="soft" />
    <path d="M8 18l3 3M6 26h4M10 10l2 4" class="accent" />
  {:else if kind === 'ceramics'}
    <path d="M24 10h16M26 10c0 6-10 10-10 24 0 10 6 18 16 18s16-8 16-18c0-14-10-18-10-24" />
    <path d="M18 30c8 3 20 3 28 0" class="soft" />
    <path d="M20 40c8 3 16 3 24 0" class="accent" />
  {:else}
    <path d="M32 8a16 16 0 0 0-10 28c2 2 3 5 3 8h14c0-3 1-6 3-8A16 16 0 0 0 32 8z" />
    <path d="M26 50h12M28 56h8" class="soft" />
    <path d="M32 20v10M27 25h10" class="accent" />
  {/if}
</svg>

<style>
  .glyph {
    fill: none;
    stroke: var(--ex-ink, #3a2418);
    stroke-width: 2.6;
    stroke-linecap: round;
    stroke-linejoin: round;
    overflow: visible;
  }
  .soft {
    stroke: var(--ex-gold, #d4a12a);
  }
  .accent {
    stroke: var(--ex-pink, #e2127a);
  }
</style>
