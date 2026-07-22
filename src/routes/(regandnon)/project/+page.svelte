<script lang="ts">
  import { page } from '$app/state';
  import DiscoveryMap from '$lib/components/location/DiscoveryMap.svelte';
  import DiscoveryNav from '$lib/components/discovery/DiscoveryNav.svelte';
  import { LAYER_COLORS, type MapItem, type MapLayer } from '$lib/map/discoveryTypes';
  import { t, isRtl } from '$lib/translations';
  import { Head } from 'svead';

  let { data } = $props();

  type ProjectCard = (typeof data.projects)[number];

  let search = $state('');
  let filter = $state<'all' | 'missions' | 'products'>('all');
  let selected = $state<MapItem | null>(null);
  let mapComponent = $state<ReturnType<typeof DiscoveryMap>>();

  const filtered = $derived.by(() => {
    const q = search.trim().toLowerCase();
    return data.projects.filter((p: ProjectCard) => {
      if (filter === 'missions' && p.openMissionsCount + p.openResourcesCount === 0) return false;
      if (filter === 'products' && p.productsCount === 0) return false;
      if (!q) return true;
      return [p.name, p.description, p.city, p.hint]
        .some((s) => (s ?? '').toLowerCase().includes(q));
    });
  });

  /** The same rikmot as map points — public entities, locations shown as-is. */
  const mapLayers = $derived.by<MapLayer[]>(() => [
    {
      id: 'projects',
      color: LAYER_COLORS.projects,
      items: filtered
        .filter((p: ProjectCard) => p.lat !== null)
        .map(
          (p: ProjectCard): MapItem => ({
            id: p.id,
            kind: 'project',
            lat: p.lat,
            lng: p.lng,
            radius: p.radius,
            title: p.name,
            hint: p.hint ?? p.city,
            isOnline: false,
            concierge: false,
            href: `/project/${p.id}`,
            meta: { membersCount: p.membersCount }
          })
        )
    }
  ]);

  const locatedCount = $derived(mapLayers[0].items.length);

  function pickOnMap(p: ProjectCard) {
    const item = mapLayers[0].items.find((i) => i.id === p.id);
    if (item) {
      selected = item;
      mapComponent?.flyTo(item);
    }
  }

  /** Deep link into the demand map, centered on the rikma, supply lens —
   *  its open missions/resources are exactly the supply-lens layers. */
  function demandHref(p: ProjectCard): string {
    const base = '/demand?lens=supply';
    return p.lat !== null ? `${base}&c=${p.lng},${p.lat},12` : base;
  }
</script>

<Head
  url={page.url.href}
  title={$t('discover.projects_title')}
  description={$t('discover.projects_subtitle')}
/>

