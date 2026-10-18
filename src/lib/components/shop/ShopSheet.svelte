<script lang="ts">
  /**
   * A bottom sheet on a phone, a centred dialog on a wider screen. Native
   * `<dialog>`: it opens in the top layer, so no transformed ancestor (the lev
   * deck's Swiper, a sticky header) can trap it, and Esc / focus return come
   * from the browser. The backdrop click closes it.
   */
  import { t } from '$lib/translations';
  import type { Snippet } from 'svelte';

  let {
    open = $bindable(false),
    label,
    children
  }: { open?: boolean; label: string; children: Snippet } = $props();

  let el: HTMLDialogElement | undefined = $state();

  $effect(() => {
    if (!el) return;
    if (open && !el.open) el.showModal();
    else if (!open && el.open) el.close();
  });

  function onBackdrop(e: MouseEvent) {
    if (e.target === el) open = false;
  }
</script>

<dialog
  bind:this={el}
  class="sh-sheet shop-ui"
  aria-label={label}
  onclose={() => (open = false)}
  onclick={onBackdrop}
>
  <span class="sh-sheet-grip" aria-hidden="true"></span>
  <button type="button" class="sheet-close" aria-label={$t('shop.stock.close')} onclick={() => (open = false)}>
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
  </button>
  <div class="sheet-body">
    {#if open}{@render children()}{/if}
  </div>
</dialog>

<style>
  .sheet-body {
    padding: 8px 18px calc(20px + env(safe-area-inset-bottom));
  }
  .sheet-close {
    position: absolute;
    top: 8px;
    inset-inline-end: 8px;
    width: 44px;
    height: 44px;
    border: 0;
    border-radius: 50%;
    background: transparent;
    color: var(--sh-muted);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sheet-close:hover {
    background: var(--sh-card-2);
  }
</style>
