<script lang="ts">
  /**
   * The rikma's shifts (docs/PLAN_SHIFTS.md §9.3): the roster of a cycle, and
   * the member's own availability for it. Replaces the old demo calendar.
   */
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';
  import { phaseAt } from '$lib/shifts/settings';
  import { dayLabel, localDateKey, moment } from '$lib/shifts/format';
  import AvailabilityGrid from '$lib/components/shifts/AvailabilityGrid.svelte';
  import RosterGrid from '$lib/components/shifts/RosterGrid.svelte';
  import FairnessPanel from '$lib/components/shifts/FairnessPanel.svelte';
  import SwapPanel from '$lib/components/shifts/SwapPanel.svelte';
  import StandingRules from '$lib/components/shifts/StandingRules.svelte';
  import { withStandingRules } from '$lib/shifts/rules';

  let { data } = $props();

  const uid = $derived(String(page.data.uid ?? ''));
  const names = $derived(
    Object.fromEntries(
      (page.data.projectBase?.user_1s?.data ?? []).map((u: any) => [String(u.id), u.attributes?.username ?? ''])
    ) as Record<string, string>
  );

  let planIdx = $state(0);
  let cycleIdx = $state(0);
  let tab = $state<'roster' | 'mine' | 'fairness'>('roster');

  const block = $derived(data.plans[planIdx] ?? null);
  const cycle = $derived(block?.cycles[cycleIdx] ?? null);
  const tz = $derived(block?.settings.timeZone ?? 'Asia/Jerusalem');
  const loc = $derived($locale || 'he');

  const cycleShifts = $derived(
    block && cycle
      ? data.window.shifts.filter(
          (s) => s.planId === block.plan.id && s.start >= cycle.start && s.start < cycle.end
        )
      : []
  );
  const shiftIds = $derived(new Set(cycleShifts.map((s) => s.id)));
  const period = $derived(block && cycle ? (block.periods.find((p) => p.periodKey === cycle.periodKey) ?? null) : null);
  const snapshot = $derived((period?.quotaSnapshot ?? null) as any);
  /**
   * SHIFTS=shadow writes no assignment rows; the roster it would have written
   * is kept on the period, and shown here under a banner so it is never
   * mistaken for the real thing (PLAN_SHIFTS §11).
   */
  const shadowRoster = $derived(
    data.mode === 'shadow' && Array.isArray(snapshot?.shadow)
      ? snapshot.shadow.map((a: any) => ({ ...a, state: 'draft' as const }))
      : null
  );
  const cycleAssignments = $derived(
    shadowRoster ?? data.window.assignments.filter((a) => shiftIds.has(a.shiftId))
  );
  const myCommitment = $derived(block?.commitments.find((c) => c.userId === uid) ?? null);
  // What I tapped, plus what my standing rules say about the shifts I did not.
  const myDeclarations = $derived(
    withStandingRules(
      data.window.declarations.filter((d) => d.userId === uid && shiftIds.has(d.shiftId)),
      cycleShifts,
      myCommitment ? [myCommitment] : [],
      tz
    ).filter((d) => d.userId === uid)
  );
  const myRanks = $derived(
    Object.fromEntries(
      cycleAssignments.filter((a) => a.userId === uid && a.state !== 'released').map((a) => [a.shiftId, a.rank])
    ) as Record<string, number>
  );

  const phase = $derived(cycle ? phaseAt(cycle, data.now) : null);
  const phaseDate = $derived(
    !cycle
      ? ''
      : phase === 'upcoming'
        ? moment(cycle.declareFrom, tz, loc)
        : phase === 'declaring'
          ? moment(cycle.draftAt, tz, loc)
          : phase === 'draft'
            ? moment(cycle.closesAt, tz, loc)
            : ''
  );
  const range = $derived(
    cycle
      ? $t('shifts.cycle.range', {
          from: dayLabel(localDateKey(cycle.start, tz), loc),
          to: dayLabel(localDateKey(new Date(new Date(cycle.end).getTime() - 1).toISOString(), tz), loc)
        })
      : ''
  );
  const hasDraft = $derived(cycleAssignments.length > 0);

  function selectPlan(i: number) {
    planIdx = i;
    cycleIdx = 0;
  }
</script>

<svelte:head>
  <title>{page.data.projectBase?.projectName ? `${page.data.projectBase.projectName} · ` : ''}{$t('shifts.page.title')} · 1lev1</title>
</svelte:head>