<div class="directory" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <DiscoveryNav current="projects" />
    <h1>🧶 {$t('discover.projects_title')}</h1>
    <p class="sub">{$t('discover.projects_subtitle')}</p>

    <div class="controls">
      <input
        type="search"
        placeholder={$t('discover.projects_search_ph')}
        bind:value={search}
      />
      <div class="filter-chips" role="group" aria-label={$t('discover.projects_title')}>
        <button class:active={filter === 'all'} onclick={() => (filter = 'all')}>
          {$t('discover.filter_all')} <span class="count">{data.projects.length}</span>
        </button>
        <button class:active={filter === 'missions'} onclick={() => (filter = 'missions')}>
          🛠️ {$t('discover.filter_with_missions')}
        </button>
        <button class:active={filter === 'products'} onclick={() => (filter = 'products')}>
          🎁 {$t('discover.filter_with_products')}
        </button>
      </div>
    </div>
  </header>

  {#if locatedCount > 0}
    <div class="map-wrap">
      <DiscoveryMap
        bind:this={mapComponent}
        layers={mapLayers}
        visibleLayerIds={['projects']}
        height="min(44vh, 380px)"
        onSelect={(item) => (selected = item)}
      />
      {#if selected}
        <aside class="selected-card" aria-live="polite">
          <div class="card-head">
            <span aria-hidden="true">🧶</span>
            <strong>{selected.title}</strong>
            <button class="close" onclick={() => (selected = null)} aria-label="✕">✕</button>
          </div>
          {#if selected.hint}
            <p class="hint">📍 {selected.hint}</p>
          {/if}
          <a class="cta" href={selected.href}>{$t('discover.projects_visit')}</a>
        </aside>
      {/if}
      <p class="map-note">
        <a href="/demand">🗺️ {$t('discover.to_full_map')}</a>
      </p>
    </div>
  {/if}

  {#if filtered.length === 0}
    <p class="empty">{$t('discover.projects_empty')}</p>
  {/if}

  <ul class="cards">
    {#each filtered as p (p.id)}
      <li class="card">
        <a class="card-link" href={`/project/${p.id}`}>
          {#if p.picUrl}
            <img src={p.picUrl} alt="" loading="lazy" />
          {:else}
            <div class="pic-fallback" aria-hidden="true">{p.name.slice(0, 1)}</div>
          {/if}
          <div class="card-body">
            <h2>{p.name}</h2>
            {#if p.city || p.hint}
              <p class="place">📍 {p.city ?? p.hint}</p>
            {/if}
            {#if p.description}
              <p class="desc">{p.description}</p>
            {/if}
            <div class="badges">
              <span class="badge">👥 {p.membersCount} {$t('discover.projects_members')}</span>
              {#if p.openMissionsCount}
                <span class="badge hot">🛠️ {p.openMissionsCount} {$t('discover.projects_open_missions')}</span>
              {/if}
              {#if p.openResourcesCount}
                <span class="badge hot">📦 {p.openResourcesCount} {$t('discover.projects_open_resources')}</span>
              {/if}
              {#if p.productsCount}
                <span class="badge">🎁 {p.productsCount} {$t('discover.projects_products')}</span>
              {/if}
            </div>
          </div>
        </a>
        <div class="card-actions">
          <a class="mini" href={demandHref(p)}>🗺️ {$t('discover.on_demand_map')}</a>
          {#if p.lat !== null}
            <button class="mini" onclick={() => pickOnMap(p)}>📍 {$t('discover.show_here')}</button>
          {/if}
        </div>
      </li>
    {/each}
  </ul>

  {#if !data.isLoggedIn}
    <aside class="join-banner">
      <div>
        <h2>{$t('discover.join_banner_title')}</h2>
        <p>{$t('discover.join_banner_sub')}</p>
      </div>
      <div class="banner-ctas">
        <a class="cta" href="/signup">{$t('discover.join_banner_cta')}</a>
        <a class="cta ghost" href="/wish/new">🪄 {$t('discover.concierge_cta')}</a>
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
  .filter-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }
  .filter-chips button {
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
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
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
    text-decoration: none;
    color: inherit;
  }
  .card img,
  .pic-fallback {
    width: 100%;
    height: 8.5rem;
    object-fit: cover;
  }
  .pic-fallback {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2.4rem;
    font-weight: 700;
    color: white;
    background: linear-gradient(120deg, #bf953f, #ff0092);
  }
  .card-body {
    padding: 0.75rem 0.85rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    flex: 1;
  }
  .card-body h2 {
    font-size: 1.05rem;
    font-weight: 700;
  }
  .place {
    font-size: 0.8rem;
    opacity: 0.7;
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
    padding-top: 0.35rem;
  }
  .badge {
    font-size: 0.75rem;
    background: rgba(120, 120, 160, 0.12);
    border-radius: 9999px;
    padding: 0.15rem 0.6rem;
  }
  .badge.hot {
    background: rgba(59, 130, 246, 0.14);
  }
  .card-actions {
    display: flex;
    gap: 0.5rem;
    padding: 0 0.85rem 0.75rem;
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
