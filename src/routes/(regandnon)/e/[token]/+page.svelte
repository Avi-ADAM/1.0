<script>
  /**
   * "My registration" (docs/inprogress/PLAN_EVENTS_WEBINARS.md §4.3): the date, add to
   * calendar, and — from 15 minutes before the start — the way into the room.
   */
  import { enhance } from '$app/forms';
  import { page } from '$app/state';
  import { onMount } from 'svelte';
  import { t, locale, isRtl } from '$lib/translations';

  let { data, form } = $props();

  let now = $state(Date.now());
  onMount(() => {
    const id = setInterval(() => (now = Date.now()), 30_000);
    return () => clearInterval(id);
  });

  let s = $derived(data.session);
  let cancelled = $derived(form?.cancelled || data.registration.status === 'cancelled');
  let waitlist = $derived(data.registration.status === 'waitlist');
  /** Recomputed on the clock, so the page opens the door without a reload. */
  let phase = $derived.by(() => {
    if (!s) return 'none';
    if (s.state === 'cancelled') return 'cancelled';
    const start = Date.parse(s.startsAt);
    const end = start + s.durationMin * 60_000;
    if (now < start - 15 * 60_000) return 'upcoming';
    if (now <= end + 30 * 60_000 && s.state !== 'done') return 'joinable';
    return 'ended';
  });
  let notYet = $derived(page.url.searchParams.get('notYet'));
  let confirming = $state(false);

  function fmt(iso, tz) {
    try {
      return new Intl.DateTimeFormat($locale || 'he', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: tz || undefined,
        timeZoneName: 'short'
      }).format(new Date(iso));
    } catch {
      return iso;
    }
  }

  /** "in 3 days" / "in 5 hours" / "in 12 minutes", in the reader's language. */
  function until(iso) {
    const ms = Date.parse(iso) - now;
    const rtf = new Intl.RelativeTimeFormat($locale || 'he', { numeric: 'auto' });
    const min = Math.round(ms / 60_000);
    if (Math.abs(min) < 90) return rtf.format(min, 'minute');
    const h = Math.round(min / 60);
    if (Math.abs(h) < 36) return rtf.format(h, 'hour');
    return rtf.format(Math.round(h / 24), 'day');
  }
</script>

