<script>
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import ResourceCalendar from '$lib/components/resource/ResourceCalendar.svelte';
  import { bookingColor, statusKey, sourceKey } from '$lib/resources/bookingView.js';
  import { CalendarDays, ArrowRight, ArrowLeft, X } from '@lucide/svelte';

  /**
   * "My resource calendar" — when each resource is taken, and by whom
   * (docs/PLAN_RESOURCE_CALENDAR.md §6.2).
   *
   * Reached from the resources category on the profile, either as the whole
   * calendar or, with `?sp=<id>`, focused on one resource.
   */

  let { data } = $props();

  // `null` means "follow the URL"; an array means the reader has touched the
  // filter chips. Keeping the two apart is what lets a fresh `?sp=<id>` link
  // land on the right resource instead of on whatever was selected last.
  /** @type {string[] | null} */
  let manualSpIds = $state(null);
  let selectedSpIds = $derived(manualSpIds ?? (data.focusSpId ? [data.focusSpId] : []));
  let selectedParties = $state([]);
  let liveOnly = $state(true);
  let view = $state('list');
  /** @type {import('$lib/resources/bookingView.js').BookingView | null} */
  let selected = $state(null);

  let focusName = $derived(
    data.focusSpId ? (data.resources.find((r) => r.id === data.focusSpId)?.name ?? '') : ''
  );

  let dateFmt = $derived(
    new Intl.DateTimeFormat($lang, { day: 'numeric', month: 'long', year: 'numeric' })
  );

  /** @param {string | null} iso */
  function full(iso) {
    return iso ? dateFmt.format(new Date(iso)) : $t('resources.calendar.open_ended');
  }
</script>

<svelte:head>
  <title>{$t('resources.page.title')}</title>
</svelte:head>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="max-w-3xl mx-auto px-3 py-4 pb-24 space-y-4">
  <header class="flex items-start justify-between gap-3">
    <div class="min-w-0">
      <h1 class="text-2xl font-extrabold text-barbi flex items-center gap-2">
        <CalendarDays size="24" aria-hidden="true" />
        {$t('resources.page.title')}
      </h1>
      <p class="text-sm text-surfaceMuted">
        {#if focusName}
          {focusName} · {$t('resources.page.single')}
        {:else}
          {$t('resources.page.sub')}
        {/if}
      </p>
    </div>
    <a
      href="/me#my-resources"
      class="shrink-0 inline-flex items-center gap-1 text-sm text-surfaceMuted hover:text-barbi"
    >
      {#if $isRtl}
        <ArrowRight size="16" aria-hidden="true" />
      {:else}
        <ArrowLeft size="16" aria-hidden="true" />
      {/if}
      {$t('resources.page.back_to_profile')}
    </a>
  </header>

  {#if data.focusSpId}
    <button
      type="button"
      class="text-xs text-barbi underline"
      onclick={() => (manualSpIds = [])}
    >
      {$t('resources.page.all')}
    </button>
  {/if}

  <ResourceCalendar
    bookings={data.bookings}
    resources={data.resources}
    bind:view
    bind:selectedSpIds={() => selectedSpIds, (value) => (manualSpIds = value)}
    bind:selectedParties
    bind:liveOnly
    onSelect={(booking) => (selected = booking)}
  />

  {#if selected}
    {@const color = bookingColor(selected)}
    <aside
      class="rounded-2xl border border-surfaceLine bg-surface p-4 space-y-2 shadow-lg"
      aria-label={selected.spName}
    >
      <div class="flex items-start justify-between gap-2">
        <h2 class="font-bold text-surfaceInk">{selected.spName}</h2>
        <button
          type="button"
          class="text-surfaceMuted hover:text-barbi"
          aria-label={$t('resources.calendar.filter_clear')}
          onclick={() => (selected = null)}
        >
          <X size="18" aria-hidden="true" />
        </button>
      </div>
      <dl class="text-sm space-y-1">
        <div class="flex gap-2">
          <dt class="text-surfaceMuted">{$t('resources.calendar.filter_party')}</dt>
          <dd class="text-surfaceInk font-semibold">
            {selected.counterparty.name || $t(sourceKey(selected.source))}
          </dd>
        </div>
        <div class="flex gap-2">
          <dt class="text-surfaceMuted">{$t('resources.overlap.requested')}</dt>
          <dd class="text-surfaceInk">{full(selected.start)} – {full(selected.end)}</dd>
        </div>
        {#if selected.quantity > 1}
          <div class="flex gap-2">
            <dt class="text-surfaceMuted">{$t('resources.model.capacity')}</dt>
            <dd class="text-surfaceInk">{selected.quantity}</dd>
          </div>
        {/if}
      </dl>
      <span
        class="inline-block rounded-full px-2 py-0.5 text-xs border"
        style:border-color={color.border}
        style:background={color.dashed ? 'transparent' : color.background}
      >
        {$t(statusKey(selected.status))}
      </span>
      {#if selected.counterparty.kind === 'project' && selected.counterparty.id}
        <a
          class="block text-sm text-barbi hover:underline"
          href={`/moach/${selected.counterparty.id}/main`}
        >
          {selected.counterparty.name}
        </a>
      {/if}
    </aside>
  {/if}
</div>
