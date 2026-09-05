<script>
  import { t, isRtl } from '$lib/translations';
  import ResourceCalendar from '$lib/components/resource/ResourceCalendar.svelte';
  import { statusKey, sourceKey } from '$lib/resources/bookingView.js';
  import { CalendarDays } from '@lucide/svelte';

  /**
   * The rikma's resource calendar (docs/PLAN_RESOURCE_CALENDAR.md §6.3).
   *
   * Same component as the personal calendar, different perspective: rows name
   * the member supplying each resource, and `concierge` rows are what the rikma
   * has promised to customers.
   */

  let { data } = $props();

  let selectedSpIds = $state([]);
  let selectedParties = $state([]);
  let liveOnly = $state(true);
  let view = $state('list');
  /** @type {import('$lib/resources/bookingView.js').BookingView | null} */
  let selected = $state(null);

  // What the rikma owes outward, kept visible as its own count: a supply
  // commitment is the half that silently doubles up.
  let outward = $derived(data.bookings.filter((b) => b.source === 'concierge'));
</script>

<svelte:head>
  <title>{$t('resources.page.project_title')}</title>
</svelte:head>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="max-w-3xl mx-auto px-3 py-4 pb-24 space-y-4">
  <header>
    <h1 class="text-2xl font-extrabold text-barbi flex items-center gap-2">
      <CalendarDays size="24" aria-hidden="true" />
      {$t('resources.page.project_title')}
    </h1>
    <p class="text-sm text-surfaceMuted">{$t('resources.page.project_sub')}</p>
  </header>

  {#if outward.length > 0}
    <p class="text-xs text-surfaceMuted rounded-xl bg-surface2 px-3 py-2">
      {$t('resources.source.concierge')} · {outward.length}
    </p>
  {/if}

  <ResourceCalendar
    bookings={data.bookings}
    bind:view
    bind:selectedSpIds
    bind:selectedParties
    bind:liveOnly
    onSelect={(booking) => (selected = booking)}
  />

  {#if selected}
    <aside
      class="rounded-2xl border border-surfaceLine bg-surface p-4 space-y-1 shadow-lg"
      aria-label={selected.spName}
    >
      <h2 class="font-bold text-surfaceInk">{selected.spName}</h2>
      <p class="text-sm text-surfaceMuted">
        {selected.counterparty.name || $t(sourceKey(selected.source))} ·
        {$t(statusKey(selected.status))}
      </p>
      <button type="button" class="text-xs text-barbi underline" onclick={() => (selected = null)}>
        {$t('resources.calendar.filter_clear')}
      </button>
    </aside>
  {/if}
</div>
