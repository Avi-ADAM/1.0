<script lang="ts">
  import { browser } from '$app/environment';
  import { page } from '$app/state';
  import DiscoveryMap from '$lib/components/location/DiscoveryMap.svelte';
  import {
    LAYER_COLORS,
    LENS_LAYERS,
    type DiscoveryLens,
    type MapItem,
    type MapLayer,
    type MapLayerId
  } from '$lib/map/discoveryTypes';
  import { t, isRtl } from '$lib/translations';
  import { Head } from 'svead';

  let { data } = $props();

  const ALL_LAYER_IDS: MapLayerId[] = [
    'wishes',
    'maagadim',
    'offers',
    'missions',
    'resources'
  ];

  // ── URL → initial state (deep links, PLAN_DISCOVERY_MAP §2.5) ────────────
  const initialParams = page.url.searchParams;
  let lens = $state<DiscoveryLens>(
    initialParams.get('lens') === 'supply' ? 'supply' : 'join'
  );
  let disabledLayers = $state<Set<MapLayerId>>(
    new Set(
      (initialParams.get('off') ?? '')
        .split(',')
        .filter((x): x is MapLayerId => ALL_LAYER_IDS.includes(x as MapLayerId))
    )
  );
  const initialView = (() => {
    const c = (initialParams.get('c') ?? '').split(',').map(Number);
    if (c.length === 3 && c.every(Number.isFinite)) {
      return { center: [c[1], c[0]] as [number, number], zoom: c[2] };
    }
    return { center: null, zoom: null };
  })();

  let selected = $state<MapItem | null>(null);
  let viewportKeys = $state<Set<string>>(new Set());
  let lastView: { center: [number, number]; zoom: number } | null = null;
  let mapComponent = $state<ReturnType<typeof DiscoveryMap>>();

  const layers: MapLayer[] = ALL_LAYER_IDS.map((id) => ({
    id,
    color: LAYER_COLORS[id],
    items: (data.mapData?.[id] ?? []) as MapItem[]
  }));

  const lensLayerIds = $derived(LENS_LAYERS[lens]);
  const visibleLayerIds = $derived(
    lensLayerIds.filter((id) => !disabledLayers.has(id))
  );

  const layerCount = (id: MapLayerId) =>
    (data.mapData?.[id] ?? []).length as number;

  /** Side list: located items inside the current viewport, per visible layer. */
  const listItems = $derived.by(() => {
    const out: MapItem[] = [];
    for (const layer of layers) {
      if (!visibleLayerIds.includes(layer.id)) continue;
      for (const item of layer.items) {
        if (item.isOnline || item.lat === null) continue;
        if (viewportKeys.size === 0 || viewportKeys.has(`${layer.id}:${item.id}`)) {
          out.push(item);
        }
      }
    }
    return out.slice(0, 60);
  });

  /** Online / global items never sit on the map — they get their own strip. */
  const onlineItems = $derived.by(() => {
    const out: MapItem[] = [];
    for (const layer of layers) {
      if (!visibleLayerIds.includes(layer.id)) continue;
      for (const item of layer.items) {
        if (item.isOnline) out.push(item);
      }
    }
    return out.slice(0, 30);
  });

  function setLens(next: DiscoveryLens) {
    lens = next;
    selected = null;
    syncUrl();
  }

  function toggleLayer(id: MapLayerId) {
    const next = new Set(disabledLayers);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    disabledLayers = next;
    syncUrl();
  }

  function onViewChange(view: {
    center: [number, number];
    zoom: number;
    visibleIds: string[];
  }) {
    viewportKeys = new Set(view.visibleIds);
    lastView = { center: view.center, zoom: view.zoom };
    syncUrl();
  }

  function syncUrl() {
    if (!browser) return;
    const params = new URLSearchParams();
    if (lens !== 'join') params.set('lens', lens);
    if (disabledLayers.size) params.set('off', [...disabledLayers].join(','));
    if (lastView) {
      params.set(
        'c',
        `${lastView.center[1].toFixed(4)},${lastView.center[0].toFixed(4)},${lastView.zoom.toFixed(1)}`
      );
    }
    const qs = params.toString();
    history.replaceState(history.state, '', qs ? `?${qs}` : location.pathname);
  }

  function pick(item: MapItem) {
    selected = item;
    mapComponent?.flyTo(item);
  }

  const kindEmoji: Record<string, string> = {
    wish: '🧺',
    maagad: '🤝',
    offer: '📣',
    mission: '🛠️',
    resource: '📦'
  };

  function itemBadges(item: MapItem): string[] {
    const m = item.meta as Record<string, any>;
    const badges: string[] = [];
    if (item.kind === 'wish') {
      if (m.minJoiners) badges.push(`${m.joinersCount ?? 0}/${m.minJoiners} ${$t('demand.joiners')}`);
      else if (m.joinersCount) badges.push(`${m.joinersCount} ${$t('demand.joiners')}`);
      if (m.frequency && m.frequency !== 'one_time') badges.push(String(m.frequency));
    } else if (item.kind === 'maagad') {
      badges.push(`${m.membersCount ?? 0} ${$t('demand.members')}`);
      if (m.viabilityHint) badges.push(`${$t('demand.viability')} ${m.viabilityHint}`);
      if (m.openOffers) badges.push(`${m.openOffers} ${$t('demand.open_offers')}`);
    } else if (item.kind === 'offer') {
      badges.push(`${m.signed ?? 0}/${m.min ?? '?'} ${$t('demand.signed')}`);
    } else if (item.kind === 'mission') {
      if (m.projectName) badges.push(String(m.projectName));
      if (m.hours) badges.push(`${m.hours} ${$t('demand.hours')}`);
      for (const s of (m.skills ?? []).slice(0, 2)) badges.push(String(s));
    } else if (item.kind === 'resource') {
      if (m.projectName) badges.push(String(m.projectName));
      if (m.kindOf) badges.push(String(m.kindOf));
    }
    if (item.concierge) badges.push($t('demand.concierge_badge'));
    return badges;
  }
