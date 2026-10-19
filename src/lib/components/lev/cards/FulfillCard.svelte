<script>
  /**
   * "Shipping · order K7Q4XM · Herzl 1, Netanya · by tomorrow 12:00" — an act
   * the rikma's agreed automation opened for an order
   * (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.2).
   *
   * The primary button is the step's effect: "Shipped ✓" *is* the order's
   * status change, through completeFulfillmentAct → updateTask + markOrderShipped.
   * An act still open to a role shows "I'll take it" first; finishing it takes
   * it too. Hours are not logged here — they come from the mission's own timer
   * and are approved as always (principle 2).
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { formatWhen } from '$lib/time/formatWhen';
  import { clock } from '$lib/stores/clock.svelte';
  import { whatsappHref } from '$lib/shop/manage';
  import { forgetFulfillAct } from '$lib/utils/levFulfill';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  let busy = $state(false);
  const loc = $derived($locale || 'he');
  const due = $derived(buble.dueAt ? formatWhen(buble.dueAt, clock.minutes, loc) : null);
  const late = $derived(!!buble.dueAt && Date.parse(buble.dueAt) < clock.minutes);
  const doneLabel = $derived(
    buble.effect === 'markShipped'
      ? $t('lev.fulfill.doneShipped')
      : buble.effect === 'markFulfilled'
        ? $t('lev.fulfill.doneFulfilled')
        : $t('lev.fulfill.done')
  );
  const prefLabel = $derived(buble.deliveryPreference ? $t(`lev.fulfill.pref.${buble.deliveryPreference}`) : '');
  const wa = $derived(whatsappHref(buble.buyerPhone, $t('lev.fulfill.waText', { order: buble.orderNumber })));
  const orderHref = $derived(
    buble.orderId ? `/moach/${buble.projectId}/sales/manage/orders/${buble.orderId}` : `/moach/${buble.projectId}/sales/manage`
  );

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  function dropCard() {
    forgetFulfillAct(buble.actId);
    onDone?.({ coinlapach: buble.coinlapach });
  }

  async function run(key) {
    if (busy) return null;
    busy = true;
    try {
      const res = await executeAction(key, { projectId: String(buble.projectId), actId: String(buble.actId) });
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
    const data = await run('takeFulfillmentAct');
    if (!data) return;
    toast.success($t('lev.fulfill.taken'));
    buble = { ...buble, mine: true };
  }

  async function complete() {
    const data = await run('completeFulfillmentAct');
    if (!data) return;
    // The act is done either way; a refused status change (the order moved on
    // meanwhile) is worth saying, not worth keeping the card for.
    if (data.effect && data.effect.ok === false) toast.warning($t('lev.fulfill.effectFailed'));
    else toast.success($t('lev.fulfill.doneToast'));
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
    cardType={$t('lev.fulfill.type')}
    cardTitle={buble.stepName || buble.name}
    glowColor="orange"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 text-gray-900 dark:bg-slate-800 dark:text-gray-100">
    <p class="font-semibold">
      {$t('lev.fulfill.order', { order: buble.orderNumber })}
      {#if prefLabel}<span class="text-sm font-normal text-gray-600 dark:text-gray-300"> · {prefLabel}</span>{/if}
    </p>

    {#if due}
      <p class="text-sm {late ? 'font-semibold text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}">
        {late ? $t('lev.fulfill.late', { when: due.short }) : $t('lev.fulfill.due', { when: due.short })}
      </p>
    {/if}

    {#if buble.items?.length}
      <ul class="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900/60">
        {#each buble.items as item, i (i)}
          <li><bdi>{item}</bdi></li>
        {/each}
      </ul>
    {/if}

    {#if buble.buyerName || buble.address}
      <div class="text-sm">
        {#if buble.buyerName}<p class="font-medium"><bdi>{buble.buyerName}</bdi></p>{/if}
        {#if buble.address}<p class="text-gray-700 dark:text-gray-300"><bdi>{buble.address}</bdi></p>{/if}
      </div>
    {/if}

    {#if buble.buyerPhone}
      <div class="flex gap-2">
        <a class="flex-1 rounded-xl border border-gray-300 py-2 text-center text-sm dark:border-gray-600" href="tel:{buble.buyerPhone}">
          {$t('lev.fulfill.call')}
        </a>
        {#if wa}
          <a class="flex-1 rounded-xl border border-gray-300 py-2 text-center text-sm dark:border-gray-600" href={wa} target="_blank" rel="noopener noreferrer">
            {$t('lev.fulfill.whatsapp')}
          </a>
        {/if}
      </div>
    {/if}

    {#if !buble.mine}
      <p class="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">
        {$t('lev.fulfill.openToRole', { role: buble.roleName || $t('lev.fulfill.yourRole') })}
      </p>
    {:else if buble.missionName}
      <p class="text-xs text-gray-500 dark:text-gray-400">{$t('lev.fulfill.inMission', { mission: buble.missionName })}</p>
    {/if}

    <div class="mt-auto flex flex-col gap-2">
      {#if !buble.mine}
        <button
          type="button"
          class="rounded-xl border border-gray-300 py-2 text-sm font-semibold dark:border-gray-600 disabled:opacity-60"
          disabled={busy}
          onclick={take}>{$t('lev.fulfill.take')}</button
        >
      {/if}
      <button
        type="button"
        class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onclick={complete}>{doneLabel}</button
      >
      <a class="text-center text-xs text-gray-600 underline dark:text-gray-300" href={orderHref}>{$t('lev.fulfill.openOrder')}</a>
    </div>
  </div>
</div>
