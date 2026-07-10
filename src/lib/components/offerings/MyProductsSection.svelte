<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl } from '$lib/translations';

  /**
   * "My products" — personal fixed-price products (Matanot origin='personal')
   * sold directly to customers, hosted on the user's home rikma
   * (PLAN_USER_OFFERINGS §4.1.3 / M3).
   *
   * Props: { uid } — the logged-in user's id.
   */

  let { uid } = $props();

  let products = $state([]);
  let loading = $state(true);
  let error1 = $state(null);
  let composing = $state(false);
  let saving = $state(false);
  let busyId = $state(null);

  let draft = $state({ name: '', descrip: '', price: null, quant: null, kindOf: 'total' });

  onMount(load);

  async function load() {
    loading = true;
    error1 = null;
    try {
      const res = await sendToSer(
        { uid: String(uid) },
        '265listMyPersonalMatanots',
        0,
        0,
        false,
        fetch
      );
      products = res?.data?.matanots?.data ?? [];
    } catch (e) {
      error1 = e?.message || String(e);
    }
    loading = false;
  }

  async function create() {
    error1 = null;
    saving = true;
    try {
      const result = await executeAction('createPersonalMatanot', {
        name: draft.name,
        descrip: draft.descrip || null,
        price: Number(draft.price),
        quant: draft.quant != null && draft.quant !== '' ? Number(draft.quant) : null,
        kindOf: draft.kindOf
      });
      if (!result.success) {
        error1 = result.error?.message || $t('offerings.products.save_failed');
      } else {
        composing = false;
        draft = { name: '', descrip: '', price: null, quant: null, kindOf: 'total' };
        await load();
      }
    } catch (e) {
      error1 = e?.message || String(e);
    }
    saving = false;
  }

  async function archive(product) {
    if (!confirm($t('offerings.products.archive_confirm'))) return;
    busyId = product.id;
    const result = await executeAction('archivePersonalMatanot', {
      matanotId: String(product.id)
    });
    if (result.success) products = products.filter((p) => p.id !== product.id);
    else error1 = result.error?.message || $t('offerings.products.save_failed');
    busyId = null;
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
>
  <!-- Header -->
  <div class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white flex items-center justify-between gap-2">
    <div>
      <h2 class="text-lg font-bold">🎁 {$t('offerings.products.title')}</h2>
      <p class="text-xs opacity-80">{$t('offerings.products.subtitle')}</p>
    </div>
    <button
      class="shrink-0 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-sm font-bold transition-colors"
      onclick={() => (composing = !composing)}
    >
      ➕ {$t('offerings.products.add')}
    </button>
  </div>

  <div class="p-3 space-y-3 max-h-[24rem] overflow-y-auto">
    {#if error1}
      <p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
        {error1}
      </p>
    {/if}

    {#if composing}
      <div class="rounded-xl border border-barbi/40 p-3 space-y-3 bg-barbi/5 dark:bg-barbi/10">
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.name')}</span>
          <input
            type="text"
            bind:value={draft.name}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            required
          />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.descrip')}</span>
          <textarea
            bind:value={draft.descrip}
            rows="2"
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          ></textarea>
        </label>
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.price')}</span>
            <input
              type="number"
              min="0"
              bind:value={draft.price}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              required
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.quant')}</span>
            <input
              type="number"
              min="0"
              bind:value={draft.quant}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
        </div>
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.products.kind')}</span>
          <select
            bind:value={draft.kindOf}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          >
            <option value="total">{$t('offerings.products.kind_total')}</option>
            <option value="monthly">{$t('offerings.products.kind_monthly')}</option>
            <option value="yearly">{$t('offerings.products.kind_yearly')}</option>
            <option value="daily">{$t('offerings.products.kind_daily')}</option>
            <option value="unlimited">{$t('offerings.products.kind_unlimited')}</option>
          </select>
        </label>
        <p class="text-xs text-gray-600 dark:text-gray-300 bg-gold/20 dark:bg-gold/10 rounded-xl px-3 py-2">
          {$t('offerings.products.create_note')}
        </p>
        {#if saving}
          <div class="flex justify-center py-1">
            <RingLoader size="32" color="#ff00ae" unit="px" duration="2s"></RingLoader>
          </div>
        {:else}
          <button
            class="w-full py-2.5 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
            disabled={!draft.name?.trim() || !(Number(draft.price) > 0)}
            onclick={create}
          >
            {$t('offerings.products.create')}
          </button>
        {/if}
      </div>
    {/if}

    {#if loading}
      <div class="flex justify-center py-4">
        <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"></RingLoader>
      </div>
    {:else if products.length === 0 && !composing}
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {$t('offerings.products.empty')}
      </p>
    {:else}
      {#each products as product (product.id)}
        <div class="rounded-xl border border-gray-200 dark:border-gray-600 p-3 flex items-start gap-3">
          {#if product.attributes.pic?.data?.attributes?.url}
            <img
              src={product.attributes.pic.data.attributes.url}
              alt={product.attributes.name}
              class="w-12 h-12 rounded-lg object-cover shrink-0"
            />
          {/if}
          <div class="min-w-0 flex-1">
            <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {product.attributes.name}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
              <span>💰 {product.attributes.price}</span>
              {#if product.attributes.quant != null}<span>📦 {product.attributes.quant}</span>{/if}
              {#if product.attributes.sp?.data}
                <span>🔗 {$t('offerings.products.from_resource')}: {product.attributes.sp.data.attributes?.name}</span>
              {/if}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-1.5">
            {#if busyId === product.id}
              <RingLoader size="20" color="#ff00ae" unit="px" duration="2s"></RingLoader>
            {:else}
              <a
                class="text-xs px-2 py-1 rounded-full border border-gray-300 text-gray-600 dark:text-gray-300 hover:border-barbi hover:text-barbi transition-colors"
                href={`/gift/${product.id}`}
              >
                {$t('offerings.products.view')}
              </a>
              <a
                class="text-xs px-2 py-1 rounded-full border border-gray-300 text-gray-600 dark:text-gray-300 hover:border-barbi hover:text-barbi transition-colors"
                href={`/gift/${product.id}/edit`}
              >
                {$t('offerings.products.edit')}
              </a>
              <button
                class="text-gray-400 hover:text-red-500 transition-colors"
                title={$t('offerings.products.archive')}
                aria-label={$t('offerings.products.archive')}
                onclick={() => archive(product)}
              >
                <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    {/if}
  </div>
</div>
