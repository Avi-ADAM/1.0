<script>
  // First-visit guide of the moach (rikma brain). Each step points at a real
  // element of the header/menu, marked with `data-moach-tour="<id>"`, so the
  // guide follows the menu instead of a parallel list of invisible anchors.
  // A step whose element is not on the page is skipped.
  import { Portal } from 'bits-ui';
  import { untrack } from 'svelte';
  import { t, isRtl } from '$lib/translations';

  /** @type {{ steps: { id: string, key: string }[], open?: boolean }} */
  let { steps, open = $bindable(false) } = $props();

  const PAD = 6;
  const GAP = 12;
  const EDGE = 16;

  /** @type {{ id: string, key: string }[]} */
  let live = $state([]);
  let index = $state(0);
  /** @type {{ top: number, left: number, width: number, height: number } | null} */
  let rect = $state(null);
  let tipHeight = $state(0);
  let innerWidth = $state(0);
  let innerHeight = $state(0);
  /** @type {HTMLButtonElement | undefined} */
  let nextBtn = $state();

  const current = $derived(live[index]);
  const atEnd = $derived(index === live.length - 1);
  const tipWidth = $derived(Math.min(340, innerWidth - EDGE * 2));

  /** @param {{ id: string } | undefined} step */
  function target(step) {
    return step ? document.querySelector(`[data-moach-tour="${step.id}"]`) : null;
  }

  // Every opening starts from the first step that is actually on the page.
  $effect(() => {
    if (!open) return;
    untrack(() => {
      live = steps.filter((s) => target(s));
      index = 0;
      if (!live.length) open = false;
    });
  });

  function measure() {
    const r = target(current)?.getBoundingClientRect();
    rect = r ? { top: r.top, left: r.left, width: r.width, height: r.height } : null;
  }

  $effect(() => {
    if (!open || !current) return;
    target(current)?.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
    measure();
    nextBtn?.focus({ preventScroll: true });
    // Smooth scrolling (the page, or the menu sideways) moves the element.
    const settle = setTimeout(measure, 450);
    window.addEventListener('scroll', measure, true);
    window.addEventListener('resize', measure);
    return () => {
      clearTimeout(settle);
      window.removeEventListener('scroll', measure, true);
      window.removeEventListener('resize', measure);
    };
  });

  const tipLeft = $derived.by(() => {
    if (!rect) return EDGE;
    const centered = rect.left + rect.width / 2 - tipWidth / 2;
    return Math.max(EDGE, Math.min(centered, innerWidth - EDGE - tipWidth));
  });

  const tipTop = $derived.by(() => {
    if (!rect) return EDGE;
    const below = rect.top + rect.height + PAD + GAP;
    if (below + tipHeight <= innerHeight - EDGE) return below;
    const above = rect.top - PAD - GAP - tipHeight;
    return above >= EDGE ? above : Math.max(EDGE, innerHeight - EDGE - tipHeight);
  });

  function next() {
    if (atEnd) close();
    else index++;
  }

  function back() {
    if (index > 0) index--;
  }

  function close() {
    open = false;
  }

  /** @param {KeyboardEvent} e */
  function onKeydown(e) {
    if (!open) return;
    const forward = $isRtl ? 'ArrowLeft' : 'ArrowRight';
    const backward = $isRtl ? 'ArrowRight' : 'ArrowLeft';
    if (e.key === 'Escape') close();
    else if (e.key === forward) next();
    else if (e.key === backward) back();
  }
</script>

<svelte:window bind:innerWidth bind:innerHeight onkeydown={onKeydown} />

{#if open && current}
  <Portal>
    <!-- Blocks the page while the guide is open; the hole is the box-shadow below. -->
    <div class="fixed inset-0 z-[1000]" aria-hidden="true"></div>
    {#if rect}
      <div
        class="pointer-events-none fixed z-[1001] rounded-xl border-2 border-gold transition-all duration-300 motion-reduce:transition-none"
        style="top:{rect.top - PAD}px;left:{rect.left - PAD}px;width:{rect.width +
          PAD * 2}px;height:{rect.height + PAD * 2}px;box-shadow:0 0 0 9999px rgb(15 23 42 / 0.75);"
        aria-hidden="true"
      ></div>
    {/if}
    <div
      class="fixed z-[1002] rounded-2xl border border-gold bg-slate-900 p-4 text-start shadow-2xl transition-all duration-300 motion-reduce:transition-none"
      style="top:{tipTop}px;left:{tipLeft}px;width:{tipWidth}px;"
      role="dialog"
      aria-modal="true"
      aria-label={$t('moach.tour.label')}
      dir={$isRtl ? 'rtl' : 'ltr'}
      bind:clientHeight={tipHeight}
    >
      <div class="mb-2 flex items-center justify-between gap-2">
        <span class="text-xs font-bold text-gold">
          {$t('moach.tour.stepOf', { current: index + 1, total: live.length })}
        </span>
        {#if !atEnd}
          <button
            type="button"
            class="text-xs text-slate-300 underline hover:text-gold"
            onclick={close}
          >
            {$t('moach.tour.skip')}
          </button>
        {/if}
      </div>
      <p class="m-0 whitespace-pre-line text-sm leading-relaxed text-slate-100" aria-live="polite">
        {$t(current.key)}
      </p>
      <div class="mt-4 flex items-center justify-between gap-2">
        <button
          type="button"
          class="rounded-full border border-slate-500 px-3 py-1 text-sm text-slate-200 hover:border-gold hover:text-gold disabled:invisible"
          onclick={back}
          disabled={index === 0}
        >
          {$t('moach.tour.back')}
        </button>
        <button
          type="button"
          bind:this={nextBtn}
          class="rounded-full bg-gold px-4 py-1 text-sm font-bold text-slate-900 hover:bg-barbi hover:text-gold"
          onclick={next}
        >
          {atEnd ? $t('moach.tour.done') : $t('moach.tour.next')}
        </button>
      </div>
    </div>
  </Portal>
{/if}
