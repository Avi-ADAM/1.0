<!--
  AccessibilityPanel.svelte — the site-wide accessibility toolbar.

  Replaces the vendored NagishLi widget (removed in the same change), which was
  loaded from exactly one route out of ~90 and never ran on any of them: the
  library appends into a `<nagishli>` element that no page provided, and it
  injected jQuery 1.8.0 (2012) from a CDN when none was present. The controls
  below are the ones it would have offered, without taking on a seven-year-old
  dependency with known advisories on every page — and unlike the widget, they
  work in all five of the site's languages and follow its RTL layout.

  Mounted from the root layout, so it is present on every page rather than one.

  Keyboard and screen-reader behaviour:
    · the trigger is a real button carrying aria-expanded / aria-controls
    · Escape closes the panel and returns focus to the trigger
    · each setting is a toggle button carrying its own aria-pressed state
    · the whole panel is a labelled dialog, so it is announced as a unit
-->
<script>
  import { t, isRtl } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import {
    a11y,
    a11yTouched,
    TEXT_SCALES,
    cycleTextScale,
    toggleA11y,
    resetA11y
  } from '$lib/stores/a11y.js';
  import {
    motionMode,
    MOTION_MODES,
    setMotionChoice,
    nextMotionMode
  } from '$lib/stores/motion.js';

  let open = $state(false);
  /** @type {HTMLButtonElement | undefined} */
  let trigger = $state();

  function close({ refocus = true } = {}) {
    open = false;
    // Returning focus to the trigger is what makes the panel usable by
    // keyboard: without it, closing drops the caret back at the top of the
    // document and the visitor has to tab through the whole page again.
    if (refocus) trigger?.focus();
  }

  function onKeydown(/** @type {KeyboardEvent} */ e) {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      close();
    }
  }

  let motionLabel = $derived(
    $motionMode === MOTION_MODES.full
      ? $t('ui.a11y.motionOn')
      : $motionMode === MOTION_MODES.calm
        ? $t('ui.a11y.motionPaused')
        : $t('ui.a11y.motionHidden')
  );

  let textLabel = $derived(
    `${$t('ui.a11y.textSize')} · ${Math.round(TEXT_SCALES[$a11y.textScale] * 100)}%`
  );
</script>

<svelte:window onkeydown={onKeydown} />

<!-- The side is picked from `$isRtl`, the same signal the bot launcher uses,
     rather than from a logical `inset-inline-start`. The <html> dir attribute
     and the active locale can disagree here (dir is stamped server-side and
     does not follow a `?lang=` switch), and a logical property reads the
     former while the bot reads the latter - so they collide exactly when the
     two disagree. Reading the one signal keeps this off the bot in every
     language. -->
<div
  class="a11y-root"
  dir="auto"
  style="{$isRtl ? 'right' : 'left'}: var(--rail-inset, 0.75rem);
         align-items: {$isRtl ? 'flex-end' : 'flex-start'};"
