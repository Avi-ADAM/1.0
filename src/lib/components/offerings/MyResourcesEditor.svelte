<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { t, isRtl, locale } from '$lib/translations';
  import { CalendarDays } from '@lucide/svelte';
  import Newsp from '$lib/components/userPr/newsp.svelte';
  import Edsp from '$lib/components/userPr/editsp.svelte';
  import { bookingsFromLegacy } from '$lib/resources/bookingsFromLegacy.js';
  import {
    deriveAvailability,
    isHolding,
    nextFreeFrom
  } from '$lib/resources/availability.js';

  /**
   * "My resources" — the things and places a member owns and can share
   * (PLAN_USER_OFFERINGS §4.1.1, PLAN_ONBOARDING M5).
   *
   * Lists the member's existing personal resources (Sp) and authors new ones
   * with the SAME form the profile uses (`userPr/newsp.svelte`), so a resource
   * added here is immediately editable from /me and vice versa. Every resource
   * hangs off a `mashaabim` template — that relation is the only thing the
   * match engine keys on (`src/lib/server/matching/engine.ts`), so a resource
   * without one is invisible to every rikma looking for it.
   *
   * Occupancy comes from the shared availability engine
   * (docs/PLAN_RESOURCE_CALENDAR.md §1, §3): "free" is *computed* from the
   * booking ledger, never read off `Sp.panui` — which is only a server-written
   * cache and, before that plan, never came back to true. Until the
   * `resource-booking` collection exists, `bookingsFromLegacy` reconstructs the
   * same picture from the rows that already record it.
   *
   * Props:
   *  - uid       — the logged-in member's id.
   *  - proposed  — optional `[{ name, descrip }]` suggestions (e.g. resources
   *                the CV analysis spotted) offered as one-tap starting points.
   */

  let { uid, proposed = [] } = $props();

  /** @type {any[]} */
  let resources = $state([]);
  /** @type {import('$lib/resources/bookingView').BookingView[]} */
  let bookings = $state([]);
  /** @type {any[]} */
  let catalog = $state([]);
  let loading = $state(true);
  let error1 = $state(null);
  let busyId = $state(null);

  // Picker state
  let picking = $state(false);
  let search = $state('');
  let creatingTemplate = $state(false);
  /** @type {{ id: string, name: string }[]} */
  let chosen = $state([]);

  // Form state — `formNodes` are FRESH template nodes from qid 205 every time
  // the form opens. newsp.svelte flattens `node.attributes` into the node on
  // mount, so handing it an array it already chewed on would blank the fields.
  /** @type {any[]} */
  let formNodes = $state([]);
  let formKey = $state(0);
  let expected = $state(0);
  let saved = $state(0);

  onMount(load);

  async function load() {
    loading = true;
    error1 = null;
    try {
      const [mine, cat] = await Promise.all([
        sendToSer({ uid: String(uid) }, '308myResourcesViaUser', 0, 0, false, fetch),
        executeAction('loadCatalog', { linkp: 'mashaabims', lang: $locale })
      ]);
      resources =
        mine?.data?.usersPermissionsUser?.data?.attributes?.sps?.data ?? [];
      catalog = cat.success ? localizeCatalog(cat.data ?? []) : [];
      if (!cat.success) error1 = cat.error?.message || $t('offerings.resources.catalog_failed');
    } catch (e) {
      error1 = e?.message || String(e);
    }
    loading = false;
    loadOccupancy();
  }

  /**
   * Who is holding what, and until when. Deliberately separate and non-fatal:
   * the step's job is to get resources listed, and a calendar hiccup must not
   * take that down — a missing occupancy line just means no line.
   */
  async function loadOccupancy() {
    try {
      const res = await sendToSer(
        { uid: String(uid) },
        '309myResourceOccupancy',
        0,
        0,
        false,
        fetch
      );
      bookings = bookingsFromLegacy(res?.data ?? {}, { perspective: 'holder' });
    } catch (e) {
      console.warn('[MyResourcesEditor] occupancy load failed (non-fatal):', e);
    }
  }

  /** Templates carry their translation as a localization, exactly as in edit.svelte. */
  function localizeCatalog(rows) {
    if ($locale === 'en') return rows;
    return rows.map((r) => {
      const loc = r.attributes?.localizations?.data?.[0]?.attributes?.name;
      return loc ? { ...r, attributes: { ...r.attributes, name: loc } } : r;
    });
  }

  const norm = (s) => String(s ?? '').trim().toLowerCase();

  let takenTemplateIds = $derived(
    new Set(
      resources
        .map((r) => r.attributes?.mashaabim?.data?.id)
        .filter(Boolean)
        .map(String)
    )
  );

  let matches = $derived.by(() => {
    const q = norm(search);
    const picked = new Set(chosen.map((c) => String(c.id)));
    return catalog
      .filter((c) => !picked.has(String(c.id)))
      .filter((c) => (q ? norm(c.attributes?.name).includes(q) : true))
      .slice(0, q ? 12 : 8);
  });

  let exactMatch = $derived(
    !!search.trim() &&
      catalog.some((c) => norm(c.attributes?.name) === norm(search))
  );

  function pick(row) {
    const id = String(row.id);
    if (chosen.some((c) => c.id === id)) return;
    chosen = [...chosen, { id, name: row.attributes?.name ?? '' }];
    search = '';
  }

  function unpick(id) {
    chosen = chosen.filter((c) => c.id !== String(id));
  }

  /** No template for what the member owns? Create one, then select it. */
  async function createTemplate(name) {
    const clean = String(name ?? '').trim();
    if (!clean || creatingTemplate) return;
    // Never mint a second template for a name the catalog already holds —
    // matching is by template identity, so two "3D printer" rows split the
    // people who own one into two pools that never see each other's requests.
    const dupe = catalog.find((c) => norm(c.attributes?.name) === norm(clean));
    if (dupe) {
      pick(dupe);
      return;
    }
    creatingTemplate = true;
    error1 = null;
    try {
      const result = await executeAction('createMashaabim', { name: clean });
      if (!result.success) {
        error1 = result.error?.message || $t('offerings.resources.template_failed');
      } else {
        catalog = [...catalog, result.data];
        pick(result.data);
      }
    } catch (e) {
      error1 = e?.message || String(e);
    }
    creatingTemplate = false;
  }

  /**
   * A CV suggestion is just a name: reuse the matching template when one
   * exists so two members who own the same thing land on the same template,
   * and only mint a new one when nothing matches.
   */
  async function useProposed(p) {
    const hit = catalog.find((c) => norm(c.attributes?.name) === norm(p.name));
    if (hit) {
      openPicker();
      pick(hit);
      return;
    }
    openPicker();
    await createTemplate(p.name);
  }

  function openPicker() {
    picking = true;
    error1 = null;
  }

  function closePicker() {
    picking = false;
    search = '';
    chosen = [];
  }

  /** Chosen templates → the shared details form. */
  async function toForm() {
    if (chosen.length === 0) return;
    error1 = null;
    try {
      const res = await sendToSer(
        { ids: chosen.map((c) => c.id) },
        '205getMashaabimsByIds',
        0,
        0,
        false,
        fetch
      );
      const nodes = res?.data?.mashaabims?.data ?? [];
      if (nodes.length === 0) {
        error1 = $t('offerings.resources.template_failed');
        return;
      }
      formNodes = nodes;
      expected = nodes.length;
      saved = 0;
      formKey += 1;
      picking = false;
      search = '';
      chosen = [];
    } catch (e) {
      error1 = e?.message || String(e);
    }
  }

  /**
   * newsp fires onClose once per created resource. Count them: the form is
   * done only when every selected template produced one, so a failure part-way
   * leaves the form open with its own error instead of silently swallowing it.
   */
  async function onCreated() {
    saved += 1;
    if (saved >= expected) {
      formNodes = [];
      expected = 0;
      saved = 0;
      await load();
    }
  }

  /**
   * Dropping a card mid-form. Re-fetch the survivors rather than reusing the
   * array newsp already flattened — feeding it back would blank every field.
   */
  async function onFormRemove(event) {
    const dropped = String(event.id);
    const keep = formNodes.map((n) => String(n.id)).filter((id) => id !== dropped);
    if (keep.length === 0) {
      formNodes = [];
      expected = 0;
      saved = 0;
      return;
    }
    const res = await sendToSer({ ids: keep }, '205getMashaabimsByIds', 0, 0, false, fetch);
    formNodes = res?.data?.mashaabims?.data ?? [];
    expected = formNodes.length;
    saved = 0;
    formKey += 1;
  }

  // Editing goes through the same node+component the profile uses (qid 257
  // re-checks ownership server-side), so there is one edit form, not two.
  /** @type {any} */
  let editing = $state(null);

  async function edit(sp) {
    busyId = sp.id;
    error1 = null;
    try {
      const res = await sendToSer(
        { spId: String(sp.id) },
        '257getSpForEditWithOffer',
        0,
        0,
        false,
        fetch
      );
      const node = res?.data?.sp?.data;
      const meId = res?.data?.me?.id;
      if (!node || String(node.attributes?.users_permissions_user?.data?.id) !== String(meId)) {
        error1 = $t('offerings.resources.save_failed');
      } else {
        editing = node;
      }
    } catch (e) {
      error1 = e?.message || String(e);
    }
    busyId = null;
  }

  async function onEdited() {
    editing = null;
    await load();
  }

  async function archive(sp) {
    if (!confirm($t('offerings.resources.archive_confirm'))) return;
    busyId = sp.id;
    error1 = null;
    try {
      const result = await executeAction('archiveUserResource', { spId: String(sp.id) });
      if (result.success) resources = resources.filter((r) => r.id !== sp.id);
      else error1 = result.error?.message || $t('offerings.resources.save_failed');
    } catch (e) {
      error1 = e?.message || String(e);
    }
    busyId = null;
  }

  /**
   * How the thing is shared, in the member's words rather than the price
   * column's: a one-off handover, an ongoing arrangement, or a fixed window.
   */
  function shareModeKey(kindOf) {
    if (kindOf === 'monthly' || kindOf === 'yearly') return 'offerings.resources.mode_recurring';
    if (kindOf === 'rent') return 'offerings.resources.mode_period';
    return 'offerings.resources.mode_once';
  }

  function scopeKey(offerScope) {
    if (offerScope === 'customers') return 'offerings.resource.scope_customers';
    if (offerScope === 'both') return 'offerings.resource.scope_both';
    return 'offerings.resource.scope_rikma';
  }

  function dateLine(a) {
    if (!a?.sdate && !a?.fdate) return '';
    return `${fmtDate(a.sdate)} – ${fmtDate(a.fdate)}`;
  }

  function fmtDate(d) {
    return d ? new Date(d).toLocaleDateString($locale) : '…';
  }

  /**
   * The Sp row as `availability.ts` reads it. `unit` is this collection's name
   * for the per-unit quantity the engine calls `hm`; without the rename a
   * `perUnit` pool would be sized 1 and read as fully taken by its first loan.
   */
  function asResourceLike(a) {
    return {
      kindOf: a?.kindOf ?? null,
      availability: a?.availability ?? null,
      capacity: a?.capacity ?? null,
      hm: a?.unit ?? null,
      sdate: a?.sdate ?? null,
      fdate: a?.fdate ?? null,
      leadTimeHours: a?.leadTimeHours ?? null,
      granularity: a?.granularity ?? null
    };
  }

  let bookingsBySp = $derived.by(() => {
    /** @type {Map<string, any[]>} */
    const map = new Map();
    for (const b of bookings) {
      if (!b.spId) continue;
      const key = String(b.spId);
      const list = map.get(key);
      if (list) list.push(b);
      else map.set(key, [b]);
    }
    return map;
  });

  /**
   * One line of truth per resource: taken (with when it frees up again), or
   * free once everything that held it has ended.
   *
   * `null` — no badge — in the two cases where there is nothing to say: a
   * resource that giving does not consume (`unlimited`), and one that has
   * never been lent, which is every resource a member adds in this step.
   * @returns {{ text: string, taken: boolean } | null}
   */
  function occupancy(sp) {
    const a = sp?.attributes;
    const resource = asResourceLike(a);
    if (deriveAvailability(resource) === 'unlimited') return null;

    const mine = bookingsBySp.get(String(sp.id)) ?? [];
    if (mine.length === 0) return null;

    const now = new Date();
    const held = mine.filter((b) => isHolding(b, now));
    if (held.length === 0) return { text: $t('offerings.resources.free_now'), taken: false };

    const free = nextFreeFrom(resource, mine, { start: now, end: null }, 1, { now });
    return {
      text: free
        ? $t('offerings.resources.taken_until', { date: fmtDate(free) })
        : $t('offerings.resources.taken_open'),
      taken: true
    };
  }

  /** Only offer the calendar for a resource that actually has dates on it. */
  function hasCalendar(sp) {
    return (bookingsBySp.get(String(sp.id)) ?? []).length > 0;
  }

  /** Suggestions the member has not already turned into a resource. */
  let openProposals = $derived(
    (proposed ?? []).filter(
      (p) => !resources.some((r) => norm(r.attributes?.name) === norm(p.name))
    )
  );
