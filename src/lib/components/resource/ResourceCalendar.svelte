<script>
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import {
    agendaGroups,
    bookingColor,
    filterBookings,
    resourcesInBookings,
    sourceKey,
    statusKey,
    toCalendarEvents
  } from '$lib/resources/bookingView.js';
  import '@event-calendar/core/index.css';

  /**
   * The resource calendar (docs/PLAN_RESOURCE_CALENDAR.md §6.1) — one component
   * behind the personal calendar, the rikma calendar, and the single-resource
   * view.
   *
   * Mobile first, and that shapes the whole thing: the default view is a plain
   * agenda list built from ordinary markup, so opening this on a phone
   * downloads **no calendar library at all**. `@event-calendar` is dynamically
   * imported only if the reader asks for the month or week grid — it is the
   * Svelte-native one, where the alternative ships a second VDOM runtime
   * (`@fullcalendar/core` depends on preact) to a phone that will mostly show
   * a list.
   *
   * It only paints. What "taken" means lives in `$lib/resources/availability.js`.
   *
   * @typedef {import('$lib/resources/bookingView.js').BookingView} BookingView
   */

  let {
    /** @type {BookingView[]} normalized rows — see `normalizeBookings` */
    bookings = [],
    /**
     * The holder's full resource list, for the filter chips. Without it the
     * chips are derived from the bookings, which silently hides every resource
     * that is currently free — the ones a holder most wants to confirm.
     * @type {{ id: string, name: string }[]}
     */
    resources = [],
    /** @type {'list'|'month'|'week'} */
    view = $bindable('list'),
    /** Preselected resource ids. Empty = every resource. */
    selectedSpIds = $bindable([]),
    /** @type {('project'|'sheirut'|'user'|'none')[]} empty = every counterparty */
    selectedParties = $bindable([]),
    liveOnly = $bindable(true),
    showFilters = true,
    now = new Date(),
    /** @type {(booking: BookingView) => void} */
    onSelect = undefined,
    /** @type {(date: Date) => void} fired when an empty day is tapped */
    onPickDate = undefined,
    emptyKey = 'resources.calendar.empty'
  } = $props();

  const VIEWS = /** @type {const} */ (['list', 'month', 'week']);
  const PARTIES = /** @type {const} */ (['project', 'sheirut', 'user', 'none']);

  let visible = $derived(
    filterBookings(bookings, {
      spIds: selectedSpIds,
      counterparties: selectedParties,
      liveOnly
    })
  );
  let allResources = $derived(resources.length ? resources : resourcesInBookings(bookings));
  let groups = $derived(agendaGroups(visible, now));

  // ── grid views: loaded on demand, never on the phone's first paint ─────────
  // The import is memoised into one promise, so switching month↔week (or
  // re-rendering) reuses the same module instead of restarting the fetch — and
  // so the {#await} below never sees a new input to tear down.
  /** @type {Promise<{ Calendar: any, plugins: any[] }> | null} */
  let gridModules = null;

  function loadGrid() {
    gridModules ??= Promise.all([
      import('@event-calendar/core'),
      import('@event-calendar/day-grid'),
      import('@event-calendar/time-grid'),
      import('@event-calendar/interaction')
    ]).then(([core, dayGrid, timeGrid, interaction]) => ({
      Calendar: core.default,
      plugins: [dayGrid.default, timeGrid.default, interaction.default]
    }));
    return gridModules;
  }

  let grid = $derived(view === 'list' ? null : loadGrid());

  /** Far edge for open-ended bookings, so the grid has a rectangle to draw. */
  let openEndedUntil = $derived(new Date(now.getFullYear() + 2, now.getMonth(), 1));

  let gridEvents = $derived(
    toCalendarEvents(visible, {
      title: (b) => (b.counterparty.name ? `${b.spName} · ${b.counterparty.name}` : b.spName),
      openEndedUntil
    })
  );

  let gridOptions = $derived({
    view: view === 'week' ? 'timeGridWeek' : 'dayGridMonth',
    locale: $lang,
    height: '100%',
    events: gridEvents,
    dayMaxEvents: true,
    buttonText: (/** @type {Record<string, string>} */ text) => ({
      ...text,
      today: $t('resources.calendar.today')
    }),
    eventClick: (/** @type {any} */ info) => onSelect?.(info.event.extendedProps.booking),
    dateClick: (/** @type {any} */ info) => onPickDate?.(info.date)
  });

  // ── formatting ────────────────────────────────────────────────────────────
  let dayFmt = $derived(new Intl.DateTimeFormat($lang, { day: 'numeric', month: 'short' }));
  let monthFmt = $derived(new Intl.DateTimeFormat($lang, { month: 'long', year: 'numeric' }));

  /** @param {string} iso */
  function day(iso) {
    return dayFmt.format(new Date(iso));
  }

  /** @param {string} monthKey `YYYY-MM` */
  function monthLabel(monthKey) {
    const [year, month] = monthKey.split('-').map(Number);
    return monthFmt.format(new Date(year, month - 1, 1));
  }

  /** @param {BookingView} booking */
  function rangeLabel(booking) {
    if (!booking.end) return `${day(booking.start)} · ${$t('resources.calendar.open_ended')}`;
    return `${day(booking.start)} – ${day(booking.end)}`;
  }

  /** @param {BookingView} booking */
  function partyLabel(booking) {
    return booking.counterparty.name || $t(sourceKey(booking.source));
  }

  /** @param {string} id */
  function toggleResource(id) {
    selectedSpIds = selectedSpIds.includes(id)
      ? selectedSpIds.filter((x) => x !== id)
      : [...selectedSpIds, id];
  }

  /** @param {'project'|'sheirut'|'user'|'none'} kind */
  function toggleParty(kind) {
    selectedParties = selectedParties.includes(kind)
      ? selectedParties.filter((x) => x !== kind)
      : [...selectedParties, kind];
  }
