<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { t, isRtl } from '$lib/translations';

  /**
   * Create personal resources (Sp) from selected mashaabim templates —
   * modern stacked-cards layout (one card per resource).
   * Contract (unchanged): props { needr, meData: MashaabimNode[], onClose(payload), onRemove(payload) }.
   * Creates via createResourceRequest per element; when the user chose to
   * offer a resource to customers too, syncs the public product via
   * publishUserResourceAsProduct (PLAN_USER_OFFERINGS §3.2).
   *
   * @typedef {Object} ClosePayload
   * @property {any} id
   * @property {string} name
   * @property {any} skob
   */

  let { onRemove, needr = [], meData = [], onClose } = $props();
  let error1 = $state(null);
  let already = $state(false);
  let ready = $state(false);

  onMount(() => {
    for (let i = 0; i < meData.length; i++) {
      const id = meData[i].id;
      meData[i] = meData[i].attributes;
      meData[i].id = id;
      meData[i].hm = 1;
      meData[i].easy = meData[i].easy ?? meData[i].price;
      meData[i].offerScope = meData[i].offerScope || 'rikma';
      meData[i].dates = new Date().toISOString().slice(0, -1);
      meData[i].datef = new Date(
        new Date().setFullYear(new Date().getFullYear() + 2)
      )
        .toISOString()
        .slice(0, -1);
    }
    ready = true;
  });

  function isRecurring(el) {
    return el.kindOf === 'monthly' || el.kindOf === 'yearly' || el.kindOf === 'rent';
  }
  function priceUnitKey(el) {
    return el.kindOf === 'monthly'
      ? 'offerings.resource.per_month'
      : el.kindOf === 'yearly'
        ? 'offerings.resource.per_year'
        : el.kindOf === 'rent'
          ? 'offerings.resource.per_period'
          : el.kindOf === 'perUnit'
            ? 'offerings.resource.per_unit'
            : '';
  }

  async function han() {
    error1 = null;
    for (const element of meData) {
      const goingPublic =
        element.offerScope === 'customers' || element.offerScope === 'both';
      if (goingPublic && !(element.price > 0)) {
        error1 = `${element.name}: ${$t('offerings.resource.price_required')}`;
        return;
      }
    }
    already = true;

    for (const element of meData) {
      const hm = element.hm > 0 ? element.hm : 1;
      const price = element.price > 0 ? element.price : 0;
      const easy = element.easy > 0 ? element.easy : 0;

      try {
        const result = await executeAction('createResourceRequest', {
          mashaabimId: element.id,
          name: element.name,
          descrip: element.descrip,
          kindOf: element.kindOf,
          hm,
          spnot: element.spnot,
          price,
          myp: easy,
          linkto: element.linkto,
          sdate: element.dates ? new Date(element.dates).toISOString() : undefined,
          fdate: element.datef ? new Date(element.datef).toISOString() : undefined
        });

        if (result.success && result.data) {
          // PLAN_USER_OFFERINGS §3.2 — mint the public product when offered to
          // customers (idempotent server action; creates the home rikma on
          // first use).
          const scope = element.offerScope || 'rikma';
          if (scope !== 'rikma') {
            const pub = await executeAction('publishUserResourceAsProduct', {
              spId: String(result.data.id),
              offerScope: scope,
              price
            });
            if (!pub.success) {
              error1 = pub.error?.message || $t('offerings.resource.publish_failed');
            }
          }
          onClose?.({
            id: result.data.id,
            name: result.data.attributes.name,
            skob: result.data
          });
        } else {
          error1 = result.error?.message || 'Create failed';
        }
      } catch (e) {
        error1 = e?.message || String(e);
      }
    }
    already = false;
  }

  function remove(id) {
    onRemove?.({ id, data: meData });
  }

  const scopeOptions = [
    { value: 'rikma', labelKey: 'offerings.resource.scope_rikma', hintKey: 'offerings.resource.scope_rikma_hint' },
    { value: 'both', labelKey: 'offerings.resource.scope_both', hintKey: 'offerings.resource.scope_both_hint' },
    { value: 'customers', labelKey: 'offerings.resource.scope_customers', hintKey: 'offerings.resource.scope_customers_hint' }
  ];
</script>

