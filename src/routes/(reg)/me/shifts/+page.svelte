<script lang="ts">
  /**
   * /me/shifts — every coming shift of mine, from every rikma, in one list
   * (docs/PLAN_SHIFTS.md §9.3). Each row says whether I am coming or waiting
   * in line, and leads to that rikma's roster, where swaps and availability live.
   */
  import { t, locale } from '$lib/translations';
  import { dayLabel, localDateKey, timeRange } from '$lib/shifts/format';

  let { data } = $props();

  const loc = $derived($locale || 'he');
  // One heading per local day, in each shift's own zone.
  const days = $derived.by(() => {
    const out: Array<{ key: string; label: string; rows: typeof data.rows }> = [];
    for (const r of data.rows) {
      const key = localDateKey(r.start, r.timeZone);
      let day = out.find((d) => d.key === key);
      if (!day) out.push((day = { key, label: dayLabel(key, loc), rows: [] }));
      day.rows.push(r);
    }
    return out;
  });
</script>

<svelte:head>
  <title>{$t('shifts.me.title')} · 1lev1</title>
</svelte:head>

<div class="mx-auto flex max-w-3xl flex-col gap-4 rounded-2xl bg-surface p-4 text-surfaceInk">
  <h1 class="text-2xl font-bold">{$t('shifts.me.title')}</h1>

  {#if data.mode === 'off'}
    <p class="rounded-xl border border-surfaceLine bg-surface2 p-4">{$t('shifts.page.off')}</p>
  {:else if data.loadError}
    <p class="rounded-xl border border-red-400 bg-surface2 p-4" role="alert">{$t('shifts.page.loadError')}</p>
  {:else if data.mode === 'shadow'}
    <p class="rounded-xl border border-amber-400 bg-amber-100/60 p-3 text-sm text-slate-900">{$t('shifts.me.shadow')}</p>
  {:else if days.length === 0}
    <p class="rounded-xl border border-surfaceLine bg-surface2 p-4">{$t('shifts.me.empty')}</p>
  {:else}
    {#each days as day (day.key)}
      <section aria-labelledby="day-{day.key}">
        <h2 id="day-{day.key}" class="mb-2 font-semibold">{day.label}</h2>
        <ul class="flex flex-col gap-2">
          {#each day.rows as r (r.assignmentId)}
            <li class="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-surfaceLine bg-surface2 p-3">
              <div class="flex flex-col">
                <span class="font-bold" dir="ltr">{timeRange(r.start, r.end, r.timeZone, loc)}</span>
                <span class="text-sm">{r.projectName}{r.planName ? ` · ${r.planName}` : ''}</span>
              </div>
              <div class="flex items-center gap-3 text-sm">
                <span class="font-semibold">
                  {r.rank === 1 ? $t('shifts.grid.youComing') : $t('shifts.grid.youBackup', { rank: r.rank })}
                </span>
                {#if r.state === 'draft'}
                  <span class="rounded-full border border-surfaceLine px-2 text-xs">{$t('shifts.me.draft')}</span>
                {/if}
                {#if r.projectId}
                  <a class="underline" href="/moach/{r.projectId}/shifts">{$t('shifts.me.toRoster')}</a>
                {/if}
              </div>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  {/if}
</div>