</script>

<div dir={$isRtl ? 'rtl' : 'ltr'} class="flex flex-col gap-3">
  <!-- View switch -->
  <div
    class="flex items-center gap-1 rounded-xl bg-surface2 p-1 self-start"
    role="tablist"
    aria-label={$t('resources.calendar.view_label')}
  >
    {#each VIEWS as v (v)}
      <button
        type="button"
        role="tab"
        aria-selected={view === v}
        class="px-3 py-1.5 text-sm font-semibold rounded-lg transition-colors {view === v
          ? 'bg-barbi text-white shadow-sm'
          : 'text-surfaceMuted hover:text-surfaceInk'}"
        onclick={() => (view = v)}
      >
        {$t(`resources.calendar.view_${v}`)}
      </button>
    {/each}
  </div>

  {#if showFilters}
    <div class="flex flex-col gap-2">
      {#if allResources.length > 1}
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-xs font-semibold text-surfaceMuted">
            {$t('resources.calendar.filter_resource')}
          </span>
          {#each allResources as resource (resource.id)}
            <button
              type="button"
              aria-pressed={selectedSpIds.includes(resource.id)}
              class="px-2.5 py-1 text-xs rounded-full border transition-colors {selectedSpIds.includes(
                resource.id
              )
                ? 'bg-barbi text-white border-barbi'
                : 'bg-surface text-surfaceInk border-surfaceLine hover:border-barbi'}"
              onclick={() => toggleResource(resource.id)}
            >
              {resource.name}
            </button>
          {/each}
          {#if selectedSpIds.length}
            <button
              type="button"
              class="px-2 py-1 text-xs text-surfaceMuted underline"
              onclick={() => (selectedSpIds = [])}
            >
              {$t('resources.calendar.filter_clear')}
            </button>
          {/if}
        </div>
      {/if}

      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-semibold text-surfaceMuted">
          {$t('resources.calendar.filter_party')}
        </span>
        {#each PARTIES as kind (kind)}
          <button
            type="button"
            aria-pressed={selectedParties.includes(kind)}
            class="px-2.5 py-1 text-xs rounded-full border transition-colors {selectedParties.includes(
              kind
            )
              ? 'bg-goldink text-white border-goldink'
              : 'bg-surface text-surfaceInk border-surfaceLine hover:border-goldink'}"
            onclick={() => toggleParty(kind)}
          >
            {$t(`resources.calendar.party_${kind}`)}
          </button>
        {/each}
        <label class="flex items-center gap-1.5 text-xs text-surfaceInk ms-auto">
          <input type="checkbox" bind:checked={liveOnly} class="accent-barbi" />
          {$t('resources.calendar.live_only')}
        </label>
      </div>
    </div>
  {/if}

  {#if view === 'list'}
    {#if groups.length === 0}
      <p class="text-sm text-surfaceMuted text-center py-8">{$t(emptyKey)}</p>
    {:else}
      <div class="flex flex-col gap-4">
        {#each groups as group (group.month)}
          <section class="flex flex-col gap-1.5">
            <h3 class="text-xs font-bold uppercase tracking-wide text-surfaceMuted">
              {monthLabel(group.month)}
            </h3>
            {#each group.bookings as booking (booking.id)}
              {@const color = bookingColor(booking)}
              <button
                type="button"
                class="w-full text-start flex items-stretch gap-2.5 rounded-xl border border-surfaceLine bg-surface p-2.5 hover:border-barbi transition-colors"
                onclick={() => onSelect?.(booking)}
              >
                <span
                  class="w-1.5 shrink-0 rounded-full"
                  style:background={color.background}
                  style:border={color.dashed ? `1px dashed ${color.border}` : 'none'}
                ></span>
                <span class="min-w-0 flex-1">
                  <span class="flex items-baseline justify-between gap-2">
                    <span class="font-semibold text-surfaceInk truncate">{booking.spName}</span>
                    <span class="shrink-0 text-xs text-surfaceMuted">{rangeLabel(booking)}</span>
                  </span>
                  <span class="mt-0.5 flex items-center gap-2 text-xs text-surfaceMuted">
                    <span class="truncate">{partyLabel(booking)}</span>
                    {#if booking.quantity > 1}
                      <span class="shrink-0">×{booking.quantity}</span>
                    {/if}
                    <span
                      class="shrink-0 rounded-full px-1.5 py-0.5 border"
                      style:border-color={color.border}
                    >
                      {$t(statusKey(booking.status))}
                    </span>
                  </span>
                </span>
              </button>
            {/each}
          </section>
        {/each}
      </div>
    {/if}
  {:else if grid}
    {#await grid}
      <p class="text-sm text-surfaceMuted text-center py-8" aria-live="polite">
        {$t('resources.calendar.loading')}
      </p>
    {:then loaded}
      {@const Grid = loaded.Calendar}
      <div class="h-[70vh] min-h-80 rounded-xl border border-surfaceLine bg-surface p-1 ec-host">
        <Grid plugins={loaded.plugins} options={gridOptions} />
      </div>
    {:catch}
      <!-- A failed chunk must not take the page down — the list still works. -->
      <p class="text-sm text-surfaceMuted text-center py-8">
        {$t('resources.calendar.grid_failed')}
      </p>
    {/await}
  {/if}
</div>

<style>
  /* The library paints its own light chrome; hand it the theme's tokens so the
     grid does not turn into a white sheet in dark mode. */
  .ec-host :global(.ec) {
    --ec-border-color: var(--surface-line);
    --ec-bg-color: var(--surface);
    --ec-text-color: var(--surface-ink);
    --ec-today-bg-color: var(--surface-2);
    color: var(--surface-ink);
  }
</style>
