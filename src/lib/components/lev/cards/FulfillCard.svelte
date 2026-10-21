<script>
  /**
   * "Shipping · order K7Q4XM · Herzl 1, Netanya · by tomorrow 12:00" — an act
   * the rikma's agreed automation opened (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.2).
   *
   * The primary button is the step's effect: "Shipped ✓" *is* the order's
   * status change, through completeFulfillmentAct → updateTask + markOrderShipped.
   * An act still open to a role (or to everyone) shows "I'll take it" first;
   * finishing it takes it too. Hours are not logged here — they come from the
   * mission's own timer and are approved as always (principle 2).
   *
   * Three shapes of the same card (A2–A3):
   *   - a wave: every order of one step due at the same cut-off — one list,
   *     one "all done" (completeFulfillmentWave), each order still gets its
   *     effect and its chain;
   *   - a purchase: a resource ran low — the shelf as it is now, and "I bought
   *     some" right here (receiveStock), which also closes the act;
   *   - an order: as in A1, plus "pass to someone else" — never declined into
   *     the void (handOffFulfillmentAct).
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { formatWhen } from '$lib/time/formatWhen';
  import { clock } from '$lib/stores/clock.svelte';
  import { dayLabel } from '$lib/shifts/format';
  import { whatsappHref } from '$lib/shop/manage';
  import { forgetFulfillActs } from '$lib/utils/levFulfill';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  let busy = $state(false);
  let takenHere = $state(false);
  let receiving = $state(false);
  let qty = $state(/** @type {number | null} */ (null));
  let price = $state(/** @type {number | null} */ (null));

  const loc = $derived($locale || 'he');
  const mine = $derived(buble.mine || takenHere);
  const wave = $derived(buble.wave ?? null);
  const isStock = $derived(buble.kind === 'stock');
  const due = $derived(buble.dueAt ? formatWhen(buble.dueAt, clock.minutes, loc) : null);
  const late = $derived(!!buble.dueAt && Date.parse(buble.dueAt) < clock.minutes);
  const dispatchDay = $derived(buble.dispatchOn && /^\d{4}-\d{2}-\d{2}$/.test(buble.dispatchOn) ? dayLabel(buble.dispatchOn, loc) : null);
  const doneLabel = $derived(
    wave
      ? buble.effect === 'markShipped'
        ? $t('lev.fulfill.waveShipped', { count: wave.actIds.length })
        : buble.effect === 'markFulfilled'
          ? $t('lev.fulfill.waveFulfilled', { count: wave.actIds.length })
          : $t('lev.fulfill.waveDone', { count: wave.actIds.length })
      : buble.effect === 'markShipped'
        ? $t('lev.fulfill.doneShipped')
        : buble.effect === 'markFulfilled'
          ? $t('lev.fulfill.doneFulfilled')
          : $t('lev.fulfill.done')
  );
  const prefLabel = $derived(buble.deliveryPreference ? $t(`lev.fulfill.pref.${buble.deliveryPreference}`) : '');
  const wa = $derived(whatsappHref(buble.buyerPhone, $t('lev.fulfill.waText', { order: buble.orderNumber })));
  const stock = $derived(buble.stock ?? null);
  const fmt = (/** @type {number} */ n) => new Intl.NumberFormat(loc, { maximumFractionDigits: 3 }).format(n);

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  function dropCard() {
    forgetFulfillActs(wave ? wave.actIds : [buble.actId]);
    onDone?.({ coinlapach: buble.coinlapach });
  }

  /**
   * @param {Parameters<typeof executeAction>[0]} key
   * @param {Record<string, unknown>} [extra]
   */
  async function run(key, extra = {}) {
    if (busy) return null;
    busy = true;
    try {
      const res = await executeAction(key, { projectId: String(buble.projectId), ...extra });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('lev.fulfill.error')));
      return res?.data ?? {};
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('lev.fulfill.error'));
      return null;
    } finally {
      busy = false;
    }
  }

  async function take() {
    const data = await run('takeFulfillmentAct', { actId: String(buble.actId) });
    if (!data) return;
    toast.success($t('lev.fulfill.taken'));
    takenHere = true;
  }

  async function complete() {
    if (wave) {
      const data = await run('completeFulfillmentWave', { actIds: wave.actIds.map(String) });
      if (!data) return;
      const failed = (data.results ?? []).filter((/** @type {any} */ r) => !r.done).length;
      if (failed) toast.warning($t('lev.fulfill.wavePartial', { done: data.done ?? 0, failed }));
      else toast.success($t('lev.fulfill.waveToast', { count: data.done ?? wave.actIds.length }));
      dropCard();
      return;
    }
    const data = await run('completeFulfillmentAct', { actId: String(buble.actId) });
    if (!data) return;
    // The act is done either way; a refused status change (the order moved on
    // meanwhile) is worth saying, not worth keeping the card for.
    if (data.effect && data.effect.ok === false) toast.warning($t('lev.fulfill.effectFailed'));
    else toast.success($t('lev.fulfill.doneToast'));
    dropCard();
  }

  async function handOff() {
    const data = await run('handOffFulfillmentAct', { actId: String(buble.actId) });
    if (!data) return;
    // The server words the link (role, the act it came from); the path is ours.
    const query = typeof data.openMissionHref === 'string' ? (data.openMissionHref.split('?')[1] ?? '') : '';
    toast.success(
      data.to
        ? $t('lev.fulfill.handedTo')
        : data.suggestOpenMission
          ? $t('lev.fulfill.handedNobody')
          : data.openTo === 'all'
            ? $t('lev.fulfill.handedAll')
            : $t('lev.fulfill.handedRole'),
      // Nobody else holds the role: the way out is one tap away.
      data.suggestOpenMission && query
        ? {
            action: { label: $t('lev.fulfill.openMission'), onClick: () => goto(resolve(`/moach/${buble.projectId}/create?${query}`)) },
            duration: 10000
          }
        : undefined
    );
    dropCard();
  }

  function openReceive() {
    receiving = true;
    qty = null;
    price = stock?.pricePerUnit ?? null;
  }

  /** @param {SubmitEvent} e */
  async function receive(e) {
    e.preventDefault();
    const q = Number(qty);
    if (!(q > 0)) return;
    const data = await run('receiveStock', {
      resourceId: String(buble.resourceId),
      quantity: q,
      ...(price != null && String(price) !== '' ? { unitPrice: Number(price) } : {}),
      actId: String(buble.actId)
    });
    if (!data) return;
    const when = data.deadline ? formatWhen(data.deadline, clock.minutes, loc) : null;
    toast.success(
      data.settled
        ? $t('lev.fulfill.receivedSettled')
        : data.waitingForGiver
          ? $t('lev.fulfill.receivedGiver')
          : $t('lev.fulfill.receivedWaiting', { when: when?.short ?? '' })
    );
    if (data.act && data.act.done === false) toast.warning($t('lev.fulfill.receivedActOpen'));
    dropCard();
  }
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="{isMobileOrTablet() ? 'w-full h-full' : 'w-[90%] h-[90%]'} lg:w-[90%] {isFirst
    ? $isRtl
      ? 'boxleft'
      : 'boxright'
    : ''} flex flex-col bg-white dark:bg-gray-800 rounded-2xl overflow-hidden {isFirst
    ? 'shadow-glow border-glow'
    : 'shadow-lg border border-gray-100 dark:border-gray-700'} transition-all duration-300 relative"
  style:--glow-rgb="249, 115, 22"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={isStock ? $t('lev.fulfill.typeStock') : $t('lev.fulfill.type')}
    cardTitle={buble.stepName || buble.name}
    glowColor="orange"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 text-gray-900 dark:bg-slate-800 dark:text-gray-100">
    {#if wave}
      <p class="font-semibold">
        {$t('lev.fulfill.wave', { count: wave.actIds.length })}
        {#if wave.itemCount}<span class="text-sm font-normal text-gray-600 dark:text-gray-300"> · {$t('lev.fulfill.waveItems', { count: wave.itemCount })}</span>{/if}
      </p>
    {:else if isStock}
      <p class="font-semibold"><bdi>{stock?.name ?? buble.name}</bdi></p>
      {#if stock}
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {$t('lev.fulfill.onHand', { count: fmt(stock.onHand) })}
          {#if stock.lowStockAt != null} · {$t('lev.fulfill.lowAt', { count: fmt(stock.lowStockAt) })}{/if}
        </p>
      {/if}
    {:else}
      <p class="font-semibold">
        {$t('lev.fulfill.order', { order: buble.orderNumber })}
        {#if prefLabel}<span class="text-sm font-normal text-gray-600 dark:text-gray-300"> · {prefLabel}</span>{/if}
      </p>
    {/if}

    {#if due}
      <p class="text-sm {late ? 'font-semibold text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}">
        {late ? $t('lev.fulfill.late', { when: due.short }) : $t('lev.fulfill.due', { when: due.short })}
      </p>
    {/if}
    {#if dispatchDay && !wave}
      <p class="text-sm text-gray-700 dark:text-gray-300">{$t('lev.fulfill.dispatchOn', { day: dispatchDay })}</p>
    {/if}

    {#if wave}
      <ul class="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900/60">
        {#each wave.orders as o (o.actId)}
          <li>
            <span class="font-medium">{$t('lev.fulfill.order', { order: o.orderNumber })}</span>
            {#if o.items?.length}<span class="text-gray-700 dark:text-gray-300"> · <bdi>{o.items.join(', ')}</bdi></span>{/if}
          </li>
        {/each}
      </ul>
    {:else if buble.items?.length && !isStock}
      <ul class="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900/60">
        {#each buble.items as item, i (i)}
          <li><bdi>{item}</bdi></li>
        {/each}
      </ul>
    {/if}

    {#if !wave && !isStock && (buble.buyerName || buble.address)}
      <div class="text-sm">
        {#if buble.buyerName}<p class="font-medium"><bdi>{buble.buyerName}</bdi></p>{/if}
        {#if buble.address}<p class="text-gray-700 dark:text-gray-300"><bdi>{buble.address}</bdi></p>{/if}
      </div>
    {/if}

    {#if !wave && !isStock && buble.buyerPhone}
      <div class="flex gap-2">
        <a class="flex-1 rounded-xl border border-gray-300 py-2 text-center text-sm dark:border-gray-600" href="tel:{buble.buyerPhone}">
          {$t('lev.fulfill.call')}
        </a>
        {#if wa}
          <a class="flex-1 rounded-xl border border-gray-300 py-2 text-center text-sm dark:border-gray-600" href={wa} target="_blank" rel="external noopener noreferrer">
            {$t('lev.fulfill.whatsapp')}
          </a>
        {/if}
      </div>
    {/if}

    {#if !mine}
      <p class="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">
        {buble.openToAll
          ? $t('lev.fulfill.openToAll')
          : $t('lev.fulfill.openToRole', { role: buble.roleName || $t('lev.fulfill.yourRole') })}
      </p>
    {:else if buble.missionName}
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.fulfill.inMission', { mission: buble.missionName })}</p>
    {/if}

    {#if isStock && receiving}
      <form class="flex flex-col gap-2 rounded-lg border border-gray-200 p-3 dark:border-gray-600" onsubmit={receive}>
        <label class="flex flex-col gap-1 text-sm">
          {$t('lev.fulfill.receiveQty')}
          <input
            class="rounded-lg border border-gray-300 px-2 py-1 text-gray-900 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-100"
            type="number"
            min="0.001"
            step="any"
            inputmode="decimal"
            required
            bind:value={qty}
          />
        </label>
        <label class="flex flex-col gap-1 text-sm">
          {$t('lev.fulfill.receivePrice')}
          <input
            class="rounded-lg border border-gray-300 px-2 py-1 text-gray-900 dark:border-gray-600 dark:bg-slate-900 dark:text-gray-100"
            type="number"
            min="0"
            step="any"
            inputmode="decimal"
            bind:value={price}
          />
        </label>
        <p class="text-xs text-gray-600 dark:text-gray-300">{$t('lev.fulfill.receiveHint')}</p>
        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-xl bg-gradient-to-r from-barbi to-mpink py-2 font-semibold text-white disabled:opacity-60"
            disabled={busy || !(Number(qty) > 0)}>{$t('lev.fulfill.receiveSubmit')}</button
          >
          <button type="button" class="rounded-xl border border-gray-300 px-3 py-2 text-sm dark:border-gray-600" onclick={() => (receiving = false)}>
            {$t('lev.fulfill.cancel')}
          </button>
        </div>
      </form>
    {/if}

    <div class="mt-auto flex flex-col gap-2">
      {#if !mine && !wave}
        <button
          type="button"
          class="rounded-xl border border-gray-300 py-2 text-sm font-semibold dark:border-gray-600 disabled:opacity-60"
          disabled={busy}
          onclick={take}>{$t('lev.fulfill.take')}</button
        >
      {/if}
      {#if isStock}
        {#if !receiving}
          <button
            type="button"
            class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
            disabled={busy || !buble.resourceId}
            onclick={openReceive}>{$t('lev.fulfill.receive')}</button
          >
        {/if}
        <button
          type="button"
          class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600 disabled:opacity-60"
          disabled={busy}
          onclick={complete}>{$t('lev.fulfill.doneNoReceipt')}</button
        >
      {:else}
        <button
          type="button"
          class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
          disabled={busy}
          onclick={complete}>{doneLabel}</button
        >
      {/if}
      {#if mine && !wave}
        <button
          type="button"
          class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600 disabled:opacity-60"
          disabled={busy}
          onclick={handOff}>{$t('lev.fulfill.handOff')}</button
        >
      {/if}
      {#if isStock}
        <a class="text-center text-xs text-gray-600 underline dark:text-gray-300" href={resolve(`/moach/${buble.projectId}/sales/manage/stock`)}>
          {$t('lev.fulfill.openStock')}
        </a>
      {:else if !wave && buble.orderId}
        <a class="text-center text-xs text-gray-600 underline dark:text-gray-300" href={resolve(`/moach/${buble.projectId}/sales/manage/orders/${buble.orderId}`)}>
          {$t('lev.fulfill.openOrder')}
        </a>
      {:else}
        <a class="text-center text-xs text-gray-600 underline dark:text-gray-300" href={resolve(`/moach/${buble.projectId}/sales/manage`)}>
          {wave ? $t('lev.fulfill.openOrders') : $t('lev.fulfill.openOrder')}
        </a>
      {/if}
    </div>
  </div>
</div>
