<script lang="ts">
  import { lang } from '$lib/stores/lang.js';
  import tr from '$lib/translations/tr.json';

  interface Props {
    votes: number;
    urgent: number;
    suggestions: number;
    activePurchases: number;
    activeSales: number;
  }

  let { votes, urgent, suggestions, activePurchases, activeSales }: Props = $props();

  let labels = $derived({
    votes: tr.hub.votes[$lang],
    urgent: tr.hub.urgent[$lang],
    suggestions: tr.hub.suggestions[$lang],
    purchases: tr.hub.purchases[$lang],
    sales: tr.hub.sales[$lang]
  });

  // KPI chips link to /lev with a ?focus= deep-link so the lev page can load
  // just the relevant quantum slice first and show cards before the full query
  // completes.  Types whose slice query isn't implemented yet (mtaha, buy)
  // gracefully fall back to the full load on the lev page.
  const chips = $derived([
    { icon: '🗳', count: votes,           label: labels.votes,       href: '/lev',               red: false,        pulse: urgent > 0 },
    { icon: '⏰', count: urgent,          label: labels.urgent,      href: '/lev',               red: urgent > 0,   pulse: urgent > 0 },
    { icon: '💼', count: suggestions,     label: labels.suggestions, href: '/lev?focus=mtaha',   red: false,        pulse: false },
    { icon: '🛒', count: activePurchases, label: labels.purchases,   href: '/lev?focus=buy',     red: false,        pulse: false },
    { icon: '💰', count: activeSales,     label: labels.sales,       href: '/lev?focus=sale',    red: false,        pulse: false }
  ]);
</script>

<nav
  dir="rtl"
  aria-label={tr.hub.activitySummary[$lang]}
  class="sticky top-0 z-30 flex flex-wrap gap-2 px-3 py-2 bg-bluesun/90 backdrop-blur-sm border-b border-white/10 shadow-sm"
>
  {#each chips as chip (chip.label)}
    <a
      href={chip.href}
      class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium no-underline transition-all
             {chip.red && chip.count > 0
               ? 'bg-red-500/20 text-red-300 border border-red-400/40 hover:bg-red-500/30'
               : 'bg-white/10 text-white/80 border border-white/15 hover:bg-white/20'}
             {chip.pulse && chip.count > 0 ? 'animate-pulse' : ''}"
    >
      <span class="text-base leading-none">{chip.icon}</span>
      <span class="font-bold">{chip.count}</span>
      <span class="opacity-70">{chip.label}</span>
    </a>
  {/each}
</nav>
