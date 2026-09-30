<script>
  /**
   * The site's one loading indicator — the two-ring spinner the lev page
   * always used, as a self-contained component. Anything that waits renders
   * this; don't reach for svelte-loading-spinners or a hand-made SVG.
   *
   * The box is fixed at `size` and the rings only rotate inside it (no scale),
   * so a spinner never pushes the page wider or makes it jump.
   *
   * @typedef {'xs' | 'sm' | 'md' | 'lg' | number} SpinnerSize
   *
   * @typedef {Object} Props
   * @property {SpinnerSize} [size]  xs=16 inline/button · sm=24 · md=48 section · lg=60 page
   * @property {string} [color]
   * @property {string} [label]      accessible name; decorative when omitted
   * @property {string} [class]
   */

  /** @type {Props} */
  let { size = 'md', color = 'var(--barbi-pink, #ff00ae)', label = '', class: klass = '' } = $props();

  const PRESETS = { xs: 16, sm: 24, md: 48, lg: 60 };
  const px = $derived(typeof size === 'number' ? size : (PRESETS[size] ?? PRESETS.md));
  // 6px on the 60px ring the lev page used, never thinner than 2px.
  const stroke = $derived(Math.max(2, Math.round(px / 10)));
</script>

<span
  class="spinner-row {klass}"
  role={label ? 'status' : undefined}
  aria-label={label || undefined}
  aria-hidden={label ? undefined : 'true'}
>
  <span class="spinner" style="--sp-size:{px}px; --sp-stroke:{stroke}px; --sp-color:{color};">
    <span class="ring ring-a"></span>
    <span class="ring ring-b"></span>
  </span>
</span>

<style>
  .spinner-row {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    vertical-align: middle;
    max-width: 100%;
  }
  .spinner {
    position: relative;
    flex: none;
    width: var(--sp-size);
    height: var(--sp-size);
    perspective: 800px;
    contain: layout paint;
  }
  .ring {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    border: var(--sp-stroke) solid var(--sp-color);
    border-radius: 50%;
    opacity: 0.45;
  }
  .ring-a {
    animation: sp-ring-a 2s linear infinite;
  }
  .ring-b {
    animation: sp-ring-b 2s linear infinite;
  }
  @keyframes sp-ring-a {
    to {
      transform: rotateX(360deg) rotateY(180deg) rotateZ(360deg);
    }
  }
  @keyframes sp-ring-b {
    to {
      transform: rotateX(180deg) rotateY(360deg) rotateZ(360deg);
    }
  }
  @media (prefers-reduced-motion: reduce) {
    .ring-a,
    .ring-b {
      animation-duration: 6s;
    }
  }
</style>
