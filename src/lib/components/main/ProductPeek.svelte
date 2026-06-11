<script>
  import { t, locale } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';

  let active = $state('hub');

  const tabs = $derived([
    { id: 'hub', icon: '🏠', label: $t('home.peek.tabs.hub') },
    { id: 'mission', icon: '⏱️', label: $t('home.peek.tabs.mission') },
    { id: 'vote', icon: '🗳️', label: $t('home.peek.tabs.vote') }
  ]);

  const kpis = $derived([
    { icon: '🗳', count: 2, label: $t('home.peek.hub.votes') },
    { icon: '⏰', count: 1, label: $t('home.peek.hub.urgent'), red: true },
    { icon: '💼', count: 3, label: $t('home.peek.hub.suggestions') }
  ]);

  const shortcuts = $derived([
    { icon: '🧩', label: $t('home.peek.hub.missions'), badge: 2 },
    { icon: '🤝', label: $t('home.peek.hub.rikma'), badge: 1 },
    { icon: '📨', label: $t('home.peek.hub.inbound'), badge: 3 }
  ]);

  const feed = $derived([
    { icon: '🗳', text: $t('home.peek.hub.feed1') },
    { icon: '✅', text: $t('home.peek.hub.feed2') },
    { icon: '🤝', text: $t('home.peek.hub.feed3') }
  ]);

  function register() {
    goto(
      $locale == 'he' ? '/hascama' : $locale == 'ar' ? '/aitifaqia' : '/convention'
    );
  }
</script>

<h2 class="text-rose-700 font-bold text-3xl sm:text-2xl mb-1 text-center">
  {$t('home.peek.title')}
</h2>
<p class="text-center text-slate-700 text-base sm:text-sm mb-5">
  {$t('home.peek.sub')}
</p>

<!-- Tabs -->
<div class="flex justify-center gap-2 flex-wrap mb-3">
  {#each tabs as tab (tab.id)}
    <button
      type="button"
      class="px-3 py-1.5 rounded-full text-base sm:text-sm font-semibold border-2 transition-all duration-300 {active ===
      tab.id
        ? 'bg-barbi text-gold border-gold shadow-md scale-105'
        : 'bg-white/60 text-slate-700 border-slate-300 hover:border-gold'}"
      onclick={() => (active = tab.id)}
    >
      {tab.icon} {tab.label}
    </button>
  {/each}
</div>

<!-- App frame (mirrors the real in-app look) -->
<div
  class="relative rounded-3xl border-4 border-gold/80 bg-bluesun shadow-2xl overflow-hidden"
