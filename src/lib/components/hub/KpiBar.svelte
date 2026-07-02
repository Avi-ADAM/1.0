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

  // Translation helper with graceful fallback (tr.hub only has he/en/ar).
  const L = (key: keyof typeof tr.hub) =>
    (tr.hub[key] as Record<string, string>)[$lang] ?? (tr.hub[key] as Record<string, string>).en;

  let labels = $derived({
    votes: L('votes'),
    urgent: L('urgent'),
    suggestions: L('suggestions'),
    purchases: L('purchases'),
    sales: L('sales')
  });

  const caughtUp = { he: 'הכל מעודכן', en: 'All caught up', ar: 'كل شيء محدث', ru: 'Всё в порядке' };
  const waiting = {
    he: 'ממתינות להצבעה שלך',
    en: 'waiting for your vote',
    ar: 'بانتظار تصويتك',
    ru: 'ждут вашего голоса'
  };

  let caughtUpLabel = $derived(caughtUp[$lang as keyof typeof caughtUp] ?? caughtUp.en);
  let waitingLabel = $derived(waiting[$lang as keyof typeof waiting] ?? waiting.en);

  // Secondary stat tiles — each deep-links into the matching lev quantum slice.
  let tiles = $derived([
    { icon: '💼', count: suggestions,     label: labels.suggestions, href: '/lev?focus=mtaha' },
    { icon: '🛒', count: activePurchases, label: labels.purchases,   href: '/lev?focus=buy' },
    { icon: '💰', count: activeSales,     label: labels.sales,       href: '/lev?focus=sale' }
  ]);
</script>

<div class="space-y-3">
  <!-- Hero: votes waiting (the primary daily action) — quantum-loads only the
       vote-relevant slices instead of the full lev query -->
  <a
    href="/lev?focus=votes"
    class="hero block no-underline rounded-3xl p-5 border transition-all active:scale-[0.985]
           {votes > 0
             ? 'border-gold/30 bg-gradient-to-br from-gold/15 via-white/5 to-transparent'
             : 'border-greeni/25 bg-gradient-to-br from-greeni/10 via-white/5 to-transparent'}"
  >
    {#if votes > 0}
      <div class="flex items-center gap-4">
        <span class="text-3xl shrink-0">🗳️</span>
        <div class="flex-1 min-w-0">
          <div class="flex items-baseline gap-2">
            <span class="font-litt text-5xl leading-none text-gold tabular-nums">{votes}</span>
            <span class="text-sm font-medium text-white/70">{labels.votes}</span>
          </div>
          <p class="text-sm text-white/55 mt-1">{waitingLabel}</p>
        </div>
        <span class="text-gold/60 text-xl shrink-0 arrow">‹</span>
      </div>
    {:else}
      <div class="flex items-center gap-4">
        <span class="text-3xl shrink-0">✓</span>
        <div class="flex-1 min-w-0">
          <p class="font-litt text-2xl leading-tight text-greeni">{caughtUpLabel}</p>
          <p class="text-sm text-white/45 mt-0.5">0 {labels.votes}</p>
        </div>
      </div>
    {/if}
  </a>

  <!-- Secondary stat tiles -->
  <div class="grid grid-cols-3 gap-3">
    {#each tiles as tile (tile.label)}
      <a
        href={tile.href}
        class="tile flex flex-col items-center justify-center gap-1 rounded-2xl py-3.5 px-2 no-underline
               bg-white/5 border border-white/10 transition-all active:scale-95 active:bg-white/10"
      >
        <span class="text-xl leading-none">{tile.icon}</span>
        <span class="font-litt text-2xl leading-none text-white tabular-nums">{tile.count}</span>
        <span class="text-[11px] text-white/55 text-center leading-tight">{tile.label}</span>
      </a>
    {/each}
  </div>
</div>

<style>
  /* RTL/LTR-agnostic chevron: point toward the link's reading end */
  .arrow {
    transform: scaleX(1);
  }
  :global([dir='ltr']) .arrow {
    transform: scaleX(-1);
  }
</style>
