<script>
  import { t, locale } from '$lib/translations';
  import LangSwitch from '$lib/components/onboard/LangSwitch.svelte';

  /**
   * The footer's own language handle: the platform's old translate icon, which
   * opens the five-language picker. It sits next to the appearance menu (which
   * also carries a language row) so a reader who does not know that menu, or
   * cannot read the current language, still finds the way out in one tap.
   * Pages no longer float a switcher of their own over the top of the screen,
   * where it covered the page's header (e.g. /hascama arriving from the
   * concierge).
   *
   * @typedef {Object} Props
   * @property {'up' | 'down'} [drop] - which way the panel opens off the trigger
   */

  /** @type {Props} */
  let { drop = 'up' } = $props();

  let open = $state(false);
  /** @type {HTMLDivElement | undefined} */
  let root = $state();
  /** @type {HTMLButtonElement | undefined} */
  let trigger = $state();
  /** @type {HTMLDivElement | undefined} */
  let panel = $state();

  /** @param {MouseEvent} e */
  function onDocPointer(e) {
    if (!open || !root) return;
    const target = /** @type {Node} */ (e.target);
    if (!root.contains(target) && !panel?.contains(target)) open = false;
  }

  /** @param {KeyboardEvent} e */
  function onDocKey(e) {
    if (e.key === 'Escape' && open) {
      open = false;
      trigger?.focus();
    }
  }

  // Picking a language is the whole job of this panel, so close it once the
  // locale moves rather than leaving it open over the re-rendered page.
  let openedAt = $state('');
  $effect(() => {
    if (open && !openedAt) openedAt = $locale;
    if (!open) openedAt = '';
    else if (openedAt && $locale !== openedAt) open = false;
  });

  /**
   * The panel is moved to <body> and placed by hand. Inside the footer it
   * could never rise above the footer's own stacking context (z-index 50), so
   * the accessibility button (998), which shares that corner, sat on top of
   * half the languages.
   * @param {HTMLElement} node
   */
  function toBody(node) {
    document.body.appendChild(node);
    return { destroy: () => node.remove() };
  }

  function place() {
    const el = panel;
    if (!el || !trigger) return;
    const r = trigger.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;
    const pad = 8;
    if (drop === 'down') {
      el.style.top = `${r.bottom + pad}px`;
      el.style.bottom = '';
    } else {
      el.style.bottom = `${vh - r.top + pad}px`;
      el.style.top = '';
    }
    // Grow from the trigger toward the middle of the screen, then keep the
    // whole row on screen.
    const w = el.offsetWidth;
    let left = r.left + r.width / 2 < vw / 2 ? r.left : r.right - w;
    left = Math.max(pad, Math.min(left, vw - pad - w));
    el.style.left = `${left}px`;
  }

  $effect(() => {
    if (!open || !panel) return;
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  });
</script>

<svelte:document onclick={onDocPointer} onkeydown={onDocKey} />

<div class="lang-menu" bind:this={root}>
  <button
    type="button"
    class="trigger"
    bind:this={trigger}
    aria-expanded={open}
    aria-haspopup="dialog"
    aria-label={$t('ui.appearance.language')}
    title={$t('ui.appearance.language')}
    onclick={() => (open = !open)}
  >
    <img
      src="https://res.cloudinary.com/love1/image/upload/v1639345051/icons8-translate-app_gwpwcn.svg"
      alt=""
      width="26"
      height="26"
    />
  </button>

  {#if open}
    <div
      class="panel"
      bind:this={panel}
      use:toBody
      role="dialog"
      aria-label={$t('ui.appearance.language')}
      dir="ltr"
    >
      <LangSwitch />
    </div>
  {/if}
</div>

<style>
  .lang-menu {
    position: relative;
    display: inline-block;
  }

  /* The size of the bar's other handles, so the cluster reads as one row. */
  .trigger {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    padding: 0;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    box-shadow: var(--shadow-theme, 0 2px 8px rgb(0 0 0 / 0.12));
  }
  .trigger img {
    display: block;
    width: 26px;
    height: 26px;
    border-radius: 6px;
  }
  .trigger:focus-visible {
    outline: 2px solid var(--barbi-pink);
    outline-offset: 2px;
  }

  .panel {
    position: fixed;
    /* Above the accessibility button (998) that shares the footer's corner. */
    z-index: 1000;
    padding: 8px;
    border: 1px solid var(--border-g);
    border-radius: var(--radius-theme, 14px);
    background: var(--card, #fff);
    box-shadow: var(--shadow-theme, 0 10px 30px rgb(0 0 0 / 0.18));
    white-space: nowrap;
  }
  /* Same retheme the appearance panel gives LangSwitch: its onboarding
     cream/brown palette is too faint on a themed card. */
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
</style>
