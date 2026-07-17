<script lang="ts">
  /**
   * Demand-map panel for the lev page (PLAN_HUB_LEV_DEMAND_SYNC direction 2).
   *
   * The maagad's discovery map, embedded where the user already is: a floating
   * button that opens a bottom sheet with the same layers as /demand (wishes,
   * pools, threshold offers, rikma missions/resources, products). Everything
   * loads lazily on first open — the map bundle and the /api/map-data fetch
   * never weigh on the lev page's own (heavy) load.
   */
  import { t, isRtl } from '$lib/translations';
  import {
    LAYER_COLORS,
    type MapItem,
    type MapLayer,
    type MapLayerId
  } from '$lib/map/discoveryTypes';

  const ALL_LAYER_IDS: MapLayerId[] = [
    'wishes',
    'maagadim',
    'offers',
    'missions',
    'resources',
    'products'
  ];

  const kindEmoji: Record<string, string> = {
    wish: '🧺',
    maagad: '🤝',
    offer: '📣',
    mission: '🛠️',
    resource: '📦',
    product: '🎁'
  };

  let open = $state(false);
  let loading = $state(false);
  let failed = $state(false);
  let layers = $state<MapLayer[] | null>(null);
  let MapCmp = $state<any>(null);
  let selected = $state<MapItem | null>(null);
  let disabledLayers = $state<Set<MapLayerId>>(new Set());

  async function loadData() {
    loading = true;
    failed = false;
    try {
      const [res, mod] = await Promise.all([
        fetch('/api/map-data').then((r) => {
          if (!r.ok) throw new Error(`map-data ${r.status}`);
          return r.json();
        }),
        import('$lib/components/location/DiscoveryMap.svelte')
      ]);
      MapCmp = mod.default;
      layers = ALL_LAYER_IDS.map((id) => ({
        id,
        color: LAYER_COLORS[id],
        items: (res.mapData?.[id] ?? []) as MapItem[]
      }));
    } catch (e) {
      console.warn('[lev] demand panel load failed:', (e as Error)?.message);
      failed = true;
      layers = null;
    } finally {
      loading = false;
    }
  }

  function openPanel() {
    open = true;
    if (!layers && !loading) loadData();
  }

  function closePanel() {
    open = false;
    selected = null;
  }

  function toggleLayer(id: MapLayerId) {
    const next = new Set(disabledLayers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    disabledLayers = next;
  }

  const visibleLayerIds = $derived(
    ALL_LAYER_IDS.filter((id) => !disabledLayers.has(id))
  );
  const layerCount = (id: MapLayerId) =>
    layers?.find((l) => l.id === id)?.items.length ?? 0;
  const globalItems = $derived.by(() => {
    if (!layers) return [] as MapItem[];
    const out: MapItem[] = [];
    for (const layer of layers) {
      if (!visibleLayerIds.includes(layer.id)) continue;
      for (const item of layer.items) if (item.isOnline) out.push(item);
    }
    return out.slice(0, 20);
  });
</script>

<button class="map-fab" onclick={openPanel} dir={$isRtl ? 'rtl' : 'ltr'}>
  🗺️ <span class="fab-label">{$t('demand.lev_panel_fab')}</span>
</button>

{#if open}
  <div
    class="sheet-backdrop"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) closePanel();
    }}
  >
    <div
      class="sheet"
      dir={$isRtl ? 'rtl' : 'ltr'}
      role="dialog"
      aria-label={$t('demand.title')}
    >
      <header class="sheet-head">
        <div class="head-text">
          <h2>🗺️ {$t('demand.title')}</h2>
          <p>{$t('demand.lev_panel_sub')}</p>
        </div>
        <button
          class="close"
          onclick={closePanel}
          aria-label={$t('demand.lev_panel_close')}>✕</button
        >
      </header>

      {#if loading}
        <div class="state">
          <span class="pulse"></span>
        </div>
      {:else if failed}
        <div class="state">
          <p>{$t('demand.lev_panel_error')}</p>
          <button class="retry" onclick={loadData}>{$t('demand.lev_panel_retry')}</button>
        </div>
      {:else if layers && MapCmp}
        <div class="layer-chips">
          {#each ALL_LAYER_IDS as id (id)}
            <button
              class="chip"
              class:off={disabledLayers.has(id)}
              style:--chip-color={LAYER_COLORS[id]}
              onclick={() => toggleLayer(id)}
              aria-pressed={!disabledLayers.has(id)}
            >
              <span class="dot"></span>
              {$t(`demand.layer_${id}`)}
              <span class="count">{layerCount(id)}</span>
            </button>
          {/each}
        </div>

        <div class="map-wrap">
          <MapCmp
            {layers}
            {visibleLayerIds}
            height="min(48vh, 420px)"
            onSelect={(item: MapItem | null) => (selected = item)}
          />
          {#if selected}
            <aside class="selected-card" aria-live="polite">
              <div class="card-head">
                <span>{kindEmoji[selected.kind]}</span>
                <strong>{selected.title || $t('demand.untitled')}</strong>
                <button
                  class="close"
                  onclick={() => (selected = null)}
                  aria-label={$t('demand.lev_panel_close')}>✕</button
                >
              </div>
              {#if selected.hint}
                <p class="hint">📍 {selected.hint}</p>
              {/if}
              {#if selected.href}
                <a class="cta" href={selected.href}>{$t('demand.cta_join')}</a>
              {/if}
            </aside>
          {/if}
        </div>

        {#if globalItems.length}
          <h3 class="online-head">
            🌐 {$t('demand.online_section')}
            <span class="count">{globalItems.length}</span>
          </h3>
          <ul class="online-list">
            {#each globalItems as item (item.kind + item.id)}
              <li>
                {#if item.href}
                  <a class="row" href={item.href}>
                    {kindEmoji[item.kind]}
                    {item.title || $t('demand.untitled')}
                  </a>
                {:else}
                  <span class="row static">
                    {kindEmoji[item.kind]}
                    {item.title || $t('demand.untitled')}
                  </span>
                {/if}
              </li>
            {/each}
          </ul>
        {/if}

        <a class="full-link" href="/demand">{$t('demand.lev_panel_full')} ↗</a>
      {/if}
    </div>
  </div>
{/if}

<style>
  .map-fab {
    position: fixed;
    bottom: 4.5rem;
    inset-inline-start: 0.75rem;
    z-index: 40;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid rgba(179, 135, 40, 0.6);
    background: rgba(15, 23, 42, 0.85);
    color: #fff;
    border-radius: 9999px;
    padding: 0.5rem 0.9rem;
    font-size: 0.85rem;
    font-weight: 600;
    cursor: pointer;
    backdrop-filter: blur(6px);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
  }
  @media (max-width: 480px) {
    .fab-label {
      display: none;
    }
  }

  .sheet-backdrop {
    position: fixed;
    inset: 0;
    z-index: 900;
    background: rgba(0, 0, 0, 0.45);
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  .sheet {
    width: min(100%, 46rem);
    max-height: 88dvh;
    overflow-y: auto;
    background: #fff;
    color: #2b2740;
    border-radius: 1.2rem 1.2rem 0 0;
    padding: 1rem 1rem calc(env(safe-area-inset-bottom) + 1rem);
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .sheet-head {
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
  }
  .head-text {
    flex: 1;
  }
  .sheet-head h2 {
    font-size: 1.1rem;
    font-weight: 700;
  }
  .sheet-head p {
    font-size: 0.8rem;
    opacity: 0.7;
    margin-top: 0.15rem;
  }
  .close {
    border: none;
    background: transparent;
    cursor: pointer;
    opacity: 0.55;
    font-size: 1rem;
  }

  .state {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.6rem;
    padding: 2.5rem 0;
  }
  .pulse {
    width: 0.9rem;
    height: 0.9rem;
    border-radius: 9999px;
    background: #ff00ae;
    animation: pulse 1.2s ease-in-out infinite;
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.35;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
  .retry {
    border: none;
    border-radius: 9999px;
    padding: 0.35rem 1rem;
    background: #7c3aed;
    color: #fff;
    font-size: 0.85rem;
    cursor: pointer;
  }

  .layer-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    border: 1px solid rgba(120, 120, 160, 0.25);
    background: #fff;
    color: #2b2740;
    border-radius: 9999px;
    padding: 0.25rem 0.65rem;
    font-size: 0.78rem;
    cursor: pointer;
  }
  .chip.off {
    opacity: 0.45;
  }
  .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 9999px;
    background: var(--chip-color, #999);
    flex: none;
  }
  .count {
    opacity: 0.6;
    font-size: 0.8em;
  }

  .map-wrap {
    position: relative;
  }
  .selected-card {
    position: absolute;
    bottom: 0.75rem;
    inset-inline-start: 0.75rem;
    max-width: min(18rem, calc(100% - 1.5rem));
    background: #fff;
    border-radius: 0.9rem;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.18);
    padding: 0.75rem;
    z-index: 5;
  }
  .card-head {
    display: flex;
    align-items: center;
    gap: 0.45rem;
  }
  .card-head strong {
    flex: 1;
    font-size: 0.9rem;
  }
  .hint {
    font-size: 0.78rem;
    opacity: 0.7;
    margin-top: 0.25rem;
  }
  .cta {
    display: inline-block;
    margin-top: 0.6rem;
    background: #7c3aed;
    color: #fff;
    border-radius: 9999px;
    padding: 0.35rem 0.9rem;
    font-size: 0.8rem;
    text-decoration: none;
  }

  .online-head {
    font-size: 0.9rem;
    font-weight: 700;
  }
  .online-list {
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
    max-height: 9rem;
    overflow-y: auto;
  }
  .row {
    display: block;
    border: 1px solid rgba(120, 120, 160, 0.18);
    border-radius: 0.7rem;
    padding: 0.4rem 0.65rem;
    font-size: 0.85rem;
    color: #2b2740;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .row.static {
    cursor: default;
  }

  .full-link {
    align-self: center;
    font-size: 0.85rem;
    font-weight: 600;
    color: #7c3aed;
    text-decoration: none;
    padding: 0.3rem 0.8rem;
  }
</style>
