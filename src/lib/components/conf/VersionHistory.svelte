<script>
  /**
   * VersionHistory — a compact, reusable side-by-side history of successive
   * versions/rounds of a negotiated thing (a saleClaim's negom rounds, a pmash's
   * precision rounds, an askm's proposals…). Renders each version as a column in
   * a horizontally-scrollable row; the aligned field rows make it easy to read
   * "what changed between round 2 and round 3" across the whole history.
   *
   * It is presentation-only: the caller normalizes its data into `versions`,
   * pre-computing per-field `changed` (vs. the previous version) and marking the
   * one that is `current` (on the table). Kept palette-neutral (gold/barbi) and
   * theme/RTL aware so any card on the site can reuse it.
   *
   * @typedef {Object} VHField
   * @property {string} label   Row label (already localized).
   * @property {string|number|null} value  Display value ('—' when empty).
   * @property {boolean} [changed]    Highlight — differs from the previous version.
   * @property {boolean} [emphasize]  Bolder (e.g. a total).
   *
   * @typedef {Object} VHVersion
   * @property {string} title       Column heading, e.g. "סבב 2".
   * @property {string} [by]        Who proposed it.
   * @property {boolean} [current]  The version currently on the table.
   * @property {VHField[]} fields
   */
  import { lang } from '$lib/stores/lang.js';
  import { isRtl } from '$lib/translations';

  /**
   * @typedef {Object} Props
   * @property {VHVersion[]} versions
   * @property {string} [label]  Optional section heading.
   */
  /** @type {Props} */
  let { versions = [], label = '' } = $props();
</script>

{#if versions.length > 0}
  <div dir={$isRtl ? 'rtl' : 'ltr'} class="vh">
    {#if label}
      <div class="vh-label">🕓 {label}</div>
    {/if}
    <div class="vh-track">
      {#each versions as v, i (i)}
        <div class="vh-col" class:vh-current={v.current}>
          <div class="vh-head">
            <span class="vh-title">{v.title}</span>
            {#if v.current}
              <span class="vh-badge">{$lang === 'he' ? 'על השולחן' : 'on table'}</span>
            {/if}
          </div>
          {#if v.by}
            <div class="vh-by">{v.by}</div>
          {/if}
          <div class="vh-fields">
            {#each v.fields as f (f.label)}
              <div class="vh-row" class:vh-changed={f.changed}>
                <span class="vh-flabel">{f.label}</span>
                <span class="vh-fval" class:vh-emph={f.emphasize}>
                  {f.value === null || f.value === '' ? '—' : f.value}
                </span>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  .vh {
    width: 100%;
  }
  .vh-label {
    font-size: 0.7rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--tm, #9ca3af);
    margin-bottom: 0.4rem;
  }
  /* Horizontal, snap-scrolling row — never pushes the card body sideways. */
  .vh-track {
    display: flex;
    gap: 0.5rem;
    overflow-x: auto;
    padding-bottom: 0.35rem;
    scroll-snap-type: x proximity;
    -webkit-overflow-scrolling: touch;
  }
  .vh-track::-webkit-scrollbar {
    height: 5px;
  }
  .vh-track::-webkit-scrollbar-thumb {
    background: rgba(156, 163, 175, 0.4);
    border-radius: 999px;
  }
  .vh-col {
    flex: 0 0 auto;
    min-width: 8.5rem;
    max-width: 12rem;
    scroll-snap-align: start;
    border: 1px solid rgba(156, 163, 175, 0.3);
    border-radius: 0.6rem;
    padding: 0.5rem;
    background: rgba(255, 255, 255, 0.55);
  }
  :global(.dark) .vh-col {
    background: rgba(31, 41, 55, 0.5);
    border-color: rgba(75, 85, 99, 0.5);
  }
  /* The version on the table gets the accent ring + tint. */
  .vh-current {
    border-color: var(--barbi, #c026d3);
    background: rgba(192, 38, 211, 0.06);
    box-shadow: 0 0 0 1px var(--barbi, #c026d3) inset;
  }
  :global(.dark) .vh-current {
    background: rgba(236, 72, 153, 0.1);
  }
  .vh-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.3rem;
    margin-bottom: 0.15rem;
  }
  .vh-title {
    font-size: 0.72rem;
    font-weight: 700;
    color: var(--gold, #b45309);
  }
  .vh-badge {
    font-size: 0.56rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.02em;
    color: var(--barbi, #c026d3);
    background: rgba(192, 38, 211, 0.12);
    border-radius: 999px;
    padding: 0.05rem 0.35rem;
    white-space: nowrap;
  }
  .vh-by {
    font-size: 0.62rem;
    color: var(--tm, #9ca3af);
    margin-bottom: 0.35rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .vh-fields {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
  }
  .vh-row {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.4rem;
    padding: 0.15rem 0.25rem;
    border-radius: 0.35rem;
  }
  /* A field that differs from the previous version. */
  .vh-changed {
    background: rgba(180, 83, 9, 0.12);
  }
  :global(.dark) .vh-changed {
    background: rgba(251, 191, 36, 0.14);
  }
  .vh-flabel {
    font-size: 0.62rem;
    color: var(--tm, #9ca3af);
    flex: 0 0 auto;
  }
  .vh-fval {
    font-size: 0.72rem;
    font-weight: 600;
    color: #1f2937;
    text-align: end;
    word-break: break-word;
  }
  :global(.dark) .vh-fval {
    color: #f3f4f6;
  }
  .vh-emph {
    font-weight: 800;
    color: var(--barbi, #c026d3);
  }
  :global(.dark) .vh-emph {
    color: #f9a8d4;
  }
</style>