>
  {#if open}
    <div
      id="a11y-panel"
      class="a11y-panel"
      role="dialog"
      aria-modal="false"
      aria-label={$t('ui.a11y.title')}
    >
      <p class="a11y-title">{$t('ui.a11y.title')}</p>

      <button type="button" class="a11y-item" onclick={cycleTextScale}>
        <EntityIcon kind="textSize" size={16} />
        <span>{textLabel}</span>
      </button>

      <button
        type="button"
        class="a11y-item"
        aria-pressed={$a11y.contrast}
        onclick={() => toggleA11y('contrast')}
      >
        <span aria-hidden="true">◐</span>
        <span>{$t('ui.a11y.contrast')}</span>
      </button>

      <button
        type="button"
        class="a11y-item"
        aria-pressed={$a11y.highlightLinks}
        onclick={() => toggleA11y('highlightLinks')}
      >
        <EntityIcon kind="link" size={16} />
        <span>{$t('ui.a11y.links')}</span>
      </button>

      <button
        type="button"
        class="a11y-item"
        aria-pressed={$a11y.readableFont}
        onclick={() => toggleA11y('readableFont')}
      >
        <EntityIcon kind="language" size={16} />
        <span>{$t('ui.a11y.font')}</span>
      </button>

      <!-- Motion is a separate store because the 3D scene reads it per frame,
           but for the visitor it belongs in the same list as everything else. -->
      <button
        type="button"
        class="a11y-item"
        onclick={() => setMotionChoice(nextMotionMode($motionMode))}
      >
        <EntityIcon kind="motion" size={16} />
        <span>{motionLabel}</span>
      </button>

      {#if $a11yTouched}
        <button type="button" class="a11y-reset" onclick={resetA11y}>
          {$t('ui.a11y.reset')}
        </button>
      {/if}
    </div>
  {/if}

  <button
    bind:this={trigger}
    type="button"
    class="a11y-trigger"
    aria-expanded={open}
    aria-controls="a11y-panel"
    aria-label={$t('ui.a11y.title')}
    title={$t('ui.a11y.title')}
    onclick={() => (open = !open)}
  >
    <!-- The internationally recognised accessibility figure, drawn rather than
         set as an emoji so it keeps its shape across platforms. -->
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="12" cy="4" r="2" fill="currentColor" />
      <path
        fill="currentColor"
        d="M19 8.5a1 1 0 0 0-1.2-.76l-3.6.8a10 10 0 0 1-4.4 0l-3.6-.8A1 1 0 0 0 5.8 9.7l3.7.82V13l-2 6.3a1 1 0 0 0 1.9.6L11 15h2l1.6 4.9a1 1 0 0 0 1.9-.6l-2-6.3v-2.48l3.7-.82A1 1 0 0 0 19 8.5Z"
      />
    </svg>
  </button>
</div>

<style>
  /* Bottom slot of the rail (see `--rail-*` in app.postcss). The horizontal
     side and the cross-axis alignment are set inline from `$isRtl` - see the
     note on the element - so only the vertical slot lives here. This first
     shipped pinned to a hardcoded `right`, which put it on top of the bot
     launcher in the LTR locales; axe caught the bot as a partially-obscured
     48x21 target. */
  .a11y-root {
    position: fixed;
    bottom: var(--rail-bottom, 5rem);
    z-index: 998;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .a11y-trigger {
    width: 2.75rem;
    height: 2.75rem;
    display: grid;
    place-items: center;
    border-radius: 9999px;
    border: 2px solid #ff0092;
    background: #ffffff;
    color: #ff0092;
    box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
    cursor: pointer;
    transition:
      transform 0.2s,
      background-color 0.2s;
  }

  .a11y-trigger:hover {
    background: #ff0092;
    color: #ffffff;
    transform: scale(1.06);
  }

  .a11y-trigger svg {
    width: 1.5rem;
    height: 1.5rem;
  }

  .a11y-panel {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.6rem;
    min-width: 13rem;
    border-radius: 0.9rem;
    border: 2px solid #ff0092;
    background: #ffffff;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.22);
  }

  .a11y-title {
    margin: 0 0 0.25rem;
    font-weight: 700;
    font-size: 0.85rem;
    color: #9d174d;
    text-align: center;
  }

  .a11y-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    padding: 0.45rem 0.6rem;
    border-radius: 0.55rem;
    border: 1px solid transparent;
    background: #fdf2f8;
    color: #1f2937;
    font-size: 0.85rem;
    text-align: start;
    cursor: pointer;
  }

  .a11y-item:hover {
    background: #fce7f3;
  }

  /* The pressed state must not be carried by colour alone — WCAG 1.4.1. */
  .a11y-item[aria-pressed='true'] {
    border-color: #ff0092;
    background: #ffe4f1;
    font-weight: 700;
  }

  .a11y-item[aria-pressed='true']::after {
    content: '✓';
    margin-inline-start: auto;
    color: #ff0092;
    font-weight: 700;
  }

  .a11y-reset {
    margin-top: 0.35rem;
    padding: 0.3rem;
    border: none;
    background: none;
    color: #6b7280;
    font-size: 0.75rem;
    text-decoration: underline;
    cursor: pointer;
  }

  .a11y-reset:hover {
    color: #9d174d;
  }

  :global(html.dark) .a11y-panel,
  :global(html.dark) .a11y-trigger {
    background: #0b1120;
    color: #f9fafb;
  }

  :global(html.dark) .a11y-item {
    background: #1f2937;
    color: #f9fafb;
  }

  @media print {
    .a11y-root {
      display: none;
    }
  }
</style>
