<script>
  /**
   * The rikma's task board.
   *
   * Replaces `@mediakular/gridcraft` (1.0.5-beta), which this page was the only
   * consumer of. Two things that library made hard are the point of the
   * rewrite:
   *
   *  1. **Paging.** Its `PagingData` class instance could not be proxied by
   *     `$state()`, so the grid's `totalPages` write never reached the footer
   *     and "Next" was disabled on a 51-row table. Every number here derives
   *     from `total` and `perPage` (`$lib/acts/pagination.ts`) — there is no
   *     mutable page count to fall out of sync.
   *  2. **Filters.** Its `filters[]` model needed four hand-synchronised
   *     `is…Active` booleans that reset each other across ~70 lines. Filtering
   *     is now one `$derived`.
   *
   * Surfaces come from a local `--tbl-*` token block (light by default,
   * swapped to the global `--s1`…`--s3` scale under `.dark`) so the table
   * reads correctly in all four theme combinations — personal/business ×
   * light/dark. The Preline theme it replaced hard-coded slate, which fought
   * the inherited gold ink; the global scale alone would not do either, since
   * `html.personal` never defines it and light mode would inherit `:root`'s
   * near-black values.
   */
  import { page } from '$app/state';
  import { t, isRtl } from '$lib/translations';
  import { lang } from '$lib/stores/lang.js';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Dates from '$lib/components/grid/dates.svelte';
  import UrgencyBadge from '$lib/components/grid/urgencyBadge.svelte';
  import ActStatusBadge from './ActStatusBadge.svelte';
  import ActQuickActions from './ActQuickActions.svelte';
  import { getActStatus, getActProgress, ACT_STATUSES } from '$lib/acts/actStatus.js';
  import { pageCount, clampPage, pageSlice, pageRange, pageWindow } from '$lib/acts/pagination.js';

  /**
   * @typedef {Object} Props
   * @property {Array<any>} [acts] - Act rows, raw Strapi (`{id, attributes}`) or already flat.
   * @property {string} [projectId] - Defaults to the route param.
   * @property {(payload: { id: any; kind: string }) => void} [onTaskClick] - A mission/pendm/open-mission chip was clicked.
   * @property {(row: any) => void} [onRowClick] - The row itself was clicked.
   * @property {(() => void) | undefined} [onCreateClick] - The create-task button.
   */

  /** @type {Props} */
  let { acts = [], projectId, onTaskClick, onRowClick, onCreateClick } = $props();

  let pid = $derived(String(projectId ?? page.params.projectId ?? ''));
  let myid = $derived(String(page.data?.uid ?? ''));

  const AVATAR_FALLBACK =
    'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';

  // ── Normalisation ────────────────────────────────────────────────────────
  // Rows arrive either as raw Strapi entities or already flattened, depending
  // on the caller. The old component flattened in place by reassigning its own
  // `$bindable` prop from inside an `$effect` — which meant the parent's array
  // was rewritten as a side effect of rendering. Derive instead.

  /** @param {any[]} list */
  function normalize(list) {
    if (!Array.isArray(list)) return [];
    return list
      .map((item) => {
        if (!item?.id) return null;
        const attributes = item.attributes ?? item;
        return {
          ...attributes,
          id: item.id,
          vali: attributes.vali ?? { data: null },
          my: attributes.my ?? { data: [] },
          mesimabetahaliches: attributes.mesimabetahaliches ?? { data: [] },
          tafkidims: attributes.tafkidims ?? { data: [] },
          pendm: attributes.pendm ?? { data: null },
          open_mission: attributes.open_mission ?? { data: null }
        };
      })
      .filter(Boolean);
  }

  /**
   * Optimistic edits from the quick actions, keyed by act id.
   *
   * Kept beside the server rows rather than written into them: `acts` is the
   * parent's data, and a failed action has to roll back cleanly.
   */
  let patches = $state(/** @type {Record<string, any>} */ ({}));

  let rows = $derived(
    normalize(acts).map((row) => {
      const patch = patches[String(row.id)];
      return patch ? { ...row, ...patch } : row;
    })
  );

  function applyPatch(row, patch) {
    const key = String(row?.id ?? '');
    if (!key) return;
    patches = { ...patches, [key]: { ...(patches[key] ?? {}), ...patch } };
  }

  // ── Filtering ────────────────────────────────────────────────────────────
  let query = $state('');
  let statusFilter = $state('all');
  let ownerFilter = $state('all');
  let roleFilter = $state('all');

  /** Roles that appear on acts nobody has taken — the ones worth filtering by. */
  let roleOptions = $derived.by(() => {
    /** @type {{id:string,name:string,count:number}[]} */
    const out = [];
    const byId = new Map();
    for (const row of rows) {
      if (row.isAssigned) continue;
      for (const role of row.tafkidims?.data ?? []) {
        const id = String(role?.id ?? '');
        if (!id) continue;
        if (byId.has(id)) {
          byId.get(id).count += 1;
          continue;
        }
        const attrs = role?.attributes ?? {};
        // Role names are authored in the default locale; Hebrew lives in
        // `localizations`.
        const name =
          ($lang === 'he' && attrs?.localizations?.data?.[0]?.attributes?.roleDescription) ||
          attrs?.roleDescription ||
          '';
        const entry = { id, name, count: 1 };
        byId.set(id, entry);
        out.push(entry);
      }
    }
    return out.filter((r) => r.name);
  });

  /** How many rows sit in each lane, for the filter chips' counters. */
  let statusCounts = $derived.by(() => {
    /** @type {Record<string, number>} */
    const counts = {};
    for (const lane of ACT_STATUSES) counts[lane] = 0;
    for (const row of rows) counts[getActStatus(row)] += 1;
    return counts;
  });

  /** Free-text haystack: name, description text, assignee, creator, mission. */
  function haystack(row) {
    const parts = [
      row.shem ?? '',
      String(row.des ?? '').replace(/<[^>]*>/g, ' '),
      row.vali?.data?.attributes?.username ?? '',
      ...(row.my?.data ?? []).map((u) => u?.attributes?.username ?? ''),
      ...(row.mesimabetahaliches?.data ?? []).map((m) => m?.attributes?.name ?? ''),
      row.pendm?.data?.attributes?.name ?? '',
      row.open_mission?.data?.attributes?.name ?? ''
    ];
    return parts.join(' ').toLowerCase();
  }

  let filtered = $derived.by(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== 'all' && getActStatus(row) !== statusFilter) return false;

      if (ownerFilter === 'mine') {
        if (!(row.my?.data ?? []).some((u) => String(u?.id ?? '') === myid)) return false;
      } else if (ownerFilter === 'created') {
        if (String(row.vali?.data?.id ?? '') !== myid) return false;
      }

      if (roleFilter !== 'all') {
        const onRole = (row.tafkidims?.data ?? []).some((r) => String(r?.id ?? '') === roleFilter);
        if (!onRole || row.isAssigned) return false;
      }

      if (q && !haystack(row).includes(q)) return false;
      return true;
    });
  });

  let hasFilters = $derived(
    query.trim() !== '' || statusFilter !== 'all' || ownerFilter !== 'all' || roleFilter !== 'all'
  );

  function clearFilters() {
    query = '';
    statusFilter = 'all';
    ownerFilter = 'all';
    roleFilter = 'all';
  }

  // ── Sorting ──────────────────────────────────────────────────────────────
  /** `''` keeps the order the server sent, which is what the old grid did. */
  let sortKey = $state('');
  let sortDir = $state(1);

  const URGENCY_RANK = { red: 3, yellow: 2, green: 1, white: 0 };

  const SORT_VALUE = {
    shem: (row) => (row.shem ?? '').toLowerCase(),
    hashivut: (row) => URGENCY_RANK[row.hashivut ?? 'white'] ?? 0,
    status: (row) => ACT_STATUSES.indexOf(getActStatus(row)),
    vali: (row) => (row.vali?.data?.attributes?.username ?? '').toLowerCase(),
    my: (row) => (row.my?.data?.[0]?.attributes?.username ?? '').toLowerCase(),
    // Undated rows sort last in both directions rather than pretending to be
    // 1970 (ascending) or the far future (descending).
    date: (row) => (row.dateS ? new Date(row.dateS).getTime() : Number.NaN)
  };

  let sorted = $derived.by(() => {
    if (!sortKey || !SORT_VALUE[sortKey]) return filtered;
    const value = SORT_VALUE[sortKey];
    return [...filtered].sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      const aMissing = av === '' || (typeof av === 'number' && Number.isNaN(av));
      const bMissing = bv === '' || (typeof bv === 'number' && Number.isNaN(bv));
      if (aMissing && bMissing) return 0;
      if (aMissing) return 1;
      if (bMissing) return -1;
      if (av < bv) return -1 * sortDir;
      if (av > bv) return 1 * sortDir;
      return 0;
    });
  });

  function toggleSort(key) {
    if (sortKey === key) {
      // name ▲ → name ▼ → back to the server's order.
      if (sortDir === 1) sortDir = -1;
      else {
        sortKey = '';
        sortDir = 1;
      }
    } else {
      sortKey = key;
      sortDir = 1;
    }
  }

  // ── Paging ───────────────────────────────────────────────────────────────
  const PER_PAGE_OPTIONS = [10, 20, 50, 100];
  let perPage = $state(20);
  let requestedPage = $state(1);

  let totalPages = $derived(pageCount(sorted.length, perPage));
  /** Clamped on read, so a shrinking filter can never strand the view. */
  let currentPage = $derived(clampPage(requestedPage, totalPages));
  let visible = $derived(pageSlice(sorted, currentPage, perPage));
  let range = $derived(pageRange(currentPage, perPage, sorted.length));
  let pageButtons = $derived(pageWindow(currentPage, totalPages));

  // Narrowing the list should take you back to the top of it, not leave you on
  // a page number that now means something else.
  $effect(() => {
    query;
    statusFilter;
    ownerFilter;
    roleFilter;
    perPage;
    requestedPage = 1;
  });

  function goToPage(p) {
    requestedPage = clampPage(p, totalPages);
  }

  // ── Row helpers ──────────────────────────────────────────────────────────
  /**
   * A mission chip on the row. Mirrors the kind/id resolution the old grid did
   * inline, so `onTaskClick` keeps receiving what `moachStore.openModal`
   * expects (see also `Kanbanboard.svelte`).
   */
  function missionChip(row) {
    const mid = row.mesimabetahaliches?.data?.[0];
    if (mid?.id) return { kind: 'betha', id: mid.id, name: mid.attributes?.name ?? '' };
    const open = row.open_mission?.data;
    if (open?.id) return { kind: 'openM', id: open.id, name: open.attributes?.name ?? '' };
    const pend = row.pendm?.data;
    if (pend?.id) return { kind: 'pendm', id: pend.id, name: pend.attributes?.name ?? '' };
    return null;
  }

  function assignee(row) {
    const user = row.my?.data?.[0];
    if (!user) return null;
    return {
      id: user.id,
      name: user.attributes?.username ?? '',
      pic: user.attributes?.profilePic?.data?.attributes?.url || AVATAR_FALLBACK
    };
  }

  function creator(row) {
    const user = row.vali?.data;
    if (!user) return null;
    return {
      id: user.id,
      name: user.attributes?.username ?? '',
      pic: user.attributes?.profilePic?.data?.attributes?.url || AVATAR_FALLBACK
    };
  }

  function rowRoles(row) {
    return (row.tafkidims?.data ?? [])
      .map((r) => {
        const attrs = r?.attributes ?? {};
        return (
          ($lang === 'he' && attrs?.localizations?.data?.[0]?.attributes?.roleDescription) ||
          attrs?.roleDescription ||
          ''
        );
      })
      .filter(Boolean);
  }

  const COLUMNS = [
    { key: 'shem', labelKey: 'mission.actsTable.name', sortable: true },
    { key: 'status', labelKey: 'mission.actsTable.status', sortable: true },
    { key: 'hashivut', labelKey: 'mission.actsTable.urgency', sortable: true },
    { key: 'my', labelKey: 'mission.actsTable.assignedTo', sortable: true },
    { key: 'des', labelKey: 'mission.actsTable.description', sortable: false },
    { key: 'vali', labelKey: 'mission.actsTable.createdBy', sortable: true },
    { key: 'date', labelKey: 'mission.actsTable.date', sortable: true },
    { key: 'actions', labelKey: 'mission.actsTable.actions', sortable: false }
  ];
