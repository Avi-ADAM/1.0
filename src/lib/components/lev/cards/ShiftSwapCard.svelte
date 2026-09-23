<script>
  /**
   * A shift swap waiting on my answer (docs/PLAN_SHIFTS.md §1.2).
   *
   * Approve · counter · (my own offer:) withdraw. There is no "reject": a swap
   * nobody approves simply lapses at its deadline and the roster stays as it
   * was — unless I already declared I can make the shift I would receive, in
   * which case silence completes it. The card says which of the two applies.
   *
   * The terms are always "the proposer's place goes to the other member, and
   * optionally one of the other member's places comes back". A counter changes
   * only what comes back — including to nothing.
   */
  import { t, isRtl, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { isMobileOrTablet } from '$lib/utilities/device';
  import { dayLabel, localDateKey, moment, timeRange } from '$lib/shifts/format';
  import { shiftWorkStore } from '$lib/utils/levShifts';
  import CardHeader from './CardHeader.svelte';

  let { buble, isFirst = false, onProj, onDone } = $props();

  const tz = $derived(buble.timeZone || 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');
  // What reaches me and what leaves me, from where I stand.
  const incoming = $derived(buble.mine ? buble.take : buble.give);
  const outgoing = $derived(buble.mine ? buble.give : buble.take);

  let busy = $state(false);
  let countering = $state(false);
  let choice = $state('');

  /** @param {{ start: string, end: string } | null} p */
  const when = (p) => (p ? `${dayLabel(localDateKey(p.start, tz), loc)} · ${timeRange(p.start, p.end, tz, loc)}` : '');

  function handleProjectClick() {
    if (onProj && buble.projectId) onProj({ id: buble.projectId });
  }

  /** A refusal from the server arrives as `swap:<problem>`; anything else is shown as is. */
  function errorText(res) {
    const raw = actionErrorText(res, $t('shifts.cards.error'));
    const m = /swap:(\w+)/.exec(raw);
    return m ? $t(`shifts.swap.problem.${m[1]}`) || $t('shifts.cards.error') : raw;
  }

  function dropCard() {
    shiftWorkStore.update((w) => ({ ...w, swaps: w.swaps.filter((s) => s.decisionId !== buble.decisionId) }));
    onDone?.({ coinlapach: buble.coinlapach });
  }

  /** @param {'approve' | 'counter' | 'withdraw'} answer */
  async function decide(answer) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('decideShiftSwap', {
        decisionId: String(buble.decisionId),
        answer,
        ...(answer === 'counter' && choice ? { takeAssignmentId: choice } : {})
      });
      if (res?.success === false) throw new Error(errorText(res));
      const status = res?.data?.status;
      toast.success(
        answer === 'counter'
          ? $t('shifts.swap.countered')
          : answer === 'withdraw'
            ? $t('shifts.swap.withdrawn')
            : status === 'done'
              ? $t('shifts.swap.done')
              : $t('shifts.swap.lapsed')
      );
      dropCard();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
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
  style:--glow-rgb="20, 184, 166"
>
  <CardHeader
    logoSrc={buble.src}
    projectName={buble.projectName}
    cardType={$t('shifts.swap.type')}
    cardTitle={buble.planName}
    glowColor="teal"
    onProjectClick={handleProjectClick}
  />
  <div class="flex flex-1 flex-col gap-3 overflow-y-auto bg-white p-4 dark:bg-slate-800">
    <p class="text-sm text-gray-700 dark:text-gray-300">
      {buble.mine
        ? $t('shifts.swap.counteredBy', { name: buble.otherName || '—' })
        : $t('shifts.swap.offeredBy', { name: buble.otherName || '—' })}
    </p>

    <dl class="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
      <dt class="font-semibold">{$t('shifts.swap.youGet')}</dt>
      <dd><span dir="auto">{incoming ? when(incoming) : $t('shifts.swap.nothing')}</span></dd>
      <dt class="font-semibold">{$t('shifts.swap.youGive')}</dt>
      <dd><span dir="auto">{outgoing ? when(outgoing) : $t('shifts.swap.nothing')}</span></dd>
    </dl>

    {#if buble.deadline}
      <p class="text-xs text-gray-500 dark:text-gray-400">
        {buble.silence
          ? $t('shifts.swap.silenceCompletes', { date: moment(buble.deadline, tz, loc) })
          : $t('shifts.swap.silenceLapses', { date: moment(buble.deadline, tz, loc) })}
      </p>
    {/if}

    <button
      type="button"
      class="rounded-xl bg-gradient-to-r from-barbi to-mpink py-3 font-semibold text-white disabled:opacity-60"
      disabled={busy}
      onclick={() => decide('approve')}>{$t('shifts.swap.approve')}</button
    >

    {#if countering}
      <label class="flex flex-col gap-1 text-sm">
        <span>{buble.mine ? $t('shifts.swap.askInstead') : $t('shifts.swap.giveInstead')}</span>
        <select class="rounded-lg border border-gray-300 px-2 py-1 dark:border-gray-600 dark:bg-slate-700" bind:value={choice}>
          <option value="">{$t('shifts.swap.nothing')}</option>
          {#each buble.options as o (o.assignmentId)}
            <option value={o.assignmentId}>{when(o)}</option>
          {/each}
        </select>
      </label>
      <button
        type="button"
        class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600 disabled:opacity-60"
        disabled={busy || choice === (buble.take?.assignmentId ?? '')}
        onclick={() => decide('counter')}>{$t('shifts.swap.sendCounter')}</button
      >
    {:else}
      <button
        type="button"
        class="rounded-xl border border-gray-300 py-2 text-sm dark:border-gray-600"
        disabled={busy}
        onclick={() => {
          choice = buble.take?.assignmentId ?? '';
          countering = true;
        }}>{$t('shifts.swap.counter')}</button
      >
    {/if}

    {#if buble.mine}
      <button type="button" class="text-xs underline disabled:opacity-60" disabled={busy} onclick={() => decide('withdraw')}
        >{$t('shifts.swap.withdraw')}</button
      >
    {/if}

    <a href="/moach/{buble.projectId}/shifts" class="mt-auto text-center text-sm underline">{$t('shifts.cards.fullRoster')}</a>
  </div>
</div>
