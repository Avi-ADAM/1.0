<script>
  /**
   * The wrapper every public page of a rikma sits in — the main page, /join
   * and /support (docs/inprogress/PLAN_RIKMA_SUBDOMAINS.md §5.3).
   *
   * It owns the `--pp-*` palette those pages paint with. The defaults below
   * are exactly the colours they always had, so a rikma without a look renders
   * byte-for-byte as before; a look overrides them through `skinVars`, which
   * builds the value from numbers only. It is also where a page joins the look
   * editor's preview frame, when it is in one.
   */
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import { fontHref, skinVars } from '$lib/rikmaLook/tokens';
  import { joinLookFrame } from '$lib/rikmaLook/frame.svelte';

  /** @type {{ look: import('$lib/rikmaLook/look').RikmaLook | null, class?: string, children: import('svelte').Snippet, [key: string]: any }} */
  let { look, class: cls = '', children, ...rest } = $props();

  let style = $derived(skinVars(look));
  let fonts = $derived(fontHref(look));
  let hasFont = $derived(!!look && look.style.font !== 'default');
  let hasHeadingFont = $derived(!!look && look.style.headingFont !== 'default');

  onMount(() => joinLookFrame(page.url));
</script>

<svelte:head>
  {#if fonts}
    <link rel="stylesheet" href={fonts} />
  {/if}
</svelte:head>

<div
  class="rikma-skin {cls}"
  class:pp-font={hasFont}
  class:pp-heading-font={hasHeadingFont}
  {style}
  {...rest}
>
  {@render children()}
</div>

<style>
  .rikma-skin {
    /* Channels (`r g b`) so a page can write rgb(var(--pp-gold) / 0.4). */
    --pp-gold: 255 215 0;
    --pp-gold-soft: 255 227 110;
    --pp-gold-2: 212 175 55;
    --pp-gold-3: 184 134 11;
    --pp-on-gold: 0 0 0;
    --pp-barbi: 255 0 174;
    --pp-barbi-soft: 255 138 216;
    --pp-barbi-2: 190 24 93;
    --pp-on-barbi: 255 255 255;
    /* The dark backdrop, as whole colours (they only ever sit in gradients). */
    --pp-bg1: #1a0515;
    --pp-bg2: #2c0b1e;
    --pp-bg3: #120f26;
  }

  /* The pages set `font-sans` on their own root, so the face has to reach it. */
  .pp-font,
  .pp-font :global(.font-sans) {
    font-family: var(--pp-font);
  }
  .pp-heading-font :global(:is(h1, h2, h3)) {
    font-family: var(--pp-heading-font);
  }
</style>
