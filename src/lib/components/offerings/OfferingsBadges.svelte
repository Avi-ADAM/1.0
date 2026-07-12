<script>
  import { onMount } from 'svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl } from '$lib/translations';
  import CreateProductFlow from './CreateProductFlow.svelte';

  /**
   * Compact offerings badges for /me (profile feedback 2026-07-13): the
   * profile has real-estate only for icon + count + expand link + a plus —
   * the full lists live on /sales-center (products, across all rikmas) and
   * /me/offerings (missions: offers + doing + ✓done).
   * Styled like the page's gradient pill chips (a6 "הרקמות שלי").
   *
   * Props: { uid }
   */

  let { uid } = $props();

  let counts = $state({ products: 0, missions: 0, done: 0 });
  let loaded = $state(false);
  let creating = $state(false);

  onMount(() => {
    // Deep link from AddSupplySheet: /me?createProduct=1 opens the flow.
    try {
      if (new URLSearchParams(location.search).get('createProduct') === '1') {
        creating = true;
      }
    } catch {
      /* SSR-safe guard; onMount is client-only anyway */
    }
    load();
  });

  async function load() {
    try {
      const res = await sendToSer({ uid: String(uid) }, '272myOfferingsCounts', 0, 0, false, fetch);
      const d = res?.data ?? {};
      const total = (k) => d[k]?.meta?.pagination?.total ?? 0;
      counts = {
        products: total('products'),
        missions: total('offers') + total('doing'),
        done: total('done')
      };
    } catch (e) {
      console.warn('offerings counts failed', e);
    }
    loaded = true;
  }
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="flex flex-wrap items-center justify-center gap-2 my-2">
  <!-- Products: count → sales-center, plus → create flow -->
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mpink via-transparent via-lpink to-barbi px-3 py-1 text-gold font-bold shadow-md"
  >
    <a
      href="/sales-center"
      class="inline-flex items-center gap-1.5 hover:scale-105 transition-transform"
      title={$t('offerings.badges.open_products')}
    >
      🎁
      <span class="hidden sm:inline">{$t('offerings.badges.products')}</span>
      {#if loaded}
        <span class="bg-gold text-barbi rounded-full px-1.5 text-xs leading-5 min-w-5 text-center">
          {counts.products}
        </span>
      {/if}
    </a>
    <button
      class="bg-gold text-barbi rounded-full w-5 h-5 leading-5 text-sm font-extrabold hover:scale-125 transition-transform"
      title={$t('offerings.badges.add_product')}
      aria-label={$t('offerings.badges.add_product')}
      onclick={() => (creating = true)}
    >
      +
    </button>
  </span>

  <!-- Missions: offers + doing count, ✓ done count → /me/offerings -->
  <span
    class="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-br from-mpink via-transparent via-lpink to-barbi px-3 py-1 text-gold font-bold shadow-md"
  >
    <a
      href="/me/offerings"
      class="inline-flex items-center gap-1.5 hover:scale-105 transition-transform"
      title={$t('offerings.badges.open_missions')}
    >
      🛠️
      <span class="hidden sm:inline">{$t('offerings.badges.missions')}</span>
      {#if loaded}
        <span class="bg-gold text-barbi rounded-full px-1.5 text-xs leading-5 min-w-5 text-center">
          {counts.missions}
        </span>
        {#if counts.done > 0}
          <span
            class="bg-emerald-500 text-white rounded-full px-1.5 text-xs leading-5 min-w-5 text-center"
            title={$t('offerings.badges.done_tip')}
          >
            ✓{counts.done}
          </span>
        {/if}
      {/if}
    </a>
    <a
      href="/me/offerings?new=1"
      class="bg-gold text-barbi rounded-full w-5 h-5 leading-5 text-sm font-extrabold text-center hover:scale-125 transition-transform"
      title={$t('offerings.badges.add_mission')}
      aria-label={$t('offerings.badges.add_mission')}
    >
      +
    </a>
  </span>
</div>

{#if creating}
  <CreateProductFlow
    {uid}
    onDone={() => {
      creating = false;
      load();
    }}
    onClose={() => (creating = false)}
  />
{/if}
