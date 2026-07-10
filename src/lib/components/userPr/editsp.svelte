<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { t, isRtl } from '$lib/translations';

  /**
   * Edit a single personal resource (Sp) — modern card layout.
   * Contract (unchanged): props { meData: SpNode, onClose(payload) }.
   * Saves via updateResourceRequest, then syncs the public product via
   * publishUserResourceAsProduct when the resource is (or was) offered to
   * customers (PLAN_USER_OFFERINGS §3.2).
   *
   * @typedef {Object} ClosePayload
   * @property {any} id
   * @property {any} name
   * @property {any} skob
   */

  let { onClose, meData = /** @type {any} */ ({}) } = $props();
  let error1 = $state(null);
  let already = $state(false);
  let ready = $state(false);

  /** offerScope as loaded — detects a revert to rikma-only on save. */
  let initialScope = $state('rikma');

  onMount(() => {
    const id = meData.id;
    meData = meData.attributes;
    meData.id = id;
    meData.offerScope = meData.offerScope || 'rikma';
    initialScope = meData.offerScope;
    meData.hm = meData.hm || 1;
    meData.dates = meData.sdate
      ? new Date(meData.sdate).toISOString().slice(0, -1)
      : new Date().toISOString().slice(0, -1);
    meData.datef = meData.fdate
      ? new Date(meData.fdate).toISOString().slice(0, -1)
      : new Date(new Date().setFullYear(new Date().getFullYear() + 2))
          .toISOString()
          .slice(0, -1);
    ready = true;
  });

  const isRecurring = $derived(
    meData.kindOf === 'monthly' || meData.kindOf === 'yearly' || meData.kindOf === 'rent'
  );
  const isPerUnit = $derived(meData.kindOf === 'perUnit');
  const priceUnitKey = $derived(
    meData.kindOf === 'monthly'
      ? 'offerings.resource.per_month'
      : meData.kindOf === 'yearly'
        ? 'offerings.resource.per_year'
        : meData.kindOf === 'rent'
          ? 'offerings.resource.per_period'
          : meData.kindOf === 'perUnit'
            ? 'offerings.resource.per_unit'
            : ''
  );
  const goingPublic = $derived(
    meData.offerScope === 'customers' || meData.offerScope === 'both'
  );

  async function han() {
    error1 = null;
    const price = meData.price > 0 ? meData.price : 0;
    if (goingPublic && price <= 0) {
      error1 = $t('offerings.resource.price_required');
      return;
    }
    already = true;
    const hm = meData.hm > 0 ? meData.hm : 1;
    const easy = meData.myp > 0 ? meData.myp : 0;

    try {
      const result = await executeAction('updateResourceRequest', {
        id: meData.id,
        name: meData.name,
        descrip: meData.descrip,
        kindOf: meData.kindOf,
        hm,
        spnot: meData.spnot,
        price,
        myp: easy,
        linkto: meData.linkto,
        sdate: meData.dates ? new Date(meData.dates).toISOString() : undefined,
        fdate: meData.datef ? new Date(meData.datef).toISOString() : undefined
      });

      if (result.success && result.data) {
        // PLAN_USER_OFFERINGS §3.2 — sync the public product when the resource
        // is (or was) offered to customers. Idempotent server-side.
        const scope = meData.offerScope || 'rikma';
        if (scope !== 'rikma' || initialScope !== 'rikma') {
          const pub = await executeAction('publishUserResourceAsProduct', {
            spId: String(meData.id),
            offerScope: scope,
            price
          });
          if (!pub.success) {
            error1 = pub.error?.message || $t('offerings.resource.publish_failed');
            already = false;
            return;
          }
          initialScope = scope;
        }
        onClose?.({
          id: result.data.id,
          name: result.data.attributes.name,
          skob: result.data
        });
      } else {
        error1 = result.error?.message || 'Update failed';
        already = false;
      }
    } catch (e) {
      error1 = e?.message || String(e);
      already = false;
    }
  }

  const scopeOptions = [
    { value: 'rikma', labelKey: 'offerings.resource.scope_rikma', hintKey: 'offerings.resource.scope_rikma_hint' },
    { value: 'both', labelKey: 'offerings.resource.scope_both', hintKey: 'offerings.resource.scope_both_hint' },
    { value: 'customers', labelKey: 'offerings.resource.scope_customers', hintKey: 'offerings.resource.scope_customers_hint' }
  ];
