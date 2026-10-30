<script lang="ts">
  /**
   * One titled card of /me/settings. The heading sits inside the card on
   * purpose: the page background is dark on some themes, and only the surface
   * tokens are guaranteed to read on the card.
   */
  import type { Snippet } from 'svelte';

  let {
    id,
    icon = '',
    title,
    desc = '',
    children
  }: { id: string; icon?: string; title: string; desc?: string; children: Snippet } = $props();
</script>

<section
  {id}
  aria-labelledby="{id}-title"
  class="scroll-mt-24 rounded-2xl border border-surfaceLine bg-surface text-surfaceInk shadow-sm"
>
  <header class="px-4 pt-4 pb-3 md:px-5">
    <h2 id="{id}-title" class="flex items-center gap-2 text-lg font-bold text-goldink">
      {#if icon}<span aria-hidden="true">{icon}</span>{/if}
      {title}
    </h2>
    {#if desc}<p class="mt-0.5 text-sm text-surfaceMuted">{desc}</p>{/if}
  </header>
  <div class="divide-y divide-surfaceLine border-t border-surfaceLine">
    {@render children()}
  </div>
</section>