</script>

<Head url={page.url.href} title={$t('demand.title')} description={$t('demand.subtitle')} />

<div class="demand-page" dir={$isRtl ? 'rtl' : 'ltr'}>
  <header class="head">
    <h1>{$t('demand.title')}</h1>
    <p class="sub">{$t('demand.subtitle')}</p>

    <div class="lens-switch" role="tablist" aria-label={$t('demand.title')}>
      <button
        role="tab"
        aria-selected={lens === 'join'}
        class:active={lens === 'join'}
        onclick={() => setLens('join')}
      >
        🧺 {$t('demand.lens_join')}
      </button>
      <button
        role="tab"
        aria-selected={lens === 'supply'}
        class:active={lens === 'supply'}
        onclick={() => setLens('supply')}
      >
        🛠️ {$t('demand.lens_supply')}
      </button>
    </div>

    <div class="layer-chips">
      {#each lensLayerIds as id (id)}
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
  </header>

  <div class="body">
    <div class="map-wrap">
      <DiscoveryMap
        bind:this={mapComponent}
        {layers}
        {visibleLayerIds}
        center={initialView.center}
        zoom={initialView.zoom}
        height="min(62vh, 560px)"
        onSelect={(item) => (selected = item)}
        {onViewChange}
      />

      {#if selected}
        <aside class="selected-card" aria-live="polite">
          <div class="card-head">
            <span class="kind-emoji">{kindEmoji[selected.kind]}</span>
            <strong>{selected.title || $t('demand.untitled')}</strong>
            <button class="close" onclick={() => (selected = null)} aria-label="✕">✕</button>
          </div>
          {#if selected.hint}
            <p class="hint">📍 {selected.hint}</p>
          {/if}
          <div class="badges">
            {#each itemBadges(selected) as badge (badge)}
              <span class="badge">{badge}</span>
            {/each}
          </div>
          {#if selected.href}
            <a class="cta" href={selected.href}>
              {lens === 'join' ? $t('demand.cta_join') : $t('demand.cta_offer')}
            </a>
          {:else}
            <span class="soon">{$t('demand.coming_soon')}</span>
          {/if}
        </aside>
      {/if}
    </div>

    <aside class="side">
      <h2>{$t('demand.list_in_view')} <span class="count">{listItems.length}</span></h2>
      {#if listItems.length === 0}
        <p class="empty">{$t('demand.empty')}</p>
      {/if}
      <ul>
        {#each listItems as item (item.kind + item.id)}
          <li>
            <button class="row" onclick={() => pick(item)}>
              <span class="dot" style:--chip-color={LAYER_COLORS[item.kind === 'wish' ? 'wishes' : item.kind === 'maagad' ? 'maagadim' : item.kind === 'offer' ? 'offers' : item.kind === 'mission' ? 'missions' : 'resources']}></span>
              <span class="row-main">
                <span class="row-title">{kindEmoji[item.kind]} {item.title || $t('demand.untitled')}</span>
                {#if item.hint}<span class="row-hint">{item.hint}</span>{/if}
              </span>
            </button>
          </li>
        {/each}
      </ul>

      {#if onlineItems.length}
        <h2 class="online-head">🌐 {$t('demand.online_section')} <span class="count">{onlineItems.length}</span></h2>
        <ul>
          {#each onlineItems as item (item.kind + item.id)}
            <li>
              {#if item.href}
                <a class="row" href={item.href}>
                  <span class="row-main">
                    <span class="row-title">{kindEmoji[item.kind]} {item.title || $t('demand.untitled')}</span>
                  </span>
                </a>
              {:else}
                <span class="row static">
                  <span class="row-main">
                    <span class="row-title">{kindEmoji[item.kind]} {item.title || $t('demand.untitled')}</span>
                  </span>
                </span>
              {/if}
            </li>
          {/each}
        </ul>
      {/if}
    </aside>
  </div>
</div>

<style>
  .demand-page {
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
  }
  .sub {
    opacity: 0.75;
    margin-top: 0.15rem;
  }
  .lens-switch {
    display: inline-flex;
    margin-top: 0.75rem;
    border-radius: 9999px;
    background: rgba(120, 120, 160, 0.12);
    padding: 0.25rem;
    gap: 0.25rem;
  }
  .lens-switch button {
    border: none;
    background: transparent;
    padding: 0.45rem 1.1rem;
    border-radius: 9999px;
    cursor: pointer;
    font-weight: 600;
    font-size: 0.95rem;
  }
  .lens-switch button.active {
    background: white;
    color: #2b2740;
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.12);
  }
  .layer-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-top: 0.75rem;
  }
  .chip {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    border: 1px solid rgba(120, 120, 160, 0.25);
    background: white;
    color: #2b2740;
    border-radius: 9999px;
    padding: 0.3rem 0.75rem;
    font-size: 0.85rem;
    cursor: pointer;
  }
  .chip.off {
    opacity: 0.45;
  }
  .dot {
    width: 0.65rem;
    height: 0.65rem;
    border-radius: 9999px;
    background: var(--chip-color, #999);
    flex: none;
  }
  .count {
    opacity: 0.6;
    font-size: 0.8em;
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
  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.5rem;
  }
  .badge {
    font-size: 0.75rem;
    background: rgba(120, 120, 160, 0.12);
    border-radius: 9999px;
    padding: 0.15rem 0.6rem;
  }
  .cta {
    display: inline-block;
    margin-top: 0.7rem;
    background: #7c3aed;
    color: white;
    border-radius: 9999px;
    padding: 0.4rem 1rem;
    font-size: 0.85rem;
    text-decoration: none;
  }
  .soon {
    display: inline-block;
    margin-top: 0.7rem;
    font-size: 0.8rem;
    opacity: 0.6;
  }
  .side h2 {
    font-weight: 700;
    font-size: 1rem;
    margin-bottom: 0.5rem;
  }
  .online-head {
    margin-top: 1.25rem;
  }
  .side ul {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 26rem;
    overflow-y: auto;
  }
  .row {
    display: flex;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
    text-align: start;
    border: 1px solid rgba(120, 120, 160, 0.18);
    background: white;
    border-radius: 0.7rem;
    padding: 0.5rem 0.7rem;
    cursor: pointer;
    text-decoration: none;
    color: #2b2740;
  }
  .row.static {
    cursor: default;
  }
  .row-main {
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
  .row-hint {
    font-size: 0.75rem;
    opacity: 0.6;
  }
  .empty {
    font-size: 0.85rem;
    opacity: 0.6;
  }
</style>
