<script lang="ts">
  /**
   * My coming places in this cycle, and a way to offer each one to another
   * member of the mission (docs/PLAN_SHIFTS.md §1.2). "I can't make it" is a
   * release (on the heart); "can you take it — maybe for one of yours?" is a
   * swap, and it lives here, next to the roster it changes.
   *
   * Offers I made and that still wait are listed with a withdraw button: an
   * offer is mine to take back, never someone else's to refuse.
   */
  import { invalidateAll } from '$app/navigation';
  import { t, locale } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { describeShiftError } from '$lib/shifts/errors';
  import { dayLabel, localDateKey, timeRange } from '$lib/shifts/format';
  import type { AssignmentLike } from '$lib/shifts/types';

  interface Shift {
    id: string;
    start: string;
    end: string;
  }
  interface OpenSwap {
    id: string;
    giveId: string | null;
    takeId: string | null;
    fromUserId: string;
    toUserId: string;
  }

  interface Props {
    shifts: Shift[];
    assignments: AssignmentLike[];
    /** Members on the mission (from its commitments). */
    members: string[];
    names: Record<string, string>;
    uid: string;
    timeZone: string;
    now: string;
    swaps: OpenSwap[];
  }

  let { shifts, assignments, members, names, uid, timeZone, now, swaps }: Props = $props();

  const loc = $derived($locale || 'he');
  const shiftOf = (a: AssignmentLike) => shifts.find((s) => s.id === a.shiftId) ?? null;
  const coming = (a: AssignmentLike) =>
    a.rank === 1 && (a.state === 'draft' || a.state === 'confirmed') && !!shiftOf(a) && shiftOf(a)!.start > now;
  const placesOf = (userId: string) =>
    assignments
      .filter((a) => a.userId === userId && coming(a))
      .sort((a, b) => shiftOf(a)!.start.localeCompare(shiftOf(b)!.start));

  const mine = $derived(placesOf(uid));
  const others = $derived(members.filter((m) => m !== uid));
  const offered = $derived(new Map(swaps.filter((s) => s.fromUserId === uid).map((s) => [s.giveId, s])));

  let openFor = $state<string | null>(null);
  let toUser = $state('');
  let takeId = $state('');
  let busy = $state(false);

  const when = (a: AssignmentLike | null | undefined) => {
    const s = a ? shiftOf(a) : null;
    return s ? `${dayLabel(localDateKey(s.start, timeZone), loc)} · ${timeRange(s.start, s.end, timeZone, loc)}` : '';
  };
  const nameOf = (id: string) => names[id] || `#${id}`;
  const theirPlaces = $derived(toUser ? placesOf(toUser) : []);

  async function propose(giveId: string) {
    if (busy || !toUser) return;
    busy = true;
    try {
      const res = await executeAction('proposeShiftSwap', {
        giveAssignmentId: giveId,
        toUserId: toUser,
        ...(takeId ? { takeAssignmentId: takeId } : {})
      });
      if (res?.success === false) throw new Error(describeShiftError(actionErrorText(res, ''), $t, $t('shifts.cards.error')));
      toast.success(res?.data?.silence ? $t('shifts.swap.sentSilence') : $t('shifts.swap.sent'));
      openFor = null;
      await invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }

  async function withdraw(swapId: string) {
    if (busy) return;
    busy = true;
    try {
      const res = await executeAction('decideShiftSwap', { decisionId: swapId, answer: 'withdraw' });
      if (res?.success === false) throw new Error(describeShiftError(actionErrorText(res, ''), $t, $t('shifts.cards.error')));
      toast.success($t('shifts.swap.withdrawn'));
      await invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }
</script>

{#if mine.length}
  <section class="mt-4 rounded-xl border border-surfaceLine bg-surface2 p-3" aria-labelledby="swap-panel-title">
    <h2 id="swap-panel-title" class="font-bold">{$t('shifts.swap.panelTitle')}</h2>
    <p class="text-xs text-surfaceMuted">{$t('shifts.swap.panelHint')}</p>
    <ul class="mt-2 flex flex-col gap-2">
      {#each mine as a (a.id)}
        {@const offer = offered.get(a.id ?? null)}
        <li class="rounded-lg border border-surfaceLine p-2">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-semibold" dir="auto">{when(a)}</span>
            {#if offer}
              <span class="flex items-center gap-2 text-xs">
                {$t('shifts.swap.waitingOn', { name: nameOf(offer.toUserId) })}
                <button type="button" class="underline disabled:opacity-60" disabled={busy} onclick={() => withdraw(offer.id)}
                  >{$t('shifts.swap.withdraw')}</button
                >
              </span>
            {:else if openFor !== a.id && others.length}
              <button
                type="button"
                class="rounded-lg border border-surfaceLine px-3 py-1 text-xs"
                onclick={() => {
                  openFor = a.id ?? null;
                  toUser = '';
                  takeId = '';
                }}>{$t('shifts.swap.offer')}</button
              >
            {/if}
          </div>
          {#if openFor === a.id && !offer}
            <div class="mt-2 flex flex-col gap-2 text-sm">
              <label class="flex flex-col gap-1">
                <span>{$t('shifts.swap.toWhom')}</span>
                <select class="rounded-lg border border-surfaceLine bg-surface px-2 py-1" bind:value={toUser} onchange={() => (takeId = '')}>
                  <option value="" disabled>—</option>
                  {#each others as m (m)}
                    <option value={m}>{nameOf(m)}</option>
                  {/each}
                </select>
              </label>
              {#if toUser}
                <label class="flex flex-col gap-1">
                  <span>{$t('shifts.swap.inExchange')}</span>
                  <select class="rounded-lg border border-surfaceLine bg-surface px-2 py-1" bind:value={takeId}>
                    <option value="">{$t('shifts.swap.nothing')}</option>
                    {#each theirPlaces as p (p.id)}
                      <option value={p.id}>{when(p)}</option>
                    {/each}
                  </select>
                </label>
              {/if}
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-lg bg-gradient-to-r from-barbi to-mpink px-3 py-1 font-semibold text-white disabled:opacity-60"
                  disabled={busy || !toUser}
                  onclick={() => propose(a.id!)}>{$t('shifts.swap.send')}</button
                >
                <button type="button" class="px-3 py-1 underline" onclick={() => (openFor = null)}>{$t('shifts.swap.cancel')}</button>
              </div>
            </div>
          {/if}
        </li>
      {/each}
    </ul>
  </section>
{/if}
