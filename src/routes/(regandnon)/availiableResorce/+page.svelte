<script lang="ts">
  import { page } from '$app/state';
  import DiscoveryMap from '$lib/components/location/DiscoveryMap.svelte';
  import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';
  import { LAYER_COLORS, type MapItem, type MapLayer } from '$lib/map/discoveryTypes';
  import { t, isRtl } from '$lib/translations';
  import { Head } from 'svead';

  let { data } = $props();

  type ResourceCard = (typeof data.resources)[number];

  let search = $state('');
  let concierge = $state(false);
  let kindFilter = $state<string | null>(null);
  let selected = $state<MapItem | null>(null);
  let mapComponent = $state<ReturnType<typeof DiscoveryMap>>();

  /** The kinds actually present in the data — quick-filter chips. */
  const kinds = $derived.by(() => {
    const counts = new Map<string, number>();
    for (const r of data.resources as ResourceCard[]) {
      if (r.kindOf) counts.set(r.kindOf, (counts.get(r.kindOf) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
  });

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return (data.resources as ResourceCard[]).filter((r) => {
      if (concierge && !r.concierge) return false;
      if (kindFilter && r.kindOf !== kindFilter) return false;
      if (!q) return true;
      return [r.name, r.excerpt, r.projectName, r.hint, r.kindOf]
        .some((s) => (s ?? '').toLowerCase().includes(q));
    });
  });

  const filteredIds = $derived(new Set(filtered.map((r) => r.id)));

  const mapLayers = $derived.by<MapLayer[]>(() => [
    {
      id: 'resources',
      color: LAYER_COLORS.resources,
      items: (data.mapItems as MapItem[]).filter(
        (i) => i.lat !== null && filteredIds.has(i.id)
      )
    }
  ]);

  const locatedCount = $derived(mapLayers[0].items.length);

  function pickOnMap(r: ResourceCard) {
    const item = mapLayers[0].items.find((i) => i.id === r.id);
    if (item) {
      selected = item;
      mapComponent?.flyTo(item);
    }
  }

  function demandHref(r: ResourceCard | null): string {
    const base = '/demand?lens=supply&off=missions';
    return r && r.lat !== null ? `${base}&c=${r.lng},${r.lat},12` : base;
  }
</script>

<Head
  url={page.url.href}
  title={$t('discover.resources_title')}
  description={$t('discover.resources_subtitle')}
/>

<div class="directory" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <DiscoveryNav current="resources" />
    <h1>📦 {$t('discover.resources_title')}</h1>
    <p class="sub">{$t('discover.resources_subtitle')}</p>

    <div class="controls">
      <input
        type="search"
        placeholder={$t('discover.resources_search_ph')}
        bind:value={search}
      />
      <div class="filter-chips" role="group" aria-label={$t('discover.resources_title')}>
        <button class:active={!concierge} onclick={() => (concierge = false)}>
          {$t('discover.filter_all')} <span class="count">{data.resources.length}</span>
        </button>
        <button class:active={concierge} onclick={() => (concierge = true)}>
          🪄 {$t('discover.filter_concierge')}
        </button>
      </div>
    </div>

    {#if kinds.length}
      <div class="kind-chips">
        {#each kinds as [kind, count] (kind)}
          <button
            class="kind"
            class:active={kindFilter === kind}
            onclick={() => (kindFilter = kindFilter === kind ? null : kind)}
          >
            {kind} <span class="count">{count}</span>
          </button>
        {/each}
      </div>
    {/if}
  </header>

  {#if locatedCount > 0}
    <div class="map-wrap">
      <DiscoveryMap
        bind:this={mapComponent}
        layers={mapLayers}
        visibleLayerIds={['resources']}
        height="min(44vh, 380px)"
        onSelect={(item) => (selected = item)}
      />
      {#if selected}
        <aside class="selected-card" aria-live="polite">
          <div class="card-head">
            <span aria-hidden="true">📦</span>
            <strong>{selected.title}</strong>
            <button class="close" onclick={() => (selected = null)} aria-label="✕">✕</button>
          </div>
          {#if selected.hint}
            <p class="hint">📍 {selected.hint}</p>
          {/if}
          <a class="cta" href={selected.href}>{$t('discover.resources_apply')}</a>
        </aside>
      {/if}
      <p class="map-note">
        <a href={demandHref(null)}>🗺️ {$t('discover.to_full_map')}</a>
      </p>
    </div>
  {/if}

  {#if filtered.length === 0}
    <p class="empty">{$t('discover.resources_empty')}</p>
  {/if}

  <ul class="cards">
    {#each filtered as r (r.id)}
      <li class="card">
        <a class="card-link" href={`/availiableResorce/${r.id}`}>
          <div class="card-top">
            {#if r.projectPicUrl}
              <img class="avatar" src={r.projectPicUrl} alt="" loading="lazy" />
            {:else}
              <div class="avatar fallback" aria-hidden="true">📦</div>
            {/if}
            <div class="top-text">
              <h2>{r.name}</h2>
              {#if r.projectName}
                <p class="proj-name">🧶 {r.projectName}</p>
              {/if}
            </div>
            {#if r.price}
              <div class="value">
                <strong>{r.price}</strong>
                {#if r.recurring}
                  <span>{$t('discover.resources_recurring')}</span>
                {/if}
              </div>
            {/if}
          </div>
          {#if r.excerpt}
            <p class="desc">{r.excerpt}</p>
          {/if}
          <div class="badges">
            {#if r.kindOf}
              <span class="badge kind-badge">{r.kindOf}</span>
            {/if}
            {#if r.concierge}
              <span class="badge concierge">🪄 {$t('discover.concierge_badge')}</span>
            {/if}
            {#if r.isOnline}
              <span class="badge">🌐 {$t('discover.online_badge')}</span>
            {:else if r.hint}
              <span class="badge">📍 {r.hint}</span>
            {/if}
            {#if r.howMany && r.howMany > 1}
              <span class="badge">×{r.howMany}</span>
            {/if}
          </div>
        </a>
        <div class="card-actions">
          <a class="cta small" href={`/availiableResorce/${r.id}`}>{$t('discover.resources_apply')}</a>
          {#if r.projectId}
            <a class="mini" href={`/project/${r.projectId}`}>🧶 {$t('discover.to_project')}</a>
          {/if}
          {#if r.lat !== null}
            <button class="mini" onclick={() => pickOnMap(r)}>📍 {$t('discover.show_here')}</button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  {#if !data.isLoggedIn}
    <aside class="join-banner">
      <div>
        <h2>{$t('discover.resources_banner_title')}</h2>
        <p>{$t('discover.resources_banner_sub')}</p>
      </div>
      <div class="banner-ctas">
        <a class="cta" href="/signup">{$t('discover.join_banner_cta')}</a>
        <a class="cta ghost" href="/demand">🗺️ {$t('discover.nav_map')}</a>
      </div>
    </aside>
  {/if}
</div>

<style>
  .directory {
    max-width: 72rem;
    margin: 0 auto;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .head h1 {
    font-size: 1.6rem;
    font-weight: 700;
    margin-top: 0.75rem;
    color: var(--stgold, #574010);
  }
  .head h1::after {
    content: '';
    display: block;
    width: 5.5rem;
    height: 4px;
    margin-top: 0.35rem;
    border-radius: 9999px;
    background: linear-gradient(90deg, #bf953f, #fcf6ba, #b38728);
  }
  .sub {
    opacity: 0.75;
    margin-top: 0.15rem;
  }
  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.75rem;
    margin-top: 0.75rem;
  }
  .controls input {
    flex: 1 1 14rem;
    max-width: 22rem;
    border: 1px solid rgba(179, 135, 40, 0.45);
    border-radius: 9999px;
    padding: 0.45rem 1rem;
    font-size: 0.9rem;
    background: white;
    color: #2b2740;
  }
  .filter-chips,
  .kind-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .kind-chips {
    margin-top: 0.6rem;
  }
  .filter-chips button,
  .kind {
    border: 1px solid rgba(179, 135, 40, 0.4);
    background: white;
    color: #2b2740;
    border-radius: 9999px;
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .filter-chips button.active {
    background: var(--barbi-pink, #ff0092);
    border-color: var(--barbi-pink, #ff0092);
    color: white;
  }
  .kind {
    font-size: 0.78rem;
    background: rgba(16, 185, 129, 0.08);
  }
  .kind.active {
    background: #10b981;
    border-color: #10b981;
    color: white;
  }
  .count {
    opacity: 0.6;
    font-size: 0.8em;
  }
  .map-wrap {
    position: relative;
  }
  .map-note {
    margin-top: 0.35rem;
    font-size: 0.85rem;
  }
  .map-note a {
    color: var(--barbi-pink, #ff0092);
    text-decoration: none;
  }
  .selected-card {
    position: absolute;
    bottom: 0.75rem;
    inset-inline-start: 0.75rem;
    max-width: min(20rem, calc(100% - 1.5rem));
    background: white;
    color: #2b2740;
    border-radius: 0.9rem;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    padding: 0.85rem;
    z-index: 5;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  .card-head strong {
    flex: 1;
    font-size: 0.95rem;
  }
  .close {
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.55;
  }
  .hint {
    font-size: 0.8rem;
    opacity: 0.7;
    margin-top: 0.3rem;
  }
  .cta {
    display: inline-block;
    margin-top: 0.7rem;
    background: var(--barbi-pink, #ff0092);
    color: white;
    border-radius: 9999px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .cta:hover {
    box-shadow: 0 4px 14px rgba(179, 135, 40, 0.5);
  }
  .cta.small {
    margin-top: 0;
    padding: 0.25rem 0.8rem;
    font-size: 0.78rem;
  }
  .cta.ghost {
    background: transparent;
    color: var(--barbi-pink, #ff0092);
    border: 1px solid var(--barbi-pink, #ff0092);
  }
  .empty {
    font-size: 0.9rem;
    opacity: 0.65;
  }
  .cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(19rem, 1fr));
    gap: 1rem;
    list-style: none;
    padding: 0;
  }
  .card {
    display: flex;
    flex-direction: column;
    border: 1px solid rgba(179, 135, 40, 0.35);
    border-radius: 1rem;
    background: white;
    color: #2b2740;
    overflow: hidden;
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .card:hover {
    box-shadow: 0 6px 20px rgba(179, 135, 40, 0.28);
    transform: translateY(-2px);
  }
  .card-link {
    display: flex;
    flex-direction: column;
    flex: 1;
    gap: 0.5rem;
    padding: 0.85rem;
    text-decoration: none;
    color: inherit;
  }
  .card-top {
    display: flex;
    align-items: center;
    gap: 0.6rem;
  }
  .avatar {
    width: 2.6rem;
    height: 2.6rem;
    border-radius: 9999px;
    object-fit: cover;
    flex: none;
  }
  .avatar.fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(120deg, #bf953f, #10b981);
    font-size: 1.2rem;
  }
  .top-text {
    flex: 1;
    min-width: 0;
  }
  .card h2 {
    font-size: 1rem;
    font-weight: 700;
  }
  .proj-name {
    font-size: 0.78rem;
    opacity: 0.7;
  }
  .value {
    display: flex;
    flex-direction: column;
    align-items: center;
    background: linear-gradient(120deg, rgba(252, 246, 186, 0.9), rgba(238, 232, 170, 0.7));
    border: 1px solid rgba(179, 135, 40, 0.45);
    color: var(--stgold, #574010);
    border-radius: 0.7rem;
    padding: 0.3rem 0.6rem;
    flex: none;
  }
  .value strong {
    font-size: 1rem;
  }
  .value span {
    font-size: 0.68rem;
    opacity: 0.7;
    white-space: nowrap;
  }
  .desc {
    font-size: 0.85rem;
    opacity: 0.85;
    display: -webkit-box;
    -webkit-line-clamp: 3;
    line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: auto;
    padding-top: 0.2rem;
  }
  .badge {
    font-size: 0.75rem;
    background: rgba(120, 120, 160, 0.12);
    border-radius: 9999px;
    padding: 0.15rem 0.6rem;
  }
  .badge.kind-badge {
    background: rgba(16, 185, 129, 0.14);
  }
  .badge.concierge {
    background: rgba(255, 0, 146, 0.12);
  }
  .card-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0 0.85rem 0.75rem;
    flex-wrap: wrap;
  }
  .mini {
    border: 1px solid rgba(179, 135, 40, 0.4);
    background: white;
    color: #2b2740;
    border-radius: 9999px;
    padding: 0.25rem 0.7rem;
    font-size: 0.78rem;
    cursor: pointer;
    text-decoration: none;
  }
  .join-banner {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 0.75rem;
    border-radius: 1rem;
    padding: 1rem 1.25rem;
    border: 1px solid rgba(179, 135, 40, 0.4);
    background: linear-gradient(120deg, rgba(238, 232, 170, 0.5), rgba(255, 0, 146, 0.07));
  }
  .join-banner h2 {
    font-size: 1.05rem;
    font-weight: 700;
  }
  .join-banner p {
    font-size: 0.88rem;
    opacity: 0.8;
  }
  .banner-ctas {
    display: flex;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
</style>
