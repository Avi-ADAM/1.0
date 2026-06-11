<script>
  import { t, locale } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { fade } from 'svelte/transition';

  let active = $state('lev');

  const tabs = $derived([
    { id: 'lev', icon: '💗', label: $t('home.peek.lev.tab') },
    { id: 'hub', icon: '🏠', label: $t('home.peek.tabs.hub') },
    { id: 'mission', icon: '⏱️', label: $t('home.peek.tabs.mission') },
    { id: 'vote', icon: '🗳️', label: $t('home.peek.tabs.vote') }
  ]);

  // --- Lev swipeable demo cards (swipe right = approve, left = negotiate) ---
  const levCards = $derived([
    {
      emoji: '🧩',
      glow: 'rgba(238,232,170,0.9)',
      type: $t('home.peek.lev.cards.c1.type'),
      project: $t('home.peek.lev.cards.c1.project'),
      title: $t('home.peek.lev.cards.c1.title'),
      by: $t('home.peek.lev.cards.c1.by'),
      terms: [
        { label: $t('home.peek.lev.cards.c1.t1'), value: 4, step: 1, min: 1 },
        { label: $t('home.peek.lev.cards.c1.t2'), value: 70, step: 5, min: 5 }
      ]
    },
    {
      emoji: '🤝',
      glow: 'rgba(74,222,128,0.8)',
      type: $t('home.peek.lev.cards.c2.type'),
      project: $t('home.peek.lev.cards.c2.project'),
      title: $t('home.peek.lev.cards.c2.title'),
      by: $t('home.peek.lev.cards.c2.by'),
      terms: [{ label: $t('home.peek.lev.cards.c2.t1'), value: 10, step: 1, min: 1 }]
    },
    {
      emoji: '💰',
      glow: 'rgba(255,0,146,0.6)',
      type: $t('home.peek.lev.cards.c3.type'),
      project: $t('home.peek.lev.cards.c3.project'),
      title: $t('home.peek.lev.cards.c3.title'),
      by: $t('home.peek.lev.cards.c3.by'),
      terms: [{ label: $t('home.peek.lev.cards.c3.t1'), value: 2400, step: 100, min: 100 }]
    }
  ]);

  let cardIdx = $state(0);
  let dx = $state(0);
  let dragging = $state(false);
  let flyDir = $state(0); // 0 = idle, 1 = flying right (approve), -1 = flying left (counter-offer sent)
  let startX = 0;
  let negoMode = $state(false);
  let negoValues = $state([]);

  function pointerDown(e) {
    if (flyDir !== 0 || negoMode || cardIdx >= levCards.length) return;
    // A press that starts on a button is a click, not a drag — capturing the
    // pointer here would steal the click from the button.
    if (e.target.closest('button')) return;
    dragging = true;
    startX = e.clientX;
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }

  function pointerMove(e) {
    if (dragging && flyDir === 0) dx = e.clientX - startX;
  }

  function pointerUp() {
    if (!dragging) return;
    dragging = false;
    if (dx > 70) approve();
    else if (dx < -70) openNego();
    else dx = 0;
  }

  function flyOut(dir) {
    flyDir = dir;
    setTimeout(() => {
      cardIdx += 1;
      dx = 0;
      flyDir = 0;
    }, 350);
  }

  function approve() {
    if (flyDir !== 0 || cardIdx >= levCards.length) return;
    flyOut(1);
  }

  function openNego() {
    if (flyDir !== 0 || cardIdx >= levCards.length) return;
    negoValues = levCards[cardIdx].terms.map((t) => t.value);
    negoMode = true;
    dx = 0;
  }

  function adjustTerm(i, dir) {
    const term = levCards[cardIdx].terms[i];
    const next = negoValues[i] + dir * term.step;
    if (next >= term.min) negoValues[i] = next;
  }

  function sendNego() {
    negoMode = false;
    flyOut(-1);
  }

  function cancelNego() {
    negoMode = false;
  }

  function restartCards() {
    cardIdx = 0;
    dx = 0;
    flyDir = 0;
    negoMode = false;
  }

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
      {#if active === 'lev'}
        <p class="text-xs font-semibold text-white/40 uppercase tracking-wider mb-1">
          {$t('home.peek.lev.header')}
        </p>
        <p class="text-center text-gold/90 text-sm mb-3">{$t('home.peek.lev.hint')}</p>

        {#if cardIdx < levCards.length}
          <div class="relative h-[250px] select-none" style="perspective: 800px;">
            <!-- next card peeking from behind -->
            {#if cardIdx + 1 < levCards.length}
              <div
                class="absolute inset-x-3 top-2 bottom-0 rounded-2xl bg-white/80 border border-slate-200 scale-95 translate-y-2"
              ></div>
            {/if}

            <!-- top card: draggable -->
            <div
              class="absolute inset-0 rounded-2xl bg-white shadow-2xl overflow-hidden flex flex-col cursor-grab active:cursor-grabbing"
              style="touch-action: pan-y; transform: translateX({flyDir !== 0
                ? flyDir * 140
                : 0}%) translateX({flyDir === 0 ? dx : 0}px) rotate({(flyDir !== 0
                ? flyDir * 18
                : dx / 14)}deg); transition: {dragging
                ? 'none'
                : 'transform 0.35s ease'}; opacity: {flyDir !== 0 ? 0.4 : 1};"
              onpointerdown={pointerDown}
              onpointermove={pointerMove}
              onpointerup={pointerUp}
              onpointercancel={pointerUp}
              role="group"
              aria-label={levCards[cardIdx].title}
            >
              <!-- gold header with glow, like the real card -->
              <div
                class="relative flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200 border-b border-amber-300 overflow-hidden"
              >
                <div
                  class="absolute inset-0 opacity-30 blur-2xl pointer-events-none"
                  style="background: radial-gradient(circle at center, {levCards[cardIdx]
                    .glow}, transparent 70%);"
                ></div>
                <span class="text-xl relative">{levCards[cardIdx].emoji}</span>
                <span class="relative flex-1 min-w-0">
                  <span class="block text-sm font-bold text-slate-800 truncate"
                    >{levCards[cardIdx].project}</span
                  >
                  <span class="block text-[11px] text-amber-700 font-semibold"
                    >{levCards[cardIdx].type}</span
                  >
                </span>
              </div>

              {#if negoMode}
                <!-- counter-offer mode: adjust the terms, no rejection -->
                <div class="flex-1 flex flex-col justify-center px-4 py-2 gap-2">
                  <p class="text-amber-700 font-bold text-sm text-center">
                    🤝 {$t('home.peek.lev.negoTitle')}
                  </p>
                  {#each levCards[cardIdx].terms as term, i (term.label)}
                    <div
                      class="flex items-center justify-between gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5"
                    >
                      <span class="text-slate-600 text-xs font-semibold">{term.label}</span>
                      <span class="flex items-center gap-2">
                        {#if negoValues[i] !== term.value}
                          <span class="text-slate-400 text-xs line-through" dir="ltr"
                            >{term.value.toLocaleString()}</span
                          >
                        {/if}
                        <button
                          type="button"
                          class="w-7 h-7 rounded-full bg-white border border-amber-300 text-amber-700 font-black leading-none hover:bg-amber-100"
                          aria-label="-"
                          onclick={() => adjustTerm(i, -1)}>−</button
                        >
                        <span
                          class="text-slate-900 font-black text-base min-w-[3.5rem] text-center"
                          dir="ltr">{negoValues[i].toLocaleString()}</span
                        >
                        <button
                          type="button"
                          class="w-7 h-7 rounded-full bg-white border border-amber-300 text-amber-700 font-black leading-none hover:bg-amber-100"
                          aria-label="+"
                          onclick={() => adjustTerm(i, 1)}>+</button
                        >
                      </span>
                    </div>
                  {/each}
                </div>
                <div class="flex border-t border-slate-100">
                  <button
                    type="button"
                    class="px-4 py-3 text-slate-400 font-bold text-sm hover:bg-slate-50 transition-colors"
                    onclick={cancelNego}>{$t('home.peek.lev.negoBack')}</button
                  >
                  <div class="w-px bg-slate-100"></div>
                  <button
                    type="button"
                    class="flex-1 py-3 text-amber-700 font-bold text-sm bg-amber-50 hover:bg-amber-100 transition-colors"
                    onclick={sendNego}>{$t('home.peek.lev.negoSend')}</button
                  >
                </div>
              {:else}
                <div class="flex-1 flex flex-col justify-center px-4 py-3 text-center">
                  <p class="text-slate-800 font-bold text-base leading-snug">
                    {levCards[cardIdx].title}
                  </p>
                  <div class="flex justify-center gap-2 flex-wrap mt-2">
                    {#each levCards[cardIdx].terms as term (term.label)}
                      <span
                        class="bg-slate-100 border border-slate-200 rounded-full px-2.5 py-0.5 text-xs font-semibold text-slate-700"
                        ><span dir="ltr">{term.value.toLocaleString()}</span> {term.label}</span
                      >
                    {/each}
                  </div>
                  <p class="text-slate-500 text-xs mt-2">{levCards[cardIdx].by}</p>
                </div>

                <div class="flex border-t border-slate-100">
                  <button
                    type="button"
                    class="flex-1 py-3 text-amber-700 font-bold text-sm hover:bg-amber-50 transition-colors"
                    onclick={openNego}
                    >🤝 {$t('home.peek.lev.reject')}</button
                  >
                  <div class="w-px bg-slate-100"></div>
                  <button
                    type="button"
                    class="flex-1 py-3 text-green-600 font-bold text-sm hover:bg-green-50 transition-colors"
                    onclick={approve}
                    >✓ {$t('home.peek.lev.approve')}</button
                  >
                </div>
              {/if}

              <!-- drag feedback stamps -->
              {#if dx > 30 || flyDir === 1}
                <span
                  class="absolute top-10 start-3 rotate-[-12deg] border-4 border-green-500 text-green-600 font-black text-lg px-2 py-0.5 rounded-lg bg-white/80"
                  >✓ {$t('home.peek.lev.approved')}</span
                >
              {:else if flyDir === -1}
                <span
                  class="absolute top-10 end-3 rotate-[12deg] border-4 border-amber-500 text-amber-600 font-black text-lg px-2 py-0.5 rounded-lg bg-white/80"
                  >🤝 {$t('home.peek.lev.negoSent')}</span
                >
              {:else if dx < -30}
                <span
                  class="absolute top-10 end-3 rotate-[12deg] border-4 border-amber-500 text-amber-600 font-black text-lg px-2 py-0.5 rounded-lg bg-white/80"
                  >🤝 {$t('home.peek.lev.rejected')}</span
                >
              {/if}
            </div>
          </div>
          <p class="text-center text-white/40 text-xs mt-2">
            {cardIdx + 1} / {levCards.length}
          </p>
        {:else}
          <div
            class="h-[250px] flex flex-col items-center justify-center text-center gap-2"
            in:fade={{ duration: 300 }}
          >
            <span class="text-5xl">💗</span>
            <p class="text-white font-bold text-lg">{$t('home.peek.lev.done')}</p>
            <p class="text-white/60 text-sm max-w-xs">{$t('home.peek.lev.doneSub')}</p>
            <button
              type="button"
              class="mt-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-semibold hover:bg-white/20 transition-colors"
              onclick={restartCards}>{$t('home.peek.lev.restart')}</button
            >
          </div>
        {/if}
      {:else if active === 'hub'}
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
              class="flex-1 text-center rounded-xl bg-amber-500/15 border border-amber-400/40 text-amber-300 font-semibold text-sm px-3 py-2"
              >🤝 {$t('home.peek.vote.no')}</span
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