<div class="mx-auto flex max-w-6xl flex-col gap-4 rounded-2xl bg-surface p-4 text-surfaceInk">
  <div class="flex flex-wrap items-baseline justify-between gap-2">
    <h1 class="text-2xl font-bold">{$t('shifts.page.title')}</h1>
    {#if data.mode !== 'off'}
      <a class="text-sm underline" href="/me/shifts">{$t('shifts.me.link')}</a>
    {/if}
  </div>

  {#if data.mode === 'off'}
    <p class="rounded-xl border border-surfaceLine bg-surface2 p-4">{$t('shifts.page.off')}</p>
  {:else if data.loadError}
    <p class="rounded-xl border border-red-400 bg-surface2 p-4" role="alert">{$t('shifts.page.loadError')}</p>
  {:else if data.plans.length === 0}
    <div class="rounded-xl border border-surfaceLine bg-surface2 p-4">
      <p class="font-semibold">{$t('shifts.page.empty')}</p>
      <p class="mt-1 text-sm text-surfaceMuted">{$t('shifts.page.emptyHint')}</p>
    </div>
  {:else}
    {#if data.mode === 'shadow'}
      <p class="rounded-xl border border-amber-400 bg-amber-100/60 p-3 text-sm text-slate-900">{$t('shifts.page.shadow')}</p>
    {/if}

    {#if data.plans.length > 1}
      <label class="flex flex-wrap items-center gap-2 text-sm">
        <span>{$t('shifts.page.planLabel')}</span>
        <select
          class="rounded-lg border border-surfaceLine bg-surface2 px-2 py-1"
          value={planIdx}
          onchange={(e) => selectPlan(Number(e.currentTarget.value))}
        >
          {#each data.plans as b, i (b.plan.id)}
            <option value={i}>{b.plan.name || `#${b.plan.id}`}</option>
          {/each}
        </select>
      </label>
    {:else if block}
      <p class="text-lg font-semibold">{block.plan.name}</p>
    {/if}

    {#if block && cycle}
      <nav class="flex items-center justify-between gap-2" aria-label={range}>
        <button
          type="button"
          class="rounded-lg border border-surfaceLine px-3 py-1 disabled:opacity-40"
          disabled={cycleIdx === 0}
          onclick={() => (cycleIdx -= 1)}>{$t('shifts.cycle.prev')}</button
        >
        <strong class="text-center">{range}</strong>
        <button
          type="button"
          class="rounded-lg border border-surfaceLine px-3 py-1 disabled:opacity-40"
          disabled={cycleIdx >= block.cycles.length - 1}
          onclick={() => (cycleIdx += 1)}>{$t('shifts.cycle.next')}</button
        >
      </nav>

      {#if phase}
        <p class="rounded-lg bg-surface2 px-3 py-2 text-sm" aria-live="polite">
          {$t(`shifts.phase.${phase}`, { date: phaseDate })}
        </p>
      {/if}

      <div role="tablist" class="flex gap-2 border-b border-surfaceLine">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'roster'}
          class="px-3 py-2 {tab === 'roster' ? 'border-b-2 border-gold font-bold' : ''}"
          onclick={() => (tab = 'roster')}>{$t('shifts.tabs.roster')}</button
        >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'mine'}
          class="px-3 py-2 {tab === 'mine' ? 'border-b-2 border-gold font-bold' : ''}"
          onclick={() => (tab = 'mine')}>{$t('shifts.tabs.mine')}</button
        >
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'fairness'}
          class="px-3 py-2 {tab === 'fairness' ? 'border-b-2 border-gold font-bold' : ''}"
          onclick={() => (tab = 'fairness')}>{$t('shifts.tabs.fairness')}</button
        >
      </div>

      <div role="tabpanel">
        {#if tab === 'roster'}
          {#if shadowRoster}
            <p class="mb-3 rounded-lg border border-amber-400 p-2 text-sm">{$t('shifts.roster.shadowNote')}</p>
          {:else if !hasDraft}
            <p class="mb-3 text-sm text-surfaceMuted">{$t('shifts.roster.noDraft')}</p>
          {/if}
          <RosterGrid
            shifts={cycleShifts}
            assignments={cycleAssignments}
            {names}
            {uid}
            timeZone={tz}
            cycleStart={cycle.start}
            cycleEnd={cycle.end}
          />
          {#if data.mode === 'on' && block.onMission && !shadowRoster}
            <SwapPanel
              shifts={cycleShifts}
              assignments={cycleAssignments}
              members={block.commitments.map((c) => c.userId)}
              {names}
              {uid}
              timeZone={tz}
              now={data.now}
              swaps={data.swaps.filter((s) => s.planId === block.plan.id)}
            />
          {/if}
        {:else if tab === 'fairness'}
          <FairnessPanel {snapshot} balance={block.plan.balanceCache} {names} {uid} />
        {:else if !block.onMission}
          <p class="rounded-xl border border-surfaceLine bg-surface2 p-4">{$t('shifts.page.notOnMission')}</p>
        {:else}
          {#if myCommitment}
            {#key `${myCommitment.mesimabetahalichId}|${myCommitment.rulesAt ?? ''}`}
              <StandingRules mesimabetahalichId={myCommitment.mesimabetahalichId} rules={myCommitment.rules ?? []} />
            {/key}
          {/if}
          {#key `${block.plan.id}|${cycle.periodKey}|${myCommitment?.rulesAt ?? ''}`}
            <AvailabilityGrid
              shifts={cycleShifts}
              declarations={myDeclarations}
              ranks={myRanks}
              timeZone={tz}
              cycleStart={cycle.start}
              cycleEnd={cycle.end}
              disabled={phase === 'past'}
            />
          {/key}
        {/if}
      </div>
    {/if}
  {/if}
</div>
