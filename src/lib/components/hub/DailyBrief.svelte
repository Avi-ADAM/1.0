<script lang="ts">
  /**
   * The daily brief, as the hub shows it (PLAN_DAILY_DIGEST). The payload is
   * the one the morning digest is composed from — same numbers, same links —
   * so what the hub says today is what the digest will say tomorrow morning.
   *
   * Votes are not repeated here: the hub already leads with them (the urgent
   * pill, the KPI hero, the action feed). This card is everything else the
   * brief carries — the work on the user's plate, what is about to be
   * released for dormancy, what is new in their rikmot, and suggestions.
   *
   * An empty brief renders nothing, the same rule as an empty digest not
   * being sent.
   */
  import { t } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import type { DigestPayload } from '$lib/digest/compose.js';

  interface Props {
    payload: DigestPayload;
    /** Sections whose read failed — said out loud rather than shown as 0. */
    failed?: string[];
  }

  let { payload, failed = [] }: Props = $props();

  const s = $derived(payload.sections);

  const newKinds = $derived(
    (
      [
        ['missions', '🛠️'],
        ['resources', '📦'],
        ['products', '🎁'],
        ['sales', '💰']
      ] as const
    )
      .map(([kind, icon]) => ({ kind, icon, count: s.whatsNew.byKind[kind] }))
      .filter((k) => k.count > 0)
  );

  const hasWork = $derived(s.missions.active > 0);
  const hasTasks = $derived(s.tasks.open > 0);
  const hasNew = $derived(s.whatsNew.total > 0);
  const hasSuggestions = $derived(s.suggestions.count > 0);
  const hasAnything = $derived(hasWork || hasTasks || hasNew || hasSuggestions);

  // Sections that failed to load, minus votes (not rendered here).
  const failedHere = $derived(failed.filter((f) => f !== 'hub'));

  function shortDate(iso: string | null): string {
    if (!iso) return '';
    try {
      return new Date(iso).toLocaleDateString($lang || 'he', {
        day: 'numeric',
        month: 'short',
        timeZone: 'Asia/Jerusalem'
      });
    } catch {
      return '';
    }
  }
</script>

