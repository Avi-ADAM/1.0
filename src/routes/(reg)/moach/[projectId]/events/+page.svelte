<script>
  /** The rikma's events: webinars, workshops, open meetings (PLAN_EVENTS_WEBINARS §7). */
  import { t, locale } from '$lib/translations';
  import { page } from '$app/state';

  let { data } = $props();
  let projectId = $derived(page.params.projectId);

  function fmt(iso, tz) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
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
</script>

<div class="max-w-4xl mx-auto space-y-6 text-white">
  <div class="flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="text-2xl font-bold">{$t('events.moach.title')}</h1>
      <p class="text-sm text-slate-300 max-w-2xl">{$t('events.moach.intro')}</p>
    </div>
    {#if data.available}
      <a href={`/moach/${projectId}/events/new`} class="rounded-full px-5 py-2 bg-gold text-black font-bold">
        {$t('events.moach.new')}
      </a>
    {/if}
  </div>

  {#if !data.available}
    <p class="rounded-xl bg-slate-800 p-4 text-slate-300">{$t('events.moach.unavailable')}</p>
  {:else if data.events.length === 0}
    <div class="rounded-xl bg-slate-800/70 border border-slate-700 p-6 text-center space-y-2">
      <p class="font-semibold">{$t('events.moach.emptyTitle')}</p>
      <p class="text-sm text-slate-300">{$t('events.moach.emptyBody')}</p>
    </div>
  {:else}
    <ul class="space-y-3">
      {#each data.events as e (e.id)}
        <li class="rounded-xl bg-slate-800/70 border border-slate-700 p-4 flex flex-wrap items-center gap-4 justify-between">
          <div class="min-w-0">
            <a href={`/moach/${projectId}/events/${e.id}`} class="text-lg font-semibold hover:text-gold">{e.title}</a>
            <p class="text-sm text-slate-300">
              <span class="status status-{e.status}">{$t(`events.status.${e.status}`)}</span>
              · {$t(`events.kind.${e.kind}`)}
              {#if e.nextStartsAt}· {$t('events.moach.next')} {fmt(e.nextStartsAt, e.nextTimezone)}{/if}
            </p>
          </div>
          <div class="flex items-center gap-4 text-sm">
            <span>{$t('events.moach.registeredCount', { count: e.registered })}</span>
            {#if e.waitlist}<span class="text-amber-300">{$t('events.moach.waitlistCount', { count: e.waitlist })}</span>{/if}
            <a href={e.href} target="_blank" rel="noopener" class="underline text-slate-300">{$t('events.moach.viewPage')}</a>
          </div>
        </li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .status {
    padding: 0.05rem 0.5rem;
    border-radius: 9999px;
    font-size: 0.75rem;
    background: rgb(51 65 85);
  }
  .status-published {
    background: rgb(5 150 105 / 0.35);
  }
  .status-proposed {
    background: rgb(217 119 6 / 0.35);
  }
</style>
