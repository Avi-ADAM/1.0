<script lang="ts">
  /**
   * One setting: what it is on the start side, its control on the end side
   * (`action`), and anything longer — a form, a list — underneath (`children`).
   */
  import type { Snippet } from 'svelte';

  let {
    title,
    desc = '',
    icon,
    action,
    children
  }: {
    title: string;
    desc?: string;
    icon?: Snippet;
    action?: Snippet;
    children?: Snippet;
  } = $props();
</script>

<div class="px-4 py-4 md:px-5">
  <div class="flex items-center justify-between gap-3 flex-wrap">
    <div class="min-w-0 flex-1">
      <p class="flex items-center gap-2 font-medium text-surfaceInk">
        {#if icon}{@render icon()}{/if}
        {title}
      </p>
      {#if desc}<p class="mt-0.5 text-sm text-surfaceMuted">{desc}</p>{/if}
    </div>
    {#if action}
      <div class="flex shrink-0 items-center gap-2">{@render action()}</div>
    {/if}
  </div>
  {#if children}
    <div class="mt-3">{@render children()}</div>
  {/if}
</div>
