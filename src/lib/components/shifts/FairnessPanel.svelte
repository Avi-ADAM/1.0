<script lang="ts">
  /**
   * Why each member's share is what it is (docs/PLAN_SHIFTS.md §6.2, §9.2).
   *
   * One sentence carries the whole rule — everyone gets the same number,
   * except where their own agreed commitment caps them lower or floors them
   * higher — and each row says which of those applied to that person.
   * Shortage and "below the minimum" are stated plainly, never hidden.
   */
  import { t } from '$lib/translations';
  import { explainQuota } from '$lib/shifts/explain';

  interface Snapshot {
    quotas: Record<string, number>;
    bounds: Record<string, { lo: number; hi: number | null; carry: number }>;
    level: number | null;
    shortage: number;
    belowMin: string[];
    assigned: Record<string, number>;
    commitments: Array<{ userId: string; min: number | null; max: number | null }>;
  }

  interface Props {
    snapshot: Snapshot | null;
    /** The plan's running balance (`balanceCache`) — positive = took more than their share before. */
    balance: Record<string, number> | null;
    names: Record<string, string>;
    uid: string;
  }

  let { snapshot, balance, names, uid }: Props = $props();

  const fmt = (n: number) => (Math.round(n * 10) / 10).toLocaleString('en-US');

  let rows = $derived.by(() => {
    if (!snapshot) return [];
    return snapshot.commitments.map((c) => {
      const b = snapshot.bounds[c.userId] ?? { lo: 0, hi: 0, carry: 0 };
      // JSON has no Infinity: an uncapped member's hi comes back as null.
      const hi = b.hi == null ? Infinity : b.hi;
      const quota = snapshot.quotas[c.userId] ?? 0;
      const why = explainQuota({
        quota,
        lo: b.lo,
        hi,
        level: snapshot.level == null ? Infinity : snapshot.level,
        carry: b.carry,
        max: c.max,
        // Only what the draft recorded is known here: if the cap equals the
        // agreed max, the max is what bound them.
        available: c.max != null && hi === c.max ? c.max : hi,
        belowMin: snapshot.belowMin.includes(c.userId)
      });
      return {
        userId: c.userId,
        name: c.userId === uid ? $t('shifts.roster.you') : names[c.userId] || `#${c.userId}`,
        commitment:
          c.min == null && c.max == null
            ? $t('shifts.fairness.noCommitment')
            : $t('shifts.fairness.commitmentRange', {
                min: String(c.min ?? 0),
                max: c.max == null ? $t('shifts.fairness.noMax') : String(c.max)
              }),
        quota,
        assigned: snapshot.assigned[c.userId] ?? 0,
        carry: balance?.[c.userId] ?? 0,
        why
      };
    });
  });
</script>

<section class="flex flex-col gap-3">
  <p class="text-sm">{$t('shifts.fairness.intro')}</p>

  {#if !snapshot}
    <p class="text-sm text-surfaceMuted">{$t('shifts.fairness.noSnapshot')}</p>
  {:else}
    {#if snapshot.shortage > 0}
      <p class="rounded-lg border border-red-400 p-2 text-sm" role="status">
        {$t('shifts.fairness.shortage', { count: snapshot.shortage })}
      </p>
    {/if}
    <div class="overflow-x-auto">
      <table class="w-full min-w-[32rem] text-sm">
        <thead>
          <tr class="border-b border-surfaceLine text-start">
            <th class="p-2 text-start">{$t('shifts.fairness.member')}</th>
            <th class="p-2 text-start">{$t('shifts.fairness.commitment')}</th>
            <th class="p-2 text-start">{$t('shifts.fairness.quota')}</th>
            <th class="p-2 text-start">{$t('shifts.fairness.assigned')}</th>
            <th class="p-2 text-start" title={$t('shifts.fairness.carryHelp')}>{$t('shifts.fairness.carry')}</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as r (r.userId)}
            <tr class="border-b border-surfaceLine" class:font-bold={r.userId === uid}>
              <td class="p-2">{r.name}</td>
              <td class="p-2">{r.commitment}</td>
              <td class="p-2">
                {r.quota}
                <span class="block text-xs font-normal text-surfaceMuted">{$t(`shifts.fairness.why.${r.why}`)}</span>
              </td>
              <td class="p-2">{r.assigned}</td>
              <td class="p-2" dir="ltr">{r.carry > 0 ? '+' : ''}{fmt(r.carry)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="text-xs text-surfaceMuted">{$t('shifts.fairness.carryHelp')}</p>
  {/if}
</section>
