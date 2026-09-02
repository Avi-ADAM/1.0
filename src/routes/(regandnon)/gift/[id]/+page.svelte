<script>
  import { isRtl, t } from '$lib/translations';
  import EntityIcon from '$lib/celim/icons/EntityIcon.svelte';
  import { Head } from 'svead';
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import RichText from '$lib/celim/ui/richText.svelte';
  import ShareLink from '$lib/components/share/ShareLink.svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { goto } from '$app/navigation';
  import SaleComponent from '$lib/components/sales/SaleComponent.svelte';
  import { toast } from 'svelte-sonner';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import MatanotPublicView from '$lib/components/products/MatanotPublicView.svelte';
  import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';

  // Icon imports (using SVG strings inline for performance if icons aren't provided via library)
  // Assuming standard icons or library usage in your project context.

  let { data } = $props();

  // State
  let showSaleInterface = $state(false);
  let currentQuantity = $state(data.alld?.quant || 0);

  // Form state
  let showPurchaseForm = $state(false);
  let quantity = $state(1);
  let price = $state(data.alld?.price || 0);
  let startDate = $state(new Date().toISOString().split('T')[0]);
  let endDate = $state('');
  let isSubmitting = $state(false);
  let totalPrice = $state(0);

  // Derived: does the user already have a pending request for this product?
  const hasPendingRequest = $derived((data.existingRequests ?? []).length > 0);
  const firstPendingId = $derived((data.existingRequests ?? [])[0]?.id ?? null);

  // Translations
  // --- Logic Functions ---

  function project(x, e) {
    e?.preventDefault?.();
    goto('/project/' + x);
  }

  function openPurchaseForm(e) {
    e?.preventDefault?.();
    showPurchaseForm = true;
  }

  function closePurchaseForm() {
    showPurchaseForm = false;
  }

  async function handleBuyNow(e) {
    e?.preventDefault();

    try {
      isSubmitting = true;
      const userId = data.uid;
      if (!userId) {
        login();
        return;
      }

      if (currentQuantity !== -1 && quantity > currentQuantity) {
        toast.error(`${$t('pages.gift.cantOrderMore')}${currentQuantity}`);
        isSubmitting = false;
        return;
      }

      let finishDate = endDate ? new Date(endDate).toISOString() : null;

      const response = await fetch('/api/action', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actionKey: 'createSheirutpend',
          params: {
            project: data.alld.projectcreates.data[0].id,
            userId: userId,
            matanots: [data.mId],
            startDate: new Date(startDate).toISOString(),
            finnishDate: finishDate,
            price: price,
            quant: quantity,
            total: totalPrice
          }
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create service request');
      }

      showPurchaseForm = false;
      isSubmitting = false;
      toast.success($t('pages.gift.saleSuccess'));

      // Redirect to the pending request page (or /deals as fallback)
      const newId = result?.data?.createSheirutpend?.data?.id;
      await goto(newId ? `/deals/request/${newId}` : '/deals');
    } catch (error) {
      console.error('Error creating service request:', error);
      toast.error($t('pages.gift.saleError'));
      isSubmitting = false;
    }
  }

  function toggleSaleInterface() {
    showSaleInterface = !showSaleInterface;
  }

  function handleSaleSuccess(saleResult) {
    if (saleResult.un !== undefined) currentQuantity = saleResult.un;
    toast.success($t('pages.gift.saleSuccess'));
    showSaleInterface = false;
  }

  function handleSaleError(error) {
    console.error('Sale error:', error);
    toast.error(error || $t('pages.gift.saleError'));
  }

  function login(e) {
    e?.preventDefault?.();
    goto(`/login?from=gift/${data.mId}`);
  }

  function register(e) {
    e?.preventDefault?.();
    goto(`/hascama?from=gift/${data.mId}`);
  }

  function isValidDate(d) {
    return d && new Date(d).getFullYear() > 1970;
  }

  const isComplexProduct = $derived(
    data.alld?.pricingMode && data.alld.pricingMode !== 'fixed'
  );
  const matanotForView = $derived(
    data.alld ? { id: data.mId, ...data.alld } : null
  );

  // Derived Values
  let title = data.alld?.name
    ? $t('pages.gift.titleWithName', { kind: $t('pages.gift.gift'), name: data.alld.name })
    : $t('pages.gift.gift');
  let image =
    data.alld?.pic?.data?.attributes?.url ||
    'https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png';
  let description = data.alld?.desc || $t('pages.gift.gift');
  let url = page.url.toString();

  // Effects
  $effect(() => {
    if (data.alld?.quant !== undefined) {
      currentQuantity = data.alld.quant;
    }
  });

  $effect(() => {
    const kindOf = data.alld?.kindOf;
    const unitPrice = Number(price) || 0;
    const qty = Number(quantity) || 0;
    let total = unitPrice * qty;

    if ((kindOf === 'monthly' || kindOf === 'yearly') && startDate) {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : null;

      if (end && !isNaN(start) && !isNaN(end) && end > start) {
        const days = Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (kindOf === 'monthly') total = (days / 30) * unitPrice * qty;
        else if (kindOf === 'yearly') total = (days / 365) * unitPrice * qty;
      }
    }
    totalPrice = Number.isFinite(total) ? total : 0;
  });
  $effect(() => {
    console.log(data?.alld);
  });
