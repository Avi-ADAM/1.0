<script>
  /**
   * "Dana proposed: every paid delivery order opens a Shipping task for you" —
   * a rule of the rikma's order automation that would land work on me and
   * waits for my answer (docs/inprogress/PLAN_SHOP_OPERATIONS.md §2.3, A2).
   *
   * Two answers, never a bare no: "I agree", or change the rule — a
   * counter-proposal that asks again and restarts the clock. Silence by the
   * deadline is my yes, and the card says so; without a deadline (the rule's
   * Decision is not deployed yet) nothing opens for me until I agree.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { resolve } from '$app/paths';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { formatWhen } from '$lib/time/formatWhen';
  import { clock } from '$lib/stores/clock.svelte';
  import { forgetFulfillRule } from '$lib/utils/levFulfill';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  let busy = $state(false);
  const loc = $derived($locale || 'he');
  const when = $derived(buble.ruleWhen ?? {});
  const stock = $derived(when.event === 'stock.low');
  const deadline = $derived(buble.deadline ? formatWhen(buble.deadline, clock.minutes, loc) : null);

  const target = $derived(
    buble.target === 'role'
      ? $t('lev.fulfillRule.target.role', { role: buble.roleName || '—' })
      : buble.target === 'mission'
        ? $t('lev.fulfillRule.target.mission', { mission: buble.missionName || '—' })
        : $t('lev.fulfillRule.target.member')
  );

  /** Everything the rule does, one line each — what I am agreeing to. */
  const terms = $derived.by(() => {
    /** @type {string[]} */
    const out = [];
    if (stock) out.push($t('lev.fulfillRule.when.stockLow'));
    else {
      const prefs = when.deliveryPreference ?? [];
      out.push(prefs.length === 1 ? $t(`lev.fulfillRule.when.${prefs[0]}`) : $t('lev.fulfillRule.when.any'));
      if (when.after?.length) out.push($t('lev.fulfillRule.after'));
      if (when.categories?.length || when.shippingZones?.length || when.shippingMethods?.length || when.pickupPoints?.length) {
        out.push($t('lev.fulfillRule.narrowed'));
      }
    }
    out.push(target);
    if (buble.per === 'line') out.push($t('lev.fulfillRule.per.line'));
    if (buble.per === 'unit') out.push($t('lev.fulfillRule.per.unit'));
    if (buble.batching === 'wave' && buble.waveAt) out.push($t('lev.fulfillRule.wave', { time: buble.waveAt }));
    if (buble.dueHours != null) out.push($t('lev.fulfillRule.due', { hours: buble.dueHours }));
    if (buble.routing === 'roundRobin' || buble.routing === 'leastOpen') out.push($t(`lev.fulfillRule.routing.${buble.routing}`));
    if (buble.effect === 'markShipped' || buble.effect === 'markFulfilled') out.push($t(`lev.fulfillRule.effect.${buble.effect}`));
    return out;
  });

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  async function agree() {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('respondFulfillmentStep', { projectId: String(buble.projectId), stepId: String(buble.stepId) });
      if (res?.success === false) throw new Error(actionErrorText(res, $t('lev.fulfillRule.error')));
      toast.success(res?.data?.consentState === 'proposed' ? $t('lev.fulfillRule.agreedWaiting') : $t('lev.fulfillRule.agreed'));
      forgetFulfillRule(buble.stepId);
      onDone?.({ coinlapach: buble.coinlapach });
    } catch (e) {
      toast.error(e instanceof Error && e.message ? e.message : $t('lev.fulfillRule.error'));
    } finally {
      busy = false;
    }
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
    cardType={$t('lev.fulfillRule.type')}
    cardTitle={buble.name}
    glowColor="orange"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 text-gray-900 dark:bg-slate-800 dark:text-gray-100">
    <p class="font-semibold">
      {buble.proposedByName
        ? $t('lev.fulfillRule.proposedBy', { name: buble.proposedByName })
        : $t('lev.fulfillRule.proposed')}
    </p>

    <ul class="flex flex-col gap-1 rounded-lg bg-gray-50 p-3 text-sm dark:bg-slate-900/60">
      {#each terms as line, i (i)}
        <li><bdi>{line}</bdi></li>
      {/each}
    </ul>

    <p class="rounded-lg bg-amber-100 p-2 text-sm text-amber-900">
      {deadline ? $t('lev.fulfillRule.silence', { when: deadline.short }) : $t('lev.fulfillRule.noClock')}
    </p>

    <div class="mt-auto flex flex-col gap-2">
      <button
        type="button"
        class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
        disabled={busy}
        onclick={agree}>{$t('lev.fulfillRule.agree')}</button
      >
      <a
        class="rounded-xl border border-gray-300 py-2 text-center text-sm font-semibold dark:border-gray-600"
        href={resolve(`/moach/${buble.projectId}/sales/manage/fulfillment?step=${buble.stepId}`)}>{$t('lev.fulfillRule.counter')}</a
      >
      <p class="text-center text-xs text-gray-600 dark:text-gray-300">{$t('lev.fulfillRule.noReject')}</p>
    </div>
  </div>
</div>
