<script>
  import { t } from '$lib/translations';
  import { theme, mode, resolvedMode, setTheme, setMode, THEMES, MODES, themeMeta } from '$lib/stores/theme';
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';

  /**
   * @typedef {Object} Props
   * @property {'up' | 'down'} [drop] - which way the panel opens off the trigger
   * @property {boolean} [compact] - icon-only handle, for docking on the footer
   */

  /** @type {Props} */
  let { drop = 'up', compact = false } = $props();

  let open = $state(false);
  /** @type {HTMLDivElement | undefined} */
  let root = $state();
  /** @type {HTMLButtonElement | undefined} */
  let trigger = $state();
  /** @type {HTMLDivElement | undefined} */
  let panel = $state();

  const themeOrder = /** @type {const} */ (['personal', 'business']);
  const modeOrder = /** @type {const} */ (['light', 'dark', 'system']);

  /** @type {Record<'light' | 'dark' | 'system', string>} */
  const modeIcon = { light: '☀', dark: '☾', system: '⌗' };

  function close() {
    open = false;
    trigger?.focus();
  }

  /** @param {MouseEvent} e */
  function onDocPointer(e) {
    if (!open || !root) return;
    if (!root.contains(/** @type {Node} */ (e.target))) open = false;
  }

  /** @param {KeyboardEvent} e */
  function onDocKey(e) {
    if (e.key === 'Escape' && open) close();
  }

  /**
   * The panel is anchored to the trigger's inline-start edge, which is the side
   * the dock itself sits on, so it grows *into* the viewport in both LTR and
   * RTL. Anything that still spills — a narrow screen, a wider translation, a
   * different dock position — is nudged back by hand: `inset-inline-*` can
   * align an edge but cannot express "stay inside the viewport".
   */
  function clampToViewport() {
    const el = panel;
    if (!el) return;
    el.style.transform = '';
    const pad = 8;
    const vw = document.documentElement.clientWidth;
    const r = el.getBoundingClientRect();
    let dx = 0;
    if (r.right > vw - pad) dx = vw - pad - r.right;
    if (r.left + dx < pad) dx = pad - r.left;
    if (dx) el.style.transform = `translateX(${dx}px)`;
  }

  $effect(() => {
    if (!open || !panel) return;
    clampToViewport();
    window.addEventListener('resize', clampToViewport);
    return () => window.removeEventListener('resize', clampToViewport);
  });
</script>

<svelte:document onclick={onDocPointer} onkeydown={onDocKey} />