</script>

{#if ready}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="flex flex-col w-full max-w-md mx-auto max-h-[min(85vh,44rem)] rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
  >
    <!-- Header -->
    <div class="shrink-0 px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white">
      <p class="text-xs opacity-80">{$t('offerings.resource.title_edit')}</p>
      <h2 class="text-lg font-bold truncate">{meData.name}</h2>
    </div>

    <!-- Scrollable body -->
    <div class="flex-1 overflow-y-auto p-4 space-y-4">
      {#if error1}
        <p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
          {error1}
        </p>
      {/if}

      <label class="block">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.name')}</span>
        <input
          type="text"
          bind:value={meData.name}
          class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          required
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.descrip')}</span>
        <textarea
          bind:value={meData.descrip}
          rows="2"
          class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
        ></textarea>
      </label>

      <label class="block">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.kind')}</span>
        <select
          bind:value={meData.kindOf}
          class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
        >
          <option value="total">{$t('offerings.resource.kind_total')}</option>
          <option value="monthly">{$t('offerings.resource.kind_monthly')}</option>
          <option value="yearly">{$t('offerings.resource.kind_yearly')}</option>
          <option value="perUnit">{$t('offerings.resource.kind_perUnit')}</option>
          <option value="rent">{$t('offerings.resource.kind_rent')}</option>
        </select>
      </label>

      <div class="grid grid-cols-2 gap-3">
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">
            {$t('offerings.resource.price')}
            {#if priceUnitKey}· {$t(priceUnitKey)}{/if}
          </span>
          <input
            type="number"
            min="0"
            bind:value={meData.price}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          />
        </label>
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.myp')}</span>
          <input
            type="number"
            min="0"
            bind:value={meData.myp}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          />
        </label>
      </div>

      {#if isPerUnit}
        <label class="block">
          <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.quantity')}</span>
          <input
            type="number"
            min="1"
            bind:value={meData.hm}
            class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
          />
        </label>
      {/if}

      {#if isRecurring}
        <div class="grid grid-cols-2 gap-3">
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.start')}</span>
            <input
              type="datetime-local"
              bind:value={meData.dates}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.end')}</span>
            <input
              type="datetime-local"
              bind:value={meData.datef}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
        </div>
      {/if}

      <!-- Offer scope: who is this resource offered to -->
      <fieldset>
        <legend class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
          {$t('offerings.resource.scope_label')}
        </legend>
        <div class="space-y-2">
          {#each scopeOptions as opt (opt.value)}
            <label
              class="flex items-start gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors {meData.offerScope === opt.value
                ? 'border-barbi bg-barbi/5 dark:bg-barbi/10'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}"
            >
              <input
                type="radio"
                name="offerScope"
                value={opt.value}
                bind:group={meData.offerScope}
                class="mt-1 accent-barbi"
              />
              <span>
                <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t(opt.labelKey)}</span>
                <span class="block text-xs text-gray-500 dark:text-gray-400">{$t(opt.hintKey)}</span>
              </span>
            </label>
          {/each}
        </div>
        {#if goingPublic}
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gold/20 dark:bg-gold/10 rounded-xl px-3 py-2">
            {$t('offerings.resource.scope_note')}
          </p>
        {/if}
      </fieldset>

      <label class="block">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.notes')}</span>
        <input
          type="text"
          bind:value={meData.spnot}
          class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
        />
      </label>

      <label class="block">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.link')}</span>
        <input
          type="url"
          bind:value={meData.linkto}
          class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
        />
      </label>
    </div>

    <!-- Actions footer -->
    <div class="shrink-0 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
      {#if already === false}
        <button
          class="w-full py-2.5 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onclick={han}
        >
          {$t('offerings.resource.submit_one')}
        </button>
      {:else}
        <div class="flex justify-center py-1">
          <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"></RingLoader>
        </div>
      {/if}
    </div>
  </div>
{/if}
