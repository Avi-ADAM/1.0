<script lang="ts">
  import DiscoveryMap from '$lib/components/location/DiscoveryMap.svelte';
  import { LAYER_COLORS, type MapItem, type MapLayer } from '$lib/map/discoveryTypes';
  import { t, isRtl } from '$lib/translations';

  let { data } = $props();

  type RankedItem = MapItem & { distanceKm: number | null };

  let activeTab = $state<'maagadim' | 'wishes'>('maagadim');
  let selected = $state<MapItem | null>(null);
  let mapComponent = $state<ReturnType<typeof DiscoveryMap>>();

  const maagadim = $derived(data.maagadim as RankedItem[]);
  const wishes = $derived(data.wishes as RankedItem[]);

  // Both demand layers on the map; the tab only drives the side list.
  const layers = $derived<MapLayer[]>([
    { id: 'maagadim', color: LAYER_COLORS.maagadim, items: maagadim },
    { id: 'wishes', color: LAYER_COLORS.wishes, items: wishes }
  ]);

  const listItems = $derived(activeTab === 'maagadim' ? maagadim : wishes);

  const center = $derived<[number, number] | null>(
    data.projectCenter ? [data.projectCenter.lng, data.projectCenter.lat] : null
  );

  function pick(item: RankedItem) {
    selected = item;
    mapComponent?.flyTo(item);
  }

  function distanceLabel(item: RankedItem): string {
    if (item.isOnline) return $t('demand.online_section');
    if (item.distanceKm === null) return '';
    return `${item.distanceKm} ${$t('demand.km')}`;
  }
</script>

<div class="supplier-demand" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header>
    <h1>🛠️ {$t('demand.supplier_title')}</h1>
    <p class="sub">{$t('demand.supplier_subtitle')} {data.projectName}</p>
    {#if !data.hasLocation}
      <p class="warn">{$t('demand.supplier_no_location')}</p>
    {/if}
  </header>

  <div class="body">
    <div class="map-wrap">
      <DiscoveryMap
        bind:this={mapComponent}
        {layers}
        visibleLayerIds={['maagadim', 'wishes']}
        {center}
        zoom={data.hasLocation ? 10 : null}
        height="min(58vh, 520px)"
        onSelect={(item) => (selected = item)}
      />
      {#if selected}
        <aside class="selected-card">
          <div class="card-head">
            <strong>{selected.title || $t('demand.untitled')}</strong>
            <button class="close" onclick={() => (selected = null)} aria-label="✕">✕</button>
          </div>
          {#if selected.hint}<p class="hint">📍 {selected.hint}</p>{/if}
          {#if selected.href}
            <a class="cta" href={selected.href}>📣 {$t('demand.cta_offer')}</a>
          {/if}
        </aside>
      {/if}
    </div>

    <aside class="side">
      <div class="tabs" role="tablist">
        <button
          role="tab"
          aria-selected={activeTab === 'maagadim'}
          class:active={activeTab === 'maagadim'}
          onclick={() => (activeTab = 'maagadim')}
        >
          🤝 {$t('demand.layer_maagadim')} <span class="count">{maagadim.length}</span>
        </button>
        <button
          role="tab"
          aria-selected={activeTab === 'wishes'}
          class:active={activeTab === 'wishes'}
          onclick={() => (activeTab = 'wishes')}
        >
          🧺 {$t('demand.layer_wishes')} <span class="count">{wishes.length}</span>
        </button>
      </div>

      {#if listItems.length === 0}
        <p class="empty">{$t('demand.supplier_empty')}</p>
      {/if}

      <ul>
        {#each listItems as item (item.kind + item.id)}
          <li>
            <button class="row" onclick={() => pick(item)}>
              <span class="row-main">
                <span class="row-title">{item.title || $t('demand.untitled')}</span>
                <span class="row-meta">
                  {#if distanceLabel(item)}<span class="dist">{distanceLabel(item)}</span>{/if}
                  {#if item.kind === 'maagad'}
                    <span>· {(item.meta as any).membersCount ?? 0} {$t('demand.members')}</span>
                  {/if}
                  {#if item.concierge}<span class="concierge">· {$t('demand.concierge_badge')}</span>{/if}
                </span>
              </span>
              {#if item.href}<span class="go">›</span>{/if}
            </button>
          </li>
        {/each}
      </ul>
    </aside>
  </div>
</div>

<style>
  .supplier-demand {
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  h1 {
    font-size: 1.4rem;
    font-weight: 800;
  }
  .sub {
    opacity: 0.75;
  }
  .warn {
    margin-top: 0.5rem;
    font-size: 0.85rem;
    background: rgba(245, 158, 11, 0.18);
    color: #fcd34d;
    border: 1px solid rgba(245, 158, 11, 0.4);
    border-radius: 0.6rem;
    padding: 0.5rem 0.75rem;
  }
  .body {
    display: grid;
    grid-template-columns: minmax(0, 2fr) minmax(16rem, 1fr);
    gap: 1rem;
    align-items: start;
  }
  @media (max-width: 860px) {
    .body {
      grid-template-columns: 1fr;
    }
  }
  .map-wrap {
    position: relative;
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
    margin: 0.3rem 0;
  }
  .cta {
    display: inline-block;
    margin-top: 0.5rem;
    background: #7c3aed;
    color: white;
    border-radius: 9999px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .tabs {
    display: flex;
    gap: 0.4rem;
    margin-bottom: 0.6rem;
  }
  .tabs button {
    flex: 1;
    border: 1px solid rgba(120, 120, 160, 0.25);
    background: white;
    color: #2b2740;
    border-radius: 0.7rem;
    padding: 0.45rem;
    cursor: pointer;
    font-size: 0.85rem;
    font-weight: 600;
  }
  .tabs button.active {
    background: #ede9fe;
    border-color: rgba(139, 92, 246, 0.6);
    color: #4c1d95;
  }
  .count {
    opacity: 0.55;
  }
  .side ul {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 30rem;
    overflow-y: auto;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
    text-align: start;
    border: 1px solid rgba(120, 120, 160, 0.18);
    background: white;
    color: #2b2740;
    border-radius: 0.7rem;
    padding: 0.55rem 0.7rem;
    cursor: pointer;
  }
  .row-main {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-width: 0;
  }
  .row-title {
    font-size: 0.88rem;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row-meta {
    font-size: 0.75rem;
    opacity: 0.7;
    display: flex;
    gap: 0.25rem;
    flex-wrap: wrap;
  }
  .dist {
    font-weight: 600;
    opacity: 0.9;
  }
  .concierge {
    color: #7c3aed;
  }
  .go {
    opacity: 0.4;
    font-size: 1.2rem;
  }
  .empty {
    font-size: 0.85rem;
    opacity: 0.6;
  }
</style>
