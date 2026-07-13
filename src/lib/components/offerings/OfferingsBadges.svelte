<script>
  import { onMount } from 'svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl } from '$lib/translations';
  import CreateProductFlow from './CreateProductFlow.svelte';

  /**
   * Compact offerings badges for /me (profile feedback 2026-07-13/14): the
   * profile has real-estate only for icon + count + expand link + a plus —
   * the full lists live on /sales-center (products, across all rikmas) and
   * /me/offerings (missions: offers + doing + ✓done).
   *
   * Layout: stacked full-width on mobile, side-by-side on desktop.
   * Counts resolve NESTED under the user entity (qid 276) so they ride the
   * user find permission — not per-collection permissions.
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
      const res = await sendToSer(
        { uid: String(uid) },
        '276myOfferingsViaUser',
        0,
        0,
        false,
        fetch
      );
      const a = res?.data?.usersPermissionsUser?.data?.attributes ?? {};
      const products = (a.projects_1s?.data ?? []).reduce(
        (sum, p) => sum + (p.attributes?.matanotofs?.data?.length ?? 0),
        0
      );
      counts = {
        products,
        missions:
          (a.mission_offers?.data?.length ?? 0) +
          (a.mesimabetahaliches?.data?.length ?? 0),
        done: a.finnished_missions?.data?.length ?? 0
      };
    } catch (e) {
      console.warn('offerings counts failed', e);
    }
    loaded = true;
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="flex flex-col lg:flex-row items-center lg:justify-center gap-2 my-2 px-2"
>
  <!-- Products: count → sales-center, plus → create flow -->
  <span
    class="flex items-center justify-between sm:justify-center gap-2 rounded-full bg-gradient-to-br from-mpink via-lpink to-barbi px-4 py-1.5 text-white font-bold shadow-md"
  >
    <a
      href="/sales-center"
      class="inline-flex items-center gap-1.5 hover:scale-105 transition-transform drop-shadow-sm"
      title={$t('offerings.badges.open_products')}
    >
      🎁
      <span>{$t('offerings.badges.products')}</span>
      {#if loaded}
        <span
          class="bg-white text-barbi rounded-full px-1.5 text-xs leading-5 min-w-5 text-center shadow-sm"
        >
          {counts.products}
        </span>
      {/if}
    </a>
    <button
      class="bg-white text-barbi rounded-full w-6 h-6 leading-6 text-base font-extrabold shadow-sm hover:scale-125 transition-transform"
      title={$t('offerings.badges.add_product')}
      aria-label={$t('offerings.badges.add_product')}
      onclick={() => (creating = true)}
    >
      +
    </button>
  </span>

  <!-- Missions: offers + doing count, ✓ done count → /me/offerings -->
  <span
    class="flex items-center justify-between sm:justify-center gap-2 rounded-full bg-gradient-to-br from-mpink via-lpink to-barbi px-4 py-1.5 text-white font-bold shadow-md"
  >
    <a
      href="/me/offerings"
      class="inline-flex items-center gap-1.5 hover:scale-105 transition-transform drop-shadow-sm"
      title={$t('offerings.badges.open_missions')}
    >
      🛠️
      <span>{$t('offerings.badges.missions')}</span>
      {#if loaded}
        <span
          class="bg-white text-barbi rounded-full px-1.5 text-xs leading-5 min-w-5 text-center shadow-sm"
        >
          {counts.missions}
        </span>
        {#if counts.done > 0}
          <span
            class="bg-emerald-500 text-white rounded-full px-1.5 text-xs leading-5 min-w-5 text-center shadow-sm"
            title={$t('offerings.badges.done_tip')}
          >
            ✓{counts.done}
          </span>
        {/if}
      {/if}
    </a>
    <a
      href="/me/offerings?new=1"
      class="bg-white text-barbi rounded-full w-6 h-6 leading-6 text-base font-extrabold text-center shadow-sm hover:scale-125 transition-transform"
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
