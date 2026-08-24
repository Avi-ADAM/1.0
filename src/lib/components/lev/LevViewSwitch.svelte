<script>
  /**
   * LevViewSwitch — one control for the heart's three layouts.
   *
   * The heart has had three views since the list landed, but only two of them
   * were ever in a switch: `celim/switch.svelte` is a two-position toggle whose
   * sliding-knob CSS and hard-coded cards/coins images cannot express a third
   * state, so the way into the list was a separate floating button parked in the
   * bottom corner — on top of the accessibility button. This replaces both.
   *
   * It is deliberately a `radiogroup` and not three buttons: the three views are
   * one exclusive choice, and a screen reader should hear "2 of 3", not three
   * unrelated commands.
   */
  import { t } from '$lib/translations';

  /**
   * @typedef {Object} Props
   * @property {'list' | 'cards' | 'coins'} value - the view showing now
   * @property {(view: 'list' | 'cards' | 'coins') => void} [onChange]
   * @property {boolean} [compact] - tighter, for the phone header bar
   */

  /** @type {Props} */
  let { value, onChange, compact = false } = $props();

  const VIEWS = /** @type {const} */ ([
    { id: 'list', labelKey: 'lev.list.toList' },
    { id: 'cards', labelKey: 'lev.list.toCards' },
    { id: 'coins', labelKey: 'lev.list.toCoins' }
  ]);

  const uid = `levview-${Math.random().toString(36).slice(2, 8)}`;

  /** @param {'list' | 'cards' | 'coins'} id */
  function pick(id) {
    if (id === value) return;
    onChange?.(id);
  }
</script>

<div
  class="switch"
  class:compact
  role="radiogroup"
  aria-label={$t('lev.list.switchLabel')}
>
  {#each VIEWS as view}
    <input
      type="radio"
      name={uid}
      id={`${uid}-${view.id}`}
      value={view.id}
      checked={value === view.id}
      onchange={() => pick(view.id)}
    />
    <label for={`${uid}-${view.id}`} title={$t(view.labelKey)}>
      <span class="sr-only">{$t(view.labelKey)}</span>
      {#if view.id === 'list'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M4 6h16M4 12h16M4 18h16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
      {:else if view.id === 'cards'}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect
            x="3"
            y="4"
            width="18"
            height="16"
            rx="2"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
      {:else}
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle
            cx="12"
            cy="12"
            r="8"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          />
        </svg>
      {/if}
    </label>
  {/each}
</div>

<style>
  .switch {
    display: inline-flex;
    align-items: center;
    gap: 0.125rem;
    padding: 0.125rem;
    border-radius: 9999px;
    background: rgba(255, 255, 255, 0.75);
    border: 1px solid var(--barbi-pink, #ff0092);
    backdrop-filter: blur(6px);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }
  :global(html.dark) .switch {
    background: rgba(17, 24, 39, 0.8);
  }

  /* The radio itself is the accessible control; the label is the visible one.
     Kept in flow (not display:none) so it stays focusable and so
     :focus-visible can reach the label through the sibling selector. */
  .switch input {
    position: absolute;
    opacity: 0;
    width: 1px;
    height: 1px;
    pointer-events: none;
  }

  .switch label {
    width: 2rem;
    height: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 9999px;
    cursor: pointer;
    color: #6b7280;
    transition:
      background 0.2s ease,
      color 0.2s ease;
  }
  :global(html.dark) .switch label {
    color: #9ca3af;
  }
  .switch label:hover {
    background: rgba(179, 135, 40, 0.18);
  }

  .switch input:checked + label {
    background: var(--barbi-pink, #ff0092);
    color: #fff;
  }

  .switch input:focus-visible + label {
    outline: 2px solid var(--barbi-pink, #ff0092);
    outline-offset: 2px;
  }

  .switch svg {
    width: 1.15rem;
    height: 1.15rem;
  }

  .compact label {
    width: 1.75rem;
    height: 1.75rem;
  }
  .compact svg {
    width: 1rem;
    height: 1rem;
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

  @media (prefers-reduced-motion: reduce) {
    .switch label {
      transition: none;
    }
  }
</style>
