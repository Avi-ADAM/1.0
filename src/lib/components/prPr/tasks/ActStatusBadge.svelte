<script>
  import { t } from '$lib/translations';
  import { getActStatus } from '$lib/acts/actStatus.js';

  /**
   * @typedef {Object} Props
   * @property {any} [row] - An act row; the lane is derived from it.
   * @property {import('$lib/acts/actStatus.js').ActStatus} [status] - Or pass the lane directly.
   * @property {boolean} [dense] - Dot only, for tight cells.
   */

  /** @type {Props} */
  let { row = null, status = undefined, dense = false } = $props();

  let lane = $derived(status ?? getActStatus(row));

  /**
   * The lane colour is a CSS custom property set per `.lane--*` class, not an
   * inline style, so the stylesheet can swap the whole palette under `.dark`.
   * Light values are the 700 steps (≥4.5:1 as text on a white-ish surface);
   * dark values are the 400 steps. Reaching for the global `--gold-l` /
   * `--pink-l` here would misfire: they are only defined on `:root` (dark) and
   * `html.business`, so a personal-theme visitor in light mode would get the
   * dark palette on a pale badge.
   */
  const LANES = {
    unassigned: 'mission.actsTable.statusUnassigned',
    published: 'mission.actsTable.statusPublished',
    pendingApproval: 'mission.actsTable.statusPendingApproval',
    inProgress: 'mission.actsTable.statusInProgress',
    pendingValidation: 'mission.actsTable.statusPendingValidation',
    completed: 'mission.actsTable.statusCompleted'
  };

  let label = $derived($t(LANES[lane] ?? LANES.unassigned));
</script>

<span
  class="act-badge lane--{lane}"
  class:dense
  title={dense ? label : undefined}
>
  <span class="act-badge__dot" aria-hidden="true"></span>
  {#if dense}
    <span class="sr-only">{label}</span>
  {:else}
    <span class="act-badge__label">{label}</span>
  {/if}
</span>

<style>
  /* Light (default): the 700 steps, each ≥4.5:1 as text on white. */
  .lane--unassigned { --lane: #b45309; }
  .lane--published { --lane: #be185d; }
  .lane--pendingApproval { --lane: #1d4ed8; }
  .lane--inProgress { --lane: #0369a1; }
  .lane--pendingValidation { --lane: #a16207; }
  .lane--completed { --lane: #15803d; }

  /* Dark: the 400 steps, on the near-black/navy surfaces. */
  :global(.dark) .lane--unassigned { --lane: #fbbf24; }
  :global(.dark) .lane--published { --lane: #f472b6; }
  :global(.dark) .lane--pendingApproval { --lane: #60a5fa; }
  :global(.dark) .lane--inProgress { --lane: #38bdf8; }
  :global(.dark) .lane--pendingValidation { --lane: #fcd34d; }
  :global(.dark) .lane--completed { --lane: #4ade80; }

  .act-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.2rem 0.6rem;
    border-radius: 999px;
    font-size: 0.72rem;
    font-weight: 600;
    line-height: 1.4;
    white-space: nowrap;
    /* 14% tint of the lane colour reads as a surface in both light and dark
       without needing a second token per lane. */
    background: color-mix(in srgb, var(--lane) 14%, transparent);
    color: var(--lane);
    border: 1px solid color-mix(in srgb, var(--lane) 34%, transparent);
  }

  .act-badge.dense {
    padding: 0.25rem;
    gap: 0;
    border-radius: 999px;
  }

  .act-badge__dot {
    width: 0.45rem;
    height: 0.45rem;
    border-radius: 999px;
    background: var(--lane);
    flex: none;
  }

  .act-badge__label {
    /* The lane colour on its own tint can dip under 4.5:1 for the paler
       tokens; the shadow-free weight bump plus the border keeps the pill
       legible without inventing a per-lane ink token. */
    letter-spacing: 0.01em;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
</style>