</script>

<div
  dir={$isRtl ? 'rtl' : 'ltr'}
  class="w-full max-w-md mx-auto rounded-2xl bg-white dark:bg-gray-800 shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden"
>
  <div
    class="px-4 py-3 bg-gradient-to-l from-barbi to-mpink text-white flex items-center justify-between gap-2"
  >
    <div>
      <h2 class="text-lg font-bold">🧰 {$t('offerings.resources.title')}</h2>
      <p class="text-xs opacity-80">{$t('offerings.resources.subtitle')}</p>
    </div>
    <button
      class="shrink-0 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-full text-sm font-bold transition-colors"
      onclick={openPicker}
    >
      ➕ {$t('offerings.resources.add')}
    </button>
  </div>

  <div class="p-3 space-y-3 max-h-[24rem] overflow-y-auto">
    {#if error1}
      <p
        class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2"
      >
        {error1}
      </p>
    {/if}

    {#if openProposals.length > 0}
      <div class="rounded-xl bg-gold/20 dark:bg-gold/10 px-3 py-2.5">
        <p class="text-xs font-semibold text-gray-700 dark:text-gray-200">
          {$t('offerings.resources.from_cv')}
        </p>
        <p class="text-[11px] text-gray-600 dark:text-gray-300 mb-2">
          {$t('offerings.resources.from_cv_hint')}
        </p>
        <div class="flex flex-wrap gap-1.5">
          {#each openProposals as p (p.name)}
            <button
              class="text-xs px-2.5 py-1 rounded-full border border-barbi text-barbi hover:bg-barbi hover:text-white transition-colors"
              onclick={() => useProposed(p)}
              disabled={creatingTemplate}
            >
              ➕ {p.name}
            </button>
          {/each}
        </div>
      </div>
    {/if}

    {#if loading}
      <div class="flex justify-center py-4">
        <RingLoader size="40" color="#ff00ae" unit="px" duration="2s"></RingLoader>
      </div>
    {:else if resources.length === 0}
      <p class="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
        {$t('offerings.resources.empty')}
      </p>
    {:else}
      {#each resources as sp (sp.id)}
        {@const a = sp.attributes}
        {@const occ = occupancy(sp)}
        <div
          class="rounded-xl border border-gray-200 dark:border-gray-600 p-3 flex items-start justify-between gap-3"
        >
          <div class="min-w-0">
            <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
              {a.name}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 flex flex-wrap gap-x-2">
              <span>🔁 {$t(shareModeKey(a.kindOf))}</span>
              {#if a.price > 0}<span>💰 {a.price}</span>{/if}
              {#if dateLine(a)}<span>🗓️ {dateLine(a)}</span>{/if}
            </p>
            <p class="mt-1 flex flex-wrap gap-1">
              <span
                class="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
              >
                {$t(scopeKey(a.offerScope))}
              </span>
              {#if !a.mashaabim?.data?.id}
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                  title={$t('offerings.resources.unlinked_hint')}
                >
                  ⚠️ {$t('offerings.resources.unlinked')}
                </span>
              {/if}
              {#if occ}
                <span
                  class="text-[11px] px-2 py-0.5 rounded-full {occ.taken
                    ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'}"
                >
                  {occ.taken ? '⏳' : '✓'}
                  {occ.text}
                </span>
              {/if}
            </p>
          </div>
          <div class="shrink-0 flex items-center gap-1.5">
            {#if busyId === sp.id}
              <RingLoader size="20" color="#ff00ae" unit="px" duration="2s"></RingLoader>
            {:else}
              {#if hasCalendar(sp)}
                <!-- Only shown once the resource has dates on it: a member who
                     just added their first one has nothing to look at, and the
                     link would only lead them out of the onboarding flow. -->
                <a
                  class="text-gray-400 hover:text-barbi transition-colors"
                  title={$t('resources.page.title')}
                  aria-label={$t('resources.page.title')}
                  href={`/me/resources?sp=${sp.id}`}
                >
                  <CalendarDays size={18} aria-hidden="true" />
                </a>
              {/if}
              <button
                class="text-gray-400 hover:text-barbi transition-colors"
                title={$t('offerings.resources.edit')}
                aria-label={$t('offerings.resources.edit')}
                onclick={() => edit(sp)}
              >
                <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M20.71,7.04C21.1,6.65 21.1,6 20.71,5.63L18.37,3.29C18,2.9 17.35,2.9 16.96,3.29L15.12,5.12L18.87,8.87M3,17.25V21H6.75L17.81,9.93L14.06,6.18L3,17.25Z"
                  />
                </svg>
              </button>
              <button
                class="text-gray-400 hover:text-red-500 transition-colors"
                title={$t('offerings.resources.archive')}
                aria-label={$t('offerings.resources.archive')}
                onclick={() => archive(sp)}
              >
                <svg style="width:18px;height:18px" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z"
                  />
                </svg>
              </button>
            {/if}
          </div>
        </div>
      {/each}
    {/if}

    {#if bookings.length > 0}
      <a
        class="inline-flex items-center gap-1.5 text-xs text-barbi hover:underline"
        href="/me/resources"
      >
        <CalendarDays size={14} aria-hidden="true" />
        {$t('resources.page.title')}
      </a>
    {/if}
  </div>
</div>

<!-- Step 1 — which thing? (the mashaabim template the match engine keys on) -->
{#if picking}
  <div
    class="fixed inset-0 z-[1200] bg-black/60 flex items-start justify-center overflow-y-auto p-3"
    role="dialog"
    aria-modal="true"
  >
    <div
      dir={$isRtl ? 'rtl' : 'ltr'}
      class="w-full max-w-md bg-white dark:bg-gray-900 rounded-2xl overflow-hidden my-6"
    >
      <div
        class="px-4 py-3 flex items-center justify-between bg-gradient-to-l from-barbi to-mpink text-white"
      >
        <div>
          <span class="font-bold">{$t('offerings.resources.pick_title')}</span>
          <p class="text-xs opacity-80">{$t('offerings.resources.pick_note')}</p>
        </div>
        <button class="text-xl leading-none" onclick={closePicker} aria-label="✕">✕</button>
      </div>

      <div class="p-3 space-y-3">
        {#if error1}
          <p
            class="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded-xl px-3 py-2"
          >
            {error1}
          </p>
        {/if}

        {#if chosen.length > 0}
          <div class="flex flex-wrap gap-1.5">
            {#each chosen as c (c.id)}
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-barbi text-white flex items-center gap-1.5"
              >
                {c.name}
                <button
                  onclick={() => unpick(c.id)}
                  aria-label={$t('offerings.resource.remove')}
                  class="leading-none">✕</button
                >
              </span>
            {/each}
          </div>
        {/if}

        <input
          type="text"
          bind:value={search}
          placeholder={$t('offerings.resources.search_placeholder')}
          class="w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-gray-100 focus:border-barbi focus:outline-none"
        />

        <div class="max-h-56 overflow-y-auto space-y-1.5">
          {#each matches as row (row.id)}
            <button
              class="w-full text-start rounded-xl border border-gray-200 dark:border-gray-600 px-3 py-2 hover:border-barbi transition-colors flex items-center justify-between gap-2"
              onclick={() => pick(row)}
            >
              <span class="text-sm text-gray-900 dark:text-gray-100"
                >{row.attributes?.name}</span
              >
              {#if takenTemplateIds.has(String(row.id))}
                <span class="text-[11px] text-gray-400"
                  >{$t('offerings.resources.already_have')}</span
                >
              {/if}
            </button>
          {/each}
        </div>

        {#if search.trim() && !exactMatch}
          <button
            class="w-full rounded-xl border-2 border-dashed border-barbi px-3 py-2 text-sm font-semibold text-barbi hover:bg-barbi/5 transition-colors"
            onclick={() => createTemplate(search)}
            disabled={creatingTemplate}
          >
            {creatingTemplate
              ? $t('offerings.resources.creating')
              : $t('offerings.resources.create_new', { name: search.trim() })}
          </button>
        {/if}
      </div>

      <div
        class="p-3 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700"
      >
        <button
          class="w-full py-2.5 bg-gradient-to-r from-barbi to-mpink text-white font-extrabold rounded-xl shadow-md disabled:opacity-50"
          onclick={toForm}
          disabled={chosen.length === 0}
        >
          {$t('offerings.resources.pick_continue')}
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- Step 2 — the details, in the very form the profile uses -->
{#if formNodes.length > 0}
  <div
    class="fixed inset-0 z-[1200] bg-black/60 flex items-start justify-center overflow-y-auto p-3"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-md my-6">
      {#key formKey}
        <Newsp
          needr={[]}
          meData={formNodes}
          onClose={onCreated}
          onRemove={onFormRemove}
        />
      {/key}
      <button
        class="mt-2 w-full text-center text-sm text-white/80 underline"
        onclick={() => {
          formNodes = [];
          expected = 0;
          saved = 0;
        }}
      >
        {$t('offerings.resources.pick_cancel')}
      </button>
    </div>
  </div>
{/if}

<!-- Editing an existing resource — the profile's own form, unchanged -->
{#if editing}
  <div
    class="fixed inset-0 z-[1200] bg-black/60 flex items-start justify-center overflow-y-auto p-3"
    role="dialog"
    aria-modal="true"
  >
    <div class="w-full max-w-md my-6">
      {#key editing.id}
        <Edsp meData={editing} onClose={onEdited} />
      {/key}
      <button
        class="mt-2 w-full text-center text-sm text-white/80 underline"
        onclick={() => (editing = null)}
      >
        {$t('offerings.resources.pick_cancel')}
      </button>
    </div>
  </div>
{/if}
