<script>
  /**
   * EquityPie — the equity breakdown as an interactive donut.
   *
   * Presentational and dependency-free: it draws whatever slices it is handed
   * (see `buildEquityBreakdown` / `buildHorizonBreakdown`) and reports which one
   * the reader is pointing at. The legend rows are the accessible controls —
   * they carry label, ₪ and %, so identity is never colour-alone and the ring
   * itself can stay `aria-hidden`.
   *
   * Colour: one accent (orange) for the reader's own slice, and an ordinal blue
   * ramp for the rest of the rikma, darkest = already earned → lightest = merely
   * open. Both ramps are validated for CVD separation and for the light and dark
   * surfaces separately; see docs/PLAN_MISSION_EQUITY_PREVIEW.md §4.1.
   */
  import { isRtl } from '$lib/translations';

  /**
   * @typedef {Object} PieSlice
   * @property {string} key - stable id ('mine' | 'existing' | …), also picks the colour.
   * @property {string} label - already-translated slice name.
   * @property {number} value - ₪ (or whatever unit the caller formats).
   * @property {number} pct - 0..100, the slice's share of the whole.
   *
   * @typedef {Object} Props
   * @property {PieSlice[]} slices - non-empty slices, the reader's own one first.
   * @property {(n: number) => string} format - number → display string.
   * @property {string} [ariaLabel] - one-line summary of the whole chart for AT.
   * @property {number} [size] - rendered width/height in px.
   */

  /** @type {Props} */
  let { slices = [], format = (n) => String(n), ariaLabel = '', size = 132 } = $props();

  /** Which slice the reader is pointing at; null ⇒ show the first (their own). */
  let hovered = $state(/** @type {string|null} */ (null));
  /** Clicking a legend row pins a slice so it survives the pointer leaving. */
  let pinned = $state(/** @type {string|null} */ (null));

  /** Set only while the reader is actually pointing at / has pinned a slice. */
  const picked = $derived(hovered ?? pinned);
  // At rest the reader's own slice is the one the centre reads out (and the one
  // drawn thicker), but nothing is dimmed — the resting ring shows the whole
  // composition. Dimming starts when the reader picks a slice.
  const activeKey = $derived(picked ?? slices[0]?.key ?? null);
  const active = $derived(slices.find((s) => s.key === activeKey) ?? slices[0] ?? null);

  // Geometry: a single circle per slice, drawn with stroke-dasharray. `GAP` is
  // the 2px surface gap that keeps neighbouring fills from touching.
  const R = 38;
  const C = 2 * Math.PI * R;
  const GAP = 2;

  /** Dash offsets accumulated in slice order, so the arcs chain around the ring. */
  const arcs = $derived(
    (() => {
      let acc = 0;
      return slices.map((s) => {
        const len = Math.max(0, (Math.min(100, Math.max(0, s.pct)) / 100) * C);
        const arc = { ...s, len: Math.max(0, len - GAP), offset: acc };
        acc += len;
        return arc;
      });
    })()
  );

  function toggle(key) {
    pinned = pinned === key ? null : key;
  }
</script>

<div
  class="equity-pie"
  class:rtl={$isRtl}
  dir={$isRtl ? 'rtl' : 'ltr'}
  onmouseleave={() => (hovered = null)}
  role="presentation"
