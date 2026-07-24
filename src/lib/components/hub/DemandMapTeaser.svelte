<script lang="ts">
  /**
   * Hub → demand-map bridge (PLAN_HUB_LEV_DEMAND_SYNC direction 3): the
   * maagad's live demand & supply, one glance and one tap from the hub.
   */
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import type { HubDemandSummary } from '../../../routes/(reg)/hub/+page.server';

  let { demand }: { demand: HubDemandSummary } = $props();

  const L = (key: string): string => $t(`hub.${key}`);

  let labels = $derived({
    title: L('demandMapTitle'),
    sub: L('demandMapSub'),
    items: L('demandMapItems'),
    btn: L('demandMapBtn')
  });

  // The per-kind mini counters, largest first, zeros hidden.
  const parts = $derived(
    (
      [
        ['🧺', demand.wishes],
        ['🤝', demand.maagadim],
        ['📣', demand.offers],
        ['🛠️', demand.missions],
        ['📦', demand.resources],
        ['🎁', demand.products]
      ] as [string, number][]
    )
      .filter(([, n]) => n > 0)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
  );
</script>

<a
  href="/demand"
  class="group relative flex items-center gap-3 px-4 py-4 rounded-2xl no-underline overflow-hidden
         bg-white/5 border border-white/10 backdrop-blur
         transition-transform active:scale-[0.98]"
>
  <span class="relative text-2xl shrink-0">🗺️</span>
  <span class="relative flex-1 min-w-0">
    <span class="block text-sm font-bold text-white leading-tight">
      {labels.title}
      {#if demand.total > 0}
        <span class="font-normal text-white/50">· {demand.total} {labels.items}</span>
      {/if}
    </span>
    {#if parts.length}
      <span class="mt-1 flex gap-2 text-xs text-white/70">
        {#each parts as [emoji, n] (emoji)}
          <span class="whitespace-nowrap">{emoji} {n}</span>
        {/each}
      </span>
    {:else}
      <span class="block text-xs text-white/60 mt-0.5 truncate">{labels.sub}</span>
    {/if}
  </span>
  <span
    class="relative shrink-0 text-xs font-bold text-white bg-white/10 rounded-full px-3 py-1.5 whitespace-nowrap"
  >{labels.btn}</span>
</a>