{#if ready}
  {#each needr as n (n)}
    <h1 style="display:none;">{n}</h1>
  {/each}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="flex flex-col w-full max-w-md mx-auto max-h-[min(85vh,44rem)] rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
  >
    <!-- Header -->
    <div class="shrink-0 px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white">
      <h2 class="text-lg font-bold">{$t('offerings.resource.title_new')}</h2>
      <p class="text-xs opacity-80">{$t('offerings.resource.subtitle_new')}</p>
    </div>

    <!-- Scrollable body: one card per selected resource -->
    <div class="flex-1 overflow-y-auto p-3 space-y-4">
      {#if error1}
        <p class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2">
          {error1}
        </p>
      {/if}

      {#each meData as data, i (data.id)}
        <div class="rounded-xl border border-gray-200 dark:border-gray-600 p-3 space-y-3 bg-gray-50/50 dark:bg-gray-900/30">
          <div class="flex items-center justify-between gap-2">
            <span class="text-sm font-bold text-barbi">#{i + 1}</span>
            <button
              class="text-gray-400 hover:text-red-500 transition-colors"
              title={$t('offerings.resource.remove')}
              aria-label={$t('offerings.resource.remove')}
              onclick={() => remove(data.id)}
            >
              <svg style="width:20px;height:20px" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                />
              </svg>
            </button>
          </div>

          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.name')}</span>
            <input
              type="text"
              bind:value={data.name}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              required
            />
          </label>

          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.descrip')}</span>
            <textarea
              bind:value={data.descrip}
              rows="2"
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            ></textarea>
          </label>

          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.kind')}</span>
            <select
              bind:value={data.kindOf}
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
                {#if priceUnitKey(data)}· {$t(priceUnitKey(data))}{/if}
              </span>
              <input
                type="number"
                min="0"
                bind:value={data.price}
                class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              />
            </label>
            <label class="block">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.myp')}</span>
              <input
                type="number"
                min="0"
                bind:value={data.easy}
                class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              />
            </label>
          </div>

          {#if data.kindOf === 'perUnit'}
            <label class="block">
              <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.quantity')}</span>
              <input
                type="number"
                min="1"
                bind:value={data.hm}
                class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
              />
            </label>
          {/if}

          {#if isRecurring(data)}
            <div class="grid grid-cols-2 gap-3">
              <label class="block">
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.start')}</span>
                <input
                  type="datetime-local"
                  bind:value={data.dates}
                  class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
                />
              </label>
              <label class="block">
                <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.end')}</span>
                <input
                  type="datetime-local"
                  bind:value={data.datef}
                  class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-2 text-sm text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
                />
              </label>
            </div>
          {/if}

          <!-- Offer scope -->
          <fieldset>
            <legend class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">
              {$t('offerings.resource.scope_label')}
            </legend>
            <div class="space-y-2">
              {#each scopeOptions as opt (opt.value)}
                <label
                  class="flex items-start gap-2.5 rounded-xl border px-3 py-2 cursor-pointer transition-colors {data.offerScope === opt.value
                    ? 'border-barbi bg-barbi/5 dark:bg-barbi/10'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}"
                >
                  <input
                    type="radio"
                    name={`offerScope-${data.id}`}
                    value={opt.value}
                    bind:group={data.offerScope}
                    class="mt-1 accent-barbi"
                  />
                  <span>
                    <span class="block text-sm font-semibold text-gray-900 dark:text-gray-100">{$t(opt.labelKey)}</span>
                    <span class="block text-xs text-gray-500 dark:text-gray-400">{$t(opt.hintKey)}</span>
                  </span>
                </label>
              {/each}
            </div>
            {#if data.offerScope === 'customers' || data.offerScope === 'both'}
              <p class="mt-2 text-xs text-gray-600 dark:text-gray-300 bg-gold/20 dark:bg-gold/10 rounded-xl px-3 py-2">
                {$t('offerings.resource.scope_note')}
              </p>
            {/if}
          </fieldset>

          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.notes')}</span>
            <input
              type="text"
              bind:value={data.spnot}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>

          <label class="block">
            <span class="text-xs font-semibold text-gray-500 dark:text-gray-400">{$t('offerings.resource.link')}</span>
            <input
              type="url"
              bind:value={data.linkto}
              class="mt-1 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
            />
          </label>
        </div>
      {/each}
    </div>

    <!-- Actions footer -->
    <div class="shrink-0 p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700">
      {#if already === false}
        <button
          class="w-full py-2.5 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
          onclick={han}
        >
          {$t('offerings.resource.submit')}
        </button>
      {:else}
        <div class="flex justify-center py-1">
          <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"></RingLoader>
        </div>
      {/if}
    </div>
  </div>
{/if}
