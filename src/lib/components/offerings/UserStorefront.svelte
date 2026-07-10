<script>
  import { t, isRtl } from '$lib/translations';

  /**
   * Public storefront on /user/[id] — PLAN_USER_OFFERINGS §4.5 (M7).
   * Read-only view of a user's customer-facing offerings:
   *  - personal products → /gift/[id]
   *  - resources offered for sale (their linked product) → /gift/[matanotId]
   *  - active priced mission offers → /concierge/new?provider=[uid]
   *
   * Props: { storefront: { products, resources, missionOffers }, userId }
   */

  let { storefront = { products: [], resources: [], missionOffers: [] }, userId } = $props();

  const hasAny = $derived(
    (storefront.products?.length ?? 0) +
      (storefront.resources?.length ?? 0) +
      (storefront.missionOffers?.length ?? 0) >
      0
  );

  function offerPrice(a) {
    if (a.perhour > 0) return `${a.perhour} · ${$t('offerings.storefront.per_hour')}`;
    if (a.price > 0) return `${a.price}`;
    return '';
  }
</script>

{#if hasAny}
  <section
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="w-full max-w-3xl mx-auto my-6 px-3"
    id="storefront"
  >
    <div class="rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white">
        <h2 class="text-lg font-bold">🛍️ {$t('offerings.storefront.title')}</h2>
        <p class="text-xs opacity-80">{$t('offerings.storefront.subtitle')}</p>
      </div>

      <div class="p-4 space-y-5">
        {#if storefront.products?.length}
          <div>
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
              🎁 {$t('offerings.storefront.products')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each storefront.products as p (p.id)}
                <a
                  href={`/gift/${p.id}`}
                  class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-3 hover:border-barbi transition-colors"
                >
                  {#if p.attributes.pic?.data?.attributes?.url}
                    <img
                      src={p.attributes.pic.data.attributes.url}
                      alt={p.attributes.name}
                      class="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                  {/if}
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {p.attributes.name}
                    </span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">
                      💰 {p.attributes.price}
                    </span>
                  </span>
                  <span class="shrink-0 text-xs font-bold text-barbi">{$t('offerings.storefront.order')} ←</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        {#if storefront.resources?.length}
          <div>
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
              📦 {$t('offerings.storefront.resources')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each storefront.resources as r (r.id)}
                <a
                  href={`/gift/${r.attributes.matanot.data.id}`}
                  class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-3 hover:border-barbi transition-colors"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {r.attributes.name}
                    </span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">
                      💰 {r.attributes.price}
                    </span>
                  </span>
                  <span class="shrink-0 text-xs font-bold text-barbi">{$t('offerings.storefront.order')} ←</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}

        {#if storefront.missionOffers?.length}
          <div>
            <h3 class="text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">
              🛠️ {$t('offerings.storefront.missions')}
            </h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {#each storefront.missionOffers as o (o.id)}
                <a
                  href={`/concierge/new?provider=${userId}`}
                  class="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-600 p-3 hover:border-barbi transition-colors"
                >
                  <span class="min-w-0 flex-1">
                    <span class="block font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {o.attributes.name ||
                        o.attributes.mission?.data?.attributes?.missionName ||
                        ''}
                    </span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
                      {#if offerPrice(o.attributes)}<span>💰 {offerPrice(o.attributes)}</span>{/if}
                      {#if o.attributes.hours > 0}<span>⏱️ {o.attributes.hours} {$t('offerings.storefront.hours')}</span>{/if}
                      {#if o.attributes.location?.location_mode === 'online'}<span>🌐 {$t('offerings.storefront.online')}</span>
                      {:else if o.attributes.location?.location_hint}<span>📍 {o.attributes.location.location_hint}</span>{/if}
                    </span>
                  </span>
                  <span class="shrink-0 text-xs font-bold text-barbi">{$t('offerings.storefront.ask_concierge')} ←</span>
                </a>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </section>
{/if}