{#if hasAnything || failedHere.length > 0}
  <section class="brief rounded-3xl border border-white/10 bg-white/[0.04] p-4 space-y-3">
    <header class="flex items-baseline justify-between gap-2 px-1">
      <h2 class="text-sm font-bold text-gold">☀️ {$t('hub.brief.title')}</h2>
      <span class="text-[11px] text-white/45">{$t('hub.brief.sub')}</span>
    </header>

    <!-- Dormancy first: it is the only line here with a deadline attached -->
    {#each s.missions.dormantSoon as m (m.id)}
      <a
        href={m.url}
        class="flex items-start gap-3 rounded-2xl px-3 py-2.5 no-underline
               bg-amber-400/10 border border-amber-300/30 active:scale-[0.99] transition-transform"
      >
        <span class="text-lg shrink-0">⏳</span>
        <span class="flex-1 min-w-0 text-xs leading-snug text-amber-100">
          <span class="block font-semibold truncate">{m.title || m.projectName}</span>
          <span class="block text-amber-100/80">
            {m.daysLeft <= 1
              ? $t('hub.brief.dormantTomorrow')
              : $t('hub.brief.dormantSoon', { count: m.daysLeft })}
          </span>
        </span>
      </a>
    {/each}

    <div class="divide-y divide-white/[0.06]">
      {#if hasWork}
        <a href="/lev?focus=mtaha" class="br-row">
          <span class="br-icon">💼</span>
          <span class="br-num font-litt">{s.missions.active}</span>
          <span class="flex-1 min-w-0">
            <span class="br-label">{$t('hub.brief.missions')}</span>
            <span class="br-chips">
              {#if s.missions.running > 0}
                <span class="br-chip">▶ {s.missions.running} {$t('hub.brief.running')}</span>
              {/if}
              {#if s.missions.notStarted > 0}
                <span class="br-chip">{s.missions.notStarted} {$t('hub.brief.notStarted')}</span>
              {/if}
            </span>
          </span>
          <span class="br-chev">‹</span>
        </a>
      {/if}

      {#if hasTasks}
        <a href="/myacts" class="br-row">
          <span class="br-icon">✅</span>
          <span class="br-num font-litt">{s.tasks.open}</span>
          <span class="flex-1 min-w-0">
            <span class="br-label">{$t('hub.brief.tasks')}</span>
            <span class="br-chips">
              {#if s.tasks.overdue > 0}
                <span class="br-chip br-chip-alert">{s.tasks.overdue} {$t('hub.brief.overdue')}</span>
              {/if}
              {#if s.tasks.dueSoon > 0}
                <span class="br-chip">{s.tasks.dueSoon} {$t('hub.brief.dueSoon')}</span>
              {/if}
            </span>
          </span>
          <span class="br-chev">‹</span>
        </a>
        {#each s.tasks.items as task (task.id)}
          <a href={task.url} class="br-sub">
            <span class="truncate flex-1 min-w-0">
              {task.title}
              {#if task.missionName}<span class="text-white/40"> · {task.missionName}</span>{/if}
            </span>
            <span class="shrink-0 {task.overdue ? 'text-red-300' : 'text-white/50'}">
              {task.overdue ? $t('hub.brief.overdue') : shortDate(task.due)}
            </span>
          </a>
        {/each}
      {/if}

      {#if hasNew}
        <a href="/moach" class="br-row">
          <span class="br-icon">✨</span>
          <span class="br-num font-litt">{s.whatsNew.total}</span>
          <span class="flex-1 min-w-0">
            <span class="br-label">{$t('hub.brief.whatsNew')}</span>
            <span class="br-chips">
              {#each newKinds as k (k.kind)}
                <span class="br-chip" title={$t(`hub.brief.kinds.${k.kind}`)}>
                  {k.icon} {k.count}
                  <span class="sr-only">{$t(`hub.brief.kinds.${k.kind}`)}</span>
                </span>
              {/each}
            </span>
          </span>
          <span class="br-chev">‹</span>
        </a>
      {/if}

      {#if hasSuggestions}
        <a href="/lev?focus=meData,huca" class="br-row">
          <span class="br-icon">💡</span>
          <span class="br-num font-litt">{s.suggestions.count}</span>
          <span class="flex-1 min-w-0">
            <span class="br-label">{$t('hub.brief.suggestions')}</span>
            <span class="br-chips">
              {#if s.suggestions.fresh > 0}
                <span class="br-chip br-chip-gold">{s.suggestions.fresh} {$t('hub.brief.fresh')}</span>
              {/if}
            </span>
          </span>
          <span class="br-chev">‹</span>
        </a>
        {#each s.suggestions.top as sug (sug.id)}
          <a href={sug.url} class="br-sub">
            <span class="truncate flex-1 min-w-0">
              {sug.kind === 'mission' ? '🛠️' : '📦'}
              {sug.title}
              {#if sug.projectName}<span class="text-white/40"> · {sug.projectName}</span>{/if}
            </span>
          </a>
        {/each}
      {/if}
    </div>

    {#if failedHere.length > 0}
      <p class="px-1 text-[11px] text-white/45">⚠️ {$t('hub.brief.partial')}</p>
    {/if}
  </section>
{/if}

<style>
  .br-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.7rem 0.25rem;
    text-decoration: none;
    transition: background-color 0.15s;
    border-radius: 0.75rem;
  }
  .br-row:active {
    background: rgb(255 255 255 / 0.05);
  }
  .br-icon {
    font-size: 1.15rem;
    flex-shrink: 0;
    width: 1.5rem;
    text-align: center;
  }
  .br-num {
    font-size: 1.5rem;
    line-height: 1;
    min-width: 1.75rem;
    text-align: center;
    color: #fff;
    font-variant-numeric: tabular-nums;
  }
  .br-label {
    display: block;
    font-size: 0.85rem;
    font-weight: 500;
    color: rgb(255 255 255 / 0.85);
  }
  .br-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.2rem;
  }
  .br-chips:empty {
    display: none;
  }
  .br-chip {
    font-size: 0.68rem;
    line-height: 1.4;
    padding: 0 0.45rem;
    border-radius: 999px;
    background: rgb(255 255 255 / 0.08);
    color: rgb(255 255 255 / 0.7);
    white-space: nowrap;
  }
  .br-chip-alert {
    background: rgb(248 113 113 / 0.18);
    color: rgb(254 202 202);
  }
  .br-chip-gold {
    background: rgb(var(--gold-rgb) / 0.18);
    color: rgb(var(--gold-rgb));
  }
  .br-sub {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.35rem 0.25rem 0.35rem 0.25rem;
    padding-inline-start: 2.5rem;
    font-size: 0.75rem;
    color: rgb(255 255 255 / 0.75);
    text-decoration: none;
    border-top: none !important;
  }
  .br-chev {
    color: rgb(255 255 255 / 0.3);
    font-size: 1.1rem;
    flex-shrink: 0;
  }
  :global([dir='ltr']) .br-chev {
    transform: scaleX(-1);
  }
</style>