<svelte:head>
  <title>{data.event.title} · {$t('events.mine.title')}</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<div class="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white" dir={$isRtl ? 'rtl' : 'ltr'}>
  <div class="max-w-xl mx-auto px-4 py-10 space-y-6">
    {#if data.justRegistered && !cancelled}
      <div class="rounded-2xl bg-emerald-600/20 border border-emerald-400/40 p-4">
        <p class="font-bold text-lg">{waitlist ? $t('events.mine.waitlistTitle') : $t('events.mine.doneTitle')}</p>
        <p class="text-white/80 text-sm mt-1">{$t('events.mine.doneBody')}</p>
      </div>
    {/if}

    <header class="space-y-2">
      <p class="text-sm text-white/60">{data.rikmaName} · {$t(`events.kind.${data.event.kind}`)}</p>
      <h1 class="text-3xl font-black leading-tight">{data.event.title}</h1>
      {#if data.event.tagline}<p class="text-white/75">{data.event.tagline}</p>{/if}
      <p class="text-white/70 text-sm">{$t('events.mine.hello', { name: data.registration.name })}</p>
    </header>

    {#if cancelled}
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <p class="font-semibold">{$t('events.mine.cancelled')}</p>
        {#if data.eventUrl}
          <a href={data.eventUrl} class="inline-block mt-3 underline text-amber-300">{$t('events.mine.pickAnother')}</a>
        {/if}
      </div>
    {:else if !s}
      <div class="rounded-2xl bg-white/5 border border-white/10 p-5">
        <p>{$t('events.mine.noDate')}</p>
      </div>
    {:else}
      <section class="rounded-2xl bg-white/5 border border-white/10 p-5 space-y-4">
        <div>
          <p class="text-xs uppercase tracking-wider text-white/50">{$t('events.mine.when')}</p>
          <p class="text-lg font-semibold">{fmt(s.startsAt, s.timezone)}</p>
          <p class="text-sm text-white/60">{$t('events.page.minutes', { count: s.durationMin })}</p>
        </div>

        {#if waitlist}
          <p class="text-amber-200">{$t('events.mine.waitlistBody')}</p>
        {:else if phase === 'cancelled'}
          <p class="text-amber-200">{$t('events.mine.sessionCancelled')}</p>
        {:else if phase === 'upcoming'}
          <p class="text-white/85">{$t('events.mine.opensAt', { when: until(s.startsAt) })}</p>
          {#if notYet}<p class="text-sm text-amber-200">{$t('events.mine.notYet')}</p>{/if}
        {:else if phase === 'joinable'}
          <a href={`/e/${data.token}/join`} class="block text-center rounded-full py-4 text-lg font-black bg-amber-400 text-black hover:bg-amber-300">
            {$t('events.mine.join')}
          </a>
          {#if notYet === 'roomNotReady'}<p class="text-sm text-amber-200">{$t('events.mine.roomNotReady')}</p>{/if}
        {:else}
          <p class="text-white/85">{$t('events.mine.ended')}</p>
          {#if s.recordingUrl}
            <a href={s.recordingUrl} target="_blank" rel="noopener" class="inline-block underline text-amber-300">{$t('events.mine.recording')}</a>
          {/if}
        {/if}

        {#if data.calendar && !waitlist && phase !== 'ended' && phase !== 'cancelled'}
          <div class="pt-2 border-t border-white/10">
            <p class="text-xs uppercase tracking-wider text-white/50 mb-2">{$t('events.mine.addToCalendar')}</p>
            <div class="flex flex-wrap gap-2 text-sm">
              <a class="chip" href={data.calendar.google} target="_blank" rel="noopener">Google</a>
              <a class="chip" href={data.calendar.outlook} target="_blank" rel="noopener">Outlook</a>
              <a class="chip" href={`/e/${data.token}/calendar.ics`}>{$t('events.mine.icsFile')}</a>
            </div>
          </div>
        {/if}
      </section>

      {#if data.registration.signedUp}
        <section class="rounded-2xl bg-emerald-600/15 border border-emerald-400/30 p-5">
          <p class="font-semibold">{$t('events.mine.signedUp')}</p>
          <a href="/onboard" class="inline-block mt-2 underline text-emerald-200">{$t('events.mine.continueOnboard')}</a>
        </section>
      {:else if data.event.afterUrl && (phase === 'joinable' || phase === 'ended')}
        <section class="rounded-2xl bg-amber-400/10 border border-amber-300/30 p-5">
          <p class="font-semibold mb-2">{$t('events.mine.nextStep')}</p>
          <a href={data.event.afterUrl} class="inline-block rounded-full px-5 py-2 bg-white text-black font-bold">{$t('events.mine.nextStepCta')}</a>
        </section>
      {/if}
    {/if}

    <footer class="flex flex-wrap items-center justify-between gap-3 text-sm text-white/60">
      {#if data.eventUrl}<a href={data.eventUrl} class="underline">{$t('events.mine.eventPage')}</a>{/if}
      {#if !cancelled && s && phase !== 'ended'}
        {#if confirming}
          <form method="POST" action="?/cancel" use:enhance class="flex items-center gap-2">
            <span>{$t('events.mine.cancelSure')}</span>
            <button class="underline text-red-300">{$t('events.mine.cancelYes')}</button>
            <button type="button" class="underline" onclick={() => (confirming = false)}>{$t('events.mine.cancelNo')}</button>
          </form>
        {:else}
          <button type="button" class="underline" onclick={() => (confirming = true)}>{$t('events.mine.cancel')}</button>
        {/if}
      {/if}
    </footer>
  </div>
</div>

<style>
  .chip {
    padding: 0.35rem 0.9rem;
    border-radius: 9999px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }
  .chip:hover {
    border-color: rgb(252 211 77);
  }
</style>