>
  <span
    class="absolute top-2 z-10 bg-gold text-bluesun text-xs font-bold px-2 py-0.5 rounded-full shadow {$locale ===
      'he' || $locale === 'ar'
      ? 'left-2'
      : 'right-2'}"
  >
    {$t('home.peek.badge')}
  </span>

  {#key active}
    <div class="min-h-[330px] p-3 sm:p-4" in:fade={{ duration: 250 }}>
      {#if active === 'hub'}
        <!-- KPI chips like the real hub -->
        <div class="flex flex-wrap gap-2 pb-3 border-b border-white/10">
          {#each kpis as kpi (kpi.label)}
            <span
              class="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium {kpi.red
                ? 'bg-red-500/20 text-red-300 border border-red-400/40'
                : 'bg-white/10 text-white/80 border border-white/15'}"
            >
              <span class="text-base leading-none">{kpi.icon}</span>
              <span class="font-bold">{kpi.count}</span>
              <span class="opacity-70">{kpi.label}</span>
            </span>
          {/each}
        </div>

        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mt-3 mb-2">
          {$t('home.peek.hub.shortcuts')}
        </p>
        <div class="flex gap-2 flex-wrap">
          {#each shortcuts as s (s.label)}
            <span
              class="relative flex flex-col items-center gap-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 min-w-[90px]"
            >
              <span class="text-xl">{s.icon}</span>
              <span class="text-xs text-white/80 text-center">{s.label}</span>
              <span
                class="absolute -top-1.5 -end-1.5 w-5 h-5 rounded-full bg-barbi text-white text-[10px] font-bold flex items-center justify-center"
                >{s.badge}</span
              >
            </span>
          {/each}
        </div>

        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mt-4 mb-2">
          {$t('home.peek.hub.feedTitle')}
        </p>
        <div class="space-y-2">
          {#each feed as item (item.text)}
            <div
              class="flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-white/5 border border-white/10"
            >
              <span class="text-lg shrink-0">{item.icon}</span>
              <span class="flex-1 text-sm text-white text-start">{item.text}</span>
              <span class="text-white/30 text-xs shrink-0"
                >{$locale === 'he' || $locale === 'ar' ? '←' : '→'}</span
              >
            </div>
          {/each}
        </div>
      {:else if active === 'mission'}
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          {$t('home.peek.mission.header')}
        </p>
        <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🧩</span>
            <span class="text-white font-semibold text-base text-start flex-1">
              {$t('home.peek.mission.name')}
            </span>
          </div>
          <div
            class="mt-4 flex items-center justify-center gap-3 rounded-xl bg-barbi/20 border border-barbi/40 px-4 py-3"
          >
            <span class="w-2.5 h-2.5 rounded-full bg-green-400 animate-pulse"></span>
            <span class="text-white/80 text-sm">{$t('home.peek.mission.timerLabel')}</span>
            <span dir="ltr" class="text-gold font-mono font-bold text-xl tracking-wider"
              >01:37:42</span
            >
          </div>
          <p class="mt-3 text-white/70 text-sm text-start">
            {$t('home.peek.mission.hours')}
          </p>
          <div class="mt-2 h-2 rounded-full bg-white/10 overflow-hidden">
            <div class="h-full w-[65%] rounded-full bg-gradient-to-r from-gold to-barbi"></div>
          </div>
        </div>
        <p
          class="mt-4 text-center text-gold/90 text-sm bg-white/5 border border-gold/30 rounded-xl px-3 py-2.5"
        >
          💡 {$t('home.peek.mission.equity')}
        </p>
      {:else}
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-2">
          {$t('home.peek.vote.header')}
        </p>
        <div class="rounded-2xl bg-white/5 border border-white/10 p-4">
          <p class="text-white font-semibold text-base text-start">
            {$t('home.peek.vote.proposal')}
          </p>
          <p class="text-white/50 text-xs mt-1 text-start">{$t('home.peek.vote.by')}</p>
          <div class="mt-4">
            <p class="text-white/70 text-sm mb-1.5 text-start">
              {$t('home.peek.vote.consensus')}
            </p>
            <div class="h-2 rounded-full bg-white/10 overflow-hidden">
              <div class="h-full w-3/4 rounded-full bg-green-400"></div>
            </div>
          </div>
          <div class="mt-4 flex gap-2">
            <span
              class="flex-1 text-center rounded-xl bg-green-500/20 border border-green-400/40 text-green-300 font-semibold text-sm px-3 py-2"
              >✓ {$t('home.peek.vote.yes')}</span
            >
            <span
              class="flex-1 text-center rounded-xl bg-white/5 border border-white/15 text-white/60 font-semibold text-sm px-3 py-2"
              >✕ {$t('home.peek.vote.no')}</span
            >
          </div>
        </div>
        <p
          class="mt-4 text-center text-gold/90 text-sm bg-white/5 border border-gold/30 rounded-xl px-3 py-2.5"
        >
          🤝 {$t('home.peek.vote.hint')}
        </p>
      {/if}
    </div>
  {/key}
</div>

<p class="text-center text-slate-600 text-sm mt-3">{$t('home.peek.note')}</p>
<div class="mt-3 text-center">
  <button
    type="button"
    class="bg-barbi hover:bg-white hover:text-barbi text-gold font-bold text-lg sm:text-base px-5 py-2.5 rounded-xl shadow-md hover:scale-105 transition-all duration-300"
    onclick={register}
  >
    {$t('home.peek.cta')} ✍️
  </button>
</div>