>
  <div class="ring-wrap" style="width:{size}px;height:{size}px">
    <svg viewBox="0 0 100 100" aria-hidden="true">
      <!-- track: keeps the ring legible even when a single slice is 100% -->
      <circle class="track" cx="50" cy="50" r={R} />
      {#each arcs as arc (arc.key)}
        <circle
          class="arc {arc.key}"
          class:dim={picked != null && picked !== arc.key}
          class:on={activeKey === arc.key}
          cx="50"
          cy="50"
          r={R}
          stroke-dasharray="{arc.len} {C - arc.len}"
          stroke-dashoffset={-arc.offset}
          role="presentation"
          onmouseenter={() => (hovered = arc.key)}
        />
      {/each}
    </svg>
    {#if active}
      <div class="center">
        <span class="pct">{active.pct < 0.1 && active.pct > 0 ? '<0.1' : active.pct.toFixed(1)}%</span>
        <span class="who">{active.label}</span>
      </div>
    {/if}
  </div>

  <!-- The legend is also the table view: every slice's name, value and share. -->
  <ul class="legend" aria-label={ariaLabel}>
    {#each slices as s (s.key)}
      <li>
        <button
          type="button"
          class:on={activeKey === s.key}
          aria-pressed={pinned === s.key}
          onclick={(e) => {
            e.stopPropagation();
            toggle(s.key);
          }}
          onmouseenter={() => (hovered = s.key)}
          onfocus={() => (hovered = s.key)}
          onblur={() => (hovered = null)}
        >
          <span class="swatch {s.key}" aria-hidden="true"></span>
          <span class="name">{s.label}</span>
          <span class="num">{format(s.value)}</span>
          <span class="share">{s.pct < 0.1 && s.pct > 0 ? '<0.1' : s.pct.toFixed(1)}%</span>
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .equity-pie {
    /* accent — the reader's own mission/resource */
    --eq-mine: #eb6834;
    /* ordinal blue ramp: earned → approved → merely open */
    --eq-existing: #1c5cab;
    --eq-approved: #3987e5;
    --eq-open: #86b6ef;
    --eq-track: #e8e8e4;
    --eq-ink: #52514e;
    --eq-ink-strong: #0b0b0b;

    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem 1rem;
  }

  @media (prefers-color-scheme: dark) {
    :root:where(:not([data-theme='light'])) .equity-pie {
      --eq-mine: #d95926;
      --eq-existing: #b7d3f6;
      --eq-approved: #5598e7;
      --eq-open: #256abf;
      --eq-track: #33332f;
      --eq-ink: #c3c2b7;
      --eq-ink-strong: #ffffff;
    }
  }
  :root[data-theme='dark'] .equity-pie {
    --eq-mine: #d95926;
    --eq-existing: #b7d3f6;
    --eq-approved: #5598e7;
    --eq-open: #256abf;
    --eq-track: #33332f;
    --eq-ink: #c3c2b7;
    --eq-ink-strong: #ffffff;
  }

  .ring-wrap {
    position: relative;
    flex: 0 0 auto;
  }
  .ring-wrap svg {
    width: 100%;
    height: 100%;
    transform: rotate(-90deg); /* start the first slice at 12 o'clock */
  }

  circle {
    fill: none;
    stroke-width: 13;
  }
  .track {
    stroke: var(--eq-track);
    stroke-width: 13;
  }
  .arc {
    stroke-linecap: butt;
    transition:
      stroke-width 150ms ease,
      opacity 150ms ease;
  }
  .arc.on {
    stroke-width: 17;
  }
  /* Recede, but stay identifiable — the ramp's steps must not collapse into
     one grey band while a slice is picked. */
  .arc.dim {
    opacity: 0.7;
  }

  .arc.mine,
  .swatch.mine {
    stroke: var(--eq-mine);
    background: var(--eq-mine);
  }
  .arc.existing,
  .swatch.existing {
    stroke: var(--eq-existing);
    background: var(--eq-existing);
  }
  .arc.approvedOthers,
  .swatch.approvedOthers {
    stroke: var(--eq-approved);
    background: var(--eq-approved);
  }
  .arc.pipelineOthers,
  .swatch.pipelineOthers,
  .arc.recurringOthers,
  .swatch.recurringOthers {
    stroke: var(--eq-open);
    background: var(--eq-open);
  }

  .center {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    pointer-events: none;
    padding: 0 18%;
  }
  .center .pct {
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.1;
    color: var(--eq-ink-strong);
  }
  .center .who {
    font-size: 0.6rem;
    line-height: 1.15;
    color: var(--eq-ink);
  }

  .legend {
    flex: 1 1 11rem;
    min-width: 10rem;
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 0.125rem;
  }
  .legend button {
    display: flex;
    align-items: baseline;
    gap: 0.375rem;
    width: 100%;
    padding: 0.125rem 0.25rem;
    border-radius: 0.375rem;
    font-size: 0.7rem;
    line-height: 1.3;
    color: var(--eq-ink);
    text-align: start;
    cursor: pointer;
  }
  .legend button:hover,
  .legend button.on {
    background: color-mix(in srgb, currentColor 10%, transparent);
    color: var(--eq-ink-strong);
  }
  .legend .swatch {
    flex: 0 0 auto;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 0.125rem;
  }
  .legend .name {
    flex: 1 1 auto;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .legend .num {
    font-variant-numeric: tabular-nums;
    opacity: 0.8;
  }
  .legend .share {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
    min-width: 2.5rem;
    text-align: end;
  }
</style>