<div class="appearance" bind:this={root}>
  <button
    type="button"
    class="trigger"
    class:compact
    bind:this={trigger}
    aria-expanded={open}
    aria-haspopup="dialog"
    aria-label={$t('ui.appearance.title')}
    onclick={() => (open = !open)}
    title={$t('ui.appearance.title')}
  >
    <span aria-hidden="true">🎨</span>
    {#if !compact}
      <span class="trigger-label">{$t('ui.appearance.title')}</span>
    {/if}
  </button>

  {#if open}
    <div
      class="panel"
      class:down={drop === 'down'}
      bind:this={panel}
      role="dialog"
      aria-label={$t('ui.appearance.title')}
    >
      <section>
        <h3>{$t('ui.appearance.language')}</h3>
        <LangSwitch />
      </section>

      <section>
        <h3>{$t('ui.appearance.look')}</h3>
        <div class="options">
          {#each themeOrder as name (name)}
            <button
              type="button"
              class="option"
              class:selected={$theme === name}
              aria-pressed={$theme === name}
              onclick={() => setTheme(THEMES[name])}
            >
              <span
                class="swatch"
                aria-hidden="true"
                style:--a={themeMeta[name].swatch[0]}
                style:--b={themeMeta[name].swatch[1]}
              ></span>
              <span class="option-text">
                <span class="option-label">{$t(themeMeta[name].labelKey)}</span>
                <span class="option-desc">{$t(themeMeta[name].descKey)}</span>
              </span>
            </button>
          {/each}
        </div>
      </section>

      <section>
        <h3>{$t('ui.appearance.brightness')}</h3>
        <div class="segmented" role="group" aria-label={$t('ui.appearance.brightness')}>
          {#each modeOrder as name (name)}
            <button
              type="button"
              class="seg"
              class:selected={$mode === name}
              aria-pressed={$mode === name}
              onclick={() => setMode(MODES[name])}
            >
              <span aria-hidden="true">{modeIcon[name]}</span>
              {$t(`ui.appearance.mode_${name}`)}
            </button>
          {/each}
        </div>
        {#if $mode === 'system'}
          <p class="hint">
            {$t('ui.appearance.followingSystem', { mode: $t(`ui.appearance.mode_${$resolvedMode}`) })}
          </p>
        {/if}
      </section>
    </div>
  {/if}
</div>

<style>
  .appearance {
    position: relative;
    display: inline-block;
  }

  .trigger {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: 1px solid var(--border-g);
    border-radius: var(--radius-theme, 999px);
    /* An OPAQUE surface on purpose. --background-without-opacity is 70% white
       in the personal theme and is never redefined for personal·dark, so the
       dark-mode --goldink (#f0c040) landed as yellow on a pale wash — the one
       pairing the appearance layer's contrast table does not cover. --card
       flips with `.dark`, and --goldink is documented AA against it in all
       four theme × mode combinations. */
    background: var(--card, #fff);
    color: var(--goldink);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: var(--shadow-theme, 0 2px 8px rgb(0 0 0 / 0.12));
    transition: border-color 0.15s, background 0.15s;
  }
  .trigger:hover {
    border-color: var(--barbi-pink);
  }
  .trigger:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 2px;
  }
  /* The label is only ever decoration next to the icon — drop it before the
     footer runs out of room rather than wrapping the row. */
  @media (max-width: 480px) {
    .trigger-label {
      display: none;
    }
  }

  /* Docked on the footer: a handle the size of the bar's own minimize button,
     so the two read as a matched pair on the bar's top edge. */
  .trigger.compact {
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border-radius: 999px;
    font-size: 13px;
    line-height: 1;
  }

  .panel {
    position: absolute;
    /* Anchored to the same edge the dock is pinned to (inset-inline-start),
       so the panel opens toward the middle of the screen. Anchoring it to the
       *end* pushed it off the right edge in Hebrew, where the dock's
       inline-start is the viewport's right side. */
    inset-inline-start: 0;
    bottom: calc(100% + 8px);
    z-index: 60;
    width: min(19rem, calc(100vw - 2rem));
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 14px;
    border: 1px solid var(--border-g);
    border-radius: var(--radius-theme, 14px);
    background: var(--card, #fff);
    color: var(--foreground);
    box-shadow: var(--shadow-theme, 0 10px 30px rgb(0 0 0 / 0.18));
  }
  .panel.down {
    bottom: auto;
    top: calc(100% + 8px);
  }

  /* LangSwitch is an onboarding atom with a hard-coded cream/brown palette. It
     reads fine on the onboarding wash but drops to ~2.2:1 once it sits on this
     themed panel. Retheme it here only — the onboarding pages keep their look. */
  .panel :global(.lang-switch) {
    background: var(--muted, rgb(0 0 0 / 0.05));
    border-color: var(--border-g);
  }
  .panel :global(.lang-btn) {
    color: var(--goldink);
  }
  .panel :global(.lang-btn.active) {
    background: var(--barbi-pink);
    color: var(--gold);
    box-shadow: none;
  }

  h3 {
    margin: 0 0 8px;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--muted-foreground, var(--tm));
  }

  .options {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  .option {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    padding: 8px;
    border: 1px solid transparent;
    border-radius: var(--radius-theme, 10px);
    background: transparent;
    color: inherit;
    text-align: start;
    cursor: pointer;
  }
  .option:hover {
    background: var(--muted, rgb(0 0 0 / 0.04));
  }
  .option.selected {
    border-color: var(--barbi-pink);
    background: var(--muted, rgb(0 0 0 / 0.04));
  }
  .option:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 1px;
  }
  .swatch {
    flex: none;
    width: 26px;
    height: 26px;
    border-radius: 50%;
    border: 1px solid var(--border-g);
    background: linear-gradient(135deg, var(--a) 0 50%, var(--b) 50% 100%);
  }
  .option-text {
    display: flex;
    flex-direction: column;
    line-height: 1.25;
  }
  .option-label {
    font-size: 13px;
    font-weight: 600;
  }
  .option-desc {
    font-size: 11px;
    color: var(--muted-foreground, var(--tm));
  }

  .segmented {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 4px;
    padding: 3px;
    border: 1px solid var(--border-g);
    border-radius: var(--radius-theme, 999px);
  }
  .seg {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    padding: 6px 4px;
    border: none;
    border-radius: calc(var(--radius-theme, 999px) - 2px);
    background: transparent;
    color: inherit;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .seg:hover {
    background: var(--muted, rgb(0 0 0 / 0.05));
  }
  .seg.selected {
    background: var(--barbi-pink);
    color: var(--gold);
  }
  .seg:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 1px;
  }

  .hint {
    margin: 6px 0 0;
    font-size: 11px;
    color: var(--muted-foreground, var(--tm));
  }
</style>