</script>

<div class="acts" dir={$isRtl ? 'rtl' : 'ltr'}>
  <!-- ── Toolbar ────────────────────────────────────────────────────── -->
  <div class="acts__toolbar">
    <div class="acts__search">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
      </svg>
      <input
        type="search"
        bind:value={query}
        placeholder={$t('mission.actsTable.searchPlaceholder')}
        aria-label={$t('mission.actsTable.searchPlaceholder')}
      />
    </div>

    <div class="acts__toolbar-end">
      {#if hasFilters}
        <button type="button" class="acts__clear" onclick={clearFilters}>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
          {$t('mission.actsTable.clearFilters')}
        </button>
      {/if}
      {#if onCreateClick}
        <button type="button" class="acts__create" onclick={onCreateClick}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" aria-hidden="true">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {$t('mission.actsTable.newTask')}
        </button>
      {/if}
    </div>
  </div>

  <!-- ── Filter chips ───────────────────────────────────────────────── -->
  <div class="acts__chips" role="group" aria-label={$t('mission.actsTable.filterByStatus')}>
    <button
      type="button"
      class="chip"
      class:chip--on={statusFilter === 'all' && ownerFilter === 'all' && roleFilter === 'all'}
      onclick={clearFilters}
    >
      {$t('mission.actsTable.allStatuses')}
      <span class="chip__count">{rows.length}</span>
    </button>

    <button
      type="button"
      class="chip"
      class:chip--on={ownerFilter === 'mine'}
      onclick={() => (ownerFilter = ownerFilter === 'mine' ? 'all' : 'mine')}
    >
      {$t('mission.actsTable.myTasks')}
    </button>
    <button
      type="button"
      class="chip"
      class:chip--on={ownerFilter === 'created'}
      onclick={() => (ownerFilter = ownerFilter === 'created' ? 'all' : 'created')}
    >
      {$t('mission.actsTable.myCreatedTasks')}
    </button>

    <span class="acts__chip-sep" aria-hidden="true"></span>

    {#each ACT_STATUSES as lane (lane)}
      {#if statusCounts[lane] > 0}
        <button
          type="button"
          class="chip"
          class:chip--on={statusFilter === lane}
          aria-pressed={statusFilter === lane}
          onclick={() => (statusFilter = statusFilter === lane ? 'all' : lane)}
        >
          <ActStatusBadge status={lane} />
          <span class="chip__count">{statusCounts[lane]}</span>
        </button>
      {/if}
    {/each}

    {#if roleOptions.length}
      <span class="acts__chip-sep" aria-hidden="true"></span>
      {#each roleOptions as role (role.id)}
        <button
          type="button"
          class="chip chip--role"
          class:chip--on={roleFilter === role.id}
          aria-pressed={roleFilter === role.id}
          onclick={() => (roleFilter = roleFilter === role.id ? 'all' : role.id)}
        >
          {role.name}
          <span class="chip__count">{role.count}</span>
        </button>
      {/each}
    {/if}
  </div>

  {#if visible.length === 0}
    <!-- ── Empty ────────────────────────────────────────────────────── -->
    <div class="acts__empty">
      <svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M9 4h6a2 2 0 0 1 2 2v1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h2V6a2 2 0 0 1 2-2z" />
        <path d="m9 14 2 2 4-4" />
      </svg>
      <p class="acts__empty-title">
        {hasFilters ? $t('mission.actsTable.emptyFilteredTitle') : $t('mission.actsTable.emptyTitle')}
      </p>
      <p class="acts__empty-desc">
        {hasFilters ? $t('mission.actsTable.emptyFilteredDesc') : $t('mission.actsTable.emptyDesc')}
      </p>
      {#if hasFilters}
        <button type="button" class="acts__clear" onclick={clearFilters}>
          {$t('mission.actsTable.clearFilters')}
        </button>
      {/if}
    </div>
  {:else}
    <!-- ── Desktop table ────────────────────────────────────────────── -->
    <div class="acts__scroll">
      <table class="acts__table">
        <thead>
          <tr>
            {#each COLUMNS as col (col.key)}
              <th scope="col" class="acts__th acts__th--{col.key}">
                {#if col.sortable}
                  <button
                    type="button"
                    class="acts__sort"
                    class:acts__sort--on={sortKey === col.key}
                    aria-label={$t('mission.actsTable.sortBy', { column: $t(col.labelKey) })}
                    onclick={() => toggleSort(col.key)}
                  >
                    {$t(col.labelKey)}
                    <svg
                      class="acts__caret"
                      class:acts__caret--desc={sortKey === col.key && sortDir === -1}
                      viewBox="0 0 24 24" width="12" height="12" fill="none"
                      stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"
                      aria-hidden="true"
                    >
                      <path d="m6 15 6-6 6 6" />
                    </svg>
                  </button>
                {:else}
                  <span>{$t(col.labelKey)}</span>
                {/if}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each visible as row (row.id)}
            {@const chip = missionChip(row)}
            {@const who = assignee(row)}
            {@const by = creator(row)}
            {@const roles = rowRoles(row)}
            {@const progress = getActProgress(row)}
            <tr
              class="acts__row"
              tabindex="0"
              role="button"
              aria-label={row.shem ?? $t('mission.actsTable.openTask')}
              onclick={() => onRowClick?.(row)}
              onkeydown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onRowClick?.(row);
                }
              }}
            >
              <td class="acts__td acts__td--name">
                <span class="acts__name">{row.shem}</span>
                {#if chip}
                  <button
                    type="button"
                    class="acts__mission"
                    onclick={(e) => {
                      e.stopPropagation();
                      onTaskClick?.({ id: chip.id, kind: chip.kind });
                    }}
                  >
                    {chip.name}
                  </button>
                {/if}
              </td>

              <td class="acts__td">
                <ActStatusBadge {row} />
                {#if progress > 0 && progress < 100}
                  <span class="acts__progress" aria-label="{progress}%">
                    <span class="acts__progress-bar" style="width:{progress}%"></span>
                  </span>
                {/if}
              </td>

              <td class="acts__td"><UrgencyBadge value={row.hashivut || 'white'} /></td>

              <td class="acts__td">
                {#if who}
                  <span class="acts__person">
                    <img src={who.pic} alt="" loading="lazy" />
                    <span>{who.name}</span>
                  </span>
                {:else if roles.length}
                  <span class="acts__roles">
                    {#each roles as role (role)}<span class="acts__role">{role}</span>{/each}
                  </span>
                {:else}
                  <span class="acts__muted">—</span>
                {/if}
              </td>

              <td class="acts__td acts__td--des">
                <RichText outpot={row.des} editable={false} sml={true} minw={true} trans={true} />
              </td>

              <td class="acts__td">
                {#if by}
                  <span class="acts__person">
                    <img src={by.pic} alt="" loading="lazy" />
                    <span>{by.name}</span>
                  </span>
                {:else}
                  <span class="acts__muted">—</span>
                {/if}
              </td>

              <td class="acts__td"><Dates value={row.dateS} value2={row.dateF} /></td>

              <td class="acts__td acts__td--actions">
                <ActQuickActions
                  {row}
                  projectId={pid}
                  viewerId={myid}
                  onPatched={applyPatch}
                  onAssign={(r) => onTaskClick?.({ id: r.id, kind: 'assign' })}
                  compact={true}
                />
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- ── Mobile cards ─────────────────────────────────────────────── -->
    <ul class="acts__cards">
      {#each visible as row (row.id)}
        {@const chip = missionChip(row)}
        {@const who = assignee(row)}
        {@const roles = rowRoles(row)}
        <li>
          <div
            class="acts__card"
            role="button"
            tabindex="0"
            onclick={() => onRowClick?.(row)}
            onkeydown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onRowClick?.(row);
              }
            }}
          >
            <div class="acts__card-top">
              <span class="acts__name">{row.shem}</span>
              <UrgencyBadge value={row.hashivut || 'white'} />
            </div>

            <div class="acts__card-meta">
              <ActStatusBadge {row} />
              {#if chip}
                <button
                  type="button"
                  class="acts__mission"
                  onclick={(e) => {
                    e.stopPropagation();
                    onTaskClick?.({ id: chip.id, kind: chip.kind });
                  }}
                >
                  {chip.name}
                </button>
              {/if}
            </div>

            <div class="acts__card-row">
              {#if who}
                <span class="acts__person">
                  <img src={who.pic} alt="" loading="lazy" />
                  <span>{who.name}</span>
                </span>
              {:else if roles.length}
                <span class="acts__roles">
                  {#each roles as role (role)}<span class="acts__role">{role}</span>{/each}
                </span>
              {/if}
              <Dates value={row.dateS} value2={row.dateF} />
            </div>

            <ActQuickActions
              {row}
              projectId={pid}
              viewerId={myid}
              onPatched={applyPatch}
              onAssign={(r) => onTaskClick?.({ id: r.id, kind: 'assign' })}
            />
          </div>
        </li>
      {/each}
    </ul>

    <!-- ── Pager ────────────────────────────────────────────────────── -->
    <div class="acts__pager">
      <div class="acts__pager-info">
        <label class="acts__per-page">
          <span>{$t('mission.actsTable.perPage')}</span>
          <select bind:value={perPage}>
            {#each PER_PAGE_OPTIONS as option (option)}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
        <span class="acts__muted">
          {$t('mission.actsTable.showingRange', {
            from: range.from,
            to: range.to,
            total: range.total
          })}
        </span>
      </div>

      {#if totalPages > 1}
        <nav class="acts__pages" aria-label={$t('mission.actsTable.pageOf', { page: currentPage, pages: totalPages })}>
          <button
            type="button"
            class="acts__page acts__page--step"
            disabled={currentPage === 1}
            aria-label={$t('mission.actsTable.prevPage')}
            onclick={() => goToPage(currentPage - 1)}
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d={$isRtl ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} />
            </svg>
            <span class="acts__step-label">{$t('mission.actsTable.prevPage')}</span>
          </button>

          {#each pageButtons as item, i (typeof item === 'number' ? `p${item}` : `g${i}`)}
            {#if item === 'gap'}
              <span class="acts__gap" aria-hidden="true">…</span>
            {:else}
              <button
                type="button"
                class="acts__page"
                class:acts__page--on={item === currentPage}
                aria-current={item === currentPage ? 'page' : undefined}
                aria-label={$t('mission.actsTable.goToPage', { page: item })}
                onclick={() => goToPage(item)}
              >
                {item}
              </button>
            {/if}
          {/each}

          <button
            type="button"
            class="acts__page acts__page--step"
            disabled={currentPage === totalPages}
            aria-label={$t('mission.actsTable.nextPage')}
            onclick={() => goToPage(currentPage + 1)}
          >
            <span class="acts__step-label">{$t('mission.actsTable.nextPage')}</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <path d={$isRtl ? 'm15 6-6 6 6 6' : 'm9 6 6 6-6 6'} />
            </svg>
          </button>
        </nav>
      {/if}
    </div>
  {/if}
</div>

<style>
  /* ── Surface tokens ────────────────────────────────────────────────
     Deliberately local rather than the global `--s1/--s2/--s3` scale.
     Those are defined on `:root` (dark) and on `html.business`, but NOT on
     `html.personal` — so a personal-theme visitor in light mode inherits the
     near-black `:root` values and this table would render as a black slab on
     a pale page. Light is the default here and `.dark` opts into the global
     scale, which is correct for personal.dark and business.dark alike. */
  .acts {
    --tbl-bg: #ffffff;
    --tbl-surface: #f6f7f9;
    --tbl-raised: #eceef2;
    --tbl-line: rgba(15, 23, 42, 0.1);
    --tbl-line-on: rgba(15, 23, 42, 0.28);
    --tbl-ink: #1f2937;
    --tbl-muted: #5b6676; /* 5.7:1 on --tbl-bg */
    --tbl-accent: var(--goldink); /* the token whose stated job is ink on light */
    --tbl-on-accent: #ffffff;
    --tbl-tint: rgba(15, 23, 42, 0.04);
    --tbl-link: #be185d; /* 6.2:1 on white */
    --tbl-r: 14px;
    --tbl-rl: 22px;

    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem;
    color: var(--tbl-ink);
    background: var(--tbl-bg);
    border: 1px solid var(--tbl-line);
    border-radius: var(--tbl-rl);
  }

  :global(.dark) .acts {
    --tbl-bg: var(--s1);
    --tbl-surface: var(--s2);
    --tbl-raised: var(--s3);
    --tbl-line: rgba(255, 255, 255, 0.08);
    --tbl-line-on: var(--border-g);
    --tbl-ink: var(--text);
    --tbl-muted: var(--tm);
    --tbl-accent: var(--gold-l);
    --tbl-on-accent: var(--s1);
    --tbl-tint: var(--gold-dd);
    --tbl-link: var(--pink-l);
  }

  /* ── Toolbar ───────────────────────────────────────────────────── */
  .acts__toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.5rem;
  }

  .acts__search {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1 1 16rem;
    min-width: 0;
    padding: 0.45rem 0.75rem;
    background: var(--tbl-surface);
    border: 1px solid var(--tbl-line);
    border-radius: 999px;
    color: var(--tbl-muted);
  }

  .acts__search input {
    flex: 1;
    min-width: 0;
    background: transparent;
    border: 0;
    outline: none;
    color: var(--tbl-ink);
    font-size: 0.85rem;
  }

  .acts__search:focus-within {
    border-color: var(--tbl-line-on);
  }

  .acts__toolbar-end {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: none;
  }

  .acts__create {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.85rem;
    border-radius: 999px;
    font-size: 0.82rem;
    font-weight: 700;
    background: var(--tbl-accent);
    color: var(--tbl-bg);
    border: 1px solid transparent;
    cursor: pointer;
    transition: filter 0.15s ease;
  }

  .acts__create:hover { filter: brightness(1.08); }

  .acts__clear {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    padding: 0.4rem 0.7rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--tbl-muted);
    background: transparent;
    border: 1px solid var(--tbl-line);
    cursor: pointer;
  }

  .acts__clear:hover { color: var(--tbl-ink); border-color: var(--tbl-line-on); }

  /* ── Chips ─────────────────────────────────────────────────────── */
  .acts__chips {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    overflow-x: auto;
    padding-bottom: 0.15rem;
    scrollbar-width: thin;
  }

  .acts__chip-sep {
    width: 1px;
    height: 1.25rem;
    background: var(--tbl-line);
    flex: none;
  }

  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    flex: none;
    padding: 0.3rem 0.6rem;
    border-radius: 999px;
    font-size: 0.78rem;
    font-weight: 600;
    white-space: nowrap;
    color: var(--tbl-muted);
    background: var(--tbl-surface);
    border: 1px solid var(--tbl-line);
    cursor: pointer;
    transition: border-color 0.15s ease, color 0.15s ease;
  }

  .chip:hover { color: var(--tbl-ink); }

  .chip--on {
    color: var(--tbl-ink);
    border-color: var(--tbl-line-on);
    background: var(--tbl-tint);
  }

  .chip__count {
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.05rem 0.35rem;
    border-radius: 999px;
    background: var(--tbl-raised);
    color: var(--tbl-muted);
  }

  /* ── Table ─────────────────────────────────────────────────────── */
  .acts__scroll {
    display: none;
    overflow-x: auto;
    border-radius: var(--tbl-r);
    border: 1px solid var(--tbl-line);
  }

  @media (min-width: 900px) {
    .acts__scroll { display: block; }
    .acts__cards { display: none; }
  }

  .acts__table {
    width: 100%;
    border-collapse: separate;
    border-spacing: 0;
    font-size: 0.82rem;
  }

  .acts__th {
    position: sticky;
    top: 0;
    z-index: 2;
    text-align: start;
    padding: 0.6rem 0.75rem;
    background: var(--tbl-surface);
    border-bottom: 1px solid var(--tbl-line);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--tbl-muted);
    white-space: nowrap;
  }

  .acts__th--actions { text-align: end; }

  .acts__sort {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    background: none;
    border: 0;
    padding: 0;
    font: inherit;
    color: inherit;
    letter-spacing: inherit;
    text-transform: inherit;
    cursor: pointer;
  }

  .acts__sort:hover { color: var(--tbl-ink); }
  .acts__sort--on { color: var(--tbl-accent); }

  .acts__caret {
    opacity: 0;
    transition: transform 0.15s ease, opacity 0.15s ease;
  }

  .acts__sort:hover .acts__caret { opacity: 0.5; }
  .acts__sort--on .acts__caret { opacity: 1; }
  .acts__caret--desc { transform: rotate(180deg); }

  .acts__row {
    cursor: pointer;
    transition: background-color 0.12s ease;
  }

  .acts__row:nth-child(odd) { background: color-mix(in srgb, var(--tbl-surface) 45%, transparent); }
  .acts__row:hover { background: var(--tbl-raised); }
  .acts__row:focus-visible {
    outline: 2px solid var(--tbl-accent);
    outline-offset: -2px;
  }

  .acts__td {
    padding: 0.55rem 0.75rem;
    border-bottom: 1px solid var(--tbl-line);
    vertical-align: middle;
  }

  .acts__td--name { max-width: 16rem; }
  .acts__td--des { max-width: 22rem; color: var(--tbl-muted); }
  .acts__td--actions { text-align: end; white-space: nowrap; }

  .acts__name {
    display: block;
    font-weight: 600;
    color: var(--tbl-ink);
    overflow-wrap: anywhere;
  }

  .acts__mission {
    display: inline-block;
    margin-top: 0.15rem;
    font-size: 0.72rem;
    font-weight: 600;
    color: var(--tbl-link);
    background: none;
    border: 0;
    padding: 0;
    cursor: pointer;
  }

  .acts__mission:hover { text-decoration: underline; }

  .acts__person {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    min-width: 0;
  }

  .acts__person img {
    width: 1.6rem;
    height: 1.6rem;
    border-radius: 999px;
    object-fit: cover;
    flex: none;
  }

  .acts__roles { display: inline-flex; flex-wrap: wrap; gap: 0.25rem; }

  .acts__role {
    font-size: 0.68rem;
    font-weight: 600;
    padding: 0.1rem 0.4rem;
    border-radius: 999px;
    color: var(--tbl-muted);
    background: var(--tbl-raised);
  }

  .acts__muted { color: var(--tbl-muted); }

  .acts__progress {
    display: block;
    margin-top: 0.3rem;
    height: 3px;
    width: 100%;
    max-width: 5rem;
    border-radius: 999px;
    background: var(--tbl-raised);
    overflow: hidden;
  }

  .acts__progress-bar {
    display: block;
    height: 100%;
    background: var(--tbl-accent);
  }

  /* ── Cards (below 900px) ───────────────────────────────────────── */
  .acts__cards {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    list-style: none;
    margin: 0;
    padding: 0;
  }

  .acts__card {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
    background: var(--tbl-surface);
    border: 1px solid var(--tbl-line);
    border-radius: var(--tbl-r);
    cursor: pointer;
  }

  .acts__card:focus-visible {
    outline: 2px solid var(--tbl-accent);
    outline-offset: 2px;
  }

  .acts__card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .acts__card-meta,
  .acts__card-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.5rem;
    font-size: 0.78rem;
    color: var(--tbl-muted);
  }

  .acts__card-row { justify-content: space-between; }

  /* ── Empty ─────────────────────────────────────────────────────── */
  .acts__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    padding: 3rem 1rem;
    text-align: center;
    color: var(--tbl-muted);
  }

  .acts__empty-title {
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--tbl-ink);
  }

  .acts__empty-desc { font-size: 0.82rem; max-width: 28rem; }

  /* ── Pager ─────────────────────────────────────────────────────── */
  .acts__pager {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.6rem;
    font-size: 0.78rem;
    color: var(--tbl-muted);
  }

  .acts__pager-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .acts__per-page {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
  }

  .acts__per-page select {
    padding: 0.25rem 0.45rem;
    border-radius: 8px;
    background: var(--tbl-surface);
    color: var(--tbl-ink);
    border: 1px solid var(--tbl-line);
    font-size: 0.78rem;
  }

  .acts__pages {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    flex-wrap: wrap;
  }

  .acts__page {
    min-width: 2rem;
    height: 2rem;
    padding: 0 0.5rem;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.25rem;
    border-radius: 8px;
    font-size: 0.78rem;
    font-weight: 600;
    color: var(--tbl-muted);
    background: var(--tbl-surface);
    border: 1px solid var(--tbl-line);
    cursor: pointer;
    transition: color 0.12s ease, border-color 0.12s ease;
  }

  .acts__page:hover:not(:disabled) { color: var(--tbl-ink); border-color: var(--tbl-line-on); }

  .acts__page--on {
    color: var(--tbl-bg);
    background: var(--tbl-accent);
    border-color: var(--tbl-accent);
  }

  .acts__page:disabled { opacity: 0.4; cursor: default; }

  .acts__page:focus-visible {
    outline: 2px solid var(--tbl-accent);
    outline-offset: 2px;
  }

  .acts__gap { padding: 0 0.15rem; color: var(--tbl-muted); }

  /* The step buttons keep their words on desktop and shed them on phones,
     where the arrow alone is unambiguous and the row has to fit. */
  .acts__step-label { display: none; }

  @media (min-width: 640px) {
    .acts__step-label { display: inline; }
  }

  @media (prefers-reduced-motion: reduce) {
    .acts__row,
    .acts__page,
    .chip,
    .acts__caret,
    .acts__create { transition: none; }
  }
</style>