</script>

<Head {title} {description} {image} {url} />

{#if data.alld}
  <div
    dir={$isRtl ? 'rtl' : 'ltr'}
    class="container mx-auto px-4 py-6 max-w-4xl pb-24"
  >
    <!-- Discovery cross-links: back to the big picture (directories + map) -->
    <div class="mb-4 flex justify-center">
      <DiscoveryNav current="products" isLoggedIn={data.tok} />
    </div>
    <!-- Main Card -->
    <div
      class="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-700"
    >
      <!-- Header Gradient -->
      <div
        class="bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre p-4 sm:p-6 text-white"
      >
        <div
          class="flex flex-col sm:flex-row justify-between items-center gap-4"
        >
          <!-- Avatar & Title -->
          <div class="flex items-center gap-4 w-full">
            {#if data.personalSeller}
              <!-- Personal product (PLAN_USER_OFFERINGS M3): the seller is the
                   owning user, not the auto-created home rikma. -->
              {#if data.personalSeller.picUrl}
                <img
                  src={data.personalSeller.picUrl}
                  alt={data.personalSeller.username}
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/30 shadow-md object-cover flex-shrink-0"
                />
              {/if}
              <div class="flex flex-col">
                <span class="text-barbi font-bold text-lg sm:text-xl drop-shadow-sm"
                  >{$t('pages.gift.gift')}</span
                >
                <h1 class="text-xl sm:text-3xl font-extrabold text-white leading-tight">
                  {data.personalSeller.username}
                </h1>
                <span
                  class="mt-1 self-start text-xs font-bold bg-white/20 border border-white/40 rounded-full px-2.5 py-0.5"
                >
                  {$t('offerings.products.seller_badge')}
                </span>
              </div>
            {:else}
              {#if data.alld.projectcreates?.data?.[0]?.attributes?.profilePic?.data?.attributes?.url}
                <img
                  src={data.alld.projectcreates.data[0].attributes.profilePic.data
                    .attributes.url}
                  alt="Project Profile"
                  class="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white/30 shadow-md object-cover flex-shrink-0"
                />
              {/if}

              <div class="flex flex-col">
                <span
                  class="text-barbi font-bold text-lg sm:text-xl drop-shadow-sm"
                  >{$t('pages.gift.gift')}</span
                >
                <h1
                  class="text-xl sm:text-3xl font-extrabold text-white leading-tight"
                >
                  {data.alld.projectcreates?.data?.[0]?.attributes?.projectName}
                </h1>
              </div>
            {/if}
          </div>

          <!-- Seller / Project Button -->
          {#if data.personalSeller}
            <a
              href={`/user/${data.personalSeller.id}`}
              class="w-full sm:w-auto px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-full text-white font-bold transition-all transform hover:scale-105 shadow-sm whitespace-nowrap text-center"
            >
              {$t('offerings.products.seller_profile')}
            </a>
          {:else if data.alld.projectcreates?.data?.[0]?.id}
            <button
              onclick={(e) => project(data.alld.projectcreates.data[0].id, e)}
              class="w-full sm:w-auto px-6 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-full text-white font-bold transition-all transform hover:scale-105 shadow-sm whitespace-nowrap"
            >
              {$t('pages.gift.seeProject')}
            </button>
          {/if}
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex flex-col md:flex-row">
        <!-- Image Section -->
        {#if data.alld.pic?.data}
          <div class="md:w-2/5 h-64 md:h-auto bg-gray-100 relative">
            <img
              src={data.alld.pic.data.attributes.url}
              alt={data.alld.name}
              class="w-full h-full object-cover absolute inset-0"
            />
          </div>
        {/if}

        <!-- Text & Details Section -->
        <div class="p-6 md:w-3/5 flex flex-col justify-between">
          <div>
            <div class="flex justify-between items-start mb-4">
              <h2
                class="text-2xl sm:text-3xl font-bold text-barbi border-b-2 border-barbi/20 pb-2 inline-block"
              >
                {data.alld.name}
              </h2>
              <div class="scale-90 origin-top-right rtl:origin-top-left">
                <ShareLink
                  path={'/gift/' + data.mId}
                  title={data.alld.name}
                  desc={$t('ui.share.product')}
                  hashtags={['1lev1', 'gift']}
                  quote={data.alld.titleKey ? $t(data.alld.titleKey, data.alld.titleParams) : ''}
                />
              </div>
            </div>

            <div
              class="prose dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 mb-6"
            >
              {#if data.alld.desc}
                <RichText outpot={data.alld.desc} editable={false} />
              {/if}
            </div>

            <!-- Price Tag -->
            <div
              class="flex items-center gap-3 bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg w-fit mb-4"
            >
              <img
                class="w-8 h-8"
                src="https://res.cloudinary.com/love1/image/upload/v1653148344/Crashing-Money_n6qaqj.svg"
                alt="price"
              />
              <div class="flex flex-col leading-none">
                <span
                  class="text-xl font-bold text-gray-800 dark:text-gray-100"
                >
                  {#if data.alld.price != null}
                    {Number(data.alld.price).toLocaleString('en-US', {
                      maximumFractionDigits: 2
                    })}
                  {/if}
                  <span class="text-sm font-normal text-gray-500">
                    {#if data.alld.kindOf === 'monthly'}
                      {$t('pages.gift.monthly')}
                    {/if}
                    {#if data.alld.kindOf === 'yearly'}
                      {$t('pages.gift.yearly')}
                    {/if}
                    {#if data.alld.kindOf === 'total'}
                      {$t('pages.gift.perUnit')}
                    {/if}
                    {#if data.alld.kindOf === 'unlimited'}
                      {$t('pages.gift.unlimited')}
                    {/if}
                  </span>
                </span>
              </div>
            </div>

            <!-- Complex product BOM view -->
            {#if isComplexProduct && matanotForView}
              <div class="mb-4">
                <MatanotPublicView matanot={matanotForView} />
              </div>
              <div
                class="mb-6 flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-700/40 dark:bg-amber-900/20"
                dir={$isRtl ? 'rtl' : 'ltr'}
              >
                <span class="mt-0.5 shrink-0 text-amber-500">ℹ️</span>
                <div class="text-amber-800 dark:text-amber-300">
                  <span class="font-bold">{$t('pages.gift.complexPriceMaxLabel')}: </span>
                  {$t('pages.gift.complexPriceExplain')}
                </div>
              </div>
            {/if}

            <!-- Dates -->
            {#if isValidDate(data.alld.startDate) || isValidDate(data.alld.finnishDate)}
              <div
                class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mb-6"
              >
                <img
                  class="w-5 h-5 opacity-70"
                  src="https://res.cloudinary.com/love1/image/upload/v1699831987/FX13_calendar2_jlxcn1.svg"
                  alt="calendar"
                />
                {#if isValidDate(data.alld.startDate)}
                  <span
                    >{new Date(data.alld.startDate).toLocaleDateString(
                      $lang
                    )}</span
                  >
                {/if}
                {#if isValidDate(data.alld.finnishDate)}
                  <span>
                    - {new Date(data.alld.finnishDate).toLocaleDateString(
                      $lang
                    )}</span
                  >
                {/if}
              </div>
            {/if}
          </div>

          <!-- Actions Area -->
          <div class="mt-auto">
            {#if data.tok}
              {#if hasPendingRequest}
                <a
                  href={firstPendingId ? `/deals/request/${firstPendingId}` : '/deals'}
                  class="flex items-center gap-3 mb-4 px-4 py-3 rounded-lg border border-gold/40 bg-gold/10 text-sm font-semibold text-gold hover:bg-gold/20 transition-colors"
                >
                  <EntityIcon kind="waiting" size={17} />
                  <span>
                    {$lang === 'he'
                      ? 'כבר שלחת בקשת רכישה - לצפייה בבקשה'
                      : 'You already submitted a purchase request - view it'}
                  </span>
                  <span class="mr-auto rtl:ml-auto rtl:mr-0">←</span>
                </a>
              {/if}
              <div class="flex flex-wrap items-center gap-4">
                <button
                  class="flex-1 min-w-[140px] py-3 px-6 text-lg font-bold rounded-lg shadow-md transition-all
                  bg-gradient-to-r from-barbi to-mpink text-gold border-2 border-gold hover:brightness-110
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
                  disabled={data.alld.archived === true ||
                    (currentQuantity !== -1 && currentQuantity <= 0)}
                  onclick={openPurchaseForm}
                >
                  {#if data.alld.archived === true || (currentQuantity !== -1 && currentQuantity <= 0)}
                    {$t('pages.gift.notAvailable')}
                  {:else}
                    {$t('pages.gift.buyNow')}
                  {/if}
                </button>

                {#if currentQuantity != null}
                  <div
                    class="text-sm font-medium text-barbi bg-barbi/10 px-3 py-1 rounded-full"
                  >
                    {currentQuantity === -1
                      ? $t('pages.gift.unlimited')
                      : `${currentQuantity} ${$t('pages.gift.left')}`}
                  </div>
                {/if}
              </div>

              <!-- Admin/Member Section -->
              {#if data.isMember}
                <div
                  class="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700"
                >
                  <a
                    href={`/gift/${data.mId}/edit`}
                    class="text-sm font-semibold text-barbi underline mb-3 inline-block"
                  >
                    {$lang === 'he'
                      ? 'עריכת BOM / מוצר'
                      : 'Edit BOM / product'}
                  </a>
                  <button
                    class="text-sm font-semibold text-gray-500 hover:text-barbi flex items-center gap-2 transition-colors"
                    onclick={toggleSaleInterface}
                  >
                    <EntityIcon kind="settings" size={17} />
                    {showSaleInterface
                      ? $t('pages.gift.hideReport')
                      : $t('pages.gift.reportSale')}
                  </button>

                  {#if showSaleInterface}
                    <div
                      class="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-barbi/30 animate-fade-in"
                    >
                      <SaleComponent
                        productId={data.mId}
                        productName={data.alld.name}
                        availableQuantity={currentQuantity}
                        price={data.alld.price || 0}
                        kindOf={data.alld.kindOf || 'total'}
                        projectId={data.alld.projectcreates.data[0].id}
                        projectUsers={data.projectUsers}
                        onDone={handleSaleSuccess}
                        onError={handleSaleError}
                      />
                    </div>
                  {/if}
                </div>
              {/if}
            {:else}
              <!-- Not Logged In State -->
              <div
                class="mt-4 rounded-xl border border-barbi/20 bg-gradient-to-br from-white to-barbi/5 dark:from-gray-800 dark:to-barbi/10 p-5 text-center shadow-sm"
              >
                <div class="mb-1 flex justify-center text-barbi"><EntityIcon kind="cart" size={24} /></div>
                <h3 class="mb-1 text-base font-bold text-barbi">
                  {$t('pages.gift.inviteTitle')}
                </h3>
                <p
                  class="mb-4 text-sm leading-relaxed text-gray-500 dark:text-gray-400"
                >
                  {$t('pages.gift.inviteSubtitle')}
                </p>

                <div
                  class="mb-4 rounded-lg bg-barbi/10 px-4 py-2 text-xl font-bold text-barbi"
                >
                  {data.alld.price}
                  {data.alld.currency ?? ''}
                </div>

                <div class="flex items-center gap-2">
                  <button
                    class="flex-1 rounded-lg bg-gradient-to-r from-barbi to-mpink py-2.5 px-4 font-bold text-gold shadow-md transition-all hover:brightness-110"
                    onclick={register}
                  >
                    {$t('pages.gift.toRegister')}
                  </button>
                  <span class="text-xs text-gray-400">{$t('pages.gift.orText')}</span>
                  <button
                    class="flex-1 rounded-lg border border-barbi/40 py-2.5 px-4 font-bold text-barbi transition-all hover:bg-barbi/10"
                    onclick={login}
                  >
                    {$t('pages.gift.toLogin')}
                  </button>
                </div>
              </div>
            {/if}
          </div>
        </div>
      </div>
    </div>
  </div>
{:else if data.archived}
  <div class="flex justify-center items-center h-[50vh]">
    <div class="text-2xl font-bold text-gray-400">{$t('pages.gift.notAvailable')}</div>
  </div>
{:else}
  <div
    class="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50"
  >
    <RingLoader size="120" color="#ff00ae" unit="px" duration="2s" />
  </div>
{/if}

<!-- Purchase Modal -->
{#if showPurchaseForm}
  <div
    class="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in"
    onclick={closePurchaseForm}
    aria-hidden="true"
  >
    <div
      class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-y-auto max-h-[80vh] d relative"
      onclick={(e) => e.stopPropagation()}
      aria-hidden="true"
    >
      <!-- Modal Header -->
      <div
        class="bg-gradient-to-r from-barbi to-mpink p-4 flex justify-between items-center text-white"
      >
        <h3 class="text-xl font-bold">{$t('pages.gift.purchaseDetails')}</h3>
        <button
          onclick={closePurchaseForm}
          class="text-white/80 hover:text-white text-2xl leading-none"
          >&times;</button
        >
      </div>

      <div class="p-6">
        <!-- Live Total Preview -->
        <div
          class="mb-6 text-center bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg border border-gray-100 dark:border-gray-600"
        >
          <span class="text-sm text-gray-500 block mb-1"
            >{$t('pages.gift.totalEst')}</span
          >
          <span class="text-3xl font-bold text-barbi"
            >{totalPrice.toFixed(2)}</span
          >
        </div>

        <form onsubmit={handleBuyNow} class="space-y-5">
          <div>
            <NumberInput
              bind:value={quantity}
              topLebel={$t('pages.gift.amount')}
              barbi={true}
              noNegative={true}
              noMoreThen={currentQuantity === -1 ? undefined : currentQuantity}
            />
          </div>

          <div>
            <NumberInput
              bind:value={price}
              topLebel={$t('pages.gift.unitPrice')}
              barbi={true}
              noNegative={true}
            />
          </div>
          {#if data.alld.kindOf === 'monthly' || data.alld.kindOf === 'yearly'}
            <div class="grid grid-cols-1 gap-4">
              <div>
                <label
                  for="startDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {$t('pages.gift.startD')}
                </label>
                <input
                  id="startDate"
                  type="date"
                  bind:value={startDate}
                  min={new Date().toISOString().split('T')[0]}
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbi focus:border-barbi outline-none dark:bg-gray-700 dark:border-gray-600 transition-all"
                  required
                />
              </div>

              <div>
                <label
                  for="endDate"
                  class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  {$t('pages.gift.endD')}
                </label>
                <input
                  id="endDate"
                  type="date"
                  bind:value={endDate}
                  min={startDate}
                  class="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-barbi focus:border-barbi outline-none dark:bg-gray-700 dark:border-gray-600 transition-all"
                />
              </div>
            </div>
          {/if}
          <div
            class="flex items-center gap-3 pt-4 mt-2 border-t dark:border-gray-700"
          >
            <button
              type="button"
              onclick={closePurchaseForm}
              class="flex-1 py-2.5 px-4 text-sm font-bold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={isSubmitting}
            >
              {$t('pages.gift.cancel')}
            </button>
            <button
              type="submit"
              class="flex-1 py-2.5 px-4 text-sm font-bold text-white bg-gradient-to-r from-barbi to-mpink rounded-lg shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:transform-none"
              disabled={isSubmitting}
            >
              {isSubmitting ? $t('pages.gift.submitting') : $t('pages.gift.confirm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
{/if}

<style>
  /* Optional: Add custom animation if not present in global css */
  .animate-fade-in {
    animation: fadeIn 0.2s ease-out;
  }
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: scale(0.98);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
</style>
