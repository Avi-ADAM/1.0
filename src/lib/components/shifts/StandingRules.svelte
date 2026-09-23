<script lang="ts">
  /**
   * "Never Fridays", "Sunday mornings are mine" — a member's standing rules on
   * one mission (src/lib/shifts/rules.ts). Each rule answers every coming
   * shift it matches that the member did not answer by hand; a tap on the grid
   * below always wins over a rule. The first matching rule wins, so a narrow
   * rule goes above a broad one.
   */
  import { invalidateAll } from '$app/navigation';
  import { t } from '$lib/translations';
  import { toast } from 'svelte-sonner';
  import { executeAction, actionErrorText } from '$lib/client/actionClient';
  import { describeShiftError } from '$lib/shifts/errors';
  import { stanceKey } from '$lib/shifts/explain';
  import { MAX_RULES, validateRules, type StandingRule } from '$lib/shifts/rules';
  import type { Stance } from '$lib/shifts/types';

  interface Props {
    mesimabetahalichId: string;
    rules: StandingRule[];
  }

  let { mesimabetahalichId, rules }: Props = $props();

  const STANCES: Stance[] = ['want', 'can', 'ifNeeded', 'cannot'];
  const DAYS = [0, 1, 2, 3, 4, 5, 6];

  // A working copy of the saved rules: nothing is saved until "save". The page
  // keys this component on the saved rules, so a save re-seeds it.
  const copy = () => rules.map((r) => ({ ...r, days: [...r.days] }));
  let draft = $state<StandingRule[]>(copy());
  let busy = $state(false);
  const issues = $derived(validateRules(draft));

  function add() {
    draft.push({ days: [5], stance: 'cannot' });
  }
  function remove(i: number) {
    draft.splice(i, 1);
  }
  function move(i: number, by: -1 | 1) {
    const j = i + by;
    if (j < 0 || j >= draft.length) return;
    [draft[i], draft[j]] = [draft[j], draft[i]];
  }
  function toggleDay(r: StandingRule, d: number) {
    r.days = r.days.includes(d) ? r.days.filter((x) => x !== d) : [...r.days, d].sort((a, b) => a - b);
  }

  async function save() {
    if (busy || issues.length) return;
    busy = true;
    try {
      const res = await executeAction('setShiftRules', {
        mesimabetahalichId,
        rules: $state.snapshot(draft).map((r) => ({ ...r, from: r.from || undefined, to: r.to || undefined }))
      });
      if (res?.success === false) throw new Error(describeShiftError(actionErrorText(res, ''), $t, $t('shifts.cards.error')));
      toast.success($t('shifts.rules.saved'));
      await invalidateAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : $t('shifts.cards.error'));
    } finally {
      busy = false;
    }
  }
</script>

<section class="mb-4 rounded-xl border border-surfaceLine bg-surface2 p-3" aria-labelledby="rules-title">
  <h2 id="rules-title" class="font-bold">{$t('shifts.rules.title')}</h2>
  <p class="text-xs text-surfaceMuted">{$t('shifts.rules.hint')}</p>

  <ol class="mt-2 flex flex-col gap-2">
    {#each draft as r, i (i)}
      <li class="rounded-lg border p-2 text-sm {issues.some((x) => x.index === i) ? 'border-red-500' : 'border-surfaceLine'}">
        <fieldset class="flex flex-wrap gap-1">
          <legend class="sr-only">{$t('shifts.rules.days')}</legend>
          {#each DAYS as d (d)}
            <button
              type="button"
              class="rounded-md border border-surfaceLine px-2 py-0.5 text-xs {r.days.includes(d) ? 'bg-gold font-bold text-slate-900' : ''}"
              aria-pressed={r.days.includes(d)}
              onclick={() => toggleDay(r, d)}>{$t(`shifts.rules.day.${d}`)}</button
            >
          {/each}
        </fieldset>
        <div class="mt-2 flex flex-wrap items-center gap-2">
          <label class="flex items-center gap-1">
            <span>{$t('shifts.rules.from')}</span>
            <input type="time" class="rounded border border-surfaceLine bg-surface px-1" bind:value={r.from} />
          </label>
          <label class="flex items-center gap-1">
            <span>{$t('shifts.rules.to')}</span>
            <input type="time" class="rounded border border-surfaceLine bg-surface px-1" bind:value={r.to} />
          </label>
          <label class="flex items-center gap-1">
            <span class="sr-only">{$t('shifts.rules.stance')}</span>
            <select class="rounded border border-surfaceLine bg-surface px-1" bind:value={r.stance}>
              {#each STANCES as s (s)}
                <option value={s}>{$t(stanceKey(s))}</option>
              {/each}
            </select>
          </label>
          <span class="ms-auto flex gap-1">
            <button type="button" class="px-1" aria-label={$t('shifts.rules.up')} disabled={i === 0} onclick={() => move(i, -1)}>↑</button>
            <button type="button" class="px-1" aria-label={$t('shifts.rules.down')} disabled={i === draft.length - 1} onclick={() => move(i, 1)}>↓</button>
            <button type="button" class="px-1 underline" onclick={() => remove(i)}>{$t('shifts.rules.remove')}</button>
          </span>
        </div>
        {#each issues.filter((x) => x.index === i) as issue (issue.code)}
          <p class="mt-1 text-xs text-red-600" role="alert">{$t(`shifts.rules.issue.${issue.code}`)}</p>
        {/each}
      </li>
    {/each}
  </ol>

  <div class="mt-2 flex gap-2">
    <button type="button" class="rounded-lg border border-surfaceLine px-3 py-1 text-sm" disabled={draft.length >= MAX_RULES} onclick={add}
      >{$t('shifts.rules.add')}</button
    >
    <button
      type="button"
      class="rounded-lg bg-gradient-to-r from-barbi to-mpink px-3 py-1 text-sm font-semibold text-white disabled:opacity-60"
      disabled={busy || issues.length > 0}
      onclick={save}>{$t('shifts.rules.save')}</button
    >
  </div>
</section>
