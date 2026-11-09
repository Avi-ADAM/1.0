<script>
  /**
   * The host's live screen (PLAN_EVENTS_WEBINARS §6, W4). Re-reads itself every
   * 20 seconds while the tab is visible — a plain poll, no socket.
   */
  import { onMount } from 'svelte';
  import { invalidateAll, goto } from '$app/navigation';
  import { page } from '$app/state';
  import { t, locale } from '$lib/translations';

  let { data } = $props();
  let projectId = $derived(page.params.projectId);

  onMount(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') invalidateAll();
    }, 20_000);
    return () => clearInterval(id);
  });

  function fmt(iso, tz) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz || undefined
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }
  function clock(iso) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso));
    } catch {
      return '';
    }
  }

  const STAGE_CLASS = {
    joinedNoAccount: 'bg-amber-500/20 border-amber-400/50',
    accountNotOnboarded: 'bg-sky-500/15 border-sky-400/40',
    onboarded: 'bg-emerald-500/15 border-emerald-400/40',
    notJoined: 'bg-slate-800/60 border-slate-700'
  };

  /** A phone number as WhatsApp wants it: digits only, Israeli 0-prefix → 972. */
  function waNumber(phone) {
    const d = String(phone ?? '').replace(/\D/g, '');
    if (!d) return '';
    return d.startsWith('0') ? `972${d.slice(1)}` : d;
  }
</script>

<div class="max-w-5xl mx-auto space-y-5 text-white pb-16">
  <a href={`/moach/${projectId}/events/${data.event.id}`} class="text-sm text-slate-300 hover:text-gold">← {data.event.title}</a>

  <div class="flex flex-wrap items-end justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold">{$t('events.live.title')}</h1>
      <p class="text-sm text-slate-300">{$t('events.live.intro')}</p>
    </div>
    {#if data.sessions.length > 1}
      <select
        class="rounded-lg bg-slate-900 border border-slate-600 px-3 py-2"
        value={data.session?.key}
        onchange={(e) => goto(`?s=${e.currentTarget.value}`, { replaceState: true, keepFocus: true })}
      >
        {#each data.sessions as s (s.key)}<option value={s.key}>{fmt(s.startsAt, s.timezone)}</option>{/each}
      </select>
    {/if}
  </div>

  {#if !data.session}
    <p class="rounded-xl bg-slate-800 p-4">{$t('events.live.noSession')}</p>
  {:else}
    <p class="text-slate-300">{fmt(data.session.startsAt, data.session.timezone)} · {$t('events.live.updated', { time: clock(data.readAt) })}</p>

    {#if data.counts}
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div class="stat"><span class="num">{data.counts.total}</span><span>{$t('events.live.registered')}</span></div>
        <div class="stat"><span class="num">{data.counts.total - data.counts.notJoined}</span><span>{$t('events.live.inRoom')}</span></div>
        {#if data.signupFlow}
          <div class="stat"><span class="num">{data.counts.accountNotOnboarded + data.counts.onboarded}</span><span>{$t('events.live.signedUp')}</span></div>
          <div class="stat"><span class="num">{data.counts.onboarded}</span><span>{$t('events.live.onboarded')}</span></div>
        {/if}
      </div>
    {/if}

    {#if data.rows.length === 0}
      <p class="rounded-xl bg-slate-800 p-4">{$t('events.editor.noRegistrations')}</p>
    {:else}
      <ul class="space-y-2">
        {#each data.rows as r (r.id)}
          <li class="rounded-xl border p-3 flex flex-wrap items-center gap-3 justify-between {STAGE_CLASS[r.stage]}">
            <div class="min-w-0">
              {#if r.leadId}
                <a class="font-semibold underline" href={`/moach/${projectId}/sales/manage/leads/${r.leadId}`}>{r.name}</a>
              {:else}
                <span class="font-semibold">{r.name}</span>
              {/if}
              <span class="block text-xs text-slate-300" dir="ltr">{r.email}{r.phone ? ` · ${r.phone}` : ''}</span>
            </div>
            <div class="flex items-center gap-3 text-sm">
              <span class="checks">
                <span title={$t('events.live.inRoom')}>{r.stage !== 'notJoined' ? '🟢' : '⚪'}</span>
                {#if data.signupFlow}
                  <span title={$t('events.live.signedUp')}>{r.stage === 'accountNotOnboarded' || r.stage === 'onboarded' ? '🟢' : '⚪'}</span>
                  <span title={$t('events.live.onboarded')}>{r.stage === 'onboarded' ? '🟢' : '⚪'}</span>
                {/if}
              </span>
              <span class="hidden sm:inline text-slate-200">{$t(`events.live.stage.${r.stage}`)}</span>
              {#if r.phone && r.stage !== 'onboarded'}
                <a class="underline" href={`https://wa.me/${waNumber(r.phone)}`} target="_blank" rel="noopener">WhatsApp</a>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</div>

<style>
  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    padding: 0.9rem;
    border-radius: 0.8rem;
    background: rgb(30 41 59 / 0.7);
    border: 1px solid rgb(51 65 85);
    font-size: 0.85rem;
    color: rgb(203 213 225);
  }
  .num {
    font-size: 1.8rem;
    font-weight: 800;
    color: #fff;
  }
  .checks {
    letter-spacing: 0.15rem;
  }
</style>
